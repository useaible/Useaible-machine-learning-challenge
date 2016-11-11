using DRNN;
using DRNN.Contracts;
using DRNN.Exceptions;
using DRNN.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using useAIble.Core.Models;
using useAIble.Core.Models.GameData;
using useAIble.Core.Models.RNN;
using useAIble.GameLibrary.Maze;

namespace useAIble.MVC.Api.DRNN
{
    [RoutePrefix("api/drnn")]
    public class DRNNController : ApiController
    {
        const int BATCH_LIMIT = 1000;
        private static IDRNNMsgQueuer queuer;

        public DRNNController()
        {
            var repo = DRNNServerApp.Repo;
            queuer = new DRNNMsgQueuer(repo);
        }

        [Route("generateMaze")]
        public HttpResponseMessage GenerateMaze(string token, int width, int height)
        {

            MazeGenerator generator = new MazeGenerator();
            generator.Generate(width, height);
            generator.Solve();

            MazeInfo mazeData = new MazeInfo()
            {
                Name = token,
                StartingPosition = generator.StartingPosition,
                GoalPosition = generator.GoalLocation,
                PerfectGameMovesCount = generator.PerfectGameMovesCount,
                Grid = generator.TheMazeGrid,
                Width = width,
                Height = height
            };

            return Request.CreateResponse(HttpStatusCode.OK, mazeData);
        }

        [Route("playMaze")]
        public void PlayMaze(string token, int numSessions, [FromBody]MazeParams mazeParams)
        {
            useAIbleTask newTask = new useAIbleTask() { GlobalIdentifier = token };
            newTask.TaskItemList.Add(new useAIbleTaskItem("DataPresentationModule", null,
                new useAIbleDestination("AIModule", false, "PlayMaze", new object[]
                {
                    new MazeMetadata()
                    {
                        MazeInfo = mazeParams.Maze,
                        UserToken = token,
                        Width = mazeParams.Maze.Width,
                        Height = mazeParams.Maze.Height,
                        NumSessions = numSessions,
                        NetworkName = "Maze Master",
                        RNNSettings = mazeParams.Settings
                    }
                })));

            // pass to AI module
            Defaults.AIFeatureMgr.TaskEnqueuer.EnqueueOutgoingTask(newTask);
        }

        [Route("playMazeEncog")]
        public void PlayMazeEncog(string token, int numSessions, [FromBody]MazeMetadata_Encog mazeParams)
        {
            MazeInfo maze = JsonConvert.DeserializeObject<MazeInfo>(mazeParams.MazeInfo.ToString());

            useAIbleTask newTask = new useAIbleTask() { GlobalIdentifier = token };
            newTask.TaskItemList.Add(new useAIbleTaskItem("DataPresentationModule", null,
                new useAIbleDestination("AIModule", false, "PlayMaze_Encog", new object[]
                {
                    new MazeMetadata_Encog()
                    {
                        MazeInfo = maze,
                        UserToken = token,
                        Width = maze.Width,
                        Height = maze.Height,
                        NumSessions = numSessions,
                        NetworkName = "Maze Master",

                        HiddenLayerNeurons = mazeParams.HiddenLayerNeurons,
                        TrainingMethodType = mazeParams.TrainingMethodType,
                        Cycles = mazeParams.Cycles,
                        StartTemp = mazeParams.StartTemp,
                        StopTemp = mazeParams.StopTemp,
                        PopulationSize = mazeParams.PopulationSize,
                        Epochs = mazeParams.Epochs,
                        MinRandom = mazeParams.MinRandom,
                        MaxRandom = mazeParams.MaxRandom,
                        HiddenLayerNeuronsInputs = mazeParams.HiddenLayerNeuronsInputs
                    }
                })));

            // pass to AI module
            Defaults.AIFeatureMgr.TaskEnqueuer.EnqueueOutgoingTask(newTask);
        }

