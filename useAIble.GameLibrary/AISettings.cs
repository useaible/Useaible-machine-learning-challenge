using Encog.Engine.Network.Activation;
using Encog.MathUtil.Randomize;
using Encog.ML;
using Encog.ML.Data;
using Encog.ML.Data.Basic;
using Encog.ML.Genetic;
using Encog.ML.Train;
using Encog.Neural.Networks;
using Encog.Neural.Networks.Layers;
using Encog.Neural.Networks.Training.Anneal;
using Encog.Neural.Networks.Training.Lma;
using Encog.Neural.Networks.Training.Propagation.Back;
using Encog.Neural.Networks.Training.Propagation.Manhattan;
using Encog.Neural.Networks.Training.Propagation.Quick;
using Encog.Neural.Networks.Training.Propagation.Resilient;
using Encog.Neural.Networks.Training.Propagation.SCG;
using Encog.Neural.Networks.Training.PSO;
using Encog.Util.Arrayutil;
using Newtonsoft.Json;
using RNN;
using RNN.EF;
using RNN.Enums;
using RNN.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;
using useAIble.Core.Contracts;
using useAIble.Core.Contracts.ProductAdviser;
using useAIble.Core.Contracts.Repositories;
using useAIble.Core.Enums;
using useAIble.Core.Exceptions;
using useAIble.Core.IoC;
using useAIble.Core.Models;
using useAIble.Core.Models.FeatureItems.DataChunks;
using useAIble.Core.Models.GameData;
using useAIble.Core.Models.PlanogramBuilder;
using useAIble.Core.Utility;
using useAIble.FeatureManagement.AI;
using useAIble.GameLibrary.LogisticSimulation;
using useAIble.GameLibrary.LunarLander;
using useAIble.GameLibrary.Maze;
using useAIble.ModuleManager;

namespace useAIble.AIModule
{
    public delegate void EnqueueProgress(NotificationType type, useAIbleProgress prg);
    public delegate void EnqueueNotify(NotificationType type, useAIbleNotification notify);
    public delegate bool ConcurrDictTryAdd(string key, IEnumerable<AreaItemOptimizedResults> value);

    public class AI : useAIbleModuleBase
    {
        private string MQTT_URL = ConfigFile.MqttUrl;
        #region Constructors

        public AI(useAIbleAIFeatureMgr featureMgr)
            : base("AIModule", featureMgr)
        {
            rnetworks = new ConcurrentDictionary<string, rnn_network>();
        }

        #endregion

        #region Games
        // global cancel token so we could stop all running instances
        private static CancellationTokenSource gameCancelTokenSrc = new CancellationTokenSource();

        #region Lunar lander
        public void PlayLunarLander_Encog(LunarLanderMetadata_Encog data)
        {
            Task mazeTask = Task.Run(() =>
            {
                PlayLunarLander_Encog(data, gameCancelTokenSrc.Token);
            }, gameCancelTokenSrc.Token);
        }

