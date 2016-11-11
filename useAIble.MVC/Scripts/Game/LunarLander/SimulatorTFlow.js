function TensorFlowClient(sim, runGame, gameVM, resetGame, currentSession, sessionWaitText, settings, enableStartButton, donePlaying, sessionWaitTextTF, waitTimeElapseTF, tensorFlowShowChart) {

    var self = this;
    var sessions = {
    };
    var doneSessions = {
    };
    var sessionCounter = 0;
    var totalSessions = settings.Sessions;
    var fuel = settings.Fuel;
    var altitude = settings.Altitude;
    var gameDone = true;

    self.GameQueue = ko.observableArray([]);

    self.SessionDone = ko.observable(true);
    self.StartGame = ko.observable(false);
    self.StartNewGame = ko.observable(true);

    var setPlayingStatus = function () {

        var sessStart = currentSession();
        var sessEnd = currentSession() == 1 ? currentSession() + 100 : currentSession();

        $.each(self.GameQueue(), function (ii, gg) {

            if (gg.Session >= sessStart && gg.Session <= sessEnd) {
                gg.Playing(true);
            }
        });
    };

    var setDoneStatus = function () {

        var sessStart = currentSession();
        var sessEnd = currentSession() == 1 ? currentSession() + 100 : currentSession();
        $.each(self.GameQueue(), function (ii, gg) {

            if (gg.Session >= sessStart && gg.Session <= sessEnd) {
                gg.Done(true);
                gg.Playing(false);
            }
        });
    };

    var setDoneAllStatus = function () {
        $.each(self.GameQueue(), function (ii, gg) {
            gg.Done(true);
        });
    };

    self.StartGame.subscribe(function (val) {

        if (self.StartNewGame() && self.SessionDone()) {

            var newGame;
            if (self.GameQueue().length > 0) {
                $.each(self.GameQueue(), function (game_index, game_data) {
                    if (!game_data.Done() && (game_index % 100) == 0) {

                        var gameCounter = 0;

                        self.SessionDone(false);
                        self.StartNewGame(false);

                        currentSession(game_data.Session + "-" + (game_data.Session + 99));

                        var results = game_data.Data;
                        var outputLen = results.length;

                        var start = function () {

                            setTimeout(function () {


                                var thrust = results[gameCounter] == 1 ? true : false;
                                sim.thrust(thrust);

                                runGame(gameVM);

                                gameCounter++;

                                if (gameCounter < outputLen) {

                                    $.each(self.GameQueue(), function (ii, vv) {
                                        if (vv.Type() == 'tensorFlow') {
                                            if (vv.Session <= game_data.Session + 99) {
                                                vv.Playing(true);
                                            }
                                        }
                                    });

                                    start();
                                }
                                else if (gameCounter == outputLen) {

                                    $.each(self.GameQueue(), function (ii, vv) {
                                        if (vv.Type() == 'tensorFlow') {
                                            if (vv.Session <= game_data.Session + 99) {
                                                vv.Playing(false);
                                                vv.Done(true);
                                            }
                                        }
                                    });

                                    self.SessionDone(true);
                                    self.StartNewGame(true);

                                    resetGame(gameVM);

                                    self.StartGame(self.StartGame() ? false : true);

                                    if (game_data.Session + 99 >= totalSessions) {
                                        donePlaying(true);
                                        $.each(self.GameQueue(), function (ii, vv) {
                                            if (vv.Type() == 'tensorFlow') {
                                                vv.Playing(false);
                                                vv.Done(true);
                                            }
                                        });
                                    }
                                }

                            }, sim.speed());
                        };

                        start();

                        return false;
                    }
                });

            } else {
                self.SessionDone(true);
                self.StartNewGame(true);
                self.StartGame(self.StartGame() ? false : true);
            }
        }
    });



    //var self = this;

    var client;
    var dataReceive;
    var dataSend;
    var dataCount = 0;

    //self.GameQueue = ko.observableArray();
    //self.Playing = ko.observable(false);

    //self.Thrust = ko.observable(false);
    //self.Reset = ko.observable(false);

    self.Init = function () {

        client = new Paho.MQTT.Client("invirmq.southeastasia.cloudapp.azure.com", 15675, "/ws", settings.UserToken);

        // set callback handlers
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;

        client.connect({ onSuccess: onConnect });

    };

    self.StartSession = function () {

        $("#tensorFlowWaitingDiv").show();
        $("#mainWaitingDiv").show();

        //todo: pass the initial altitude and fuel
        var data = {}

        var msg = ko.toJSON({
            Sessions: settings.Sessions,
            Fuel: settings.Fuel,
            Altitude: settings.Altitude,
            random_action_prob: settings.RandomActionProb,
            RANDOM_ACTION_DECAY: settings.RandomActionDecay,
            HIDDEN1_SIZE: settings.Hidden1Size,
            HIDDEN2_SIZE: settings.Hidden2Size,
            LEARNING_RATE: settings.LearningRate,
            MINIBATCH_SIZE: settings.MiniBatchSize,
            DISCOUNT_FACTOR: settings.DiscountFactor,
            TARGET_UPDATE_FREQ: settings.TargetUpdateFreq,
            USER_TOKEN: settings.UserToken
        });

        start = new Paho.MQTT.Message(msg);
        start.destinationName = "tensorflow.train";

        client.send(start);

    };

    self.BestSolutions = [];
    self.PlaySolution = function () {

        //var solution = new Paho.MQTT.Message("Play solution");
        //solution.destinationName = "tensorflow.lander_solution";

        //client.send(solution);

        var results = self.BestSolutions;
        var outputLen = results.length;
        var gameCounter = 0;
        var start_playing = function () {

            setTimeout(function () {


                var thrust = results[gameCounter] == 1 ? true : false;
                sim.thrust(thrust);

                runGame(gameVM);

                gameCounter++;

                if (gameCounter < outputLen) {
                    start_playing();
                }
                else if (gameCounter == outputLen) {
                    resetGame(gameVM);
                }

            }, sim.speed());
        };

        start_playing();

    };
    //var sessionID = 0;
    var onMessageArrived = function (message) {

        var output = eval("(" + message.payloadString + ")");

        if (message.destinationName === "tensorflow/play_lander/" + settings.UserToken) {
            var results = output.data;
            var outputLen = results.length;
            //gameCounter = 0;
            //var start_playing = function () {

            //    setTimeout(function () {


            //        var thrust = results[gameCounter] == 1 ? true : false;
            //        sim.thrust(thrust);

            //        runGame(gameVM);

            //        gameCounter++;

            //        if (gameCounter < outputLen) {
            //            start_playing();
            //        }
            //        else if (gameCounter == outputLen) {



            //            //sim.sessionScores.push({
            //            //        Id: game_data.Session, Score: game_data.Score
            //            //});

            //            //console.log("session = "+game_data.Session + " fuel =" +sim.fuel() + ", altitude = " +sim.altitude() + ", velocity = " +sim.velocity());

            //            resetGame(gameVM);
            //        }

            //    }, sim.speed());
            //};
            //start_playing();

            self.BestSolutions = results;
        }
        else if (message.destinationName == "tensorflow/actions/" + settings.UserToken) {

            sessionCounter++;

            var gameObj = {
                Session: output.session,
                Done: ko.observable(false),
                Playing: ko.observable(false),
                Data: output.data,
                Score: output.score,
                Type: ko.observable('tensorFlow')
            };

            gameObj.Icon = ko.computed(function () {
                if (gameObj.Done()) {
                    return '<i class="fa fa-check-square-o" aria-hidden="true"></i>';
                } else if (!gameObj.Done() && gameObj.Playing()) {
                    return '<i class="fa fa-rocket" aria-hidden="true"></i>';
                } else if (!gameObj.Done() && !gameObj.Playing()) {
                    return '<i class="fa fa-hourglass-half" aria-hidden="true"></i>';
                }
            });
            sim.sessionScores.push({
                Id: output.session, Score: output.score
            });
            self.GameQueue.push(gameObj);

            sim.gameQueue(self.GameQueue());

            self.StartGame(self.StartGame() ? false : true);

            if (sessionCounter < totalSessions) {
                var counter = sessionCounter + 1;
                sessionWaitText("Waiting results for session # " + counter + "");
                sessionWaitTextTF("Waiting results for session # " + counter + "");
            } else {
                sessionWaitText("");
                sessionWaitTextTF("");
                $("#tensorFlowWaitingDiv").hide();
                $("#mainWaitingDiv").hide();

                tensorFlowShowChart(true);
            }
        }
        //var dataReceive = eval("(" + message.payloadString + ")");

        //dataCount++;
        //self.GameQueue.push(dataReceive);


        //sim.sessionScores.push({
        //    Id: dataReceive.session, Score: dataReceive.score
        //});

        //if (self.GameQueue().length == 1)
        //    render(0);

        //if((dataCount % 100) == 0)
        //{
        //    render(dataCount);
        //}
        //var thrust = dataReceive.Value;
        //var reset = dataReceive.Reset;

        //if (reset) {
        //    if (sessionID == 0) {
        //        resetGame();
        //    } else {
        //        sim.sessionScores.push({
        //            Id: sessionID, Score: sim.score()
        //        });
        //        resetGame();
        //    }

        //    sessionID++;
        //}
        //else {
        //    self.Thrust(thrust == 1);
        //    self.Reset(reset);

        //    sim.thrust(self.Thrust());

        //    publishData(thrust);

        //    runGame();
        //}

    };

    //var render = function (dataCount) {

    //    var actions = self.GameQueue()[dataCount].data;
    //    console.log(actions);
    //    for (i = 0; i < actions.length; i++) {

    //        setTimeout(function () {
    //            self.Thrust(actions[i] == 1);
    //            sim.thrust(self.Thrust());
    //            runGame();
    //        }, sim.speed());
    //    }

    //    resetGame();   
    //};

    //var publishData = function (thrust) {

    //    var score = scoreTurn(thrust);
    //    var done = sim.flying() ? 0 : 1;

    //    var inputs = [sim.fuel(), sim.altitude(), sim.velocity()];
    //    var objData = ko.toJSON({ "obs": inputs, "reward": score, "done": done });

    //    console.log(objData);

    //    simData = new Paho.MQTT.Message(objData);
    //    simData.destinationName = "telemetry";

    //    client.send(simData);

    //};

    var onConnect = function () {
        client.subscribe("tensorflow.actions." + settings.UserToken);
        client.subscribe("tensorflow.play_lander." + settings.UserToken);
        self.StartSession();
    };

    var onConnectionLost = function (responseObject) {
        if (responseObject.errorCode !== 0) {
            donePlaying(true);
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
    };

    //var scoreTurn = function (thrust) {

    //    var retVal = -1;
    //    var VELOCITY = sim.velocity();
    //    var fuel = sim.fuel();
    //    var altitude = sim.altitude();

    //    if (altitude <= 1000) {
    //        if (fuel > 0 && VELOCITY >= -10 && !thrust) {
    //            retVal = 1;
    //        } else if (fuel > 0 && VELOCITY < -12 && thrust) {
    //            retVal = 1
    //        }
    //    } else if (altitude > 1000 && !thrust) {
    //        retVal = 1;
    //    }

    //    return retVal;
    //};
}