        [Route("play")]
        public void PlayLunarLander(string token, string networkName, [FromBody]IEnumerable<RNNCoreSettings> settings, bool learn = true, int sessions = 100, int altitude = 1000, int fuel = 200)
        {
            //LunarLander simulator = new LunarLander(token, networkName, learn, sessions, startRandomness, endRandomness, maxLinearBracket, minLinearBracket, true);
            //simulator.ResetSessionCnt();

            //for (var i = 0; i < sessions; i++)
            //{
            //    simulator.StartSimulation();
            //}

            useAIbleTask newTask = new useAIbleTask() { GlobalIdentifier = token };
            newTask.TaskItemList.Add(new useAIbleTaskItem("DataPresentationModule", null,
                new useAIbleDestination("AIModule", false, "PlayLunarLander", new object[]
                {
                    //new LunarLanderMetadata()
                    //{
                    //    UserToken = token,
                    //    NetworkName = networkName,
                    //    Learn = learn,
                    //    NumSessions = sessions,
                    //    StartRandomness = startRandomness,
                    //    EndRandomness = endRandomness,
                    //    MaxLinear = maxLinearBracket,
                    //    MinLinear = minLinearBracket,
                    //    Altitude = 10000, // todo wireup
                    //    Fuel = 200, // todo wireup
                    //    StartSessionRandomness = numSessionRandomness
                    //}

                    new LunarLanderMetadata()
                    {
                        UserToken = token,
                        NetworkName = networkName,
                        NumSessions = sessions,
                        Altitude = altitude,
                        Fuel = fuel,
                        //RNNSettings = new List<RNNCoreSettings>()
                        //{
                        //    new RNNCoreSettings() { StartRandomness = 30, EndRandomness = 0,  MaxLinear = 15, MinLinear = 5, StartSessionRandomness = 1, EndSessionRandomness = 5 },
                        //    new RNNCoreSettings() { StartRandomness = 10, EndRandomness = 0,  MaxLinear = 10, MinLinear = 5, StartSessionRandomness = 6, EndSessionRandomness = 12 },
                        //}
                        RNNSettings = settings
                    }
                })));

            // pass to AI module
            Defaults.AIFeatureMgr.TaskEnqueuer.EnqueueOutgoingTask(newTask);
        }

        [Route("playLunarLanderEncog")]
        public void PlayLunarLanderEncog(string token, string networkName, [FromBody]LunarLanderMetadata_Encog settings, bool learn = true, int sessions = 100, int altitude = 1000, int fuel = 200)
        {
            //LunarLander simulator = new LunarLander(token, networkName, learn, sessions, startRandomness, endRandomness, maxLinearBracket, minLinearBracket, true);
            //simulator.ResetSessionCnt();

            //for (var i = 0; i < sessions; i++)
            //{
            //    simulator.StartSimulation();
            //}

            useAIbleTask newTask = new useAIbleTask() { GlobalIdentifier = token };
            newTask.TaskItemList.Add(new useAIbleTaskItem("DataPresentationModule", null,
                new useAIbleDestination("AIModule", false, "PlayLunarLander_Encog", new object[]
                {
                    new LunarLanderMetadata_Encog()
                    {
                        UserToken = token,
                        NetworkName = networkName,
                        NumSessions = sessions,
                        Altitude = altitude,
                        Fuel = fuel,

                        HiddenLayerNeurons = settings.HiddenLayerNeurons,
                        TrainingMethodType = settings.TrainingMethodType,
                        Cycles = settings.Cycles,
                        StartTemp = settings.StartTemp,
                        StopTemp = settings.StopTemp,
                        PopulationSize = settings.PopulationSize,
                        Epochs = settings.Epochs,
                        MinRandom = settings.MinRandom,
                        MaxRandom = settings.MaxRandom,
                        HiddenLayerNeuronsInputs = settings.HiddenLayerNeuronsInputs

                    }
                })));

            // pass to AI module
            Defaults.AIFeatureMgr.TaskEnqueuer.EnqueueOutgoingTask(newTask);
        }

