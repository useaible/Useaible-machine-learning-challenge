using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RNN;
using RNN.Enums;
using uPLibrary.Networking.M2Mqtt;
using Newtonsoft.Json;
using uPLibrary.Networking.M2Mqtt.Messages;
using useAIble.Core.Models.GameData;
using System.Threading;

namespace useAIble.GameLibrary.Maze
{
    public delegate void MazeCycleCompleteDelegate(int x, int y, bool bumpedIntoWall);
    public delegate void MazeCycleErrorDelegate(string networkName);
    public delegate void SessionStartedDelegate(double randomnessLeft);
    public delegate void SetRandomnessLeftDelegate(double val);

    public class RNNMazeTraveler : Traveler, IDisposable
    {
        private const string NETWORK_NAME = "AIMazeTraveler01";
        private const double CORRECT_SCORE = 100;
        private const double WRONG_SCORE = 0;
        private rnn_network rnn_net;
        private Int64 currentSessionID;
        private Int64 currentCycleID;
        private SetRandomnessLeftDelegate SetRandomnessLeft;

        public event MazeCycleCompleteDelegate MazeCycleComplete;
        public event MazeCycleErrorDelegate MazeCycleError;
        public event SessionStartedDelegate SessionStarted;


        private MqttClient OUTPUT_FROM_SERVER_MQTT_CLIENT;


        public MazeInfo Maze { get; set; }
        public int Temp_num_sessions { get; set; }
        public int StartRandomness { get; set; }
        public int EndRandomness { get; set; }
        public bool Learn { get; set; }
        public string USER_TOKEN { get; set; }

        public rnn_network Rnetwork
        {
            get
            {
                return rnn_net;
            }
        }

        public RNNMazeTraveler(MazeInfo maze, string token)
        {
            Maze = maze;
            USER_TOKEN = token;

            OUTPUT_FROM_SERVER_MQTT_CLIENT = new MqttClient("dev.useaible.com");
            OUTPUT_FROM_SERVER_MQTT_CLIENT.Connect(Guid.NewGuid().ToString("N"));

            OUTPUT_FROM_SERVER_MQTT_CLIENT.MqttMsgPublishReceived += (sender, e) => {
                DisconnectMQTT();
            };

            OUTPUT_FROM_SERVER_MQTT_CLIENT.Subscribe(new string[] { token + "/disconnect" }, new byte[] { MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE });

            // restore db from file or template
            string dbName = "RNN_maze_" + USER_TOKEN;
            rnn_network.RestoreDB(dbName, true);

            rnn_net = CreateOrLoadNetwork(dbName, Maze);

            rnn_net.Temp_Num_Sessions = Temp_num_sessions;
            rnn_net.StartRandomness = StartRandomness;
            rnn_net.EndRandomness = EndRandomness;
        }

        public rnn_network CreateOrLoadNetwork(string databaseName, MazeInfo maze)
        {
            var rnn_net = new rnn_network(databaseName);

            if (!rnn_net.LoadNetwork(maze.Name))
            {
                var inputs = new List<rnn_io>()
                {
                    new rnn_io(rnn_net, "X", typeof(Int32).ToString(), 0, maze.Width - 1, RnnInputType.Distinct),
                    new rnn_io(rnn_net, "Y", typeof(Int32).ToString(), 0, maze.Height - 1,  RnnInputType.Distinct),
                    //new rnn_io(rnn_net, "BumpedIntoWall", typeof(Boolean).ToString(), 0, 1)
                };

                var outputs = new List<rnn_io>()
                {
                    new rnn_io(rnn_net, "Direction", typeof(Int16).ToString(), 0, 3)
                };

                rnn_net.NewNetwork(maze.Name, inputs, outputs);
            }

            return rnn_net;
        }

        public double RandomnessLeft
        {
            get
            {
                return rnn_net.RandomnessCurrentValue;
            }
        }

        
        public double BumpedIntoWallPercentage
        {
            get
            {
                return rnn_net.GetBumpedIntoWallsCount(rnn_net.CurrentNetworkID, rnn_net.LastSessionID);
            }
        }