        private void PlayLunarLander_Encog(LunarLanderMetadata_Encog data, CancellationToken cancelToken)
        {
            MqttClient mqtt = null;
            LanderOutputManager outputMgr = null;
            BasicNetwork network;

            try
            {
                network = CreateLanderNetwork_Encog(data.HiddenLayerNeuronsInputs);

                // ICalculateScore instance which invokes the simulation and gets the score for encog
                var encogPilotScore = new EncogLanderPilotScore(data);

                // determine training method
                IMLTrain train = null;
                if (data.TrainingMethodType == 0)
                {
                    // create encog network structure
                    //BasicNetwork network = CreateLanderNetwork_Encog(data.HiddenLayerNeurons);

                    train = new NeuralSimulatedAnnealing(
                        network, encogPilotScore, data.StartTemp.Value, data.StopTemp.Value, data.Cycles.Value);
                }
                else if(data.TrainingMethodType == 1)
                {
                    train = new MLMethodGeneticAlgorithm(() =>
                    {
                        BasicNetwork result = CreateLanderNetwork_Encog(data.HiddenLayerNeuronsInputs);
                        ((IMLResettable)result).Reset();
                        return result;
                    }, encogPilotScore, data.PopulationSize.Value);
                }
                else
                {
                    IRandomizer randomizer = new RangeRandomizer(data.MinRandom.Value, data.MaxRandom.Value);

                    train = new NeuralPSO(network, randomizer, encogPilotScore, data.PopulationSize.Value);
                }

                // initialize MQTT client and connect to server
                //mqtt = new MqttClient(System.Net.IPAddress.Parse(MQTT_URL));

                System.Net.IPAddress ipAddress;
                if (System.Net.IPAddress.TryParse(MQTT_URL, out ipAddress))
                {
                    mqtt = new MqttClient(ipAddress);
                }
                else
                {
                    mqtt = new MqttClient(MQTT_URL);
                }

                mqtt.Connect(Guid.NewGuid().ToString("N"), "", "", true, 60 * 10); // ten minutes

                // handles the output per simulation
                outputMgr = new LanderOutputManager(mqtt, data.UserToken);
                outputMgr.ProcessOutputs();

                // set the Output Manager instance so it can be referenced during training/simulation               
                encogPilotScore.OutputMgr = outputMgr;

                // train
                for (int i = 0; i < data.Epochs; i++)
                {
                    if (cancelToken.IsCancellationRequested)
                        return;

                    train.Iteration();

                    // send epoch score
                    mqtt.Publish(data.UserToken + "/encog/lander/epoch_scores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Epoch = i + 1, Score = train.Error })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
                    System.Diagnostics.Debug.WriteLine(@"Epoch #" + i + @" Score:" + train.Error);
                }
            }
            finally
            {
                outputMgr?.StopProcess();

                if (mqtt != null && mqtt.IsConnected)
                {
                    if (outputMgr != null && outputMgr.Outputs.Count == 0)
                    {
                        Thread.Sleep(3 * 1000);
                        mqtt.Disconnect();
                    }
                    else
                    {
                        outputMgr.HandleMqttDisconnection = true;
                    }
                }
            }
        }

        private BasicNetwork CreateLanderNetwork_Encog(int hiddenLayerNeurons)
        {
            var pattern = new Encog.Neural.Pattern.FeedForwardPattern();
            pattern.InputNeurons = 3;
            pattern.AddHiddenLayer(hiddenLayerNeurons);
            pattern.OutputNeurons = 1;
            pattern.ActivationFunction = new ActivationTANH();
            BasicNetwork network = (BasicNetwork)pattern.Generate();
            network.Reset();
            return network;
        }

        private BasicNetwork CreateLanderNetwork_Encog(List<int> hiddenLayerNeuronsInputs)
        {
            var pattern = new Encog.Neural.Pattern.FeedForwardPattern();
            pattern.InputNeurons = 3;

            foreach (var numberOfNeurons in hiddenLayerNeuronsInputs)
            {
                pattern.AddHiddenLayer(numberOfNeurons);
            }

            pattern.OutputNeurons = 1;
            pattern.ActivationFunction = new ActivationTANH();
            BasicNetwork network = (BasicNetwork)pattern.Generate();

            network.Reset();
            return network;
        }
        #endregion

        #region Maze
        public void PlayMaze_Encog(MazeMetadata_Encog data)
        {
            Task mazeTask = Task.Run(() =>
            {
                PlayMaze_Encog(data, gameCancelTokenSrc.Token);
            }, gameCancelTokenSrc.Token);
        }

        private void PlayMaze_Encog(MazeMetadata_Encog data, CancellationToken cancelToken)
        {
            MqttClient mqtt = null;
            MazeOutputManager outputMgr = null;

            try
            {
                MazeInfo maze = (MazeInfo)data.MazeInfo;

                // create encog network structure
                BasicNetwork network = CreateMazeNetwork_Encog(data.HiddenLayerNeuronsInputs);

                // ICalculateScore instance which invokes the simulation and gets the score for encog
                var encogPilotScore = new EncogMazePilotScore(maze, data.UserToken);

                // determine training method
                IMLTrain train = null;
                if (data.TrainingMethodType == 0)
                {
                    train = new NeuralSimulatedAnnealing(
                        network, encogPilotScore, data.StartTemp.Value, data.StopTemp.Value, data.Cycles.Value);
                }
                else if(data.TrainingMethodType == 1)
                {
                    train = new MLMethodGeneticAlgorithm(() =>
                    {
                        BasicNetwork result = CreateMazeNetwork_Encog(data.HiddenLayerNeuronsInputs);
                        ((IMLResettable)result).Reset();
                        return result;
                    }, encogPilotScore, data.PopulationSize.Value);
                }
                else
                {
                    IRandomizer randomizer = new RangeRandomizer(data.MinRandom.Value, data.MaxRandom.Value);

                    train = new NeuralPSO(network, randomizer, encogPilotScore, data.PopulationSize.Value);
                }

                // initialize MQTT client and connect to server
                System.Net.IPAddress ipAddress;
                if (System.Net.IPAddress.TryParse(MQTT_URL, out ipAddress))
                {
                    mqtt = new MqttClient(ipAddress);
                }
                else
                {
                    mqtt = new MqttClient(MQTT_URL);
                }
                mqtt.Connect(Guid.NewGuid().ToString("N"), "", "", true, 60 * 10); // ten minutes

                // handles the output per simulation
                outputMgr = new MazeOutputManager(mqtt, data.UserToken);
                outputMgr.ProcessOutputs();
                
                // set the Output Manager instance so it can be referenced during training/simulation               
                encogPilotScore.OutputMgr = outputMgr;

                // train
                for (int i = 0; i < data.Epochs; i++)
                {
                    if (cancelToken.IsCancellationRequested)
                        return;

                    train.Iteration();

                    // send epoch score
                    mqtt.Publish(data.UserToken + "/mazeEpochScores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Epoch = i + 1, Score = train.Error })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
                    System.Diagnostics.Debug.WriteLine(@"Epoch #" + i + @" Score:" + train.Error);
                }

                // send all session scores
                //mqtt.Publish(data.UserToken + "/mazeSessionScores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(EncogMazeTraveler.Scores)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
            }
            finally
            {
                outputMgr?.StopProcess();

                if (mqtt != null && mqtt.IsConnected)
                {
                    if (outputMgr != null && outputMgr.Outputs.Count == 0)
                    {
                        Thread.Sleep(3 * 1000);
                        mqtt.Disconnect();
                    }
                    else
                    {
                        outputMgr.HandleMqttDisconnection = true;
                    }
                }
            }
        }

        private BasicNetwork CreateMazeNetwork_Encog(int hiddenLayerNeurons)
        {
            var pattern = new Encog.Neural.Pattern.FeedForwardPattern();
            pattern.InputNeurons = 2;
            pattern.AddHiddenLayer(hiddenLayerNeurons);
            pattern.OutputNeurons = 4;
            pattern.ActivationFunction = new ActivationTANH();
            BasicNetwork network = (BasicNetwork)pattern.Generate();
            //network.AddLayer(new BasicLayer(new ActivationTANH(), true, 4));
            network.Reset();
            return network;
        }

        private BasicNetwork CreateMazeNetwork_Encog(List<int> hiddenLayerNeuronsInputs)
        {
            var pattern = new Encog.Neural.Pattern.FeedForwardPattern();
            pattern.InputNeurons = 2;

            foreach (var numberOfNeurons in hiddenLayerNeuronsInputs)
            {
                pattern.AddHiddenLayer(numberOfNeurons);
            }

            pattern.OutputNeurons = 4;
            pattern.ActivationFunction = new ActivationTANH();
            BasicNetwork network = (BasicNetwork)pattern.Generate();

            network.Reset();
            return network;
        }
        #endregion

        #region Logistic Simulation
        public void PlayLogisticSimulator_TF(LogisticSimulationMetadata data)
        {
            // todo, might track per game instance later on so we will use the task handle for the maze task
            Task mazeTask = Task.Run(() =>
            {
                PlayLogisticSimulator_TF(data, gameCancelTokenSrc.Token);

            }, gameCancelTokenSrc.Token);

            //LogisticSimulator simulator = simulator = new LogisticSimulator(1.0, 0.5, data.UserToken, data.NetworkName);
            //simulator.start();
        }

        private void PlayLogisticSimulator_TF(LogisticSimulationMetadata data, CancellationToken cancelToken)
        {
            LogisticSimulator simulator = null;

            try
            {
                simulator = new LogisticSimulator(data.UserToken, data.NetworkName, data.StorageCostPerDay, data.BacklogCostPerDay, data.RetailerInitialInventory, data.WholesalerInitialInventory, data.DistributorInitialInventory, data.FactoryInitialInventory, true);
                IEnumerable<int> customerOrders = new List<int>() { 11, 1, 16, 6, 10, 26, 1, 25, 28, 25, 2, 23, 3, 5, 24, 20, 3, 27, 22, 24, 19, 29, 27, 28, 24, 2, 9, 26, 7, 4, 18, 21, 18, 26, 8, 27, 5, 29, 27, 6, 6, 17, 4, 6, 3, 22, 17, 1, 21, 21, 1, 21, 27, 19, 17, 11, 4, 18, 11, 8, 18, 5, 18, 25, 7, 10, 6, 7, 27, 27, 15, 3, 29, 17, 19, 2, 25, 21, 25, 3, 15, 9, 5, 15, 4, 27, 23, 29, 9, 26, 24, 16, 19, 19, 17, 1, 28, 9, 29, 23 };

                Random rand = new Random();
                var initialDataList = new List<TF_Initial_Data>();
                for (int i = 0; i < data.NumSessions; i++)
                {
                    // randomize max/min values
                    var simOutputs = new List<LogisticSimulatorOutput>();
                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "Retailer_Min", Value = rand.Next(0, 51) });
                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "Retailer_Max", Value = rand.Next(51, 120) });

                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "WholeSaler_Min", Value = rand.Next(0, 51) });
                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "WholeSaler_Max", Value = rand.Next(51, 120) });

                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "Distributor_Min", Value = rand.Next(0, 51) });
                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "Distributor_Max", Value = rand.Next(51, 120) });

                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "Factory_Min", Value = rand.Next(0, 51) });
                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "Factory_Max", Value = rand.Next(51, 120) });
                    simOutputs.Add(new LogisticSimulatorOutput() { Name = "Factory_Units_Per_Day", Value = rand.Next(1, 100) });

                    // reset sim outputs
                    simulator.ResetSimulationOutput();

                    simulator.start(simOutputs, customOrders: customerOrders);
                    var totalCosts = simulator.SumAllCosts() * -1;

                    initialDataList.Add(new TF_Initial_Data() { Settings = simOutputs.Select(a => a.Value), TotalCosts = totalCosts });
                }

                var jsonInitData = JsonConvert.SerializeObject(new { Metadata = data, Data = initialDataList });

                // make request to alvin to play TF

                simulator = new LogisticSimulator(data.UserToken, data.NetworkName, data.StorageCostPerDay, data.BacklogCostPerDay, data.RetailerInitialInventory, data.WholesalerInitialInventory, data.DistributorInitialInventory, data.FactoryInitialInventory, false, "tensorflow");


            simulator.OutputFromServerMQttClient.Publish("logistic_train", Encoding.UTF8.GetBytes(jsonInitData), MqttMsgBase.QOS_LEVEL_AT_LEAST_ONCE, false);

                //simulator.TurnOffMQTT = false;

                // setting timeout for tensorflow response
                //bool timeout = false;
                //System.Timers.Timer t = new System.Timers.Timer();
                //t.Interval = (60 * 1000 * 60); // 10 minutes to wait for tensorflow
                //t.Elapsed += (s, e) =>
                //{
                //    timeout = true;
                //    ((System.Timers.Timer)s).Stop();
                //};

                //t.Start();

                while (true)
                {

                    System.Diagnostics.Debug.WriteLine("Waiting for tensorflow...");

                    // TODO put timeout here
                    //if (timeout)
                    //{
                    //    simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/tensorflowTimeout", Encoding.UTF8.GetBytes("Tensorflow failed to response within the allotted time of 10 minutes"), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                    //    simulator.DisconnectMQTT();
                    //    break;
                    //}

                    if (cancelToken.IsCancellationRequested)
                        break;

                    if (simulator.TF_Output != null)
                    {
                        //timeout = false;
                        //t.Stop();

                        int trainingCnt = 0;
                        foreach (var item in simulator.TF_Output)
                        {
                            trainingCnt++;

                        simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/logisticOutputs", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = trainingCnt, Outputs = item.Settings })), MqttMsgBase.QOS_LEVEL_AT_LEAST_ONCE, false);

                            // reset sim outputs
                            simulator.ResetSimulationOutput();

                            simulator.start(item.Settings, data.NoOfDaysInterval, customerOrders);
                            var totalCosts = simulator.SumAllCosts();

                        simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/logisticSessionScores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = trainingCnt, Score = string.Format("${0:#,0}", Math.Abs(totalCosts)) })), MqttMsgBase.QOS_LEVEL_AT_LEAST_ONCE, false);

                            Task.Delay(1000).Wait();
                        }

                        break;
                    }

                    Task.Delay(1000).Wait();
                }
            }
            finally
            {
                if (simulator != null)
                {
                    simulator.DisconnectMQTT();
                }
            }
        }

        public void PlayLogisticSimulator_Encog(LogisticSimulationMetadata_Encog data)
        {
            Task logisticTask = Task.Run(() =>
            {
                PlayLogisticSimulator_Encog(data, gameCancelTokenSrc.Token);

            }, gameCancelTokenSrc.Token);
        }

        private void PlayLogisticSimulator_Encog(LogisticSimulationMetadata_Encog data, CancellationToken cancelToken)
        {
            MqttClient mqtt = null;
            LogisticOutputManager outputMgr = null;
            EncogNetworkType trainingMethodType = (EncogNetworkType)data.TrainingMethodType;


            //mqtt = new MqttClient("dev.useaible.com");
            //mqtt.Connect(Guid.NewGuid().ToString("N"), "", "", true, 60 * 10); // ten minutes

            bool isSupervised = false;

            try
            {
                // create encog network structure
                BasicNetwork network = CreateLogisticNetwork_Encog(data.HiddenLayerNeuronsInputs);

                IMLTrain train;
                var encogPilotScore = new EncogLogisticsPilotScore(
                    new List<int>() { 11, 1, 16, 6, 10, 26, 1, 25, 28, 25, 2, 23, 3, 5, 24, 20, 3, 27, 22, 24, 19, 29, 27, 28, 24, 2, 9, 26, 7, 4, 18, 21, 18, 26, 8, 27, 5, 29, 27, 6, 6, 17, 4, 6, 3, 22, 17, 1, 21, 21, 1, 21, 27, 19, 17, 11, 4, 18, 11, 8, 18, 5, 18, 25, 7, 10, 6, 7, 27, 27, 15, 3, 29, 17, 19, 2, 25, 21, 25, 3, 15, 9, 5, 15, 4, 27, 23, 29, 9, 26, 24, 16, 19, 19, 17, 1, 28, 9, 29, 23 },
                    data);//LogisticSimulator.GenerateCustomerOrders(), // todo assign customer orders)


                if (trainingMethodType == EncogNetworkType.Anneal)
                {
                    train = new NeuralSimulatedAnnealing(
                        network, encogPilotScore, data.StartTemp.Value, data.StopTemp.Value, data.Cycles.Value);
                }
                else if (trainingMethodType == EncogNetworkType.Genetic)
                {
                    train = new MLMethodGeneticAlgorithm(() =>
                    {
                        BasicNetwork result = CreateLogisticNetwork_Encog(data.HiddenLayerNeuronsInputs);
                        ((IMLResettable)result).Reset();
                        return result;
                    }, encogPilotScore, data.PopulationSize.Value);
                }
                else if (trainingMethodType == EncogNetworkType.PSO)
                {
                    IRandomizer randomizer = new RangeRandomizer(data.MinRandom.Value, data.MaxRandom.Value);

                    train = new NeuralPSO(network, randomizer, encogPilotScore, data.PopulationSize.Value);

                }
                else
                {
                    isSupervised = true;

                    //mqtt = new MqttClient("dev.useaible.com");
                    //mqtt.Connect(Guid.NewGuid().ToString("N"), "", "", true, 60 * 10); // ten minutes

                    System.Net.IPAddress ipAddress;
                    if (System.Net.IPAddress.TryParse(MQTT_URL, out ipAddress))
                    {
                        mqtt = new MqttClient(ipAddress);
                    }
                    else
                    {
                        mqtt = new MqttClient(MQTT_URL);
                    }
                    mqtt.Connect(Guid.NewGuid().ToString("N"), "", "", true, 60 * 10); // ten minutes

                    var simulator = new LogisticSimulator(data.UserToken, data.NetworkName, data.StorageCostPerDay, data.BacklogCostPerDay, data.RetailerInitialInventory, data.WholesalerInitialInventory, data.DistributorInitialInventory, data.FactoryInitialInventory, true);
                    IEnumerable<int> customerOrders = new List<int>() { 11, 1, 16, 6, 10, 26, 1, 25, 28, 25, 2, 23, 3, 5, 24, 20, 3, 27, 22, 24, 19, 29, 27, 28, 24, 2, 9, 26, 7, 4, 18, 21, 18, 26, 8, 27, 5, 29, 27, 6, 6, 17, 4, 6, 3, 22, 17, 1, 21, 21, 1, 21, 27, 19, 17, 11, 4, 18, 11, 8, 18, 5, 18, 25, 7, 10, 6, 7, 27, 27, 15, 3, 29, 17, 19, 2, 25, 21, 25, 3, 15, 9, 5, 15, 4, 27, 23, 29, 9, 26, 24, 16, 19, 19, 17, 1, 28, 9, 29, 23 };

                    Random rand = new Random();

                    IList<IEnumerable<LogisticSimulatorOutput>> logisticOutputs = new List<IEnumerable<LogisticSimulatorOutput>>();
                    for (int i = 0; i < 100; i++)
                    {
                        // randomize max/min values
                        var simOutputs = new List<LogisticSimulatorOutput>();
                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "Retailer_Min", Value = rand.Next(0, 51) });
                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "Retailer_Max", Value = rand.Next(51, 120) });

                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "WholeSaler_Min", Value = rand.Next(0, 51) });
                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "WholeSaler_Max", Value = rand.Next(51, 120) });

                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "Distributor_Min", Value = rand.Next(0, 51) });
                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "Distributor_Max", Value = rand.Next(51, 120) });

                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "Factory_Min", Value = rand.Next(0, 51) });
                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "Factory_Max", Value = rand.Next(51, 120) });
                        simOutputs.Add(new LogisticSimulatorOutput() { Name = "Factory_Units_Per_Day", Value = rand.Next(1, 100) });

                        // reset sim outputs
                        simulator.ResetSimulationOutput();
                        simulator.start(simOutputs, customOrders: customerOrders);

                        logisticOutputs.Add(simOutputs);
                    }

                    var trainingSet = new BasicMLDataSet();
                    var encogInput = new BasicMLData(1);

                    encogInput[0] = 1;

                    foreach (var b in logisticOutputs)
                    {
                        trainingSet.Data.Add(new BasicMLDataPair(encogInput, new BasicMLData(b.Select(a => Convert.ToDouble(a.Value)).ToArray())));
                    }

                    if (trainingMethodType == EncogNetworkType.Back_Propagation)
                    {
                        train = new Backpropagation(network, trainingSet, data.LearnRate.Value, data.Momentum.Value);
                    }
                    else if (trainingMethodType == EncogNetworkType.Manhattan_Propagation)
                    {
                        train = new ManhattanPropagation(network, trainingSet, data.LearnRate.Value);
                    }
                    else if (trainingMethodType == EncogNetworkType.Quick_Propagation)
                    {
                        train = new QuickPropagation(network, trainingSet, data.LearnRate.Value);
                    }
                    else if (trainingMethodType == EncogNetworkType.Resilient_Propagation)
                    {
                        train = new ResilientPropagation(network, trainingSet);
                    }
                    else if (trainingMethodType == EncogNetworkType.SCG)
                    {
                        train = new ScaledConjugateGradient(network, trainingSet);
                    }
                    else if (trainingMethodType == EncogNetworkType.LMA)
                    {
                        train = new LevenbergMarquardtTraining(network, trainingSet);
                    }
                    else
                    {
                        train = null;
                    }

                    // train
                    for (int i = 0; i < data.Epochs; i++)
                    {
                        if (cancelToken.IsCancellationRequested)
                            return;

                        train.Iteration();
                    }

                    NormalizedField min = new NormalizedField(NormalizationAction.Normalize, "min", 51, 0, -1, 1);
                    NormalizedField max = new NormalizedField(NormalizationAction.Normalize, "max", 120, 51, -1, 1);
                    NormalizedField units = new NormalizedField(NormalizationAction.Normalize, "units", 100, 1, -1, 1);

                    var logisticSimulatorOutput = new LogisticSimOutput();

                    for (var i = 0; i < data.Epochs; i++)
                    {
                        var output = network.Compute(encogInput);

                        var logOutput = new List<LogisticSimulatorOutput>();
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "Retailer_Min", Value = Convert.ToInt32(min.DeNormalize(output[0])) });
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "Retailer_Max", Value = Convert.ToInt32(max.DeNormalize(output[1])) });
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "WholeSaler_Min", Value = Convert.ToInt32(min.DeNormalize(output[2])) });
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "WholeSaler_Max", Value = Convert.ToInt32(max.DeNormalize(output[3])) });
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "Distributor_Min", Value = Convert.ToInt32(min.DeNormalize(output[4])) });
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "Distributor_Max", Value = Convert.ToInt32(max.DeNormalize(output[5])) });
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "Factory_Min", Value = Convert.ToInt32(min.DeNormalize(output[6])) });
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "Factory_Max", Value = Convert.ToInt32(max.DeNormalize(output[7])) });
                        logOutput.Add(new LogisticSimulatorOutput() { Name = "Factory_Units_Per_Day", Value = Convert.ToInt32(units.DeNormalize(output[8])) });

                        simulator.ResetSimulationOutput();
                        simulator.start(logOutput, customOrders: customerOrders);

                        logisticSimulatorOutput.Settings = logOutput;
                        logisticSimulatorOutput.Score = simulator.SimulationOutput.Score;
                        logisticSimulatorOutput.SimulatedDays = simulator.SimulationOutput.SimulatedDays;

                        mqtt.Publish(
                 data.UserToken + "/encog/logistic/simulation_output",
                 Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(logisticSimulatorOutput)),
                 MqttMsgBase.QOS_LEVEL_AT_LEAST_ONCE,
                 false);

                    }
                }

                if (!isSupervised)
                {
                    // initialize MQTT client and connect to server
                    //mqtt = new MqttClient("dev.useaible.com");
                    //mqtt.Connect(Guid.NewGuid().ToString("N"), "", "", true, 60 * 10); // ten minutes

                    System.Net.IPAddress ipAddress;
                    if (System.Net.IPAddress.TryParse(MQTT_URL, out ipAddress))
                    {
                        mqtt = new MqttClient(ipAddress);
                    }
                    else
                    {
                        mqtt = new MqttClient(MQTT_URL);
                    }
                    mqtt.Connect(Guid.NewGuid().ToString("N"), "", "", true, 60 * 10); // ten minutes

                    outputMgr = new LogisticOutputManager(mqtt, data.UserToken);
                    outputMgr.ProcessOutputs();
                    encogPilotScore.OutputMgr = outputMgr;

                    // train
                    for (int i = 0; i < data.Epochs; i++)
                    {
                        if (cancelToken.IsCancellationRequested)
                            return;

                        train.Iteration();
                        //mqtt.Publish(data.UserToken + "/logisticEpochScores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Epoch = i + 1, Score = (20000 - train.Error) })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
                        System.Diagnostics.Debug.WriteLine(@"Epoch #" + i + @" Score:" + (20000 - train.Error));
                    }
                }

            }
            finally
            {
                outputMgr?.StopProcess();

                if (mqtt != null && mqtt.IsConnected)
                {
                    if (outputMgr != null && outputMgr.Outputs.Count == 0)
                    {
                        //Task.Delay(1000*3).Wait();
                        mqtt.Disconnect();
                    }
                    else
                    {
                        outputMgr.HandleMqttDisconnection = true;
                    }
                }
            }
        }

        private BasicNetwork CreateLogisticNetwork_Encog(int hiddenLayerNeurons)
        {
            var pattern = new Encog.Neural.Pattern.FeedForwardPattern();
            pattern.InputNeurons = 1;
            pattern.AddHiddenLayer(hiddenLayerNeurons);
            pattern.OutputNeurons = 9;
            pattern.ActivationFunction = new ActivationTANH();
            BasicNetwork network = (BasicNetwork)pattern.Generate();

            network.Reset();
            return network;
        }

        private BasicNetwork CreateLogisticNetwork_Encog(List<int> hiddenLayerNeuronsInputs)
        {
            var pattern = new Encog.Neural.Pattern.FeedForwardPattern();
            pattern.InputNeurons = 1;

            foreach(var numberOfNeurons in hiddenLayerNeuronsInputs)
            {
                pattern.AddHiddenLayer(numberOfNeurons);
            }

            pattern.OutputNeurons = 9;
            pattern.ActivationFunction = new ActivationTANH();
            BasicNetwork network = (BasicNetwork)pattern.Generate();

            network.Reset();
            return network;
        }
        #endregion

        #endregion

        #region Overriden methods

        public override void Stop()
        {
            // stops all game instances that are running
            gameCancelTokenSrc.Cancel();

            base.Stop();
        }

        #endregion
    }

    public enum EncogNetworkType
    {
        Anneal,
        Genetic,
        PSO,
        Back_Propagation,
        Manhattan_Propagation,
        Quick_Propagation,
        Resilient_Propagation,
        SCG,
        LMA
    }
}