        [Route("playLogisticSimulator")]
        public void PlayLogisticSimulator(string token, int numSessions, [FromBody]LogisticSimulationMetadata settings)
        {
            useAIbleTask newTask = new useAIbleTask() { GlobalIdentifier = token };
            newTask.TaskItemList.Add(new useAIbleTaskItem("DataPresentationModule", null,
                new useAIbleDestination("AIModule", false, "PlayLogisticSimulator", new object[]
                {
                    new LogisticSimulationMetadata()
                    {
                        UserToken = token,
                        NumSessions = numSessions,
                        NetworkName = "useAIble Logistic Simulator Master",
                        RNNSettings = settings.RNNSettings,
                        BacklogCostPerDay = settings.BacklogCostPerDay,
                        DistributorInitialInventory = settings.DistributorInitialInventory,
                        FactoryInitialInventory = settings.FactoryInitialInventory,
                        RetailerInitialInventory = settings.RetailerInitialInventory,
                        StorageCostPerDay = settings.StorageCostPerDay,
                        WholesalerInitialInventory = settings.WholesalerInitialInventory,
                        NoOfDaysInterval = settings.NoOfDaysInterval,

                        random_action_prob = settings.random_action_prob,
                        RANDOM_ACTION_DECAY = settings.RANDOM_ACTION_DECAY,
                        HIDDEN1_SIZE = settings.HIDDEN1_SIZE,
                        HIDDEN2_SIZE = settings.HIDDEN2_SIZE,
                        LEARNING_RATE = settings.LEARNING_RATE,
                        MINIBATCH_SIZE = settings.MINIBATCH_SIZE,
                        DISCOUNT_FACTOR = settings.DISCOUNT_FACTOR,
                        TARGET_UPDATE_FREQ = settings.TARGET_UPDATE_FREQ
                    }
                })));

            // pass to AI module
            Defaults.AIFeatureMgr.TaskEnqueuer.EnqueueOutgoingTask(newTask);
        }

        [Route("playLogisticSimulatorTF")]
        public void PlayLogisticSimulatorTF(string token, int numSessions, [FromBody]LogisticSimulationMetadata settings)
        {
            useAIbleTask newTask = new useAIbleTask() { GlobalIdentifier = token };
            newTask.TaskItemList.Add(new useAIbleTaskItem("DataPresentationModule", null,
                new useAIbleDestination("AIModule", false, "PlayLogisticSimulator_TF", new object[]
                {
                    new LogisticSimulationMetadata()
                    {
                        UserToken = token,
                        NumSessions = numSessions,
                        NetworkName = "TF Logistic Simulator Master",

                        BacklogCostPerDay = settings.BacklogCostPerDay,
                        DistributorInitialInventory = settings.DistributorInitialInventory,
                        FactoryInitialInventory = settings.FactoryInitialInventory,
                        RetailerInitialInventory = settings.RetailerInitialInventory,
                        StorageCostPerDay = settings.StorageCostPerDay,
                        WholesalerInitialInventory = settings.WholesalerInitialInventory,
                        NoOfDaysInterval = settings.NoOfDaysInterval,

                        random_action_prob = settings.random_action_prob,
                        RANDOM_ACTION_DECAY = settings.RANDOM_ACTION_DECAY,
                        HIDDEN1_SIZE = settings.HIDDEN1_SIZE,
                        HIDDEN2_SIZE = settings.HIDDEN2_SIZE,
                        LEARNING_RATE = settings.LEARNING_RATE,
                        MINIBATCH_SIZE = settings.MINIBATCH_SIZE,
                        DISCOUNT_FACTOR = settings.DISCOUNT_FACTOR,
                        TARGET_UPDATE_FREQ = settings.TARGET_UPDATE_FREQ
                    }
                })));

            // pass to AI module
            Defaults.AIFeatureMgr.TaskEnqueuer.EnqueueOutgoingTask(newTask);
        }

