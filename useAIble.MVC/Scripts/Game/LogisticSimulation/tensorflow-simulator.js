
var repo2 = new DRNNRepository();
//var client2 = new Paho.MQTT.Client("dev.useaible.com", 61614, repo2.GenerateGUID());
//var client2 = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, repo2.GenerateGUID());

function TensorFlowSimulator(donePlaying, sessionData, tensorflowShowChart, showComparisonChart) {

    client2 = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, repo2.GenerateGUID());

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

    self.RandomActionProb = ko.observable(0.9);
    self.RandomActionDecay = ko.observable(0.99);
    self.Hidden1Size = ko.observable(200);
    self.Hidden2Size = ko.observable(100);
    self.LearningRate = ko.observable(0.002);
    self.MiniBatchSize = ko.observable(50);
    self.DiscountFactor = ko.observable(0.9);
    self.TargetUpdateFreq = ko.observable(300);

    self.NumberOfSessions = ko.observable();
    self.Day = ko.observable();
    self.FinalResults = ko.observableArray([]);
    self.Canvas = ko.observable();
    self.PlayerDetails = ko.observableArray([]);

    self.SessionScores = ko.observableArray([]);
    self.CurrentSession = ko.observable(0);
    self.CurrentSessionScore = ko.observable("");
    self.CurrentStatus = ko.observable("");

    //self.Init = function (token) {

    //    var def = $.Deferred();
    //    client2 = new Paho.MQTT.client2("invirmq.southeastasia.cloudapp.azure.com", 15675, "/ws", token);

    //    // set callback handlers
    //    client2.onConnectionLost = onConnectionLost;
    //    client2.onMessageArrived = onMessageArrived;

    //    client2.connect({
    //        onSuccess: function () {

    //            USER_TOKEN = token;

    //            //client2.subscribe("tensorflow.actions.maze." + USER_TOKEN);
    //            //client2.subscribe("tensorflow.play_maze." + USER_TOKEN);

    //            def.resolve();
    //        }
    //    });



    //    return def;
    //};

    var connect = function (userToken, drawGame) {

        if (client2) {
            if (!client2.isConnected()) {
                client2.connect({
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

                        client2.subscribe(userToken + "/tensorflow/outputFromServer", { qos: 1 });
                        //client2.subscribe(userToken + "/requestOrder", { qos: 1 });
                        //client2.subscribe(userToken + "/receiveOrder");
                        client2.subscribe(userToken + "/logisticSessionScores", { qos: 1 });
                        client2.subscribe(userToken + "/logisticOutputs", { qos: 1 });
                        //client2.subscribe(userToken + "/test_data", { qos: 1 });
                        //client2.subscribe(userToken + "/tensorflowTimeout", { qos: 1 });

                        console.log("subscribed to tensorflow logistic simulator with token = " + userToken);
                    }
                });
            }
        }

            client2.onConnectionLost = function (msg) {

                console.log(msg.errorMessage);
                //self.CurrentStatus("Connection Lost");

                //drawGame.UpdateSummaryDetails(self.Canvas(), {
                //    CurrentStatus: self.CurrentStatus(),
                //    CurrentSession: self.CurrentSession(),
                //    CurrentSessionScore: self.CurrentSessionScore()
                //});

                //disableSettingsControls(false);


                //connect(userToken, drawGame);
            };
    };

    self.Init = function (userToken, drawGame) {

        //client2 = new Paho.MQTT.client("dev.useaible.com", 61614, repo.GenerateGUID());

        //client2.onConnectionLost = function (msg) {

        //    console.log(msg.errorMessage);
        //    //self.CurrentStatus("Connection Lost");
            
        //    //drawGame.UpdateSummaryDetails(self.Canvas(), {
        //    //    CurrentStatus: self.CurrentStatus(),
        //    //    CurrentSession: self.CurrentSession(),
        //    //    CurrentSessionScore: self.CurrentSessionScore()
        //    //});

        //    //disableSettingsControls(false);


        //    connect(userToken, drawGame);
        //};

        //if (!client2.isConnected()) {
        //    connect(userToken, drawGame);
        //} else {
        //    client2.subscribe(userToken + "/tensorflow/outputFromServer", { qos: 1 });
        //    //client2.subscribe(userToken + "/requestOrder", { qos: 1 });
        //    //client2.subscribe(userToken + "/receiveOrder", { qos: 1 });
        //    client2.subscribe(userToken + "/logisticSessionScores", { qos: 1 });
        //    client2.subscribe(userToken + "/logisticOutputs", { qos: 1 });
        //    //client2.subscribe(userToken + "/test_data", { qos: 1 });
        //    //client2.subscribe(userToken + "/tensorflowTimeout", { qos: 1 });
        //}

    };

    var moveFunction;
    var drawFunction;

    self.SelectedSpeedOption = ko.observable();

    self.Logistics = ko.observableArray([]);
    self.LogisticOutputs = ko.observableArray([]);
    self.Playing = ko.observable(false);

    var CURR_SESS_COUNT = 0;

    self.StartGame = ko.observable(false);
    self.StartGame.subscribe(function () {
        $.each(self.Logistics(), function (index, val) {

            if (!val.Done() && !self.Playing()) {

                CURR_SESS_COUNT++;

                self.Playing(true);
                self.CurrentStatus("Tensor Flow Playing...");

                var results = val.PlayerDetails;
                var score = val.Score;
                var session = CURR_SESS_COUNT;//val.Session;

                var resultCounter = 0;

                CURRENTLY_PLAYING = true;

                if (IS_HEAD_TO_HEAD) {
                    if (TENSORFLOW_CURRENT_GAME_DONE) {
                        TENSORFLOW_CURRENT_GAME_DONE(false);
                    }
                }

                var run = function () {

                    setTimeout(function () {

                        var val_r = results[resultCounter];
                        if (val_r) {

                            resultCounter++;

                            self.Day(eval(self.Day() + 1));

                            var playerDetails;
                            var paperImages = {
                                RETAILER_PAPER_CACHE: self.RETAILER_PAPER_CACHE(),
                                WHOLESALER_PAPER_CACHE: self.WHOLESALER_PAPER_CACHE(),
                                DISTRIBUTOR_PAPER_CACHE: self.DISTRIBUTOR_PAPER_CACHE(),
                                FACTORY_PAPER_CACHE: self.FACTORY_PAPER_CACHE()
                            };

                            //if ($.isArray(val_r)) {

                            playerDetails = val_r.Results;


                            if (resultCounter == results.length) {
                                $.each(self.LogisticOutputs(), function (index_out, val_out) {
                                    if (val_out.Session == session) {
                                        self.FinalResults(val_out.Outputs);
                                        return false;
                                    }
                                });
                            }

                            drawFunction.UpdatePlayerDetails(self.Canvas(), paperImages, self.DAY_PAPER_CACHE(), playerDetails, self);
                            drawFunction.UpdateSummaryDetails(self.Canvas(), {
                                CurrentStatus: self.CurrentStatus(),
                                CurrentSession: session,
                                CurrentSessionScore: self.CurrentSessionScore(),

                                StorageCostPerDay: "$"+ LOGISTIC_SETTINGS.StorageCostPerDay(),
                                BacklogCostPerDay: "$"+ LOGISTIC_SETTINGS.BacklogCostPerDay()
                            });



                            //} else {

                            //    var move = val_r;

                            //    if (move) {

                            //        //var from = move.FROM;
                            //        //var to = move.TO;

                            //        //if (from == "Retailer" && to == "WholeSaler") {
                            //        //    moveFunction.MoveRetailerToWholeSaler(self.Canvas(), self.SelectedSpeedOption().Id);
                            //        //}
                            //        //else if (from == "WholeSaler" && to == "Distributor") {
                            //        //    moveFunction.MoveWholeSalerToDistributor(self.Canvas(), self.SelectedSpeedOption().Id);
                            //        //}
                            //        //else if (from == "Distributor" && to == "Factory") {
                            //        //    moveFunction.MoveDistributorToFactory(self.Canvas(), self.SelectedSpeedOption().Id);
                            //        //}
                            //        //else if (from == "WholeSaler" && to == "Retailer") {
                            //        //    moveFunction.MoveWholeSalerToRetailer(self.Canvas(), self.SelectedSpeedOption().Id);
                            //        //}
                            //        //else if (from == "Distributor" && to == "WholeSaler") {
                            //        //    moveFunction.MoveDistributorToWholeSaler(self.Canvas(), self.SelectedSpeedOption().Id);
                            //        //}
                            //        //else if (from == "Factory" && to == "Distributor") {
                            //        //    moveFunction.MoveFactoryToDistributor(self.Canvas(), self.SelectedSpeedOption().Id);
                            //        //}
                            //    }
                            //}
                        }

                        if (resultCounter < results.length) {
                            disableSettingsControls(true);

                            if (IS_HEAD_TO_HEAD) {
                                TENSORFLOW_CURRENT_GAME_DONE(false);
                            }
                            run();
                        } else if(resultCounter >= results.length) {

                            CURRENTLY_PLAYING = false;

                            self.Playing(false);
                            val.Done(true);
                            self.Day(0);
                            //self.CurrentStatus("Ready session " + eval(session + 1));
                            self.CurrentStatus("Loading data...");

                            self.CurrentSessionScore(score);

                            //clearTimeout(this);
                            self.CurrentSession(session);


                            if (IS_HEAD_TO_HEAD) {

                                TENSORFLOW_CURRENT_GAME_DONE(true);
                                CURRENT_TF_SESSION(session);

                                console.log("tf session = " + session);
                                PLAY_TRIGGER(repo2.GenerateGUID());
                            }

                            self.SessionScores.push({ Session: session, Score: score });

                            var table = $("#tensorflow-table-container");
                            table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });


                            if (self.CurrentSession() == self.NumberOfSessions()) {

                                self.CurrentSession(-1);
                                self.CurrentStatus("Done");

                                if (USEAIBLE_DONE_PLAYING != undefined) {

                                    if (USEAIBLE_DONE_PLAYING()) {
                                        disableSettingsControls(false);
                                        //$(".outer-chart-container").show();
                                        //SHOW_COMPARISON_CHART(SESSION_DATA());
                                        $(".view-chart").show();
                                    }

                                } else {

                                    disableSettingsControls(false);
                                   // $(".outer-chart-container").show();
                                    //SHOW_COMPARISON_CHART(SESSION_DATA());
                                    $(".view-chart").show();
                                }

                                TENSORFLOW_SHOWCHART(true);
                                DONE_PLAYING(true);

                                //client2.unsubscribe(USER_TOKEN + "/tensorflow/outputFromServer");
                                //client2.unsubscribe(USER_TOKEN + "/logisticSessionScores");
                                //client2.unsubscribe(USER_TOKEN + "/logisticOutputs");

                                if (client2) {
                                    if (client2.isConnected()) {
                                        client2.disconnect();
                                    }
                                }
                            }

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

                    }, SPEED().Id);

                };

                run();


                return false;
            }

        });
    });

    self.StartSync = function (logisticData) {

        //$.each(logisticData, function (index, val) {

                self.Playing(true);
                self.CurrentStatus("Tensor Flow Playing...");

                var results = logisticData.PlayerDetails;
                var score = logisticData.Score;
                var session = logisticData.Session;

                var resultCounter = 0;

                CURRENTLY_PLAYING = true;
                TENSORFLOW_CURRENT_GAME_DONE(false);

                var run = function () {

                    setTimeout(function () {

                        var val_r = results[resultCounter];
                        if (val_r) {

                            resultCounter++;

                            self.Day(eval(self.Day() + 1));

                            var playerDetails;
                            var paperImages = {
                                RETAILER_PAPER_CACHE: self.RETAILER_PAPER_CACHE(),
                                WHOLESALER_PAPER_CACHE: self.WHOLESALER_PAPER_CACHE(),
                                DISTRIBUTOR_PAPER_CACHE: self.DISTRIBUTOR_PAPER_CACHE(),
                                FACTORY_PAPER_CACHE: self.FACTORY_PAPER_CACHE()
                            };

                            playerDetails = val_r.Results;

                            if (resultCounter == results.length) {
                                $.each(self.LogisticOutputs(), function (index_out, val_out) {
                                    if (val_out.Session == session) {
                                        self.FinalResults(val_out.Outputs);
                                        return false;
                                    }
                                });
                            }

                            drawFunction.UpdatePlayerDetails(self.Canvas(), paperImages, self.DAY_PAPER_CACHE(), playerDetails, self);
                            drawFunction.UpdateSummaryDetails(self.Canvas(), {
                                CurrentStatus: self.CurrentStatus(),
                                CurrentSession: session,
                                CurrentSessionScore: self.CurrentSessionScore(),

                                StorageCostPerDay: "$" + LOGISTIC_SETTINGS.StorageCostPerDay(),
                                BacklogCostPerDay: "$" + LOGISTIC_SETTINGS.BacklogCostPerDay()
                            });
                        }

                        if (resultCounter < results.length) {

                            disableSettingsControls(true);

                            TENSORFLOW_CURRENT_GAME_DONE(false);

                            run();
                        } else if (resultCounter >= results.length) {

                            CURRENTLY_PLAYING = false;

                            self.Playing(false);
                            logisticData.Done(true);
                            self.Day(0);
                            self.CurrentStatus("Loading data...");

                            self.CurrentSessionScore(score);

                            self.CurrentSession(session);

                            TENSORFLOW_CURRENT_GAME_DONE(true);
                            CURRENT_TF_SESSION(session);

                            console.log("tf session = " + session);

                            self.SessionScores.push({ Session: session, Score: score });

                            var table = $("#tensorflow-table-container");
                            table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });


                            if (self.CurrentSession() == self.NumberOfSessions()) {

                                self.CurrentSession(-1);
                                self.CurrentStatus("Done");

                                if (USEAIBLE_DONE_PLAYING != undefined) {

                                    if (USEAIBLE_DONE_PLAYING()) {
                                        disableSettingsControls(false);
                                        $(".view-chart").show();
                                    }

                                } else {

                                    disableSettingsControls(false);
                                    $(".view-chart").show();
                                }

                                TENSORFLOW_SHOWCHART(true);
                                DONE_PLAYING(true);

                                if (client2) {
                                    if (client2.isConnected()) {
                                        client2.disconnect();
                                    }
                                }
                            }

                            drawFunction.UpdateSummaryDetails(self.Canvas(), {
                                CurrentStatus: self.CurrentStatus(),
                                CurrentSession: self.CurrentSession(),
                                CurrentSessionScore: self.CurrentSessionScore(),

                                StorageCostPerDay: "$" + LOGISTIC_SETTINGS.StorageCostPerDay(),
                                BacklogCostPerDay: "$" + LOGISTIC_SETTINGS.BacklogCostPerDay()
                            });
                        }

                    }, SPEED().Id);

                };

                run();

        //});
    };

    self.Done = ko.observable(false);

    var USEAIBLE_DONE_PLAYING;
    var SESSION_DATA;
    var SHOW_COMPARISON_CHART;
    var DONE_PLAYING;
    var TENSORFLOW_SHOWCHART;
    var LOGISTIC_SETTINGS;
    var SPEED;

    var USEAIBLE_CURRENT_GAME_DONE;
    var TENSORFLOW_CURRENT_GAME_DONE;

    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;

    var CURRENT_TF_SESSION;
    var PLAY_TRIGGER;

    self.Play = function (userToken, numSessions, logisticSettings, drawGame, moveBeer, speed, useAIbleDonePlaying, sessionScore, showChart, tensorflowDonePlaying, tensorflowShowChart, useAIbleCurrentGameDonePlaying, tensorflowCurrentGameDonePlaying,
        currentTFSession, playTrigger) {

        try {

            connect(userToken, drawGame);

            $(".view-chart").hide();

            SPEED = speed;
            LOGISTIC_SETTINGS = logisticSettings;
            SHOW_COMPARISON_CHART = showChart;
            SESSION_DATA = sessionScore;
            USEAIBLE_DONE_PLAYING = useAIbleDonePlaying;
            DONE_PLAYING = tensorflowDonePlaying;
            TENSORFLOW_SHOWCHART = tensorflowShowChart;

            USER_TOKEN = userToken;
            self.NumberOfSessions(numSessions);

            USEAIBLE_CURRENT_GAME_DONE = useAIbleCurrentGameDonePlaying;
            TENSORFLOW_CURRENT_GAME_DONE = tensorflowCurrentGameDonePlaying;

            if (TENSORFLOW_CURRENT_GAME_DONE) {
                TENSORFLOW_CURRENT_GAME_DONE(false);
            }

            IS_HEAD_TO_HEAD = USEAIBLE_CURRENT_GAME_DONE ? true : false;

            if (IS_HEAD_TO_HEAD) {
                CURRENT_TF_SESSION = currentTFSession;

                PLAY_TRIGGER = playTrigger;

                PLAY_TRIGGER(repo2.GenerateGUID());
            }

            moveFunction = moveBeer;
            drawFunction = drawGame;
            self.SelectedSpeedOption(speed);

            var resultsList = [];
            var resultsListIndexCounter = 0;
            client2.onMessageArrived = function (msg) {

                if (msg.duplicate) {
                    console.log('tensorflow found duplicate');
                    return;
                }

                //if (!self.Done()) {

                //self.CurrentStatus("Tensor Flow Playing...");

                var msgOrigin = msg.destinationName;
                var playerDetailsRoute = userToken + "/tensorflow/outputFromServer";
                var requestedOrdersRoute = userToken + "/requestOrder";
                var receivedOrdersRoute = userToken + "/receiveOrder";
                var logisticSessionScoresRoute = userToken + "/logisticSessionScores";
                var logisticOutputsRoute = userToken + "/logisticOutputs";
                var timeoutRoute = userToken + "/tensorflowTimeout";
                //var test_data = userToken + "/test_data";

                switch (msgOrigin) {
                    case playerDetailsRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        var outputObj = {
                            Day: output.Day,
                            PlayerDetails: output.PlayerDetails
                        };

                        //self.Day(output.Day);


                        self.PlayerDetails([]);
                        $.each(output, function (index, player) {

                            var player = new PlayerVM(player.Name, player.Inventory, player.Expected, player.Shipped, player.Ordered, player.StorageCost, player.BacklogCost);

                            //player.Session(output.Session);

                            self.PlayerDetails.push(player);

                        });

                        resultsList.push({ Distribution: ko.observable(new DistributionVM()), Results: self.PlayerDetails() });

                        resultsListIndexCounter++;

                        break;
                    case requestedOrdersRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        var from = output.From;
                        var to = output.To;

                        if (from == "Retailer" && to == "WholeSaler") {
                            //moveBeer.MoveRetailerToWholeSaler(self.Canvas());
                        }
                        else if (from == "WholeSaler" && to == "Distributor") {
                            //moveBeer.MoveWholeSalerToDistributor(self.Canvas());
                        }
                        else if (from == "Distributor" && to == "Factory") {
                            //moveBeer.MoveDistributorToFactory(self.Canvas());
                        }

                        if (from != "Retailer" && to != "Retailer") {

                            var dist = new DistributionVM();

                            dist.From(from);
                            dist.To(to);

                            resultsList[resultsListIndexCounter - 1].Distribution(dist);
                        }

                        break;
                    case receivedOrdersRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        var from = output.From;
                        var to = output.To;

                        if (from == "WholeSaler" && to == "Retailer") {
                            //moveBeer.MoveWholeSalerToRetailer(self.Canvas());
                        } else if (from == "Distributor" && to == "WholeSaler") {
                            //moveBeer.MoveDistributorToWholeSaler(self.Canvas());
                        } else if (from == "Factory" && to == "Distributor") {
                            //moveBeer.MoveFactoryToDistributor(self.Canvas());
                        }

                        if (from != "Retailer" && to != "Retailer") {

                            var dist = new DistributionVM();

                            dist.From(from);
                            dist.To(to);

                            resultsList[resultsListIndexCounter - 1].Distribution(dist);
                        }

                        break;
                    case logisticSessionScoresRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        //self.CurrentSession(output.Session);
                        //self.CurrentSessionScore(output.Score);

                        //if (self.NumberOfSessions() == output.Session) {
                        //    self.CurrentStatus("Done");
                        //    self.CurrentSession(self.CurrentSession() - 1);
                        //    disableSettingsControls(false);
                        //    self.Done(true);
                        //}
                        //output.Type = ko.observable("tensorFlow");

                        //self.SessionScores.push(output);

                        //var table = $("#tensorflow-table-container");
                        //table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });

                        self.Logistics.push({ Done: ko.observable(false), Session: output.Session, PlayerDetails: resultsList, Score: output.Score });
                        resultsListIndexCounter = 0;

                        resultsList = [];

                        if (IS_HEAD_TO_HEAD) {
                            if (output.Session == 1) {
                                TENSORFLOW_CURRENT_GAME_DONE(true);
                                //CURRENTLY_PLAYING = true;
                            }
                            //else {
                            //    if (!CURRENTLY_PLAYING) {
                            //        TENSORFLOW_CURRENT_GAME_DONE(true);
                            //    }
                            //}

                            //PLAY_TRIGGER(repo2.GenerateGUID());
                        }

                        if (!IS_HEAD_TO_HEAD) {
                            self.StartGame(self.StartGame() ? false : true);
                        }

                        break;

                    case logisticOutputsRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        if (output.Outputs != null) {
                            //self.FinalResults(output.Outputs);

                            self.LogisticOutputs.push({ Session: output.Session, Outputs: output.Outputs });
                        }

                        //if (IS_HEAD_TO_HEAD) {
                        //    if (output.Session == 1) {
                        //        TENSORFLOW_CURRENT_GAME_DONE(true);
                        //        CURRENTLY_PLAYING = true;
                        //    } else {
                        //        if (!CURRENTLY_PLAYING) {
                        //            TENSORFLOW_CURRENT_GAME_DONE(true);
                        //        }
                        //    }

                        //    PLAY_TRIGGER(repo2.GenerateGUID());
                        //}

                        break;

                        //case test_data:

                        //    var testData = '[[{"Name":"Retailer_Min","Value":15},{"Name":"Retailer_Max","Value":85},{"Name":"WholeSaler_Min","Value":30},{"Name":"WholeSaler_Max","Value":116},{"Name":"Distributor_Min","Value":31},{"Name":"Distributor_Max","Value":65},{"Name":"Factory_Min","Value":28},{"Name":"Factory_Max","Value":65},{"Name":"Factory_Units_Per_Day","Value":71}],[{"Name":"Retailer_Min","Value":46},{"Name":"Retailer_Max","Value":60},{"Name":"WholeSaler_Min","Value":41},{"Name":"WholeSaler_Max","Value":89},{"Name":"Distributor_Min","Value":20},{"Name":"Distributor_Max","Value":54},{"Name":"Factory_Min","Value":33},{"Name":"Factory_Max","Value":117},{"Name":"Factory_Units_Per_Day","Value":54}],[{"Name":"Retailer_Min","Value":12},{"Name":"Retailer_Max","Value":67},{"Name":"WholeSaler_Min","Value":42},{"Name":"WholeSaler_Max","Value":55},{"Name":"Distributor_Min","Value":46},{"Name":"Distributor_Max","Value":97},{"Name":"Factory_Min","Value":40},{"Name":"Factory_Max","Value":100},{"Name":"Factory_Units_Per_Day","Value":49}],[{"Name":"Retailer_Min","Value":20},{"Name":"Retailer_Max","Value":97},{"Name":"WholeSaler_Min","Value":24},{"Name":"WholeSaler_Max","Value":52},{"Name":"Distributor_Min","Value":47},{"Name":"Distributor_Max","Value":63},{"Name":"Factory_Min","Value":8},{"Name":"Factory_Max","Value":65},{"Name":"Factory_Units_Per_Day","Value":15}],[{"Name":"Retailer_Min","Value":39},{"Name":"Retailer_Max","Value":114},{"Name":"WholeSaler_Min","Value":15},{"Name":"WholeSaler_Max","Value":111},{"Name":"Distributor_Min","Value":28},{"Name":"Distributor_Max","Value":69},{"Name":"Factory_Min","Value":22},{"Name":"Factory_Max","Value":102},{"Name":"Factory_Units_Per_Day","Value":49}],[{"Name":"Retailer_Min","Value":38},{"Name":"Retailer_Max","Value":52},{"Name":"WholeSaler_Min","Value":35},{"Name":"WholeSaler_Max","Value":102},{"Name":"Distributor_Min","Value":48},{"Name":"Distributor_Max","Value":55},{"Name":"Factory_Min","Value":21},{"Name":"Factory_Max","Value":88},{"Name":"Factory_Units_Per_Day","Value":28}],[{"Name":"Retailer_Min","Value":37},{"Name":"Retailer_Max","Value":67},{"Name":"WholeSaler_Min","Value":30},{"Name":"WholeSaler_Max","Value":113},{"Name":"Distributor_Min","Value":7},{"Name":"Distributor_Max","Value":113},{"Name":"Factory_Min","Value":36},{"Name":"Factory_Max","Value":62},{"Name":"Factory_Units_Per_Day","Value":55}],[{"Name":"Retailer_Min","Value":12},{"Name":"Retailer_Max","Value":112},{"Name":"WholeSaler_Min","Value":11},{"Name":"WholeSaler_Max","Value":95},{"Name":"Distributor_Min","Value":20},{"Name":"Distributor_Max","Value":65},{"Name":"Factory_Min","Value":46},{"Name":"Factory_Max","Value":112},{"Name":"Factory_Units_Per_Day","Value":6}],[{"Name":"Retailer_Min","Value":11},{"Name":"Retailer_Max","Value":77},{"Name":"WholeSaler_Min","Value":35},{"Name":"WholeSaler_Max","Value":89},{"Name":"Distributor_Min","Value":32},{"Name":"Distributor_Max","Value":62},{"Name":"Factory_Min","Value":9},{"Name":"Factory_Max","Value":53},{"Name":"Factory_Units_Per_Day","Value":68}]]';

                        //    var testSend = new Paho.MQTT.Message(testData);
                        //    testSend.destinationName = USER_TOKEN + "/tf_output";

                        //    client2.send(testSend);

                        //    break;
                    case timeoutRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        console.log(output);

                        break;
                }

                //var paperImages = {
                //    RETAILER_PAPER_CACHE: self.RETAILER_PAPER_CACHE(),
                //    WHOLESALER_PAPER_CACHE: self.WHOLESALER_PAPER_CACHE(),
                //    DISTRIBUTOR_PAPER_CACHE: self.DISTRIBUTOR_PAPER_CACHE(),
                //    FACTORY_PAPER_CACHE: self.FACTORY_PAPER_CACHE()
                //};

                //var summaryLabels = {
                //    CurrentStatus: self.CurrentStatus(),
                //    CurrentSession: self.CurrentSession(),
                //    CurrentSessionScore: self.CurrentSessionScore()
                //};

                //drawGame.UpdatePlayerDetails(self.Canvas(), paperImages, self.DAY_PAPER_CACHE(), self.PlayerDetails(), self);
                //drawGame.UpdateSummaryDetails(self.Canvas(), summaryLabels);
                //}
            };

            logisticSettings.random_action_prob(self.RandomActionProb());
            logisticSettings.RANDOM_ACTION_DECAY(self.RandomActionDecay());
            logisticSettings.HIDDEN1_SIZE(self.Hidden1Size());
            logisticSettings.HIDDEN2_SIZE(self.Hidden2Size());
            logisticSettings.LEARNING_RATE(self.LearningRate());
            logisticSettings.MINIBATCH_SIZE(self.MiniBatchSize());
            logisticSettings.DISCOUNT_FACTOR(self.DiscountFactor());
            logisticSettings.TARGET_UPDATE_FREQ(self.TargetUpdateFreq());

            var settings = logisticSettings;

            repo.PlayLogisticSimulatorTF(userToken, self.NumberOfSessions(), settings).done(function (res) {

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

        //$('#speed-option-dropdown').prop('disabled', disabled);

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

}