        public void ResestStaticSessionData()
        {
            //rnn_network.SessionCountInitial = null;
            if (rnn_net != null)
            {
                rnn_net.SessionCountInitial = 0;// rnn_net.SessionCount;
            }
        }

        public void DisconnectMQTT()
        {
            if (OUTPUT_FROM_SERVER_MQTT_CLIENT != null && OUTPUT_FROM_SERVER_MQTT_CLIENT.IsConnected)
            {
                OUTPUT_FROM_SERVER_MQTT_CLIENT.Disconnect();
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
                OUTPUT_FROM_SERVER_MQTT_CLIENT.Publish(USER_TOKEN + "/mazeMove", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(gameError)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
            }
        }

        /// <summary>
        /// This method will let the AI play the maze for one game (windowless)
        /// </summary>
        /// 

        int sessionCounter = 0;
        public MazeCycleOutcome Travel(int currentSession = 1, CancellationToken? cancelToken = null)
        {
            sessionCounter++;

            MazeGame game = new MazeGame();
            game.InitGame(Maze);
            game.traveler = this;
            game.traveler.location.X = Maze.StartingPosition.X;
            game.traveler.location.Y = Maze.StartingPosition.Y;

            MazeCycleOutcome outcome = new MazeCycleOutcome();
            bool isFirst = true;

            //Start AI Training Cycle
            currentSessionID = rnn_net.SessionStart();
                
            //hack, should not have to do this anymore but the way the maz app was built I have to do it this way
            rnn_net.SessionCount = currentSession - 1;

            if (SessionStarted != null) SessionStarted(rnn_net.RandomnessCurrentValue);

            var cycleCounter = 0;
            var cycleOutputs = new List<int>();
            dynamic outObj = null;
            var sessionDone = false;

            while (!outcome.GameOver)
            {
                if (cancelToken.HasValue && cancelToken.Value.IsCancellationRequested)
                {
                    return outcome;
                }

                // start next AI's move
                var inputs = new List<rnn_io_with_value>()
                {
                    new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "X"), game.traveler.location.X.ToString()),
                    new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "Y"), game.traveler.location.Y.ToString()),
                    //new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "BumpedIntoWall"), ((isFirst) ? false.ToString() : outcome.BumpedIntoWall.ToString()))
                };
                isFirst = false;

                // get AI output
                rnn_cycle cycle = new rnn_cycle();
                var aiResult = cycle.RunCycle(rnn_net, currentSessionID, inputs, Learn);
                var direction = Convert.ToInt16(aiResult.CycleOutput.Outputs.First().Value);

                // make the move
                outcome = game.CycleMaze(direction, true);

                // score AI
                double score = ScoreAI(outcome, game.traveler);
                rnn_net.ScoreCycle(aiResult.CycleOutput.CycleID, score);

                if (MazeCycleComplete != null) MazeCycleComplete(game.traveler.location.X, game.traveler.location.Y, outcome.BumpedIntoWall);

                cycleCounter++;
                cycleOutputs.Add(direction);

                if (cycleCounter == 100)
                {
                    outObj = new { Moves = cycleOutputs, Session = sessionCounter, Done = false, SessionScore = 0 };

                    OUTPUT_FROM_SERVER_MQTT_CLIENT.Publish(USER_TOKEN + "/mazeMove", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(outObj)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                    cycleCounter = 0;
                    cycleOutputs = new List<int>();

                }
                else
                {
                    sessionDone = true;
                }
            }

            // compute final score
            outcome.FinalScore = game.CalculateFinalScore(game.Moves);

            if (sessionDone)
            {
                outObj = new { Moves = cycleOutputs, Session = sessionCounter, Done = true, SessionScore = outcome.FinalScore };
                OUTPUT_FROM_SERVER_MQTT_CLIENT.Publish(USER_TOKEN + "/mazeMove", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(outObj)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
            }

            System.Diagnostics.Debug.WriteLine($"Randomness left: {rnn_net.RandomnessCurrentValue}");

            // End AI Training Cycle
            rnn_net.SessionEnd(outcome.FinalScore);

            return outcome;
        }

