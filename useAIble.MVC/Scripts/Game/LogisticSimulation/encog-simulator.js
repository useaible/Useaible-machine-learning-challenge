
var repo3 = new DRNNRepository();
//var client3 = new Paho.MQTT.Client("dev.useaible.com", 61614, repo3.GenerateGUID());
//var client3 = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, repo3.GenerateGUID());

function EncogSimulator(donePlaying, sessionData, encogShowChart, showComparisonChart) {

    client3 = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, repo3.GenerateGUID());

    var self = this;
    var USER_TOKEN;

    // for caching canvas images
    self.CANVAS_BG_CACHE = ko.observable();

    self.RETAILER_CACHE = ko.observable();
    self.WHOLESALER_CACHE = ko.observable();
    self.DISTRIBUTOR_CACHE = ko.observable();
    self.FACTORY_CACHE = ko.observable();

    self.RETAILER_PAPER_CACHE = ko.observable();
    self.WHOLESALER_PAPER_CACHE = ko.observable();
    self.DISTRIBUTOR_PAPER_CACHE = ko.observable();
    self.FACTORY_PAPER_CACHE = ko.observable();

    self.DAY_PAPER_CACHE = ko.observable();

    self.ROAD_PAPER_CACHE = ko.observable();
    // end for caching canvas images

    self.ShowHiddenLayerConfigPanel = ko.observable(true);
    self.ShowHideHiddenLayerConfigPanel = function () {

        if (self.ShowHiddenLayerConfigPanel()) {
            self.ShowHiddenLayerConfigPanel(false);
        } else {
            self.ShowHiddenLayerConfigPanel(true);
        }

    };

    self.HiddenLayerNeuronsInputs = ko.observableArray([]);
    self.SelectedNumberOfNeuronOption = ko.observable();
    self.SelectedNumberOfNeuronOption.subscribe(function (selected_num_neuron) {

        self.HiddenLayerNeuronsInputs([]);
        for (var i = 0; i < selected_num_neuron; i++) {
            self.HiddenLayerNeuronsInputs.push(new HiddenLayerNeuronVM());
        }

    });

    self.EncogTrainingMethods = ko.observableArray([
        { Id: 0, Name: 'Annealing' },
        { Id: 1, Name: 'Genetic' },
        { Id: 2, Name: 'Neural PSO' },
        { Id: 3, Name: 'Back Propagation' },
        { Id: 4, Name: 'Manhattan Propagation' },
        { Id: 5, Name: 'Quick Propagation' },
        { Id: 6, Name: 'Resilient Propagation' },
        { Id: 7, Name: 'SCG' },
        { Id: 8, Name: 'LMA' }
    ]);
    self.SelectedTrainingMethod = ko.observable(self.EncogTrainingMethods()[1]);
    self.SelectedTrainingMethod.subscribe(function (training_type) {
        self.TrainingMethodType(training_type.Id);

        if (training_type.Name == 'Back Propagation') {
            self.LearnRate(0.7);
        } else if (training_type.Name == 'Manhattan Propagation') {
            self.LearnRate(0.00001);
        } else if (training_type.Name == 'Quick Propagation') {
            self.LearnRate(2.0);
        }

    });

    self.HiddenLayerNeurons = ko.observable(50);
    self.TrainingMethodType = ko.observable(self.SelectedTrainingMethod().Id);
    self.Cycles = ko.observable(10);
    self.StartTemp = ko.observable(2);
    self.StopTemp = ko.observable(10);
    self.PopulationSize = ko.observable(10);
    self.Epochs = ko.observable(10);
    self.MinRandom = ko.observable(0);
    self.MaxRandom = ko.observable(100);
    self.LearnRate = ko.observable();
    self.Momentum = ko.observable(0.3);
    self.HasBiasNeuron = ko.observable(true);

    self.NumberOfSessions = ko.observable();
    self.Day = ko.observable();
    self.FinalResults = ko.observableArray([]);
    self.Canvas = ko.observable();
    self.PlayerDetails = ko.observableArray([]);

    self.SessionScores = ko.observableArray([]);
    self.CurrentSession = ko.observable(0);
    self.CurrentSessionScore = ko.observable("");
    self.CurrentStatus = ko.observable("");

    var connect = function (userToken, drawGame) {
        if (client3) {
            if (!client3.isConnected()) {
                client3.connect({
                    keepAliveInterval: 1800,
                    timeout: 10000,
                    onFailure: function (fl) {
                        console.log(fl.errorMessage);
                    },
                    onSuccess: function () {

                        drawGame.UpdateSummaryDetails(self.Canvas(), {
                            CurrentStatus: self.CurrentStatus(),
                            CurrentSession: self.CurrentSession(),
                            CurrentSessionScore: self.CurrentSessionScore(),

                            StorageCostPerDay: "",
                            BacklogCostPerDay: ""
                        });

                        //client3.subscribe(userToken + "/encog/outputFromServer", { qos: 1 });
                        //client3.subscribe(userToken + "/encog/requestOrder", { qos: 1 });
                        //client3.subscribe(userToken + "/encog/receiveOrder");
                        //client3.subscribe(userToken + "/encog/logisticSessionScores", { qos: 1 });
                        //client3.subscribe(userToken + "/encog/logisticOutputs", { qos: 1 });
                        //client3.subscribe(userToken + "/encog/test_data", { qos: 1 });
                        //client3.subscribe(userToken + "/encog/tensorflowTimeout", { qos: 1 });
                        client3.subscribe(userToken + "/encog/logistic/simulation_output", { qos: 1 });

                        console.log("subscribed to encog logistic simulator with token = " + userToken);
                    }
                });
            }
        }

        client3.onConnectionLost = function (msg) {

            console.log(msg.errorMessage);

            //disableSettingsControls(false);
            //connect(userToken, drawGame);
        };
    };

    self.Init = function (userToken, drawGame) {

        //client3.onConnectionLost = function (msg) {

        //    console.log(msg.errorMessage);

        //    //disableSettingsControls(false);
        //    connect(userToken, drawGame);
        //};

        //if (!client3.isConnected()) {
        //    connect(userToken, drawGame);
        //} else {
        //    //client3.subscribe(userToken + "/encog/outputFromServer", { qos: 1 });
        //    //client3.subscribe(userToken + "/encog/requestOrder", { qos: 1 });
        //    //client3.subscribe(userToken + "/encog/receiveOrder");
        //    //client3.subscribe(userToken + "/encog/logisticSessionScores", { qos: 1 });
        //    //client3.subscribe(userToken + "/encog/logisticOutputs", { qos: 1 });
        //    //client3.subscribe(userToken + "/encog/test_data", { qos: 1 });
        //    //client3.subscribe(userToken + "/tensorflowTimeout", { qos: 1 });
        //    client3.subscribe(userToken + "/encog/logistic/simulation_output", { qos: 1 });
        //}

    };

    var moveFunction;
    var drawFunction;
    var speedOption;

    self.SelectedSpeedOption = ko.observable();

    self.Logistics = ko.observableArray([]);
    self.LogisticOutputs = ko.observableArray([]);
    self.Playing = ko.observable(false);

    self.StartGame = ko.observable(false);

    var CURRENT_SESSION_COUNTER = 0;
    var SESSION_COUNTER = 0;

    self.StartGame.subscribe(function () {
        $.each(self.Logistics(), function (index, val) {

            if (!val.Done() && !self.Playing()) {

                CURRENT_SESSION_COUNTER++;

                CURRENTLY_PLAYING = true;

                if (IS_HEAD_TO_HEAD) {
                    ENCOG_CURRENT_GAME_DONE(false);
                }

                self.Playing(true);
                self.CurrentStatus("Encog Playing...");
                self.CurrentSession(CURRENT_SESSION_COUNTER);

                disableSettingsControls(true);

                var simulationResults = val.PlayerDetails;
                var score = val.Score;
                var session = val.Session;
                var settings = val.Settings;

                var resultCounter = 0;

                var run = function () {

                    setTimeout(function () {

                        var val_r = simulationResults[resultCounter];
                        if (val_r) {

                            resultCounter++;

                            self.Day(eval(self.Day() + 1));

                            var paperImages = {
                                RETAILER_PAPER_CACHE: self.RETAILER_PAPER_CACHE(),
                                WHOLESALER_PAPER_CACHE: self.WHOLESALER_PAPER_CACHE(),
                                DISTRIBUTOR_PAPER_CACHE: self.DISTRIBUTOR_PAPER_CACHE(),
                                FACTORY_PAPER_CACHE: self.FACTORY_PAPER_CACHE()
                            };


                            if (resultCounter == simulationResults.length) {
                                self.FinalResults(settings);
                            }

                            var playerDetails = val_r.Results;

                            drawFunction.UpdatePlayerDetails(self.Canvas(), paperImages, self.DAY_PAPER_CACHE(), playerDetails, self);
                            drawFunction.UpdateSummaryDetails(self.Canvas(), {
                                CurrentStatus: self.CurrentStatus(),
                                CurrentSession: self.CurrentSession(),
                                CurrentSessionScore: self.CurrentSessionScore(),

                                StorageCostPerDay: "$"+ LOGISTIC_SETTINGS.StorageCostPerDay(),
                                BacklogCostPerDay: "$"+ LOGISTIC_SETTINGS.BacklogCostPerDay()
                            });
                        }

                        if (resultCounter < simulationResults.length) {
                            disableSettingsControls(true);
                            run();
                        } else if(resultCounter >= simulationResults.length) {

                            if (IS_HEAD_TO_HEAD) {
                                ENCOG_CURRENT_GAME_DONE(true);
                                CURRENT_ENCOG_SESSION(session);

                                PLAY_TRIGGER(repo3.GenerateGUID());

                                console.log("encog session = " + session);
                            }

                            CURRENTLY_PLAYING = false;

                            self.Playing(false);
                            val.Done(true);

                            self.Day(0);
                            //self.CurrentStatus("Ready session " + eval(CURRENT_SESSION_COUNTER + 1));
                            self.CurrentStatus("Loading data...");

                            self.CurrentSession(session);
                            self.CurrentSessionScore(numberToCurrency(score));
                            

                            self.SessionScores.push({ Session: session, Score: numberToCurrency(score) });

                            if (session >= SESSION_COUNTER) {

                                self.CurrentSession(-1);
                                self.CurrentStatus("Done");

                                if (USEAIBLE_DONE_PLAYING != undefined) {

                                    if (USEAIBLE_DONE_PLAYING()) {
                                        $(".view-chart").show();
                                        disableSettingsControls(false);
                                        //$(".outer-chart-container").show();
                                        //SHOW_COMPARISON_CHART(SESSION_DATA());
                                    }

                                } else {

                                    $(".view-chart").show();
                                    disableSettingsControls(false);
                                    //$(".outer-chart-container").show();
                                    //SHOW_COMPARISON_CHART(SESSION_DATA());
                                }

                                ENCOG_SHOWCHART(true);
                                DONE_PLAYING(true);

                                //client3.unsubscribe(USER_TOKEN + "/encog/logistic/simulation_output");
                                if (client3) {
                                    if (client3.isConnected()) {
                                        client3.disconnect();
                                    }
                                }
                            }

                            var table = $("#encog-table-container");
                            table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });

                            drawFunction.UpdateSummaryDetails(self.Canvas(), {
                                CurrentStatus: self.CurrentStatus(),
                                CurrentSession: self.CurrentSession(),
                                CurrentSessionScore: self.CurrentSessionScore(),

                                StorageCostPerDay: "$"+ LOGISTIC_SETTINGS.StorageCostPerDay(),
                                BacklogCostPerDay: "$"+ LOGISTIC_SETTINGS.BacklogCostPerDay()
                            });

                            if (!IS_HEAD_TO_HEAD) {
                                self.StartGame(self.StartGame() ? false : true);
                            }
                        }

                    }, speedOption().Id);

                };

                run();


                return false;
            }

        });
    });

    self.StartSync = function (logisticData) {

        CURRENTLY_PLAYING = true;
        ENCOG_CURRENT_GAME_DONE(false);

        CURRENT_SESSION_COUNTER++;

        self.Playing(true);
        self.CurrentStatus("Encog Playing...");
        self.CurrentSession(CURRENT_SESSION_COUNTER);

        disableSettingsControls(true);

        var simulationResults = logisticData.PlayerDetails;
        var score = logisticData.Score;
        var session = logisticData.Session;
        var settings = logisticData.Settings;

        var resultCounter = 0;

        var run = function () {

            setTimeout(function () {

                var val_r = simulationResults[resultCounter];
                if (val_r) {

                    resultCounter++;

                    self.Day(eval(self.Day() + 1));

                    var paperImages = {
                        RETAILER_PAPER_CACHE: self.RETAILER_PAPER_CACHE(),
                        WHOLESALER_PAPER_CACHE: self.WHOLESALER_PAPER_CACHE(),
                        DISTRIBUTOR_PAPER_CACHE: self.DISTRIBUTOR_PAPER_CACHE(),
                        FACTORY_PAPER_CACHE: self.FACTORY_PAPER_CACHE()
                    };


                    if (resultCounter == simulationResults.length) {
                        self.FinalResults(settings);
                    }

                    var playerDetails = val_r.Results;

                    drawFunction.UpdatePlayerDetails(self.Canvas(), paperImages, self.DAY_PAPER_CACHE(), playerDetails, self);
                    drawFunction.UpdateSummaryDetails(self.Canvas(), {
                        CurrentStatus: self.CurrentStatus(),
                        CurrentSession: self.CurrentSession(),
                        CurrentSessionScore: self.CurrentSessionScore(),

                        StorageCostPerDay: "$" + LOGISTIC_SETTINGS.StorageCostPerDay(),
                        BacklogCostPerDay: "$" + LOGISTIC_SETTINGS.BacklogCostPerDay()
                    });
                }

                if (resultCounter < simulationResults.length) {
                    disableSettingsControls(true);
                    run();
                } else if (resultCounter >= simulationResults.length) {

                    ENCOG_CURRENT_GAME_DONE(true);
                    CURRENT_ENCOG_SESSION(session);

                    PLAY_TRIGGER(repo3.GenerateGUID());

                    console.log("encog session = " + session);

                    CURRENTLY_PLAYING = false;

                    self.Playing(false);
                    logisticData.Done(true);

                    self.Day(0);
                    self.CurrentStatus("Loading data...");

                    self.CurrentSession(session);
                    self.CurrentSessionScore(numberToCurrency(score));

                    self.SessionScores.push({ Session: session, Score: numberToCurrency(score) });

                    if (session >= SESSION_COUNTER) {

                        self.CurrentSession(-1);
                        self.CurrentStatus("Done");

                        if (USEAIBLE_DONE_PLAYING != undefined) {

                            if (USEAIBLE_DONE_PLAYING()) {
                                $(".view-chart").show();
                                disableSettingsControls(false);
                            }

                        } else {

                            $(".view-chart").show();
                            disableSettingsControls(false);
                        }

                        ENCOG_SHOWCHART(true);
                        DONE_PLAYING(true);

                        if (client3) {
                            if (client3.isConnected()) {
                                client3.disconnect();
                            }
                        }
                    }

                    var table = $("#encog-table-container");
                    table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });

                    drawFunction.UpdateSummaryDetails(self.Canvas(), {
                        CurrentStatus: self.CurrentStatus(),
                        CurrentSession: self.CurrentSession(),
                        CurrentSessionScore: self.CurrentSessionScore(),

                        StorageCostPerDay: "$" + LOGISTIC_SETTINGS.StorageCostPerDay(),
                        BacklogCostPerDay: "$" + LOGISTIC_SETTINGS.BacklogCostPerDay()
                    });

                    if (!IS_HEAD_TO_HEAD) {
                        self.StartGame(self.StartGame() ? false : true);
                    }
                }

            }, speedOption().Id);

        };

        run();
    };

    self.Done = ko.observable(false);
    self.EncogSessionScores = [];

    var lastScore;
    var USEAIBLE_DONE_PLAYING;
    var SESSION_DATA;
    var SHOW_COMPARISON_CHART;
    var ENCOG_SHOWCHART;
    var DONE_PLAYING;
    var LOGISTIC_SETTINGS;

    var USEAIBLE_CURRENT_GAME_DONE;
    var ENCOG_CURRENT_GAME_DONE;

    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;

    var CURRENT_ENCOG_SESSION;
    var PLAY_TRIGGER;

    self.Play = function (userToken, numSessions, logisticSettings, drawGame, moveBeer, speed, useAIbleDonePlaying, sessionScore, showChart, donePlaying, encogShowChart, useAIbleCurrentGameDonePlaying,
        encogCurrentGameDonePlaying, currentEncogSession, playTrigger) {

        try {

            connect(userToken, drawGame);
        
            $(".view-chart").hide();

            LOGISTIC_SETTINGS = logisticSettings;

            DONE_PLAYING = donePlaying;
            ENCOG_SHOWCHART = encogShowChart;
            SHOW_COMPARISON_CHART = showChart;
            SESSION_DATA = sessionScore;
            USEAIBLE_DONE_PLAYING = useAIbleDonePlaying;
            SESSION_COUNTER = 0;
            CURRENT_SESSION_COUNTER = 0;

            USEAIBLE_CURRENT_GAME_DONE = useAIbleCurrentGameDonePlaying;
            ENCOG_CURRENT_GAME_DONE = encogCurrentGameDonePlaying;

            if (ENCOG_CURRENT_GAME_DONE) {
                ENCOG_CURRENT_GAME_DONE(false);
            }

            IS_HEAD_TO_HEAD = USEAIBLE_CURRENT_GAME_DONE ? true : false;

            if (IS_HEAD_TO_HEAD) {

                CURRENT_ENCOG_SESSION = currentEncogSession;

                PLAY_TRIGGER = playTrigger;

                PLAY_TRIGGER(repo3.GenerateGUID());
            }

            USER_TOKEN = userToken;
            self.NumberOfSessions(numSessions);

            moveFunction = moveBeer;
            drawFunction = drawGame;
            speedOption = speed;

            self.EncogSessionScores = [];

            var resultsList = [];
            var resultsListIndexCounter = 0;
            client3.onMessageArrived = function (msg) {

                if (msg.duplicate) {
                    console.log('encog found duplicate');
                    return;
                }

                var msgOrigin = msg.destinationName;
                var simulationOutputRoute = userToken + "/encog/logistic/simulation_output";

                switch (msgOrigin) {

                    case simulationOutputRoute:

                        SESSION_COUNTER++;

                        if (IS_HEAD_TO_HEAD) {
                            if (SESSION_COUNTER == 1) {
                                ENCOG_CURRENT_GAME_DONE(true);
                                //CURRENTLY_PLAYING = true;
                            }
                            //else {
                            //    if (!CURRENTLY_PLAYING) {
                            //        ENCOG_CURRENT_GAME_DONE(true);
                            //    }
                            //}

                            //PLAY_TRIGGER(repo3.GenerateGUID());
                        }

                        var output = eval("(" + msg.payloadString + ")");

                        var score = output.Score;
                        var settings = output.Settings;

                        $.each(output.SimulatedDays, function (index_day, value_day) {

                            var dayNum = value_day.Day;
                            var playerDetails = value_day.PlayerDetails;

                            self.PlayerDetails([]);
                            $.each(playerDetails, function (index_player, value_player) {

                                var player = new PlayerVM(value_player.Name,
                                    value_player.Inventory ? value_player.Inventory : 0,
                                    value_player.Expected ? value_player.Expected : 0,
                                    value_player.Shipped ? value_player.Shipped : 0,
                                    value_player.Ordered ? value_player.Ordered : 0,
                                    value_player.StorageCost ? value_player.StorageCost : 0,
                                    value_player.BacklogCost? value_player.BacklogCost : 0);

                                player.Session(self.CurrentSession() + 1);

                                self.PlayerDetails.push(player);
                            });

                            resultsList.push({ Distribution: ko.observable(new DistributionVM()), Results: self.PlayerDetails() });

                        });



                        self.Logistics.push({ Done: ko.observable(false), Session: SESSION_COUNTER, PlayerDetails: resultsList, Score: score, Settings: settings });
                        resultsList = [];

                        if (!IS_HEAD_TO_HEAD) {
                            self.StartGame(self.StartGame() ? false : true);
                        }

                        break;
                }
            };

            logisticSettings.HiddenLayerNeurons(self.HiddenLayerNeurons());
            logisticSettings.TrainingMethodType(self.TrainingMethodType());
            logisticSettings.Cycles(self.Cycles());
            logisticSettings.StartTemp(self.StartTemp());
            logisticSettings.StopTemp(self.StopTemp());
            logisticSettings.PopulationSize(self.PopulationSize());
            logisticSettings.Epochs(self.Epochs());
            logisticSettings.MinRandom(self.MinRandom());
            logisticSettings.MaxRandom(self.MaxRandom());
            logisticSettings.LearnRate(self.LearnRate());
            logisticSettings.Momentum(self.Momentum());

            var neuronInputs = $.map(self.HiddenLayerNeuronsInputs(), function (neuron, i) {
                return neuron.NeuronCount();
            });

            logisticSettings.HiddenLayerNeuronsInputs(neuronInputs);

            var settings = logisticSettings;

            repo.PlayLogisticSimulatorEncog(userToken, self.NumberOfSessions(), settings).done(function (res) {

                disableSettingsControls(true);
                self.Done(false);

                self.CurrentStatus("Waiting...");

                drawGame.UpdateSummaryDetails(self.Canvas(), {
                    CurrentStatus: self.CurrentStatus(),
                    CurrentSession: self.CurrentSession(),
                    CurrentSessionScore: self.CurrentSessionScore(),

                    StorageCostPerDay: "$"+ LOGISTIC_SETTINGS.StorageCostPerDay(),
                    BacklogCostPerDay: "$"+ LOGISTIC_SETTINGS.BacklogCostPerDay()
                });

            });
        } catch (exception) {
            console.log(exception);
        }

    };

    var renderScores = function () {

        if (self.EncogSessionScores.length > 0) {
            var score = self.EncogSessionScores.shift();

            self.SessionScores.push(score);

            setTimeout(renderScores, 30);
        }
    };

    var disableSettingsControls = function (disabled) {

        $('#player-option-dropdown').prop('disabled', disabled);
        $('#storage-cost-per-day-input').prop('disabled', disabled);
        $('#backlog-cost-per-day-input').prop('disabled', disabled);
        $('#initial-inventory-retailer-input').prop('disabled', disabled);
        $('#initial-inventory-wholesaler-input').prop('disabled', disabled);
        $('#initial-inventory-distributor-input').prop('disabled', disabled);
        $('#initial-inventory-factory-input').prop('disabled', disabled);

        $('#sessionInput').prop('disabled', disabled);
        $('#sessionRandomnessInput').prop('disabled', disabled);

        $('#RandomnessInput').prop('disabled', disabled);
        $('#RandomnessInput2').prop('disabled', disabled);
        $('#add-settings-btn').prop('disabled', disabled);

        if (disabled) {
            $('#play-game-btn').hide();
            $('#sessionRandomnessSlider').slider('disable');
            $('#RandomnessSlider').slider('disable');
            $('#sessionSlider').slider('disable');
        } else {
            $('#play-game-btn').show();
            $('#sessionRandomnessSlider').slider('enable');
            $('#RandomnessSlider').slider('enable');
            $('#sessionSlider').slider('enable');
        }

    };

    var formatNumber = function (val) {
        while (/(\d+)(\d{3})/.test(val.toString())) {
            val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
        }
        return val;
    };

    var numberToCurrency = function(val){

        return '$' + val.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

    };

}
