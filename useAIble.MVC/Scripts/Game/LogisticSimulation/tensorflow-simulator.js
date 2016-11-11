
var repo2 = new DRNNRepository();
var client2 = new Paho.MQTT.Client("dev.useaible.com", 61614, repo2.GenerateGUID());

function TensorFlowSimulator(donePlaying, sessionData, tensorflowShowChart, showComparisonChart) {

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
            client2.connect({
                keepAliveInterval: 1000, // 10mins (60s*10)
                onSuccess: function () {

                    drawGame.UpdateSummaryDetails(self.Canvas(), {
                        CurrentStatus: self.CurrentStatus(),
                        CurrentSession: self.CurrentSession(),
                        CurrentSessionScore: self.CurrentSessionScore()
                    });

                    client2.subscribe(userToken + "/outputFromServer");
                    client2.subscribe(userToken + "/requestOrder");
                    client2.subscribe(userToken + "/receiveOrder");
                    client2.subscribe(userToken + "/logisticSessionScores");
                    client2.subscribe(userToken + "/logisticOutputs");
                    client2.subscribe(userToken + "/test_data");
                    client2.subscribe(userToken + "/tensorflowTimeout");

                    console.log("subscribed to tensorflow logistic simulator with token = " + userToken);
                }
            });
    };

    self.Init = function (userToken, drawGame) {

        //client2 = new Paho.MQTT.client("dev.useaible.com", 61614, repo.GenerateGUID());

        client2.onConnectionLost = function (msg) {
            console.log("connection lost");
            //self.CurrentStatus("Connection Lost");
            
            //drawGame.UpdateSummaryDetails(self.Canvas(), {
            //    CurrentStatus: self.CurrentStatus(),
            //    CurrentSession: self.CurrentSession(),
            //    CurrentSessionScore: self.CurrentSessionScore()
            //});

            disableSettingsControls(false);


            connect(userToken, drawGame);
        };

        if (!client2.isConnected()) {
            connect(userToken, drawGame);
        } else {
            client2.subscribe(userToken + "/outputFromServer");
            client2.subscribe(userToken + "/requestOrder");
            client2.subscribe(userToken + "/receiveOrder");
            client2.subscribe(userToken + "/logisticSessionScores");
            client2.subscribe(userToken + "/logisticOutputs");
            client2.subscribe(userToken + "/test_data");
            client2.subscribe(userToken + "/tensorflowTimeout");
        }

    };

    var moveFunction;
    var drawFunction;

    self.SelectedSpeedOption = ko.observable();

    self.Logistics = ko.observableArray([]);
    self.LogisticOutputs = ko.observableArray([]);
    self.Playing = ko.observable(false);

    self.StartPlay = ko.observable(false);
    self.StartPlay.subscribe(function () {
        $.each(self.Logistics(), function (index, val) {

            if (!val.Done() && !self.Playing()) {

                self.Playing(true);
                self.CurrentStatus("Tensor Flow Playing...");

                var results = val.PlayerDetails;
                var score = val.Score;
                var session = val.Session;

                var resultCounter = 0;

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
                                CurrentSession: self.CurrentSession(),
                                CurrentSessionScore: self.CurrentSessionScore()
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
                            run();
                        } else {

                            self.Playing(false);
                            val.Done(true);
                            self.Day(0);
                            self.CurrentStatus("Waiting...");

                            self.CurrentSessionScore(score);

                            //clearTimeout(this);
                            self.CurrentSession(session);

                            self.SessionScores.push({ Session: session, Score: score });

                            var table = $("#useAIble-table-container");
                            table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });


                            if (self.CurrentSession() == self.NumberOfSessions()) {

                                self.CurrentSession(session - 1);
                                self.CurrentStatus("Done");

                                if (USEAIBLE_DONE_PLAYING != undefined) {

                                    if (USEAIBLE_DONE_PLAYING()) {
                                        disableSettingsControls(false);
                                        $(".outer-chart-container").show();
                                        SHOW_COMPARISON_CHART(SESSION_DATA());
                                    }

                                } else {

                                    disableSettingsControls(false);
                                    $(".outer-chart-container").show();
                                   SHOW_COMPARISON_CHART(SESSION_DATA());
                                }

                                TENSORFLOW_SHOWCHART(true);
                                DONE_PLAYING(true);
                            }

                            drawFunction.UpdateSummaryDetails(self.Canvas(), {
                                CurrentStatus: self.CurrentStatus(),
                                CurrentSession: self.CurrentSession(),
                                CurrentSessionScore: self.CurrentSessionScore()
                            });

                            self.StartPlay(self.StartPlay() ? false : true);
                        }

                    }, self.SelectedSpeedOption().Id);

                };

                run();


                return false;
            }

        });
    });

    self.Done = ko.observable(false);

    var USEAIBLE_DONE_PLAYING;
    var SESSION_DATA;
    var SHOW_COMPARISON_CHART;
    var DONE_PLAYING;
    var TENSORFLOW_SHOWCHART;

    self.Play = function (userToken, numSessions, logisticSettings, drawGame, moveBeer, speed, useAIbleDonePlaying, sessionScore, showChart, tensorflowDonePlaying, tensorflowShowChart) {

        SHOW_COMPARISON_CHART = showChart;
        SESSION_DATA = sessionScore;
        USEAIBLE_DONE_PLAYING = useAIbleDonePlaying;
        DONE_PLAYING = tensorflowDonePlaying;
        TENSORFLOW_SHOWCHART = tensorflowShowChart;

        USER_TOKEN = userToken;
        self.NumberOfSessions(numSessions);

        moveFunction = moveBeer;
        drawFunction = drawGame;
        self.SelectedSpeedOption(speed);

        var resultsList = [];
        var resultsListIndexCounter = 0;
        client2.onMessageArrived = function (msg) {

            //if (!self.Done()) {

                //self.CurrentStatus("Tensor Flow Playing...");

                var msgOrigin = msg.destinationName;
                var playerDetailsRoute = userToken + "/outputFromServer";
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
                        $.each(output.PlayerDetails, function (index, player) {

                            var player = new PlayerVM(player.Name, player.Inventory, player.Expected, player.Shipped, player.Ordered, player.StorageCost, player.BacklogCost);

                            player.Session(output.Session);

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

                        self.StartPlay(self.StartPlay() ? false : true);

                        break;

                    case logisticOutputsRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        if (output.Outputs != null) {
                            //self.FinalResults(output.Outputs);

                            self.LogisticOutputs.push({ Session: output.Session, Outputs: output.Outputs });
                        }

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
                CurrentSessionScore: self.CurrentSessionScore()
            });

        });

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