        [Route("playLogisticSimulatorEncog")]
        public void PlayLogisticSimulatorEncog(string token, int numSessions, [FromBody]LogisticSimulationMetadata_Encog settings)
        {
            useAIbleTask newTask = new useAIbleTask() { GlobalIdentifier = token };
            newTask.TaskItemList.Add(new useAIbleTaskItem("DataPresentationModule", null,
                new useAIbleDestination("AIModule", false, "PlayLogisticSimulator_Encog", new object[]
                {
                    new LogisticSimulationMetadata_Encog()
                    {
                        UserToken = token,
                        NumSessions = numSessions,
                        NetworkName = "Encog Logistic Simulator Master",

                        BacklogCostPerDay = settings.BacklogCostPerDay,
                        DistributorInitialInventory = settings.DistributorInitialInventory,
                        FactoryInitialInventory = settings.FactoryInitialInventory,
                        RetailerInitialInventory = settings.RetailerInitialInventory,
                        StorageCostPerDay = settings.StorageCostPerDay,
                        WholesalerInitialInventory = settings.WholesalerInitialInventory,
                        NoOfDaysInterval = settings.NoOfDaysInterval,

                        HiddenLayerNeurons = settings.HiddenLayerNeurons,
                        TrainingMethodType = settings.TrainingMethodType,
                        Cycles = settings.Cycles,
                        StartTemp = settings.StartTemp,
                        StopTemp = settings.StopTemp,
                        PopulationSize = settings.PopulationSize,
                        Epochs = settings.Epochs,
                        MinRandom = settings.MinRandom,
                        MaxRandom = settings.MaxRandom,
                        LearnRate = settings.LearnRate,
                        Momentum = settings.Momentum,
                        ActivationFunction = settings.ActivationFunction,
                        HasBiasNeuron = settings.HasBiasNeuron,
                        HiddenLayerNeuronsInputs = settings.HiddenLayerNeuronsInputs
                    }
                })));

            // pass to AI module
            Defaults.AIFeatureMgr.TaskEnqueuer.EnqueueOutgoingTask(newTask);
        }

        [Route("token")]
        [HttpGet]
        public HttpResponseMessage GetToken()
        {
            HttpResponseMessage retVal = null;

            retVal = Request.CreateResponse(HttpStatusCode.OK, new { Token = Guid.NewGuid().ToString("N") });

            return retVal;
        }

