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
        #region Constructors

        public AI(useAIbleAIFeatureMgr featureMgr)
            : base("AIModule", featureMgr)
        {
            rnetworks = new ConcurrentDictionary<string, rnn_network>();
            
            //PlayLogisticSimulator_TF(new LogisticSimulationMetadata() { NumSessions = 100, RNNSettings = new List<Core.Models.RNN.RNNCoreSettings>() });
        }

        #endregion

        #region Product Adviser and Planogram

        // training and predict settings currently used by the AI for Planogram Optimization (Phase 2)
        //private const int NUM_SESSIONS = 250;
        private const int START_RANDOMNESS = 100;
        private const int END_RANDOMNESS = 5;
        private const int MIN_LINEAR_BRACKET = 1;
        private const int MAX_LINEAR_BRACKET = 5;
        private const int COUSIN_NODE_SEARCH_TOLERANCE = 1;

        private ConcurrentDictionary<string, rnn_network> rnetworks { get; set; }
        
        public void OptimizeProductAdviser(string orgDbName, int productId, bool resetRnn, CancellationToken cancelToken)
        {
            Logger.Debug("Product optimization entry point invoked...");

            // get attributes
            var attrRepo = Ioc.Get<IAttributeRepo>(orgDbName);
            var attributes = attrRepo.GetGroupedAttributes(true);

            // get product
            var settRepo = Ioc.Get<IProductSettingsRepository>(orgDbName);
            var prodRepo = Ioc.Get<IProductRepository>(orgDbName);
            var retailFeatureMgr = new useAIble.FeatureManagement.RetailSystems.useAIbleRetailSystemsFeatureMgr();
            var product = retailFeatureMgr.GetProduct(orgDbName, productId, true);

            // determine if rimports org
            var orgRepo = Ioc.Get<IOrganizationRepository>();
            var org = orgRepo.GetOrganizationByDbName(orgDbName);
            bool isRimports = org.Name.ToUpper().Contains("RIMPORTS");

            var dataChunkRepo = Ioc.Get<IDataChunkRepo>(orgDbName);
            var chunk = dataChunkRepo.GetById(product.Settings.DataChunkId, true);

            Exception ex = null;
            string networkName = null;
            try
            {
                Logger.Debug("Setting up product for optimization...");
                #region product settings setup
                // setup data for optimization
                // set product repo reference
                product.Settings.ProductRepo = prodRepo;

                // set db name
                product.Settings.DbName = orgDbName;

                // set chunk postfix
                product.Settings.ChunkPostFix = chunk.TablePostfix;

                // set key field and scoring fields
                product.Settings.SetFields(chunk.Fields);

                // set temp tags all
                product.Settings.TagsAllTable = prodRepo.BuildTagsAll(chunk.TablePostfix, product.Settings.KeyFieldName, isRimports);
                product.Settings.IsRimports = isRimports;

                // set (limiter) filtered list
                List<int> excludedList = product.Attributes.Select(a => a.AttributeId).ToList();
                excludedList.AddRange(product.ExcludedAttributes);
                product.Settings.SetCurrentItemList(attributes, excludedList.Distinct());

                foreach(var item in product.Settings.CurrentItemList)
                {
                    System.Diagnostics.Debug.WriteLine(attributes.ElementAt(item).Name);
                }
                // end setup
                #endregion

                // check if network exists in the cache
                networkName = "productadviser-" + product.Id;
                if (rnetworks.ContainsKey(networkName))
                {
                    throw new InvalidOperationException($"'{networkName}' rnetwork is busy");
                }

                string dbName = orgDbName + "_RNN_" + product.GlobalIdentifier;
                try
                {
                    // restore db if it has a backup file
                    rnn_network.RestoreDB(dbName);

                    rnn_network network = new rnn_network(dbName);
                    if (!network.LoadNetwork(networkName))
                    {
                        int maxSlots = 10; // TODO need to determine if this will be constant or user inputted
                        var inputs = new List<rnn_io>()
                        {
                            new rnn_io(network, "Slot", typeof(System.Double).ToString(), 0, Convert.ToDouble(maxSlots - 1), RnnInputType.Distinct)
                        };

                        var outputs = new List<rnn_io>()
                        {
                            new rnn_io(network, "Attribute", typeof(System.Int32).ToString(), 0, attributes.Count() - 1, RnnInputType.Distinct)
                        };

                        network.NewNetwork(networkName, inputs, outputs);
                    }

                    if (resetRnn)
                    {
                        network.ResetNetwork();
                    }

                    // rnetwork settings
                    network.Temp_Num_Sessions = product.Settings.OptimizationSettingsObj.NumOfSimulations;
                    network.StartRandomness = START_RANDOMNESS;
                    network.EndRandomness = END_RANDOMNESS;
                    network.MinLinearBracket = MIN_LINEAR_BRACKET;
                    network.MaxLinearBracket = MAX_LINEAR_BRACKET;
                    network.CousinNodeSearchToleranceIncrement = COUSIN_NODE_SEARCH_TOLERANCE;

                    // add to cache
                    rnetworks.TryAdd(networkName, network);

                    Logger.Debug($"Opt task [{product.Name}] training...");

                    // train
                    var adviser = new ProductAdviser(network, product, attributes, this, cancelToken);
                    adviser.Train();

                    Logger.Debug($"Opt task [{product.Name}] predicting...");

                    // predict
                    adviser.Train(false);
                }
                finally
                {
                    // backup db and drops it right after
                    rnn_network.BackupDB(dbName);
                }
            }
            catch(Exception e)
            {
                Logger.Error(e);
                ex = e;
                throw;
            }
            finally
            {
                // remove from cache
                if (rnetworks != null && !string.IsNullOrEmpty(networkName))
                {
                    rnn_network removeRnn;
                    rnetworks.TryRemove(networkName, out removeRnn);
                }                        

                if (product != null && product.Settings != null)
                {
                    if (cancelToken.IsCancellationRequested)
                    {
                        Logger.Debug("Optimization cancelled...");

                        product.Settings.OptimizationSettingsObj.IsOptimizing = false;
                        product.Settings.OptimizationSettingsObj.OptimizationResults = null;
                        settRepo.Update(product.Settings);

                        EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, productId, TaskProgressType.ProductAdviser));
                        EnqueueNotify(NotificationType.Organization, new useAIbleNotification(orgDbName, $"Product '{product.Name}' optimization has been cancelled", "success"));
                    }
                    else
                    {
                        Logger.Debug("Optimization done, saving the results...");

                        // save optimization results
                        product.Settings.OptimizationSettingsObj.IsOptimizing = false;
                        if (ex != null)
                        {
                            product.Settings.OptimizationSettingsObj.OptimizationResults = null;
                        }
                        else
                        {
                            product.Settings.OptimizationSettingsObj.TotalSimulations++;
                        }
                        settRepo.Update(product.Settings);

                        EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, productId, 100, "Done", TaskProgressType.ProductAdviser));
                        EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, productId, TaskProgressType.ProductAdviser));
                        EnqueueNotify(NotificationType.Organization, new useAIbleNotification(orgDbName, $"Product '{product.Name}' is done optimizing", "success"));
                    }

                    prodRepo.DropTempTagsTables(product.Settings.TagsAllTable, null);
                }
            }
        }

        public void RNNDiagnosticsTracker(string orgDbName, string rnnDbName, string globalIdentifier, string networkName, CancellationToken cancelToken)
        {
            System.Diagnostics.Debug.WriteLine("RNN Diagnostics tracker started...");
            const int INTERVAL = 5 * 1000; // 5 seconds interval

            try
            {
                string orgDb = orgDbName;
                string globalId = globalIdentifier;
                string rnetworkName = networkName;

                rnn_network rnetwork = new rnn_network(rnnDbName);
                rnetwork.LoadNetwork(rnetworkName, false);

                while (!cancelToken.IsCancellationRequested)
                {
                    Task.Delay(INTERVAL).Wait();

                    if (string.IsNullOrEmpty(rnetwork.CurrentNetworkName))
                    {
                        rnetwork.LoadNetwork(rnetworkName, false);
                    }
                    else
                    {
                        var rnnStats = rnetwork.GetStatistics();
                        var diag = new useAIbleRNNDiagnostics()
                        {
                            DatabaseName = orgDb,
                            GlobalIdentifier = globalId,
                            NetworkName = rnetworkName,
                            AvgTimePerSessionInSeconds = rnnStats.AvgTimePerSessionInSeconds,
                            TotalSessionTimeInSeconds = rnnStats.TotalSessionTimeInSeconds,
                            NumSessionSinceBestScore = rnnStats.NumSessionsSinceLastBestScore,
                            TotalSessions = rnnStats.TotalSessions,
                            MaxSessionScore = rnnStats.MaxSessionScore,
                            AvgSessionScore = rnnStats.AvgSessionScore,
                            LastSessionScore = rnnStats.LastSessionScore,
                            LastSessionId = rnnStats.LastSessionId,
                            LastSessionTimeInSeconds = rnnStats.LastSessionTimeInSeconds
                        };

                        System.Diagnostics.Debug.WriteLine("Sending RNN Diagnostics...");
                        EnqueueRNNDiag(diag);
                    }
                }
            }
            catch (Exception e)
            {
                Logger.Error(e);
            }

            System.Diagnostics.Debug.WriteLine("RNN Diagnostics tracker ended...");
        }

        public void OptimizationProgressTracker(PlanogramOptimizationSettings opt, string orgDbName, int planogramId, CancellationToken? cancelToken = null)
        {
            try
            {
                double percentage = 0;
                double lastPerc = 0;
                double totalSeconds = (opt.EndsOn - opt.Started).TotalSeconds;

                while (percentage <= 99 && ((cancelToken.HasValue && !cancelToken.Value.IsCancellationRequested) || !cancelToken.HasValue))
                {
                    percentage = ((totalSeconds - opt.TimeRemaining.TotalSeconds) / totalSeconds) * 100D;
                    percentage = Math.Ceiling(percentage);

                    if (percentage <= 99 && percentage != lastPerc)
                    {
                        lastPerc = percentage;
                        EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, planogramId, percentage, "Optimizing...", TaskProgressType.RetailBuilder));
                        System.Diagnostics.Debug.WriteLine($"Progress: {percentage}%");
                    }

                    Task.Delay(1000).Wait();
                }
            }
            catch (Exception e)
            {
                Logger.Error(e);
                throw;
            }
        }

        public void OptimizePlanogram(Organization org, Planogram planogram, PlanogramOptimizationSettings opt, IDictionary<int, IEnumerable<PlanogramAreaItem>> spaceToOptimize, IEnumerable<IDictionary<string, object>> items, ConcurrDictTryAdd TryAdd, CancellationToken? cancelToken = null)
        {
            var networkName = "planogram-" + planogram.Id + "-metric-" + opt.CurrentMetric.Name;

            try
            {
                Logger.Debug($"Started optimizing [{opt.CurrentMetric.Name}]...");
                
                string orgName = org.Name;
                string orgDbName = org.DatabaseName;

                // check if network exists in the cache
                if (rnetworks.ContainsKey(networkName))
                {
                    throw new InvalidOperationException($"'{networkName}' rnetwork is busy");
                }

                string dbName = orgDbName + "_RNN_" + planogram.GlobalIdentifier;
                rnn_network network = new rnn_network(dbName);

                if (!network.LoadNetwork(networkName))
                {
                    int shelfMaxCnt = spaceToOptimize.Count;
                    var inputs = new List<rnn_io>()
                    {
                        new rnn_io(network, "Shelf", typeof(System.Int32).ToString(), 0, shelfMaxCnt - 1, RnnInputType.Distinct),
                        new rnn_io(network, "Width", typeof(System.Double).ToString(), 0, Convert.ToDouble(planogram.RackWidthInches), RnnInputType.Linear)
                    };

                    var outputs = new List<rnn_io>()
                    {
                        new rnn_io(network, "Items", typeof(System.Int32).ToString(), 0, items.Count() - 1, RnnInputType.Distinct),
                        new rnn_io(network, "NumberOfFacings", typeof(System.Int32).ToString(), 1, planogram.MaxNumFacingsPossible - 1, RnnInputType.Distinct)
                    };

                    network.NewNetwork(networkName, inputs, outputs);
                }
                
                // rnetwork settings
                //network.Temp_Num_Sessions = opt.NumOfSimulations;
                network.StartRandomness = START_RANDOMNESS;
                network.EndRandomness = END_RANDOMNESS;
                network.MinLinearBracket = MIN_LINEAR_BRACKET;
                network.MaxLinearBracket = MAX_LINEAR_BRACKET;
                network.CousinNodeSearchToleranceIncrement = COUSIN_NODE_SEARCH_TOLERANCE;

                // add to cache
                rnetworks.TryAdd(networkName, network);

                Logger.Debug($"Opt task [{opt.CurrentMetric.Name}] training...");

                // train
                var simmod = new SimMod(network, planogram, opt, spaceToOptimize, items, org.Name.ToUpper().Contains("RIMPORTS"), cancelToken);

                while (opt.TimeRemaining.TotalSeconds > 0 && ((cancelToken.HasValue && !cancelToken.Value.IsCancellationRequested) || !cancelToken.HasValue))
                {
                    simmod.Train(true);
                }

                Logger.Debug($"Opt task [{opt.CurrentMetric.Name}] predicting...");
                                
                // predict
                simmod.Train(false);

                // gets the final results
                // populated inside the simmod train method during prediction (or even during training)
                var results = opt.OptimizedResults;

                // add the results to the concurrent dictionary
                if (TryAdd != null)
                {
                    TryAdd(opt.CurrentMetric.Name, results);
                }


                if (cancelToken.HasValue && cancelToken.Value.IsCancellationRequested)
                {
                    Logger.Debug($"Opt task [{opt.CurrentMetric.Name}] cancelled.");
                }
                else
                {
                    Logger.Debug($"Opt task [{opt.CurrentMetric.Name}] done.");
                }
            }
            catch (AIOptimizationException e)
            {
                throw;
            }
            catch (Exception e)
            {
                throw;
            }
            finally
            {
                // remove from cache
                rnn_network network = null;
                rnetworks.TryRemove(networkName, out network);
            }
        }
        
        public void OptimizePlanogram(string orgDbName, int planogramId, string optimizationId, bool resetRnn, CancellationToken cancelToken)
        {
            CancellationTokenSource tokenSrc = null;
            CancellationTokenSource diagTrackerTokenSrc = new CancellationTokenSource();
            string planogramName = null;

            try
            {
                Logger.Debug("Optimization entry point invoked...");

                var orgRepo = Ioc.Get<IOrganizationRepository>();
                var organization = orgRepo.GetOrganizationByDbName(orgDbName);

                // get planogram metadata from DB
                var planRepo = Ioc.Get<IPlanogramRepository>(orgDbName);
                Planogram planogram = planRepo.GetById(planogramId, true);
                if (planogram == null)
                {
                    throw new DoesNotExistException($"The planogram with ID '{planogramId}' does not exist");
                }
                else
                {
                    planogramName = planogram.Name;
                    tokenSrc = this.GetTaskCancellationTokenSrc(planogram.GlobalIdentifier);
                }

                // the planogram metadata is saved as JSON so we need to convert it to a C# object
                planogram.Settings = JsonConvert.DeserializeObject<PlanogramSetting>(planogram.Metadata);

                // find the right optimization setting to use
                PlanogramOptimizationSettings opt = planogram.Settings.Optimizations.FirstOrDefault(a => a.Id == optimizationId);
                if (opt == null)
                {
                    throw new DoesNotExistException("The optimization setting metadata does not exist");
                }

                List<IDictionary<string, object>> filteredItems;
                Dictionary<int, IEnumerable<PlanogramAreaItem>> spaceToOptimize;

                // gets and sets all the metadata needed for plangoram optimization
                SetupPlanogramMetadata(organization, planogram, opt, out filteredItems, out spaceToOptimize, Logger);

                Logger.Debug("Creating new Tasks for each criteria...");

                // holds the result for each optimization 
                var results = new ConcurrentDictionary<string, IEnumerable<AreaItemOptimizedResults>>();

                // run each criteria on a different task
                var optimizationTasks = new List<Task>();

                // get all core retail metrics
                var metrics = opt.CoreRetailMetrics
                    .Cast<OptimizationMetric>()
                    .ToList();

                // TODO get all selected attribute based metrics

                // get all weighted metrics
                metrics.AddRange(opt.WeightedMetrics
                    .Cast<OptimizationMetric>());

                OptimizationMetric lastSelectedMetric = null;

                string dbName = orgDbName + "_RNN_" + planogram.GlobalIdentifier;
                try
                {
                    // restores db if has a backup file
                    rnn_network.RestoreDB(dbName);

                    // iterates through each metric to be assigned on it's own optimization task
                    foreach (var item in metrics)
                    {
                        // tries to see if this metric is already a network
                        var networkName = "planogram-" + planogram.Id + "-metric-" + item.Name;

                        // reset rnetwork training data, if any
                        if (resetRnn)
                        {
                            rnn_network metricNetwork = new rnn_network(dbName);
                            if (metricNetwork.LoadNetwork(networkName, false))
                            {
                                Logger.Debug($"Resetting Rnetwork [{networkName}] training data...");
                                metricNetwork.ResetNetwork();
                            }
                        }

                        if (!item.Selected) continue;

                        // TODO make sure all properties are copied
                        // create a copy fo the optimization setting instance
                        var optCopy = opt.Convert<PlanogramOptimizationSettings>();
                        var spaceToOptimizeCopy = new Dictionary<int, IEnumerable<PlanogramAreaItem>>();
                        foreach(var space in spaceToOptimize)
                        {
                            var areaItemsCopy = new List<PlanogramAreaItem>();
                            foreach(var areaItem in space.Value)
                            {
                                areaItemsCopy.Add(areaItem.Copy());
                            }
                            spaceToOptimizeCopy.Add(space.Key, areaItemsCopy);
                        }

                        // sets the CurrentMetric to be used on each optimization task
                        item.MaxRankValue = filteredItems.Max(a => Convert.ToDouble(a[item.RankName]));
                        optCopy.CurrentMetric = lastSelectedMetric = item;

                        var newTask = Task.Run(() => { OptimizePlanogram(organization, planogram, optCopy, spaceToOptimizeCopy, filteredItems, results.TryAdd, cancelToken); });

                        newTask.ContinueWith(t => 
                        {
                            if (tokenSrc != null)
                            {
                                tokenSrc.Cancel(false);
                            }
                        }, TaskContinuationOptions.OnlyOnFaulted);
                        optimizationTasks.Add(newTask);

                        // diag tracker task
                        Task.Run(() => { RNNDiagnosticsTracker(orgDbName, dbName, planogram.GlobalIdentifier, networkName, diagTrackerTokenSrc.Token); });
                    }

                    // progress tracker task
                    optimizationTasks.Add(Task.Run(() => { OptimizationProgressTracker(opt, orgDbName, planogramId, cancelToken); }));

                    Logger.Debug("At Task.WaitAll() method call...");

                    // waits for all of the optimizations and progress tracker to finish
                    Task.WaitAll(optimizationTasks.ToArray());

                    if (cancelToken.IsCancellationRequested)
                    {
                        Logger.Debug("Optimization cancelled...");

                        // update status to Ready state
                        planRepo.UpdateStatus(planogramId, PlanogramStatus.Ready, null);

                        // remove the optimization object
                        var origPlanogram = planRepo.GetById(planogramId);
                        if (origPlanogram != null)
                        {
                            var optToRemove = origPlanogram.Settings.Optimizations.FirstOrDefault(a => a.Id == opt.Id);
                            if (optToRemove != null)
                            {
                                origPlanogram.Settings.Optimizations.Remove(optToRemove);
                                planRepo.UpdateSettings(planogramId, origPlanogram.Settings);
                            }
                        }

                        EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, planogramId, TaskProgressType.RetailBuilder));
                        EnqueueNotify(NotificationType.Organization, new useAIbleNotification(orgDbName, $"Planogram '{planogram.Name}' optimization was cancelled", "success"));
                    }
                    else
                    {
                        Logger.Debug("Optimization done, saving the results...");

                        // save the results to the DB
                        var optResults = new List<PlanogramOptimizationResult>();
                        var metricScores = new List<PlanogramMetricScore>();
                        foreach (var item in results)
                        {
                            // extract opt results for each metric
                            optResults.Add(new PlanogramOptimizationResult() { Criteria = item.Key, Results = item.Value });

                            // extract session score for each metric
                            var metricScore = new PlanogramMetricScore() { MetricName = item.Key };
                            AreaItemOptimizedResults firstResult = item.Value.FirstOrDefault();
                            if (firstResult != null)
                            {
                                metricScore.Score = firstResult.SessionScore;
                                metricScores.Add(metricScore);
                            }
                        }

                        // update optimization settings and results
                        var planOptRepo = Ioc.Get<IPlanogramOptMetadataRepository>(orgDbName);
                        planOptRepo.UpdateResults(planogramId, optResults);

                        // get the total time of simulations in seconds and save it to the PlanogramOptimizationMetadata 
                        rnn_network lastMetricNetwork = new rnn_network(dbName);
                        lastMetricNetwork.LoadNetwork("planogram-" + planogram.Id + "-metric-" + lastSelectedMetric.Name, false);
                        int totalSecondsOfSimulations = lastMetricNetwork.GetTotalSimulationInSeconds();
                        planOptRepo.UpdateTotalSimulations(planogramId, totalSecondsOfSimulations);

                        // update metric scores
                        planOptRepo.UpdateMetricScore(planogramId, metricScores);

                        // update status to Result Selection
                        planRepo.UpdateStatus(planogramId, PlanogramStatus.ResultSelection, opt.Id);

                        // final progress and notifications
                        EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, planogramId, 100, "Optimizing...", TaskProgressType.RetailBuilder));
                        EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, planogramId, TaskProgressType.RetailBuilder));
                        EnqueueNotify(NotificationType.Organization, new useAIbleNotification(orgDbName, $"Planogram '{planogram.Name}' is done optimizing.", "success"));
                    }
                }
                finally
                {
                    // stops the diagnostics tracker task
                    diagTrackerTokenSrc.Cancel(false);

                    // backup the db and drops it right after
                    rnn_network.BackupDB(dbName);
                }
            }
            catch (Exception e)
            {
                Logger.Error(e);

                // update status to Ready state
                var planRepo = Ioc.Get<IPlanogramRepository>(orgDbName);
                planRepo.UpdateStatus(planogramId, PlanogramStatus.Ready, null);

                EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, planogramId, -100, "Optimization failed", TaskProgressType.RetailBuilder));
                EnqueueProgress(NotificationType.Organization, new useAIbleProgress(orgDbName, planogramId, TaskProgressType.RetailBuilder));
                EnqueueNotify(NotificationType.Organization, new useAIbleNotification(orgDbName, $"Planogram '{planogramName}' failed to optimize. An error has occured.", "error"));
                
                throw;
            }
        }

        #region Static helper methods
        public static void SetupPlanogramMetadata(Organization organization, Planogram planogram, PlanogramOptimizationSettings opt, out List<IDictionary<string, object>> filteredItems, out Dictionary<int, IEnumerable<PlanogramAreaItem>> spaceToOptimize, IuseAIbleLogger logger = null)
        {
            string orgDbName = organization.DatabaseName;

            // get item margins
            var planogramItemMarginRepo = Ioc.Get<IPlanogramItemMarginRepo>(orgDbName);
            var itemMargins = planogramItemMarginRepo.Get();
            planogram.Settings.Margins = itemMargins;

            // get chunk and line instances used by the planogram optimization
            var chunkRepo = Ioc.Get<IDataChunkRepo>(orgDbName);
            var chunkId = planogram.Settings.DataChunkId;
            var chunk = chunkRepo.GetById(chunkId);

            var lineRepo = Ioc.Get<ILineRepository>(orgDbName);
            var lineId = opt.LineId;
            var line = lineRepo.GetById(lineId);

            logger?.Debug("Getting line data...");

            // gets the line's data, still in JSON format
            var lineReportRepo = Ioc.Get<ILineReportRepository>(line.TablePostfix, orgDbName);

            // find out the max facings possible
            planogram.MaxNumFacingsPossible = lineReportRepo.GetMaxNumFacings(Convert.ToDouble(planogram.RackWidthInches), opt.WidthColumn);

            //var jsonItems = lineReportRepo.Get();
            //var items = JsonConvert.DeserializeObject<IEnumerable<IDictionary<string, object>>>(jsonItems);
            var items = lineReportRepo.GetPlanogramItemsData(opt, chunk.TablePostfix, organization.Name.ToUpper().Contains("RIMPORTS"), planogram.Settings.TargetMod);

            logger?.Debug("Getting item attributes...");

            // get item attributes then create a lookup table for it
            var itemAttribs = lineReportRepo.GetAttributesForItems(chunk.TablePostfix, opt.SkuColumn);
            var itemAttribLookup = itemAttribs.ToLookup(a => a.SKU.ToString());

            logger?.Debug("Mapping the Line items and attributes...");

            // map the items and attributes
            filteredItems = new List<IDictionary<string, object>>();
            foreach (IDictionary<string, object> item in items)
            {
                var newItem = new Dictionary<string, object>();
                foreach(var key in item)
                {
                    if (key.Key == "Attributes") continue;
                    newItem.Add(key.Key, key.Value);
                }

                var sku = item[opt.SkuColumn].ToString();

                // skip the ones that has an invalid SKU number (this is a result from the Line's subtotals i.e. 'All Item_Nbr')
                if (sku.Contains("All")) continue;

                // lookup the attributes by SKU
                var attributes = itemAttribLookup[sku];

                if (attributes != null)
                {
                    var attributeList = new List<useAIbleAttribute>();
                    foreach (var attr in attributes)
                    {
                        attributeList.Add(new useAIbleAttribute()
                        {
                            Id = Convert.ToInt32(attr.AttributeId),
                            Name = attr.AttributeName.ToString(),
                            GroupingId = Convert.ToInt32(attr.GroupingId),
                            GroupingName = attr.GroupingName.ToString()
                        });
                    }

                    try
                    {
                        //if (item.ContainsKey("Attributes"))
                        //{
                        //    item["Attributes"] = attributeList;
                        //}
                        //else
                        //{
                        //    item.Add("Attributes", attributeList);
                        //}
                        newItem.Add("Attributes", attributeList);
                    }
                    catch (Exception e)
                    {
                        throw;
                    }
                    filteredItems.Add(newItem);
                }
            }

            // deallocate unfiltered list, not needed anymore
            items = null;

            // map the planogram items with actual object instances
            foreach (var shelf in planogram.Rack.Shelves)
            {
                foreach (var shelfItem in shelf.Items)
                {
                    var item = filteredItems.FirstOrDefault(a => a[opt.SkuColumn].ToString() == shelfItem.SKU);
                    shelfItem.ItemObj = item;
                }
            }

            // map the shelf instances in each area
            //foreach(var area in planogram.Areas)
            //{
            //    var shelves = planogram.Rack.Shelves.Where(a => a.AreaId.HasValue && a.AreaId.Value == area.Id);
            //    if (shelves != null && shelves.Count() > 0)
            //    {
            //        foreach(var shelf in shelves)
            //        {
            //            shelf.Area = area;
            //            area.Shelves.Add(shelf);
            //        }
            //    }
            //}

            logger?.Debug("Determining the spaces to optimize...");

            // find out which spaces in the planogram are up for optimization
            spaceToOptimize = opt.GetSpacesToOptimize(planogram, lineReportRepo, opt, filteredItems, organization.Name.ToUpper().Contains("RIMPORTS"));
        }
        #endregion

        #region old code
        public void StartRNNTraining(string orgDbName, string networkName, bool isSupervised, int numSessions, int minRandomness, int maxRandomness, int minLinearBracket, int maxLinearBracket)
        {   
            // try to check from list of rnetworks
            if (rnetworks.ContainsKey(networkName))
            {
                throw new InvalidOperationException($"'{networkName}' rnetwork is busy");
            }
            
            var rnetwork = new rnn_network(orgDbName + "_RNN");
            if (!rnetwork.LoadNetwork(networkName))
            {
                throw new DoesNotExistException($"The Rnetwork '{networkName}' does not exist");
            }

            rnetwork.Temp_Num_Sessions = numSessions;
            rnetwork.StartRandomness = minRandomness;
            rnetwork.EndRandomness = maxRandomness;
            rnetwork.MinLinearBracket = minLinearBracket;
            rnetwork.MaxLinearBracket = maxLinearBracket;

            rnetworks.TryAdd(networkName, rnetwork);
            
            // train the RNN AI
            RNNTraining(networkName, isSupervised);

            // remove from dict
            rnn_network rnetworkRemoved;
            rnetworks.TryRemove(networkName, out rnetworkRemoved);
        }


        // TODO test code training below, replace later
        private void RNNTraining(string networkName, bool isSupervised)
        {
            rnn_network rnetwork;
            if (rnetworks.TryGetValue(networkName, out rnetwork))
            {
                for (int i = 0; i < rnetwork.Temp_Num_Sessions; i++)
                {
                    // start training session
                    long sessionId = rnetwork.SessionStart();
                    System.Diagnostics.Debug.WriteLine($"Session #{i} started");

                    for (int c = 0; c < 100; c++)
                    {
                        // build inputs
                        var inputs = new List<rnn_io_with_value>();
                        foreach(var inp in rnetwork.Inputs)
                        {
                            inputs.Add(new rnn_io_with_value(inp, rnn_utils.Randomizer.Next(Convert.ToInt32(inp.Min), Convert.ToInt32(inp.Max + 1)).ToString()));
                        }

                        // do cycle
                        var cycle = new rnn_cycle();
                        var rnnOutput = cycle.RunCycle(rnetwork, sessionId, inputs, true);

                        // score output
                        var outputValue = Convert.ToInt32(rnnOutput.CycleOutput.Outputs.First().Value);
                        double score = 0;
                        if (outputValue > 50)
                        {
                            score = 100;
                        }

                        // save cycle score
                        rnetwork.ScoreCycle(rnnOutput.CycleOutput.CycleID, score);

                        System.Diagnostics.Debug.WriteLine($"...cyle #{c}");
                    }

                    // end training session
                    rnetwork.SessionEnd(0);
                    System.Diagnostics.Debug.WriteLine($"Session #{i} ended");
                }
                
                System.Diagnostics.Debug.WriteLine($"{networkName} done training!");
            }
        }
        #endregion

        #endregion

        #region Games
        // global cancel token so we could stop all running instances
        private static CancellationTokenSource gameCancelTokenSrc = new CancellationTokenSource();

        #region Lunar lander

        public void PlayLunarLander(LunarLanderMetadata data)
        {
            // todo, might track per game instance later on so we will use the task handle for the lunar lander task
            Task lunarLanderTask = Task.Run(() =>
            {
                PlayLunarLander(data, gameCancelTokenSrc.Token);
            }, gameCancelTokenSrc.Token);
        }

        private void PlayLunarLander(LunarLanderMetadata data, CancellationToken cancelToken)
        {
            bool taskCancelled = false;
            RNNLunarLander simulator = null;

            try
            {
                simulator = new RNNLunarLander(
                        userToken: data.UserToken,
                        networkName: data.NetworkName,
                        scoringOn: true,
                        altitude: data.Altitude,
                        fuel: data.Fuel);

                // do Rnetwork training per RnnSetting instance
                bool beyondNumSess = false;
                int trainingCnt = 0;

                foreach (var rnnSetting in data.RNNSettings)
                {
                    int sessions = (rnnSetting.EndSessionRandomness - rnnSetting.StartSessionRandomness) + 1;

                    simulator.Rnetwork.Temp_Num_Sessions = sessions;
                    simulator.Rnetwork.StartRandomness = rnnSetting.StartRandomness;
                    simulator.Rnetwork.EndRandomness = rnnSetting.EndRandomness;
                    simulator.Rnetwork.MaxLinearBracket = rnnSetting.MaxLinear;
                    simulator.Rnetwork.MinLinearBracket = rnnSetting.MinLinear;
                    simulator.Learn = true; // rnnSettting.Learn;
                    simulator.ResetSessionCnt();

                    for (int i = 0; i < sessions; i++)
                    {
                        if (gameCancelTokenSrc.IsCancellationRequested)
                        {
                            taskCancelled = true;
                            break;
                        }

                        trainingCnt++;
                        simulator.StartSimulation(cancelToken);

                        if (trainingCnt >= data.NumSessions)
                        {
                            beyondNumSess = true;
                            break;
                        }
                    }

                    if (beyondNumSess || taskCancelled)
                    {
                        break;
                    }
                }

                // if training count for expected num session was not met then the rest we do a Predict
                if (trainingCnt < data.NumSessions && !taskCancelled)
                {
                    int sessions = data.NumSessions - trainingCnt;

                    simulator.Rnetwork.Temp_Num_Sessions = sessions;
                    simulator.Learn = false;
                    simulator.ResetSessionCnt();

                    for (int i = 0; i < sessions; i++)
                    {
                        if (gameCancelTokenSrc.IsCancellationRequested)
                        {
                            taskCancelled = true;
                            break;
                        }

                        simulator.StartSimulation(cancelToken);
                    }
                }
            }
            catch (Exception e)
            {
                Logger.Error(e);
                if (simulator != null)
                {
                    simulator.SendErrorViaMQTT(e);
                }
            }
            finally
            {
                if (simulator != null)
                {
                    // TODO need to add a scheduler to cleanup unused RNN databases
                    // for now, deletes database directly after finishing
                    if (simulator.Rnetwork != null)
                    {
                        rnn_network.DropDB(simulator.Rnetwork.DatabaseName);
                    }

                    Thread.Sleep(3 * 1000);
                    simulator.DisconnectMQTT();
                }
            }
        }

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
                mqtt = new MqttClient("dev.useaible.com");
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

        public void PlayMaze(MazeMetadata data)
        {
            // todo, might track per game instance later on so we will use the task handle for the maze task
            Task mazeTask = Task.Run(() =>
            {
                PlayMazeGame(data, gameCancelTokenSrc.Token);     
            }, gameCancelTokenSrc.Token);
        }
        
        private void PlayMazeGame(MazeMetadata data, CancellationToken cancelToken)
        {
            bool taskCancelled = false;
            RNNMazeTraveler traveler = null;

            try
            {
                traveler = new RNNMazeTraveler((MazeInfo)data.MazeInfo, data.UserToken);

                // do Rnetwork training per RnnSetting instance
                bool beyondNumSess = false;
                int trainingCnt = 0;
                foreach (var rnnSetting in data.RNNSettings)
                {
                    int sessions = (rnnSetting.EndSessionRandomness - rnnSetting.StartSessionRandomness) + 1;

                    traveler.Temp_num_sessions = sessions;
                    traveler.StartRandomness = rnnSetting.StartRandomness;
                    traveler.EndRandomness = rnnSetting.EndRandomness;
                    traveler.Learn = true;

                    traveler.ResestStaticSessionData();


                    for (int i = 0; i < sessions; i++)
                    {
                        if (cancelToken.IsCancellationRequested)
                        {
                            taskCancelled = true;
                            break;
                        }

                        trainingCnt++;

                        traveler.Travel(trainingCnt, cancelToken);

                        if (trainingCnt >= data.NumSessions)
                        {
                            beyondNumSess = true;
                            break;
                        }
                    }

                    if (beyondNumSess || taskCancelled)
                    {
                        break;
                    }
                }

                // if training count for expected num session was not met then the rest we do a Predict
                if (trainingCnt < data.NumSessions && !taskCancelled)
                {
                    int sessions = data.NumSessions - trainingCnt;

                    traveler.Temp_num_sessions = sessions;
                    traveler.Learn = false;
                    traveler.ResestStaticSessionData();

                    for (int i = 0; i < sessions; i++)
                    {
                        if (cancelToken.IsCancellationRequested)
                        {
                            taskCancelled = true;
                            break;
                        }

                        traveler.Travel(1, cancelToken);
                    }
                }
            }            
            catch (Exception e)
            {
                Logger.Error(e);

                if (traveler != null)
                {
                    traveler.SendErrorViaMQTT(e);
                }
            }
            finally
            {
                if (traveler != null)
                {
                    if (traveler.Rnetwork != null)
                    {
                        rnn_network.DropDB(traveler.Rnetwork.DatabaseName);
                    }

                    Thread.Sleep(3 * 1000);
                    traveler.DisconnectMQTT();
                }
            }
        }

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
                mqtt = new MqttClient("dev.useaible.com");
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
            pattern.OutputNeurons = 1;
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

            pattern.OutputNeurons = 1;
            pattern.ActivationFunction = new ActivationTANH();
            BasicNetwork network = (BasicNetwork)pattern.Generate();

            network.Reset();
            return network;
        }
        #endregion

        #region Logistic Simulation

        // Logistic Simulation Game
        public void PlayLogisticSimulator(LogisticSimulationMetadata data)
        {
            // todo, might track per game instance later on so we will use the task handle for the maze task
            Task mazeTask = Task.Run(() =>
            {
                PlayLogisticSimulator(data, gameCancelTokenSrc.Token);

            }, gameCancelTokenSrc.Token);

            //LogisticSimulator simulator = simulator = new LogisticSimulator(1.0, 0.5, data.UserToken, data.NetworkName);
            //simulator.start();
        }

        private void PlayLogisticSimulator(LogisticSimulationMetadata data, CancellationToken cancelToken)
        {
            bool taskCancelled = false;

            var dbName = $"RNN_logistic_{data.UserToken}";
            var NetworkName = "Tagay";
            LogisticSimulator simulator = null;

            IEnumerable<int> customerOrders = new List<int>() { 11, 1, 16, 6, 10, 26, 1, 25, 28, 25, 2, 23, 3, 5, 24, 20, 3, 27, 22, 24, 19, 29, 27, 28, 24, 2, 9, 26, 7, 4, 18, 21, 18, 26, 8, 27, 5, 29, 27, 6, 6, 17, 4, 6, 3, 22, 17, 1, 21, 21, 1, 21, 27, 19, 17, 11, 4, 18, 11, 8, 18, 5, 18, 25, 7, 10, 6, 7, 27, 27, 15, 3, 29, 17, 19, 2, 25, 21, 25, 3, 15, 9, 5, 15, 4, 27, 23, 29, 9, 26, 24, 16, 19, 19, 17, 1, 28, 9, 29, 23 };

            try
            {
                // TODO encapsulate rnn inner workings to the LogisticSimulator class
                rnn_network.RestoreDB(dbName, true);

                rnn_network network = new rnn_network(dbName);

                if (!network.LoadNetwork(NetworkName))
                {
                    var inputs = new List<rnn_io>()
                    {
                        new rnn_io(network, "X", typeof(Int32).ToString(), 1,1, RnnInputType.Distinct),

                    };

                    var outputs = new List<rnn_io>()
                    {
                       new rnn_io(network, "Retailer_Min", typeof(Int16).ToString(), 0, 50),
                       new rnn_io(network, "Retailer_Max", typeof(Int16).ToString(), 51, 120),
                       new rnn_io(network, "WholeSaler_Min", typeof(Int16).ToString(), 0, 50),
                       new rnn_io(network, "WholeSaler_Max", typeof(Int16).ToString(), 51, 120),
                       new rnn_io(network, "Distributor_Min", typeof(Int16).ToString(), 0, 50),
                       new rnn_io(network, "Distributor_Max", typeof(Int16).ToString(), 51, 120),
                       new rnn_io(network, "Factory_Min", typeof(Int16).ToString(), 0, 50),
                       new rnn_io(network, "Factory_Max", typeof(Int16).ToString(), 51, 120),
                       new rnn_io(network, "Factory_Units_Per_Day", typeof(Int16).ToString(), 1, 100),

                    };

                    network.NewNetwork(NetworkName, inputs, outputs);
                }


                simulator = new LogisticSimulator(data.UserToken, data.NetworkName, data.StorageCostPerDay, data.BacklogCostPerDay, data.RetailerInitialInventory, data.WholesalerInitialInventory, data.DistributorInitialInventory, data.FactoryInitialInventory);
                bool beyondNumSess = false;
                int trainingCnt = 0;
                var input_with_val = new List<rnn_io_with_value>() { new rnn_io_with_value(network.Inputs.First(), "1") };

                // do training per Rnetwork instance
                foreach (var rnnSetting in data.RNNSettings)
                {
                    int sessions = (rnnSetting.EndSessionRandomness - rnnSetting.StartSessionRandomness) + 1;

                    network.Temp_Num_Sessions = sessions;
                    network.StartRandomness = rnnSetting.StartRandomness;
                    network.EndRandomness = rnnSetting.EndRandomness;

                    network.SessionCountInitial = 0;

                    for (int i = 0; i < sessions; i++)
                    {
                        if (cancelToken.IsCancellationRequested)
                        {
                            taskCancelled = true;
                            break;
                        }

                        trainingCnt++;

                        /* logistic simulation training */
                        var sessionId = network.SessionStart();

                        var cycle = new rnn_cycle();
                        var outputs = cycle.RunCycle(network, sessionId, input_with_val, true);

                        simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/useaible/logisticOutputs", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = trainingCnt, Outputs = outputs.CycleOutput.Outputs.Select(a => new { Name = a.Name, Value = a.Value }) })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                        var simOutputs = outputs.CycleOutput.Outputs
                            .Select(a => new LogisticSimulatorOutput() { Name = a.Name, Value = Convert.ToInt32(a.Value) })
                            .ToList();

                        // reset sim outputs
                        simulator.ResetSimulationOutput();

                        //simulator.start(simOutputs, (trainingCnt >= data.NumSessions) ? 1000 : data.NoOfDaysInterval);
                        simulator.start(simOutputs, 50, customerOrders);

                        network.ScoreCycle(outputs.CycleOutput.CycleID, 0);
                        var totalCosts = simulator.SumAllCosts();
                        network.SessionEnd(totalCosts);
                        /* end logistic simulation training */

                        simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/useaible/logisticSessionScores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = trainingCnt, Score = string.Format("${0:#,0}", Math.Abs(totalCosts)) })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                        if (trainingCnt >= data.NumSessions)
                        {
                            beyondNumSess = true;
                            break;
                        }
                    }

                    if (beyondNumSess || taskCancelled)
                    {
                        break;
                    }
                }

                // if training count for expected num session was not met then the rest we do a Predict
                if (trainingCnt < data.NumSessions && !taskCancelled)
                {
                    int sessions = data.NumSessions - trainingCnt;

                    network.Temp_Num_Sessions = sessions;
                    network.SessionCountInitial = 0;

                    for (int i = 0; i < sessions; i++)
                    {
                        if (cancelToken.IsCancellationRequested)
                        {
                            taskCancelled = true;
                            break;
                        }

                        trainingCnt++;

                        /* logistic simulation predict */
                        var sessionId = network.SessionStart();

                        var cycle = new rnn_cycle();
                        var outputs = cycle.RunCycle(network, sessionId, input_with_val, false);

                        simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/useaible/logisticOutputs", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = trainingCnt, Outputs = outputs.CycleOutput.Outputs.Select(a => new { Name = a.Name, Value = a.Value }) })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                        var simOutputs = outputs.CycleOutput.Outputs
                           .Select(a => new LogisticSimulatorOutput() { Name = a.Name, Value = Convert.ToInt32(a.Value) })
                           .ToList();

                        // reset sim outputs
                        simulator.ResetSimulationOutput();

                        //simulator.start(simOutputs, (trainingCnt >= data.NumSessions) ? 1000 : data.NoOfDaysInterval);
                        simulator.start(simOutputs, 50);

                        network.ScoreCycle(outputs.CycleOutput.CycleID, 0);
                        var totalCosts = simulator.SumAllCosts();
                        network.SessionEnd(totalCosts);
                        /* end logistic simulation predict */

                        simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/useaible/logisticSessionScores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = trainingCnt, Score = string.Format("${0:#,0}", Math.Abs(totalCosts)) })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
                    }
                }

                //for (int i = 0; i < data.NumSessions; i++)
                //{
                //    if (cancelToken.IsCancellationRequested)
                //        break;

                //    var sessionId = network.SessionStart();
                //    var cycle = new rnn_cycle();
                //    var outputs = cycle.RunCycle(network, sessionId, new List<rnn_io_with_value>() { new rnn_io_with_value(network.Inputs.First(), "1") }, true);
                //    simulator.start(outputs.CycleOutput.Outputs);
                //    network.ScoreCycle(outputs.CycleOutput.CycleID, 0);
                //    var totalCosts = simulator.SumAllCosts();
                //    network.SessionEnd(totalCosts);

                //    simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/logisticSessionScores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = i + 1, Score = totalCosts })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
                //}
            }
            catch (Exception e)
            {
                Logger.Error(e);

            }
            finally
            {
                rnn_network.DropDB(dbName);

                if (simulator != null)
                {
                    Thread.Sleep(3 * 1000);
                    simulator.DisconnectMQTT();
                }
            }
        }

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
            var simulator = new LogisticSimulator(data.UserToken, data.NetworkName, data.StorageCostPerDay, data.BacklogCostPerDay, data.RetailerInitialInventory, data.WholesalerInitialInventory, data.DistributorInitialInventory, data.FactoryInitialInventory, true);

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
            simulator.OutputFromServerMQttClient.Publish("logistic_train", Encoding.UTF8.GetBytes(jsonInitData), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

            simulator.TurnOffMQTT = false;

            // setting timeout for tensorflow response
            bool timeout = false;
            System.Timers.Timer t = new System.Timers.Timer();
            t.Interval = (10 * 1000 * 60); // 10 minutes to wait for tensorflow
            t.Elapsed += (s, e) =>
            {
                timeout = true;
                ((System.Timers.Timer)s).Stop();
            };

            t.Start();

            while (true)
            {

                System.Diagnostics.Debug.WriteLine("Waiting for tensorflow...");

                // TODO put timeout here
                if (timeout)
                {
                    simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/tensorflowTimeout", Encoding.UTF8.GetBytes("Tensorflow failed to response within the allotted time of 10 minutes"), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                    simulator.DisconnectMQTT();
                    break;
                }

                if (cancelToken.IsCancellationRequested)
                    break;

                if (simulator.TF_Output != null)
                {
                    timeout = false;
                    t.Stop();

                    int trainingCnt = 0;
                    foreach(var item in simulator.TF_Output)
                    {
                        trainingCnt++;

                        simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/logisticOutputs", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = trainingCnt, Outputs = item.Settings })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                        // reset sim outputs
                        simulator.ResetSimulationOutput();

                        simulator.start(item.Settings, data.NoOfDaysInterval);
                        var totalCosts = simulator.SumAllCosts();

                        simulator.OutputFromServerMQttClient.Publish(data.UserToken + "/logisticSessionScores", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { Session = trainingCnt, Score = string.Format("${0:#,0}", Math.Abs(totalCosts)) })), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                        Task.Delay(1000).Wait();
                    }

                    break;
                }

                Task.Delay(1000).Wait();
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

                    mqtt = new MqttClient("dev.useaible.com");
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
                 MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE,
                 false);

                    }
                }

                if (!isSupervised)
                {
                    // initialize MQTT client and connect to server
                    mqtt = new MqttClient("dev.useaible.com");
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
                        Task.Delay(1000*3).Wait();
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