        private void Rnn_net_CycleComplete(rnn_cyclecomplete_args e)
        {
            if (e.RnnType != RnnNetworkType.Supervised) // Unsupervised & Predict only
            {
                currentCycleID = e.CycleOutput.CycleID;
                var aiOutput = Convert.ToInt16(e.CycleOutput.Outputs.First().Value);

                // queue AI's output - the Direction the AI will go
                GameRef.DirectionsStack.Enqueue(aiOutput);
            }
        }

        void GameRef_GameStartEvent(Traveler traveler, int currentIteration = 1)
        {
            try
            {
                //Start AI Training Cycle
                currentSessionID = rnn_net.SessionStart();

                //hack, should not have to do this anymore but the way the maz app was built I have to do it this way
                rnn_net.SessionCount = currentIteration - 1;
                if (SetRandomnessLeft != null)
                {
                    SetRandomnessLeft(rnn_net.RandomnessCurrentValue);
                }

                //Make your first move
                var initial_inputs = new List<rnn_io_with_value>()
                {
                    new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "X"), traveler.location.X.ToString()),
                    new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "Y"), traveler.location.Y.ToString()),
                    //new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "BumpedIntoWall"), false.ToString())
                };

                rnn_cycle cycle = new rnn_cycle();
                cycle.RunCycle(rnn_net, currentSessionID, initial_inputs, Learn);
            }
            catch (Exception)
            {
                if (MazeCycleError != null)
                    MazeCycleError(rnn_net.CurrentNetworkName);                   
            }
        }

        public void GameRef_GameOverEvent(MazeGameFinalOutcome final)
        {
            System.Diagnostics.Debug.WriteLine($"Randomness left: {rnn_net.RandomnessCurrentValue}");

            //End AI Training Cycle
            rnn_net.SessionEnd(final.FinalScore);
        }

        void GameRef_GameCycleEvent(MazeCycleOutcome mazeCycle, Traveler traveler)
        {         
            try
            {
                // A Cycle Ended, Mark the Score, then make your next move

                // determine score
                double score = ScoreAI(mazeCycle, traveler);
                rnn_net.ScoreCycle(currentCycleID, score);

                if (!mazeCycle.GameOver)
                {
                    // start next AI's move
                    var inputs = new List<rnn_io_with_value>()
                    {
                        new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "X"), traveler.location.X.ToString()),
                        new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "Y"), traveler.location.Y.ToString()),
                        //new rnn_io_with_value(rnn_net.Inputs.First(a => a.Name == "BumpedIntoWall"), mazeCycle.BumpedIntoWall.ToString())
                    };

                    rnn_cycle cycle = new rnn_cycle();
                    cycle.RunCycle(rnn_net, currentSessionID, inputs, Learn);
                }
            }
            catch (Exception)
            {
                if (MazeCycleError != null)
                    MazeCycleError(rnn_net.CurrentNetworkName);
            }
        }

        private double ScoreAI(MazeCycleOutcome mazeCycle, Traveler traveler)
        {
            double retVal = WRONG_SCORE;

            if (mazeCycle.GameOver)
            {
                retVal = CORRECT_SCORE * 2;
            }
            else if (!mazeCycle.BumpedIntoWall)
            {
                retVal = CORRECT_SCORE;
            }

            return retVal;
        }

        override public void AcceptUIKeyDown(short direction)
        {
            //Ignore the human no input on AI driven games.
        }

        public void Dispose()
        {
            if (rnn_net != null)
            {
                rnn_net.CycleComplete -= Rnn_net_CycleComplete;
            }

            if (GameRef != null)
            {
                GameRef.GameCycleEvent -= GameRef_GameCycleEvent;
                GameRef.GameStartEvent -= GameRef_GameStartEvent;
                // GameRef.GameOverEvent -= GameRef_GameOverEvent;
            }
        }
    }
}