        [Route("loadNetwork")]
        [HttpPost]
        public HttpResponseMessage LoadOrCreateNetwork(string token, string messageId, string networkName, [FromBody] CreateNetworkParams createParams, bool existing = false, bool temporary = false)
        {
            HttpResponseMessage retVal = null;
            try
            {
                string msgID = Guid.NewGuid().ToString("N");
                queuer.Queue(new DRNNMessage
                {
                    Action = DRNNMessageAction.CreateNetwork,
                    MessageId = msgID,
                    Id = token,
                    IsClaimed = false,
                    RnetworkName = networkName,
                    Data = JsonConvert.SerializeObject(createParams)
                });

                var response = queuer.Dequeue(token, msgID);

                retVal = Request.CreateResponse(HttpStatusCode.OK, response);
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("settings")]
        [HttpPost]
        public HttpResponseMessage CreateSetting(string token, string messageId, string networkName, [FromBody] RNetworkSettingsParams settingsParams)
        {
            HttpResponseMessage retVal = null;

            try
            {
                string msgID = Guid.NewGuid().ToString("N");
                queuer.Queue(new DRNNMessage
                {
                    Action = DRNNMessageAction.RNetworkSetting,
                    MessageId = msgID,
                    Id = token,
                    IsClaimed = false,
                    RnetworkName = networkName,
                    Data = JsonConvert.SerializeObject(settingsParams)
                });

                var response = queuer.Dequeue(token, msgID);

                retVal = Request.CreateResponse(HttpStatusCode.OK, response);
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("startSession")]
        [HttpPost]
        public HttpResponseMessage StartSession(string token, string messageId, string networkName)
        {
            HttpResponseMessage retVal = null;

            try
            {
                string msgID = Guid.NewGuid().ToString("N");
                queuer.Queue(new DRNNMessage
                {
                    Action = DRNNMessageAction.SessionStart,
                    MessageId = msgID,
                    Id = token,
                    IsClaimed = false,
                    RnetworkName = networkName,
                    Data = ""
                });

                var response = queuer.Dequeue(token, msgID);

                retVal = Request.CreateResponse(HttpStatusCode.OK, response);
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("endSession")]
        [HttpPost]
        public HttpResponseMessage EndSession(string token, string messageId, string networkName, [FromBody]SessionEndParams sessionEndParams)
        {
            HttpResponseMessage retVal = null;

            System.Diagnostics.Debug.WriteLine("End session API called...");

            try
            {
                string msgID = Guid.NewGuid().ToString("N");
                queuer.Queue(new DRNNMessage
                {
                    Action = DRNNMessageAction.SessionEnd,
                    MessageId = msgID,
                    Id = token,
                    IsClaimed = false,
                    RnetworkName = networkName,
                    Data = JsonConvert.SerializeObject(sessionEndParams)
                });

                var response = queuer.Dequeue(token, msgID);

                retVal = Request.CreateResponse(HttpStatusCode.OK, response);
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("runCycle")]
        [HttpPost]
        public HttpResponseMessage RunCycle(string token, string messageId, string networkName, bool direct, [FromBody]RunCycleParams cycleParams)
        {
            HttpResponseMessage retVal = null;

            try
            {
                if (!direct)
                {
                    string msgID = Guid.NewGuid().ToString("N");
                    queuer.Queue(new DRNNMessage
                    {
                        Action = DRNNMessageAction.RunCycle,
                        MessageId = msgID,
                        Id = token,
                        IsClaimed = false,
                        RnetworkName = networkName,
                        Data = JsonConvert.SerializeObject(cycleParams)
                    });

                    var response = queuer.Dequeue(token, msgID);

                    retVal = Request.CreateResponse(HttpStatusCode.OK, JsonConvert.DeserializeObject<CycleOutputParams>(response));
                }
                else
                {
                    DRNNRequestProcessingMgr processMgr = new DRNNRequestProcessingMgr();
                    var rnetwork = DRNNServerApp.GetRnetwork(processMgr, networkName, token);
                    var responseObj = (CycleOutputParams)processMgr.ExecuteRequest(rnetwork, new DRNNMessage
                    {
                        Action = DRNNMessageAction.RunCycle,
                        MessageId = messageId,
                        Id = token,
                        IsClaimed = false,
                        RnetworkName = networkName,
                        Data = JsonConvert.SerializeObject(cycleParams)
                    });

                    retVal = Request.CreateResponse(HttpStatusCode.OK, responseObj);
                }
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("runCycleBatch")]
        [HttpPost]
        public HttpResponseMessage RunCycleBatch(string token, string messageId, string networkName, [FromBody]RunCycleBatchParams cycleParams)
        {
            HttpResponseMessage retVal = null;

            try
            {
                if (cycleParams != null && cycleParams.Items != null && cycleParams.Items.Count > BATCH_LIMIT)
                {
                    throw new BatchLimitException($"Batched data has exceeded the limit ({BATCH_LIMIT})");
                }

                string msgID = messageId;
                //string msgID = Guid.NewGuid().ToString("N");
                queuer.Queue(new DRNNMessage
                {
                    Action = DRNNMessageAction.RunCycleBatch,
                    MessageId = msgID,
                    Id = token,
                    IsClaimed = false,
                    RnetworkName = networkName,
                    Data = JsonConvert.SerializeObject(cycleParams)
                });

                var response = queuer.Dequeue(token, msgID);

                retVal = Request.CreateResponse(HttpStatusCode.OK, JsonConvert.DeserializeObject<IEnumerable<CycleOutputParams>>(response));
            }
            catch (BatchLimitException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine("Batch limit error");
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("scoreCycle")]
        [HttpPost]
        public HttpResponseMessage ScoreCycle(string token, string messageId, string networkName, bool direct, [FromBody] ScoreCycleParams scoreParams)
        {
            HttpResponseMessage retVal = null;

            try
            {
                if (!direct)
                {
                    string msgID = Guid.NewGuid().ToString("N");
                    queuer.Queue(new DRNNMessage
                    {
                        Action = DRNNMessageAction.ScoreCycle,
                        MessageId = msgID,
                        Id = token,
                        IsClaimed = false,
                        RnetworkName = networkName,
                        Data = JsonConvert.SerializeObject(scoreParams)
                    });

                    var response = queuer.Dequeue(token, msgID);

                    retVal = Request.CreateResponse(HttpStatusCode.OK, response);
                }
                else
                {
                    DRNNRequestProcessingMgr processMgr = new DRNNRequestProcessingMgr();
                    var rnetwork = DRNNServerApp.GetRnetwork(processMgr, networkName, token);
                    var responseObj = processMgr.ExecuteRequest(rnetwork, new DRNNMessage
                    {
                        Action = DRNNMessageAction.ScoreCycle,
                        MessageId = messageId,
                        Id = token,
                        IsClaimed = false,
                        RnetworkName = networkName,
                        Data = JsonConvert.SerializeObject(scoreParams)
                    });

                    retVal = Request.CreateResponse(HttpStatusCode.OK, responseObj);
                }
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("scoreCycleBatch")]
        [HttpPost]
        public HttpResponseMessage ScoreCycleBatch(string token, string messageId, string networkName, [FromBody] IEnumerable<ScoreCycleParams> scoreParams)
        {
            HttpResponseMessage retVal = null;

            try
            {
                if (scoreParams != null && scoreParams.Count() > BATCH_LIMIT)
                {
                    throw new BatchLimitException($"Batched data has exceeded the limit ({BATCH_LIMIT})");
                }

                string msgID = messageId; //Guid.NewGuid().ToString("N");
                queuer.Queue(new DRNNMessage
                {
                    Action = DRNNMessageAction.ScoreCycleBatch,
                    MessageId = msgID,
                    Id = token,
                    IsClaimed = false,
                    RnetworkName = networkName,
                    Data = JsonConvert.SerializeObject(scoreParams)
                });

                var response = queuer.Dequeue(token, msgID);

                retVal = Request.CreateResponse(HttpStatusCode.OK, response);
            }
            catch (BatchLimitException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine("Batch limit error");
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("resetSessionCount")]
        [HttpPost]
        public HttpResponseMessage ResetSessionCount(string token, string messageId, string networkName)
        {
            HttpResponseMessage retVal = null;

            try
            {
                string msgID = Guid.NewGuid().ToString("N");
                queuer.Queue(new DRNNMessage
                {
                    Action = DRNNMessageAction.ResetSessionCount,
                    MessageId = msgID,
                    Id = token,
                    IsClaimed = false,
                    RnetworkName = networkName,
                    Data = ""
                });

                var response = queuer.Dequeue(token, msgID);

                retVal = Request.CreateResponse(HttpStatusCode.OK, response);
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }

        [Route("resetNetwork")]
        [HttpPost]
        public HttpResponseMessage ResetNetwork(string token, string messageId, string networkName)
        {
            HttpResponseMessage retVal = null;

            try
            {
                string msgID = Guid.NewGuid().ToString("N");
                queuer.Queue(new DRNNMessage
                {
                    Action = DRNNMessageAction.ResetNetwork,
                    MessageId = msgID,
                    Id = token,
                    IsClaimed = false,
                    RnetworkName = networkName,
                    Data = ""
                });

                var response = queuer.Dequeue(token, msgID);

                retVal = Request.CreateResponse(HttpStatusCode.OK, response);
            }
            catch (RequestTicketException e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.BadRequest, e);
                System.Diagnostics.Debug.WriteLine($"Request ticket error: {e.Message}");
            }
            catch (Exception e)
            {
                retVal = Request.CreateResponse(HttpStatusCode.InternalServerError, e);
                System.Diagnostics.Debug.WriteLine($"Internal error: {e.Message}");
            }

            return retVal;
        }
    }

    public class MazeParams
    {
        public MazeInfo Maze { get; set; }
        public IEnumerable<RNNCoreSettings> Settings { get; set; }
    }
}
