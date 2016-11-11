using Newtonsoft.Json;
using RNN;
using RNN.Enums;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Web;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;
using useAIble.Core.Models.GameData;

namespace useAIble.GameLibrary.LunarLander
{
    public class RNNLunarLander
    {
        private string USER_TOKEN;
        private string NETWORK_NAME;
        private rnn_network network;
        private bool learn;
        private bool scoringOn;
        private MqttClient OUTPUT_FROM_SERVER_MQTT_CLIENT;
        private double initialAltitude = 0;
        private int initialFuel = 0;

        public RNNLunarLander(string userToken, string networkName, bool learn = false, int tmp_num_sessions = 1, int startRandomness = 1, int endRandomness = 0, double maxLinearBracket = 1, double minLinearBracket = 0, bool scoringOn = true, double altitude = 10000, int fuel = 200)
        {
            NETWORK_NAME = networkName;
            USER_TOKEN = userToken;

            OUTPUT_FROM_SERVER_MQTT_CLIENT = new MqttClient("dev.useaible.com");
            OUTPUT_FROM_SERVER_MQTT_CLIENT.Connect(Guid.NewGuid().ToString("N"));

            OUTPUT_FROM_SERVER_MQTT_CLIENT.MqttMsgPublishReceived += (sender, e) => {
                DisconnectMQTT();
            };

            OUTPUT_FROM_SERVER_MQTT_CLIENT.Subscribe(new string[] { userToken + "/disconnect" }, new byte[] { MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE });

            this.scoringOn = scoringOn;
            
            // restore DB from file or template
            string dbName = "RNN_lander_" + userToken;
            rnn_network.RestoreDB(dbName, true);

            network = new rnn_network(dbName);
            if (!network.LoadNetwork(NETWORK_NAME))
            {
                var inputs = new List<rnn_io>();
                inputs.Add(new rnn_io(network, "fuel", typeof(System.Int32).ToString(), 0, 200, RnnInputType.Linear));
                inputs.Add(new rnn_io(network, "altitude", typeof(System.Double).ToString(), 0, 10000, RnnInputType.Linear));
                inputs.Add(new rnn_io(network, "velocity", typeof(System.Double).ToString(), -LanderSimulator.TerminalVelocity, LanderSimulator.TerminalVelocity, RnnInputType.Linear));

                var outputs = new List<rnn_io>();
                outputs.Add(new rnn_io(network, "thrust", typeof(System.Boolean).ToString(), 0, 1));

                network.NewNetwork(NETWORK_NAME, inputs, outputs);
            }


            Learn = learn;
            network.Temp_Num_Sessions = tmp_num_sessions;
            network.StartRandomness = startRandomness;
            network.EndRandomness = endRandomness;
            network.MaxLinearBracket = maxLinearBracket;
            network.MinLinearBracket = minLinearBracket;

            initialAltitude = altitude;
            initialFuel = fuel;
        }

        public rnn_network Rnetwork
        {
            get { return network; }
        }

        public void DisconnectMQTT()
        {
            if (OUTPUT_FROM_SERVER_MQTT_CLIENT != null && OUTPUT_FROM_SERVER_MQTT_CLIENT.IsConnected)
            {
                OUTPUT_FROM_SERVER_MQTT_CLIENT.Disconnect();
            }
        }

        public bool Learn
        {
            get { return learn; }
            set { learn = value; }
        }

