function TensorFlowClient(sim, runGame, gameVM, resetGame, currentSession, sessionWaitText, settings, enableStartButton, donePlaying, sessionWaitTextTF, waitTimeElapseTF, tensorFlowShowChart, updateGameStatus) {

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

    var disableSettingsControls = function (disabled) {

        $('#sessionInput').prop('disabled', disabled);
        $('#sessionRandomnessInput').prop('disabled', disabled);

        $('#RandomnessInput').prop('disabled', disabled);
        $('#RandomnessInput2').prop('disabled', disabled);
        $('#add-settings-btn').prop('disabled', disabled);

        //$('#speed-option-dropdown').prop('disabled', disabled);

        if (disabled) {
            $('#play-lander-btn').hide();
            $('#sessionRandomnessSlider').slider('disable');
            $('#RandomnessSlider').slider('disable');
            $('#sessionSlider').slider('disable');

            tensorFlowShowChart(false);

        } else {

            $('#play-lander-btn').show();
            $('#sessionRandomnessSlider').slider('enable');
            $('#RandomnessSlider').slider('enable');
            $('#sessionSlider').slider('enable');

            tensorFlowShowChart(true);
        }

    };

    var CURR_SESSION_COUNTER = 0;

    self.StartGame.subscribe(function (val) {

        if (self.StartNewGame() && self.SessionDone()) {

            var newGame;
            if (self.GameQueue().length > 0) {
                $.each(self.GameQueue(), function (game_index, game_data) {
                    //if (!game_data.Done() && (game_index % 100) == 0) {

                    var allowPlay = !game_data.Done() && game_data.Data;

                    if (allowPlay) {

                        CURRENTLY_PLAYING = true;

                        if (IS_HEAD_TO_HEAD) {
                            if (TENSORFLOW_CURRENT_GAME_DONE) {
                                TENSORFLOW_CURRENT_GAME_DONE(false);
                            }
                        }

                        gameVM.gameStatus("Playing session " + game_data.Session);

                        STARTED = true;
                        zzz = 0;
                        clearInterval(elapseInterval);

                        gameVM.timeElapse("");
                        updateGameStatus(gameVM);

                        game_data.Playing(true);

                        CURR_SESSION_COUNTER ++;
                        var gameCounter = 0;

                        self.SessionDone(false);
                        self.StartNewGame(false);

                        currentSession(game_data.Session);

                        var results = game_data.Data;
                        var outputLen = results.length;

                        sim.gameQueue.push(game_data);

                        var start = function () {

                            setTimeout(function () {


                                var thrust = results[gameCounter] == 1 ? true : false;
                                sim.thrust(thrust);

                                runGame(gameVM);

                                gameCounter++;

                                if (sim.fuel() == 0 && sim.altitude() == 0) {
                                    gameCounter = outputLen;
                                    console.log("Jumping ahead... crushed na!");
                                }

                                if (gameCounter < outputLen) {

                                    //$.each(self.GameQueue(), function (ii, vv) {
                                    //    if (vv.Type() == 'tensorflow') {
                                    //        if (vv.Session <= game_data.Session + 99) {
                                    //            vv.Playing(true);
                                    //        }
                                    //    }
                                    //});

                                    start();
                                }
                                else {

                                    CURRENTLY_PLAYING = false;

                                    game_data.Playing(false);
                                    game_data.Done(true);

                                    sim.sessionScores.push({
                                        Id: game_data.Session, Score: game_data.Score
                                    });

                                    if (IS_HEAD_TO_HEAD) {
                                        TENSORFLOW_CURRENT_GAME_DONE(true);
                                    }

                                    //$.each(self.GameQueue(), function (ii, vv) {
                                    //    if (vv.Type() == 'tensorflow') {
                                    //        if (vv.Session <= game_data.Session + 99) {
                                    //            vv.Playing(false);
                                    //            vv.Done(true);
                                    //        }
                                    //    }
                                    //});

                                    //if (game_data.Session + 99 >= totalSessions) {
                                    if (game_data.Session == totalSessions) {

                                        DONE_PLAYING(true);

                                        if (USEAIBLE_DONE_PLAYING) {
                                            if (USEAIBLE_DONE_PLAYING()) {
                                                $(".view-chart").show();
                                                disableSettingsControls(false);
                                            }
                                        } else {
                                            //donePlaying(true);
                                            $(".view-chart").show();
                                            disableSettingsControls(false);
                                        }

                                        //$.each(self.GameQueue(), function (ii, vv) {
                                        //    if (vv.Type() == 'tensorflow') {
                                        //        vv.Playing(false);
                                        //        vv.Done(true);
                                        //    }
                                        //});

                                        gameVM.gameStatus("Done");
                                        //gameVM.nextSession("Done");
                                        gameVM.timeElapse("");

                                        updateGameStatus(gameVM);
                                    } else {

                                        var hasUnfinished = false;
                                        $.each(self.GameQueue(), function (ii, vv) {
                                            if (vv.Type() == 'tensorflow') {
                                                if (!vv.Done()) {
                                                    hasUnfinished = true;
                                                    return false;
                                                }
                                            }
                                        });

                                        if (hasUnfinished) {
                                            //gameVM.gameStatus("Ready session "+ eval(game_data.Session + 1));
                                            gameVM.gameStatus("Loading data...");
                                            //gameVM.nextSession("Done");
                                            gameVM.timeElapse("");

                                            updateGameStatus(gameVM);

                                            STARTED = true;
                                            zzz = 0;
                                            clearInterval(elapseInterval);

                                        } else {

                                            gameVM.gameStatus("Loading data...");
                                            //updateGameStatus(gameVM);

                                            STARTED = false;
                                            zzz = 0;
                                            clearInterval(elapseInterval);
                                            elapseInterval = setInterval(updateTimeElapse, 1000);

                                            if (IS_HEAD_TO_HEAD) {
                                                TENSORFLOW_CURRENT_GAME_DONE(false);
                                            }

                                        }
                                    }

                                    self.SessionDone(true);
                                    self.StartNewGame(true);

                                    resetGame(gameVM);

                                    if (!IS_HEAD_TO_HEAD) {
                                        self.StartGame(self.StartGame() ? false : true);
                                    }
                                }

                            }, sim.speed());
                        };

                        start();

                        return false;
                    }
                });

            }
            //else {
            //    self.SessionDone(true);
            //    self.StartNewGame(true);
            //    self.StartGame(self.StartGame() ? false : true);
            //}
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

    var USEAIBLE_DONE_PLAYING;
    var DONE_PLAYING;

    var USEAIBLE_CURRENT_GAME_DONE;
    var TENSORFLOW_CURRENT_GAME_DONE;

    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;

    self.Init = function (useAIbleDonePlaying, donePlaying, useAIbleCurrentGameDonePlaying, tensorflowCurrentGameDonePlaying, newGameTrigger, useAIbleStarted, tensorflowStarted) {

        USEAIBLE_DONE_PLAYING = useAIbleDonePlaying;
        DONE_PLAYING = donePlaying;

        USEAIBLE_CURRENT_GAME_DONE = useAIbleCurrentGameDonePlaying;
        TENSORFLOW_CURRENT_GAME_DONE = tensorflowCurrentGameDonePlaying;

        if (TENSORFLOW_CURRENT_GAME_DONE) {
            TENSORFLOW_CURRENT_GAME_DONE(false);
        }

        IS_HEAD_TO_HEAD = USEAIBLE_CURRENT_GAME_DONE ? true : false;

        client = new Paho.MQTT.Client("invirmq.southeastasia.cloudapp.azure.com", 15675, "/ws", settings.UserToken);

        // set callback handlers
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;

        client.connect({ onSuccess: onConnect });

    };

    self.StartSession = function () {

        //sim.gameQueue([]);
        //self.GameQueue([]);

        $(".view-chart").hide();

        $("#tensorFlowWaitingDiv").show();
        $("#mainWaitingDiv").show();

        gameVM.currentPlayer("Tensor Flow");
        gameVM.gameStatus("Loading data...");
        //gameVM.nextSession("Number Of Sessons: Waiting...");

        updateGameStatus(gameVM);

        STARTED = false;
        zzz = 0;
        elapseInterval = setInterval(updateTimeElapse, 1000);

        disableSettingsControls(true);

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

            if (IS_HEAD_TO_HEAD) {
                if (sessionCounter == 1) {
                    TENSORFLOW_CURRENT_GAME_DONE(true);
                } else {
                    if (!CURRENTLY_PLAYING) {
                        TENSORFLOW_CURRENT_GAME_DONE(true);
                    }
                }
            }

            var gameObj = {
                Session: output.session,
                Done: ko.observable(false),
                Playing: ko.observable(false),
                Data: output.data,
                Score: output.score,
                Type: ko.observable('tensorflow')
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
            //sim.sessionScores.push({
            //    Id: output.session, Score: output.score
            //});
            self.GameQueue.push(gameObj);

            //sim.gameQueue(self.GameQueue());

            var counter = sessionCounter < totalSessions? sessionCounter + 1 : sessionCounter;
            sessionWaitText("Waiting results for session # " + counter + "");
            sessionWaitTextTF("Waiting results for session # " + counter + "");

            //if ((sessionCounter % 100) == 0) {
            if (sessionCounter < totalSessions) {

                //gameVM.nextSession("Number Of Sessions: " + eval(sessionCounter + 1));

                updateGameStatus(gameVM);

                if (!IS_HEAD_TO_HEAD) {
                    self.StartGame(self.StartGame() ? false : true);
                }

            }
            //else if (sessionCounter == totalSessions) {
            //    sessionWaitText("");
            //    sessionWaitTextTF("");
            //    $("#tensorFlowWaitingDiv").hide();
            //    $("#mainWaitingDiv").hide();

            //    tensorFlowShowChart(true);
            //    $(".view-chart").show();

            //    $.each(self.GameQueue(), function (ii, vv) {
            //        if (vv.Type() == 'tensorflow') {
            //            vv.Playing(false);
            //            vv.Done(true);
            //        }
            //    });

            //    gameVM.gameStatus("Done");
            //    //gameVM.nextSession("Done");
            //    gameVM.timeElapse("");

            //    updateGameStatus(gameVM);
            //}
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
            //donePlaying(true);
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }

        if (!DONE_PLAYING() == true) {

            gameVM.gameStatus("Loading data...");

            STARTED = false;
            zzz = 0;
            clearInterval(elapseInterval);
            elapseInterval = setInterval(updateTimeElapse, 1000);
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

    var STARTED = false;
    var elapseInterval;
    var zzz = 0;
    var updateTimeElapse = function () {

        zzz++;

        gameVM.timeElapse(toTime(zzz));
        updateGameStatus(gameVM);

        if (STARTED) {
            elapseInterval = 0;
            clearInterval(elapseInterval);
        }

    };

    var toTime = function (t) {
        var sec_num = t;//parseInt(this, t); // don't forget the second param
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) { hours = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        return hours + ':' + minutes + ':' + seconds;
    };
}

