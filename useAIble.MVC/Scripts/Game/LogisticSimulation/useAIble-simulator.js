var repo = new DRNNRepository();
//var client = new Paho.MQTT.Client("dev.useaible.com", 61614, repo.GenerateGUID());
//var client = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, repo.GenerateGUID());

function useAIbleSimulator(donePlaying, sessionData, useAIbleShowChart, showComparisonChart) {

    client = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, repo.GenerateGUID());

    var self = this;
    var draw;

    var USER_TOKEN;

    self.Canvas = ko.observable();

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

    self.PlayerDetails = ko.observableArray([]);
    self.Day = ko.observable(0);

    self.SessionScores = ko.observableArray([]);
    self.CurrentSession = ko.observable(0);
    self.CurrentSessionScore = ko.observable("");
    self.CurrentStatus = ko.observable("");

    self.FinalResults = ko.observableArray([]);

    self.RequestedOrders = [];
    self.ReceivedOrders = [];

    self.PlayerOptions = ko.observableArray([{ Id: 2, Name: 'useAIble' }, { Id: 3, Name: 'Tensor Flow' }, { Id: 5, Name: 'Encog' }, { Id: 4, Name: 'Head-To-Head' }]);
    self.SelectedPlayerOption = ko.observable(self.PlayerOptions()[0]);
    self.SelectedPlayerOption.subscribe(function () {
        $("#player-error").text("");
    });

    self.SpeedOptions = ko.observableArray([{ Id: 2000, Name: 'Slower' }, { Id: 1000, Name: 'Slow' }, { Id: 500, Name: 'Normal' }, { Id: 100, Name: 'Fast' }, { Id: 50, Name: 'Faster' }]);
    self.SelectedSpeedOption = ko.observable(self.SpeedOptions()[2]);

    self.LogisticSettings = ko.observable(new LogisticSettingsVM(0.5, 1.0, 50, 50, 50, 50));

    // useAIble Settings
    self.NumberOfSessions = ko.observable(100);
    self.NumSessionRandomness = ko.observable(self.NumberOfSessions());

    self.NumberOfSessions.subscribe(function (val) {
        self.NumSessionRandomness(val);

        self.NetworkSettings([]);

        var totalSessions = self.NumberOfSessions();//eval(self.NumberOfSessions() * 0.80);
        var nextStartRange = totalSessions + 1;
        //var nextEndRange = self.NumberOfSessions() - (self.NumberOfSessions() * .10);

        self.NetworkSettings.push(new RNNCoreSettings(1, self.StartRandomness(), self.EndRandomness(), 0, 0, 1, totalSessions));
    });

    self.StartRandomness = ko.observable(100);
    self.EndRandomness = ko.observable(0);
    self.MaxLinearBracket = ko.observable(15);
    self.MinLinearBracket = ko.observable(3);

    self.Randomness = ko.computed({
        read: function () {
            return [self.StartRandomness(), self.EndRandomness()];
        },
        write: function (newValue) {
            self.StartRandomness(newValue[0]);
            self.EndRandomness(newValue[1]);
        }
    });

    self.NetworkSettings = ko.observableArray([]);
    var lastRandomness = function () {

        var len = self.NetworkSettings().length;

        if (len > 0) {
            return self.NetworkSettings()[len - 1];
        } else {
            return new RNNCoreSettings(0, 0, 0, 0, 0, 0);
        }
    };

    self.AddSettings = function () {

        $("#multiSettingsErr").text("");

        var S_RANDOMNESS = self.StartRandomness();
        var E_RANDOMNESS = self.EndRandomness();
        var NUM_SESSION_RANDOMNESS = self.NumSessionRandomness();

        var len = self.NetworkSettings().length;
        var startCycle = len > 0 ? lastRandomness().EndSessionRandomness() + 1 : 1;
        var endCycle = eval(NUM_SESSION_RANDOMNESS);
        var rstart = eval(S_RANDOMNESS);
        var rend = eval(E_RANDOMNESS);

        var id = lastRandomness().Id() + 1;

        if (startCycle > endCycle) {
            $("#multiSettingsErr").text("Number of session randomness must be greater than " + startCycle);
            return false;
        } else {

            var numSessions = self.NumberOfSessions(); //eval($("#sessionInput").val());

            if (endCycle + 1 < numSessions) {
                $("#sessionRandomnessSlider").slider("option", "min", endCycle + 1);
                $("#sessionRandomnessSlider").slider("value", endCycle + 1);
            }

            self.NetworkSettings.push(new RNNCoreSettings(id, rstart, rend, 0, 0, startCycle, endCycle));
        }
    };

    self.RemoveSettings = function (setting) {
        self.NetworkSettings.remove(setting);
    };
    // end useaible settings

    self.GetSampleDetails = function () {

        var retailer = new PlayerVM("Retailer", 50, 0, 0, 0, 0, 0);
        var wholesaler = new PlayerVM("WholeSaler", 50, 0, 0, 0, 0, 0);
        var distributor = new PlayerVM("Distributor", 50, 0, 0, 0, 0, 0);
        var factory = new PlayerVM("Factory", 50, 0, 0, 0, 0, 0);

        randomizePlayerDetail(retailer);
        randomizePlayerDetail(wholesaler);
        randomizePlayerDetail(distributor);
        randomizePlayerDetail(factory);

        self.PlayerDetails([retailer, wholesaler, distributor, factory]);
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


    var connect = function (userToken, drawGame) {

        if (client) {
            if (!client.isConnected()) {
                client.connect({
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

                        client.subscribe(userToken + "/useaible/outputFromServer", { qos: 1 });
                        //client.subscribe(userToken + "/useaible/requestOrder", { qos: 1 });
                        //client.subscribe(userToken + "/useaible/receiveOrder", { qos: 1 });
                        client.subscribe(userToken + "/useaible/logisticSessionScores", { qos: 1 });
                        client.subscribe(userToken + "/useaible/logisticOutputs", { qos: 1 });

                        //self.SelectedSpeedOption(self.SpeedOptions()[2]);

                        console.log("subscribed to useAIble logistic simulator with token = " + userToken);
                    }
                });
            }
        }

            client.onConnectionLost = function (msg) {
                console.log(msg.errorMessage);
            };
    };

    self.Init = function (userToken, drawGame) {

        //client.onConnectionLost = function (msg) {

        //    console.log(msg.errorMessage);
        //    //self.CurrentStatus("Connection Lost");

        //    //drawGame.UpdateSummaryDetails(self.Canvas(), {
        //    //    CurrentStatus: self.CurrentStatus(),
        //    //    CurrentSession: self.CurrentSession(),
        //    //    CurrentSessionScore: self.CurrentSessionScore()
        //    //});

        //    //disableSettingsControls(false);

        //    //connect(userToken, drawGame);
        //};

        //if (!client.isConnected()) {
        //    connect(userToken, drawGame);
        //} else {
        //    client.subscribe(userToken + "/useaible/outputFromServer", { qos: 1 });
        //    //client.subscribe(userToken + "/useaible/requestOrder", { qos: 1 });
        //    //client.subscribe(userToken + "/useaible/receiveOrder", { qos: 1 });
        //    client.subscribe(userToken + "/useaible/logisticSessionScores", { qos: 1 });
        //    client.subscribe(userToken + "/useaible/logisticOutputs", { qos: 1 });
        //}

        //client.connect({
        //    keepAliveInterval: 1000, // 10mins (60s*10)
        //    onSuccess: function () {

        //        drawGame.UpdateSummaryDetails(self.Canvas(), {
        //            CurrentStatus: self.CurrentStatus(),
        //            CurrentSession: self.CurrentSession(),
        //            CurrentSessionScore: self.CurrentSessionScore()
        //        });

        //        client.subscribe(userToken + "/outputFromServer");
        //        client.subscribe(userToken + "/requestOrder");
        //        client.subscribe(userToken + "/receiveOrder");
        //        client.subscribe(userToken + "/logisticSessionScores");
        //        client.subscribe(userToken + "/logisticOutputs");

        //        self.SelectedSpeedOption(self.SpeedOptions()[2]);

        //        console.log("subscribed to useAIble logistic simulator with token = " + userToken);
        //    }
        //});

    };

    self.GetToken = function () {

        var def = $.Deferred();

        repo.GetToken().done(function (token_res) {
            def.resolve(token_res.Token);
        });

        return def;
    };

    var moveFunction;
    var drawFunction;
    self.Logistics = ko.observableArray([]);
    self.LogisticOutputs = ko.observableArray([]);
    self.Playing = ko.observable(false);
    
    var CURR_SESS_COUNT = 0;
    self.StartGame = ko.observable(false);
    self.StartGame.subscribe(function () {
        $.each(self.Logistics(), function (index, val) {

            if (!val.Done() && !self.Playing()) {

                CURR_SESS_COUNT++;

                disableSettingsControls(true);

                self.Playing(true);
                self.CurrentStatus("useAIble Playing...");

                var results = val.PlayerDetails;
                var score = val.Score;
                var session = CURR_SESS_COUNT;//val.Session;

                if (IS_HEAD_TO_HEAD) {
                    CURRENT_GAME_DONE(false);
                }

                CURRENTLY_PLAYING = true;

                var resultCounter = 0;
                
                var run = function () {

                    setTimeout(function () {

                        var val_r = results[resultCounter];
                        if (val_r) {
                            //var distribution = val_r.Distribution();

                            resultCounter++;

                            var playerDetails;
                            var paperImages = {
                                RETAILER_PAPER_CACHE: self.RETAILER_PAPER_CACHE(),
                                WHOLESALER_PAPER_CACHE: self.WHOLESALER_PAPER_CACHE(),
                                DISTRIBUTOR_PAPER_CACHE: self.DISTRIBUTOR_PAPER_CACHE(),
                                FACTORY_PAPER_CACHE: self.FACTORY_PAPER_CACHE()
                            };

                            var anArray = $.isArray(val_r);

                            //if (anArray) {

                                self.Day(eval(self.Day() + 1));

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

                                    StorageCostPerDay: "$"+ self.LogisticSettings().StorageCostPerDay(),
                                    BacklogCostPerDay: "$"+ self.LogisticSettings().BacklogCostPerDay()
                                });

                                //var from = distribution.From();
                                //var to = distribution.To();

                                //if (from == "Retailer" && to == "WholeSaler") {
                                //    //moveFunction.MoveRetailerToWholeSaler(self.Canvas(), self.SelectedSpeedOption().Id);
                                //}
                                //else if (from == "WholeSaler" && to == "Distributor") {
                                //    //moveFunction.MoveWholeSalerToDistributor(self.Canvas(), self.SelectedSpeedOption().Id);
                                //}
                                //else if (from == "Distributor" && to == "Factory") {
                                //    //moveFunction.MoveDistributorToFactory(self.Canvas(), self.SelectedSpeedOption().Id);
                                //}
                                //else if (from == "WholeSaler" && to == "Retailer") {
                                //    //moveFunction.MoveWholeSalerToRetailer(self.Canvas(), self.SelectedSpeedOption().Id);
                                //}
                                //else if (from == "Distributor" && to == "WholeSaler") {
                                //    //moveFunction.MoveDistributorToWholeSaler(self.Canvas(), self.SelectedSpeedOption().Id);
                                //}
                                //else if (from == "Factory" && to == "Distributor") {
                                //    //moveFunction.MoveFactoryToDistributor(self.Canvas(), self.SelectedSpeedOption().Id);
                                //}


                            //} else {

                            //    //var move = val_r;

                            //    //if (move) {

                            //    //    var from = move.FROM;
                            //    //    var to = move.TO;

                            //    //    if (from == "Retailer" && to == "WholeSaler") {
                            //    //        moveFunction.MoveRetailerToWholeSaler(self.Canvas(), self.SelectedSpeedOption().Id);
                            //    //    }
                            //    //    else if (from == "WholeSaler" && to == "Distributor") {
                            //    //        moveFunction.MoveWholeSalerToDistributor(self.Canvas(), self.SelectedSpeedOption().Id);
                            //    //    }
                            //    //    else if (from == "Distributor" && to == "Factory") {
                            //    //        moveFunction.MoveDistributorToFactory(self.Canvas(), self.SelectedSpeedOption().Id);
                            //    //    }
                            //    //    else if (from == "WholeSaler" && to == "Retailer") {
                            //    //        moveFunction.MoveWholeSalerToRetailer(self.Canvas(), self.SelectedSpeedOption().Id);
                            //    //    }
                            //    //    else if (from == "Distributor" && to == "WholeSaler") {
                            //    //        moveFunction.MoveDistributorToWholeSaler(self.Canvas(), self.SelectedSpeedOption().Id);
                            //    //    }
                            //    //    else if (from == "Factory" && to == "Distributor") {
                            //    //        moveFunction.MoveFactoryToDistributor(self.Canvas(), self.SelectedSpeedOption().Id);
                            //    //    }
                            //    //}
                            //}
                        }

                        if (resultCounter < results.length) {
                            if (IS_HEAD_TO_HEAD) {
                                CURRENT_GAME_DONE(false);
                            }
                            disableSettingsControls(true);
                            run();
                        } else {

                            self.Playing(false);
                            val.Done(true);
                            self.Day(0);
                            //self.CurrentStatus("Ready session " + eval(val.Session + 1));
                            self.CurrentStatus("Loading data...");

                            self.CurrentSessionScore(score);

                            //clearTimeout(this);
                            self.CurrentSession(session);

                            self.SessionScores.push({ Session: session, Score: score });

                            var table = $("#useAIble-table-container");
                            table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });

                            if (IS_HEAD_TO_HEAD) {

                                CURRENT_GAME_DONE(true);
                                CURRENT_USEAIBLE_SESSION(session);

                                console.log("useAIble session = " + session);

                                PLAY_TRIGGER(repo.GenerateGUID());

                            }

                            CURRENTLY_PLAYING = false;

                            if (self.CurrentSession() == self.NumberOfSessions()) {

                                self.CurrentSession(-1);
                                self.CurrentStatus("Done");

                                if (PLAYER2_DONE_PLAYING != undefined) {

                                    if (PLAYER2_DONE_PLAYING()) {
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

                                USEAIBLE_SHOWCHART(true);
                                DONE_PLAYING(true);

                                //client.unsubscribe(USER_TOKEN + "/useaible/outputFromServer");
                                //client.unsubscribe(USER_TOKEN + "/useaible/logisticSessionScores");
                                //client.unsubscribe(USER_TOKEN + "/useaible/logisticOutputs");

                                if (client) {
                                    if (client.isConnected()) {
                                        client.disconnect();
                                    }
                                }
                            }

                            drawFunction.UpdateSummaryDetails(self.Canvas(), {
                                CurrentStatus: self.CurrentStatus(),
                                CurrentSession: self.CurrentSession(),
                                CurrentSessionScore: self.CurrentSessionScore(),
                                StorageCostPerDay: "$"+ self.LogisticSettings().StorageCostPerDay(),
                                BacklogCostPerDay: "$"+ self.LogisticSettings().BacklogCostPerDay()
                            });

                            if (!IS_HEAD_TO_HEAD) {
                                self.StartGame(self.StartGame() ? false : true);
                            }
                        }

                    }, self.SelectedSpeedOption().Id);

                };

                run();

                return false;
            }

        });
    });

    self.StartSync = function (logisticData) {



        //$.each(logisticData, function (index, val) {

            disableSettingsControls(true);

            self.Playing(true);
            self.CurrentStatus("useAIble Playing...");

            var results = logisticData.PlayerDetails;
            var score = logisticData.Score;
            var session = logisticData.Session;

            CURRENT_GAME_DONE(false);
            CURRENTLY_PLAYING = true;

            var resultCounter = 0;

            var run = function () {

                setTimeout(function () {

                    var val_r = results[resultCounter];
                    if (val_r) {

                        resultCounter++;

                        var playerDetails;
                        var paperImages = {
                            RETAILER_PAPER_CACHE: self.RETAILER_PAPER_CACHE(),
                            WHOLESALER_PAPER_CACHE: self.WHOLESALER_PAPER_CACHE(),
                            DISTRIBUTOR_PAPER_CACHE: self.DISTRIBUTOR_PAPER_CACHE(),
                            FACTORY_PAPER_CACHE: self.FACTORY_PAPER_CACHE()
                        };

                        self.Day(eval(self.Day() + 1));

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

                            StorageCostPerDay: "$" + self.LogisticSettings().StorageCostPerDay(),
                            BacklogCostPerDay: "$" + self.LogisticSettings().BacklogCostPerDay()
                        });
                    }

                    if (resultCounter < results.length) {
                        CURRENT_GAME_DONE(false);
                        disableSettingsControls(true);
                        run();
                    } else {

                        self.Playing(false);
                        logisticData.Done(true);
                        self.Day(0);
                        self.CurrentStatus("Loading data...");

                        self.CurrentSessionScore(score);

                        self.CurrentSession(session);

                        self.SessionScores.push({ Session: session, Score: score });

                        var table = $("#useAIble-table-container");
                        table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });

                        CURRENT_GAME_DONE(true);
                        CURRENT_USEAIBLE_SESSION(session);
                        CURRENTLY_PLAYING = false;

                        console.log("useAIble session = " + session);

                        if (self.CurrentSession() == self.NumberOfSessions()) {

                            self.CurrentSession(-1);
                            self.CurrentStatus("Done");

                            if (PLAYER2_DONE_PLAYING != undefined) {

                                if (PLAYER2_DONE_PLAYING()) {
                                    $(".view-chart").show();
                                    disableSettingsControls(false);
                                }

                            } else {

                                $(".view-chart").show();
                                disableSettingsControls(false);
                            }

                            USEAIBLE_SHOWCHART(true);
                            DONE_PLAYING(true);

                            if (client) {
                                if (client.isConnected()) {
                                    client.disconnect();
                                }
                            }
                        }

                        drawFunction.UpdateSummaryDetails(self.Canvas(), {
                            CurrentStatus: self.CurrentStatus(),
                            CurrentSession: self.CurrentSession(),
                            CurrentSessionScore: self.CurrentSessionScore(),
                            StorageCostPerDay: "$" + self.LogisticSettings().StorageCostPerDay(),
                            BacklogCostPerDay: "$" + self.LogisticSettings().BacklogCostPerDay()
                        });
                    }

                }, self.SelectedSpeedOption().Id);

            };

            run();
        //});
    };


    var PLAYER2_DONE_PLAYING;
    var SESSION_DATA;
    var SHOW_COMPARISON_CHART;
    var DONE_PLAYING;
    var USEAIBLE_SHOWCHART;

    var PLAYER2_CURRENT_GAME_DONE;
    var CURRENT_GAME_DONE;
    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;

    var CURRENT_USEAIBLE_SESSION;
    var PLAY_TRIGGER;
    var SESSION_TO_PLAY;

    self.Play = function (userToken, drawGame, moveBeer, player2DonePlaying, sessionScore, showChart, donePlaying, useAIbleShowChart, player2CurrentGameDonePlaying, useAIbleCurrentGameDonePlaying,
        currentUseAibleSession, playTrigger, sessionToPlay) {

        try {

            connect(userToken, drawGame);

            $(".view-chart").hide();
            DONE_PLAYING = donePlaying;
            USEAIBLE_SHOWCHART = useAIbleShowChart;
            SHOW_COMPARISON_CHART = showChart;
            SESSION_DATA = sessionScore;
            
            PLAYER2_DONE_PLAYING = player2DonePlaying;
            PLAYER2_CURRENT_GAME_DONE = player2CurrentGameDonePlaying;
            CURRENT_GAME_DONE = useAIbleCurrentGameDonePlaying;

            if (CURRENT_GAME_DONE) {
                CURRENT_GAME_DONE(false);
            }

            IS_HEAD_TO_HEAD = PLAYER2_CURRENT_GAME_DONE ? true : false;

            if (IS_HEAD_TO_HEAD) {
                CURRENT_USEAIBLE_SESSION = currentUseAibleSession;
                PLAY_TRIGGER = playTrigger;

                PLAY_TRIGGER(repo.GenerateGUID());

                SESSION_TO_PLAY = sessionToPlay;
            }

            moveFunction = moveBeer;
            drawFunction = drawGame;

            var supported = false;
            var currentPlayer = self.SelectedPlayerOption().Name;

            switch (currentPlayer) {
                case "Human":
                    $("#player-error").text("Human player is currently not supported for this version!");
                    break;
                case 'useAIble':
                    supported = true;
                    break;
                case 'Tensor Flow':
                    supported = true;
                    break;
                case 'Head-To-Head':
                    supported = true;
                    break;
            }

            if (!supported) {
                return;
            }


            USER_TOKEN = userToken;

            var resultsList = [];
            client.onMessageArrived = function (msg) {

                if (msg.duplicate) {
                    console.log('useaible found duplicate');
                    return;
                }

                //self.CurrentStatus("useAIble Playing...");

                var msgOrigin = msg.destinationName;
                var playerDetailsRoute = userToken + "/useaible/outputFromServer";
                var requestedOrdersRoute = userToken + "/useaible/requestOrder";
                var receivedOrdersRoute = userToken + "/useaible/receiveOrder";
                var logisticSessionScoresRoute = userToken + "/useaible/logisticSessionScores";
                var logisticOutputsRoute = userToken + "/useaible/logisticOutputs";

            
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

                            //player.Session(self.CurrentSession() + 1);

                            self.PlayerDetails.push(player);

                        });

                        resultsList.push({ Distribution: ko.observable(new DistributionVM()), Results: self.PlayerDetails() });

                        break;
                    case requestedOrdersRoute:

                        //var output = eval("(" + msg.payloadString + ")");

                        //var from = output.From;
                        //var to = output.To;

                        //if (from == "Retailer" && to == "WholeSaler") {
                        //    moveBeer.MoveRetailerToWholeSaler(self.Canvas());
                        //}
                        //else if (from == "WholeSaler" && to == "Distributor") {
                        //    moveBeer.MoveWholeSalerToDistributor(self.Canvas());
                        //}
                        //else if (from == "Distributor" && to == "Factory") {
                        //    moveBeer.MoveDistributorToFactory(self.Canvas());
                        //}

                        //resultsList.push({ FROM: from, TO: to });

                        //if (from != "Retailer" && to != "Retailer") {

                        //    var dist = new DistributionVM();

                        //    dist.From(from);
                        //    dist.To(to);

                        //    resultsList[resultsListIndexCounter-1].Distribution(dist);
                        //}

                        break;
                    case receivedOrdersRoute:

                        //var output = eval("(" + msg.payloadString + ")");

                        //var from = output.From;
                        //var to = output.To;

                        //if (from == "WholeSaler" && to == "Retailer") {
                        //    moveBeer.MoveWholeSalerToRetailer(self.Canvas());
                        //} else if (from == "Distributor" && to == "WholeSaler") {
                        //    moveBeer.MoveDistributorToWholeSaler(self.Canvas());
                        //} else if (from == "Factory" && to == "Distributor") {
                        //    moveBeer.MoveFactoryToDistributor(self.Canvas());
                        //}

                        //resultsList.push({ FROM: from, TO: to });

                        //if (from != "Retailer" && to != "Retailer") {

                        //    var dist = new DistributionVM();

                        //    dist.From(from);
                        //    dist.To(to);

                        //    resultsList[resultsListIndexCounter-1].Distribution(dist);
                        //}

                        break;
                    case logisticSessionScoresRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        //self.CurrentSession(output.Session);
                        //self.CurrentSessionScore(output.Score);

                        //output.Type = ko.observable("useAIble");

                        //self.SessionScores.push(output);

                        //var table = $("#useAIble-table-container");
                        //table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });

                        self.Logistics.push({ Done: ko.observable(false), Session: output.Session, PlayerDetails: resultsList, Score: output.Score });

                        resultsList = [];

                        if (self.NumberOfSessions() == output.Session) {
                            //self.CurrentStatus("Done");
                            //self.CurrentSession(self.CurrentSession() - 1); 
                            //disableSettingsControls(false);
                        }

                        if (IS_HEAD_TO_HEAD) {

                            if (output.Session == 1) {
                                CURRENT_GAME_DONE(true);
                                CURRENTLY_PLAYING = true;
                            }
                            else {
                                if (!CURRENTLY_PLAYING) {
                                    CURRENT_GAME_DONE(true);
                                    CURRENTLY_PLAYING = true;
                                }
                            }

                            //PLAY_TRIGGER(repo.GenerateGUID());
                        }

                        if (!IS_HEAD_TO_HEAD) {
                            self.StartGame(self.StartGame() ? false : true);
                        }

                        break;

                    case logisticOutputsRoute:

                        var output = eval("(" + msg.payloadString + ")");

                        if (output.Outputs != null) {
                            ////self.FinalResults(output.Outputs);

                            self.LogisticOutputs.push({ Session: output.Session, Outputs: output.Outputs });
                        }

                        //if (IS_HEAD_TO_HEAD) {

                        //    if (output.Session == 1) {
                        //        CURRENT_GAME_DONE(true);
                        //        CURRENTLY_PLAYING = true;
                        //    } else {
                        //        if (!CURRENTLY_PLAYING) {
                        //            CURRENT_GAME_DONE(true);
                        //        }
                        //    }

                        //    PLAY_TRIGGER(repo.GenerateGUID());
                        //}

                        break;
                }

                //var paperImages = {
                //    RETAILER_PAPER_CACHE: self.RETAILER_PAPER_CACHE(),
                //    WHOLESALER_PAPER_CACHE: self.WHOLESALER_PAPER_CACHE(),
                //    DISTRIBUTOR_PAPER_CACHE: self.DISTRIBUTOR_PAPER_CACHE(),
                //    FACTORY_PAPER_CACHE: self.FACTORY_PAPER_CACHE()
                //};

                //drawGame.UpdatePlayerDetails(self.Canvas(), paperImages, self.DAY_PAPER_CACHE(), self.PlayerDetails(), self);
                //drawGame.UpdateSummaryDetails(self.Canvas(), {
                //    CurrentStatus: self.CurrentStatus(),
                //    CurrentSession: self.CurrentSession(),
                //    CurrentSessionScore: self.CurrentSessionScore()
                //});
            };

            if (self.NetworkSettings().length == 0) {

                //var eightyPercentOfSessions = eval(self.NumberOfSessions() * 0.80);
                //var nextStartRange = eightyPercentOfSessions + 1;
                //var nextEndRange = self.NumberOfSessions() - (self.NumberOfSessions() * .10);

                //self.NetworkSettings.push(new RNNCoreSettings(1, self.StartRandomness(), self.EndRandomness(), 0, 0, 1, eightyPercentOfSessions));
                //self.NetworkSettings.push(new RNNCoreSettings(2, 0, 0, 0, 0, nextStartRange, self.NumberOfSessions()));

                var totalSessions = self.NumberOfSessions();//eval(self.NumberOfSessions() * 0.80);
                var nextStartRange = totalSessions + 1;
                //var nextEndRange = self.NumberOfSessions() - (self.NumberOfSessions() * .10);

                self.NetworkSettings.push(new RNNCoreSettings(1, self.StartRandomness(), self.EndRandomness(), 0, 0, 1, totalSessions));
            }

            self.LogisticSettings().RNNSettings(self.NetworkSettings());
            self.LogisticSettings().NoOfDaysInterval(self.SelectedSpeedOption().Id);

            var settings = self.LogisticSettings();

            repo.PlayLogisticSimulator(userToken, self.NumberOfSessions(), settings).done(function (res) {

                disableSettingsControls(true);

                self.CurrentStatus("Waiting...");

                drawGame.UpdateSummaryDetails(self.Canvas(), {
                    CurrentStatus: self.CurrentStatus(),
                    CurrentSession: self.CurrentSession(),
                    CurrentSessionScore: self.CurrentSessionScore(),

                    StorageCostPerDay: "$"+ self.LogisticSettings().StorageCostPerDay(),
                    BacklogCostPerDay: "$"+ self.LogisticSettings().BacklogCostPerDay()
                });

            });
        } catch (exception) {
            console.log(exception);
        }

    };
}

function randomizePlayerDetail(player) {

    var inventory = Math.floor((Math.random() * 100) + 1);
    var expected = Math.floor((Math.random() * 100) + 1);
    var shipped = Math.floor((Math.random() * 100) + 1);
    var ordered = Math.floor((Math.random() * 100) + 1);
    var storageCost = Math.floor((Math.random() * 100) + 1);
    var backlogCost = Math.floor((Math.random() * 100) + 1);

    player.Inventory(inventory);
    player.Expected(expected);
    player.Shipped(shipped);
    player.Ordered(ordered);
    player.StorageCost(storageCost);
    player.BacklogCost(backlogCost);
}