        int sessionCounter = 0;
        public void StartSimulation(CancellationToken? cancelToken = null)
        {
            sessionCounter++;
            var sim = new LanderSimulator() { Altitude = initialAltitude, Fuel = initialFuel };

            network.SessionStart();

            var outputData = new List<bool>();

            while (sim.Flying)
            {
                if (cancelToken.HasValue && cancelToken.Value.IsCancellationRequested)
                {
                    return;
                }

                var inputs = new List<rnn_io_with_value>();
                inputs.Add(new rnn_io_with_value(network.Inputs.First(a => a.Name == "fuel"), sim.Fuel.ToString()));
                inputs.Add(new rnn_io_with_value(network.Inputs.First(a => a.Name == "altitude"), Math.Round(sim.Altitude, 2).ToString()));
                inputs.Add(new rnn_io_with_value(network.Inputs.First(a => a.Name == "velocity"), Math.Round(sim.Velocity, 2).ToString()));

                var cycle = new rnn_cycle();
                var cycleOutcome = cycle.RunCycle(network, network.CurrentSessionID, inputs, learn);

                bool thrust = Convert.ToBoolean(cycleOutcome.CycleOutput.Outputs.First(a => a.Name == "thrust").Value);

                //OUTPUT_FROM_SERVER_MQTT_CLIENT.Publish(USER_TOKEN + "/outputFromServer", Encoding.UTF8.GetBytes(thrust.ToString()), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
                outputData.Add(thrust);

                //if (thrust)
                //{
                //    Console.WriteLine("@THRUST");
                //}

                if (this.scoringOn)
                {
                    var score = scoreTurn(sim, thrust);
                    network.ScoreCycle(cycleOutcome.CycleOutput.CycleID, score);
                }

                sim.Turn(thrust);

                //Console.WriteLine(sim.Telemetry());
            }

            //Console.Write($"Session score: {sim.Score}");
            //System.Diagnostics.Debug.WriteLine($"Randomness left: {network.RandomnessCurrentValue}");

            network.SessionEnd(sim.Score);

            dynamic output = new { Session = sessionCounter, Outputs = outputData, Score = sim.Score };

            OUTPUT_FROM_SERVER_MQTT_CLIENT.Publish(USER_TOKEN + "/outputFromServer", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(output)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

            // predict
        }

        public void Predict()
        {
            var sim = new LanderSimulator();

            network.SessionStart();

            while (sim.Flying)
            {
                var inputs = new List<rnn_io_with_value>();
                inputs.Add(new rnn_io_with_value(network.Inputs.First(a => a.Name == "fuel"), sim.Fuel.ToString()));
                inputs.Add(new rnn_io_with_value(network.Inputs.First(a => a.Name == "altitude"), sim.Altitude.ToString()));
                inputs.Add(new rnn_io_with_value(network.Inputs.First(a => a.Name == "velocity"), sim.Velocity.ToString()));

                var cycle = new rnn_cycle();
                var cycleOutcome = cycle.RunCycle(network, network.CurrentSessionID, inputs, false);

                bool thrust = Convert.ToBoolean(cycleOutcome.CycleOutput.Outputs.First(a => a.Name == "thrust").Value);
                if (thrust)
                {
                    //Console.WriteLine("@THRUST");
                }

                if (this.scoringOn)
                {
                    var score = scoreTurn(sim, thrust);
                    network.ScoreCycle(cycleOutcome.CycleOutput.CycleID, score);
                }

                sim.Turn(thrust);

                //Console.WriteLine(sim.Telemetry());
            }

            //Console.Write($"Session score: {sim.Score}");
            //System.Diagnostics.Debug.WriteLine($"Randomness left: {network.RandomnessCurrentValue}");

            network.SessionEnd(sim.Score);
        }

        public double scoreTurn(LanderSimulator sim, bool thrust)
        {
            double retVal = 0;

            if (sim.Altitude <= 1000)
            {
                if (sim.Fuel > 0 && sim.Velocity >= -5 && !thrust)
                {
                    retVal = sim.Fuel;
                }
                else if (sim.Fuel > 0 && sim.Velocity < -5 && thrust)
                {
                    retVal = sim.Fuel;
                }
            }
            else if (sim.Altitude > 1000 && !thrust)
            {
                retVal = 200;
            }

            return retVal;
        }

        public void ResetSessionCnt()
        {
            //rnn_network.SessionCountInitial = null;
            if (network != null)
            {
                network.SessionCountInitial = network.SessionCount;
            }
        }

        public void SendErrorViaMQTT(Exception e)
        {
            GameErrorMetadata gameError = new GameErrorMetadata()
            {
                Id = USER_TOKEN,
                Exception = JsonConvert.SerializeObject(e)
            };

            if (OUTPUT_FROM_SERVER_MQTT_CLIENT != null && OUTPUT_FROM_SERVER_MQTT_CLIENT.IsConnected)
            {
                OUTPUT_FROM_SERVER_MQTT_CLIENT.Publish(USER_TOKEN + "/outputFromServer", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(gameError)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
            }
        }
    }
}