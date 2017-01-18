function EncogLunarLander(sim, runGame, gameVM, resetGame, currentSession, encogSettings, enableStartButton, sessionWaitText, waitTimeElapse, donePlaying, sessionWaitTextEncog, waitTimeElapseEncog, played, encogShowChart, showComparisonChart, sessionData, updateGameStatus) {

    var self = this;
    var drnnRepo = new DRNNRepository();
    var sessions = {};
    var doneSessions = {};
    var sessionCounter = 0;
    var gameDone = true;
    var USER_TOKEN;

    var ee = 0;

    var totalSessions = encogSettings.Sessions;

    self.GameQueue = ko.observableArray([]);

    self.SessionDone = ko.observable(true);
    self.StartGame = ko.observable(false);
    self.StartNewGame = ko.observable(true);

    self.HasNewGame = function () {

        var retVal = false;
        if (self.GameQueue()) {
            $.each(self.GameQueue(), function (game_index, game_data) {
                if (!game_data.Done()) {
                    hasNewGame = true;
                    return false;
                }
            });
        }

        return retVal;
    };

    self.ReplayGame = function () {

        var gamequeue = self.GameQueue().sort(function (a, b) {

            if (a.Score > b.Score) {
                return -1;
            } else if (a.Score < b.Score) {
                return 1;
            } else {
                return 0;
            }

        });


        var gameCounter = 0;
        var game_data = gamequeue[0];
        var results = game_data.Data;
        var outputLen = results.length;

        var start = function () {

            setTimeout(function () {


                var thrust = results[gameCounter];
                sim.thrust(thrust);

                runGame(gameVM);

                gameCounter++;

                if (gameCounter < outputLen) {
                    start();
                }
                else if (gameCounter == outputLen) {
                    enableStartButton(true);
                    resetGame(gameVM);
                }

            }, sim.speed());
        };

        start();

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

            encogShowChart(false);

        } else {

            $('#play-lander-btn').show();
            $('#sessionRandomnessSlider').slider('enable');
            $('#RandomnessSlider').slider('enable');
            $('#sessionSlider').slider('enable');

            encogShowChart(true);
        }

    };

    var SESSION_COUNTER = 0;
    var CURR_SESSION_COUNTER = 0;


    self.StartGame.subscribe(function (val) {

        if (self.StartNewGame() && self.SessionDone()) {

            var newGame;
            if (self.GameQueue().length > 0) {
                $.each(self.GameQueue(), function (game_index, game_data) {

                    var allowPlay = !game_data.Done() && game_data.Data;

                    //var isHeadToHead = USEAIBLE_CURRENT_GAME_DONE ? true : false;

                    //if (isHeadToHead) {
                    //    allowPlay = !game_data.Done() && USEAIBLE_CURRENT_GAME_DONE();
                    //}

                    if (allowPlay) {

                        CURRENTLY_PLAYING = true;

                        if (IS_HEAD_TO_HEAD) {
                            ENCOG_CURRENT_GAME_DONE(false);
                        }

                        STARTED = true;
                        zzz = 0;
                        clearInterval(elapseInterval);

                        gameVM.gameStatus("Playing session " + game_data.Session);
                        gameVM.timeElapse("");
                        updateGameStatus(gameVM);

                        var gameCounter = 0;

                        self.SessionDone(false);
                        self.StartNewGame(false);

                        game_data.Playing(true);

                        donePlaying(false);
                        disableSettingsControls(true);

                        currentSession(game_data.Session);

                        var results = game_data.Data;
                        var outputLen = results.length;

                        CURR_SESSION_COUNTER++;

                        sim.gameQueue.push(game_data);

                        var start = function () {

                            setTimeout(function () {


                                var thrust = results[gameCounter];
                                sim.thrust(thrust);

                                runGame(gameVM);

                                gameCounter++;

                                if (sim.fuel() == 0 && sim.altitude() == 0) {
                                    gameCounter = outputLen;
                                    console.log("Jumping ahead... crushed na!");
                                }

                                if (gameCounter < outputLen) {
                                    disableSettingsControls(true);
                                    start();
                                }
                                else if (gameCounter == outputLen) {

                                    if (IS_HEAD_TO_HEAD) {
                                        ENCOG_CURRENT_GAME_DONE(true);
                                    }

                                    CURRENTLY_PLAYING = false;

                                    self.SessionDone(true);
                                    self.StartNewGame(true);
                                    game_data.Done(true);
                                    game_data.Playing(false);

                                    //if (isHeadToHead) {
                                    //    ENCOG_CURRENT_GAME_DONE(true);
                                    //}

                                    //sim.sessionScores.push({
                                    //    Id: game_data.Session, Score: game_data.Score
                                    //});

                                    //console.log("session = " + game_data.Session + " fuel =" + sim.fuel() + ", altitude = " + sim.altitude() + ", velocity = " + sim.velocity());

                                    resetGame(gameVM);

                                    if (CURR_SESSION_COUNTER == SESSION_COUNTER) {

                                        donePlaying(true);

                                        if (USEAIBLE_DONE_PLAYING != undefined) {
                                            if (USEAIBLE_DONE_PLAYING()) {
                                                //$(".outer-chart-container").show();
                                                //showComparisonChart(sessionData());
                                                disableSettingsControls(false);
                                                $(".view-chart").show();
                                            }
                                        } else {
                                            //$(".outer-chart-container").show();
                                            //showComparisonChart(sessionData());
                                            disableSettingsControls(false);
                                            $(".view-chart").show();
                                        }

                                        gameVM.gameStatus("Done");
                                        gameVM.nextSession("");
                                        gameVM.timeElapse("");

                                        updateGameStatus(gameVM);

                                        if (client3) {
                                            if (client3.isConnected()) {
                                                client3.disconnect();
                                            }
                                        }

                                    } else {

                                        var hasUnfinished = false;
                                        $.each(self.GameQueue(), function (iii, vvv) {
                                            if (vvv.Type() == 'encog') {
                                                if (!vvv.Done()) {
                                                    hasUnfinished = true;
                                                    return false;
                                                }
                                            }
                                        });

                                        if (hasUnfinished) {

                                            //gameVM.gameStatus("Ready session " + eval(game_data.Session + 1));
                                            gameVM.gameStatus("Loading data...");
                                            gameVM.timeElapse("");

                                            updateGameStatus(gameVM);

                                        } else {

                                            gameVM.gameStatus("Loading data...");

                                            STARTED = false;
                                            zzz = 0;
                                            clearInterval(elapseInterval);
                                            elapseInterval = setInterval(updateTimeElapse, 1000);

                                            if (IS_HEAD_TO_HEAD) {
                                                ENCOG_CURRENT_GAME_DONE(false);
                                            }
                                        }
                                    }

                                    if (!IS_HEAD_TO_HEAD) {
                                        self.StartGame(self.StartGame() ? false : true);
                                    }
                                }

                            }, sim.speed());
                        };

                        start();

                        return false;
                    }
                    //else {
                    //    if (!IS_HEAD_TO_HEAD) {
                    //        self.StartGame(self.StartGame() ? false : true);
                    //    }
                    //}
                });

            }
            //else {
            //    self.SessionDone(true);
            //    self.StartNewGame(true);
            //    self.StartGame(self.StartGame() ? false : true);
            //}
        }
    });

    self.GetToken = function () {

        var def = $.Deferred();

        drnnRepo.GetToken().done(function (token_res) {

            var token = token_res.Token;
            def.resolve(token);
        });

        return def;
    };

    var connect = function (userToken) {

        client3.connect({
            keepAliveInterval: 10000,
            timeout: 10000,
            onFailure: function (fl) {
                console.log(fl.errorMessage);
            },
            onSuccess: function () {

                client3.subscribe(userToken + "/encog/lander/simulation_output");
                console.log("subscribed to " + userToken + "/encog/lander/simulation_output");

                if (!donePlaying() == true) {
                    gameVM.gameStatus("Loading data...");
                    updateGameStatus(gameVM);
                }
            }
        });
    };

    var USEAIBLE_DONE_PLAYING;

    var USEAIBLE_CURRENT_GAME_DONE;
    var ENCOG_CURRENT_GAME_DONE;

    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;

    self.Play = function (token, useAIbleDonePlaying, useAIbleCurrentGameDonePlaying, encogCurrentGameDonePlaying) {

        try {

            //sim.gameQueue([]);
            //self.GameQueue([]);

            $(".view-chart").hide();
            disableSettingsControls(true);

            USER_TOKEN = token;
            enableStartButton(false);

            sessionCounter = 0;

            ee = 0;

            SESSION_COUNTER = 0;
            CURR_SESSION_COUNTER = 0;
            USEAIBLE_DONE_PLAYING = useAIbleDonePlaying;

            USEAIBLE_CURRENT_GAME_DONE = useAIbleCurrentGameDonePlaying;
            ENCOG_CURRENT_GAME_DONE = encogCurrentGameDonePlaying;

            if (ENCOG_CURRENT_GAME_DONE) {
                ENCOG_CURRENT_GAME_DONE(false);
            }

            IS_HEAD_TO_HEAD = USEAIBLE_CURRENT_GAME_DONE ? true : false;

            //client = new Paho.MQTT.Client("dev.useaible.com", 61614, drnnRepo.GenerateGUID());
            client3 = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, drnnRepo.GenerateGUID());

            client3.onConnectionLost = function (res) {

                console.log(res.errorMessage);

                //donePlaying(true);
                //disableSettingsControls(false);

                if (!donePlaying() == true) {
                    gameVM.gameStatus("Loading data...");
                    updateGameStatus(gameVM);

                    STARTED = false;
                    zzz = 0;
                    clearInterval(elapseInterval);
                    elapseInterval = setInterval(updateTimeElapse, 1000);
                }

                //connect(token);
            }

            client3.onMessageArrived = function (msg) {

                sessionCounter++;

                SESSION_COUNTER++;

                if (IS_HEAD_TO_HEAD) {
                    if (sessionCounter == 1) {
                        ENCOG_CURRENT_GAME_DONE(true);
                    } else {
                        if (!CURRENTLY_PLAYING) {
                            ENCOG_CURRENT_GAME_DONE(true);
                        }
                    }
                }

                var output = eval("(" + msg.payloadString + ")");

                var gameObj = {
                    Session: SESSION_COUNTER,
                    Done: ko.observable(false),
                    Playing: ko.observable(false),
                    Data: output.Thrusts,
                    Score: output.Score,
                    Type: ko.observable('encog')
                };

                gameObj.Icon = ko.computed(function () {
                    if (gameObj.Done()) {
                        return '<i class="fa fa-check-square-o" aria-hidden="true" title="Done Playing"></i>';
                    } else if (!gameObj.Done() && gameObj.Playing()) {
                        return '<i class="fa fa-rocket" aria-hidden="true" title="Currently Playing"></i>';
                    } else if (!gameObj.Done() && !gameObj.Playing()) {
                        return '<i class="fa fa-hourglass-half" aria-hidden="true" title="Pending"></i>';
                    }
                });

                //sim.sessionScores.push({
                //    Id: SESSION_COUNTER,
                //    Score: output.Score
                //});

                self.GameQueue.push(gameObj);

                //sim.gameQueue(self.GameQueue());

                //gameVM.nextSession("Number Of Sessions: " + eval(SESSION_COUNTER));

                updateGameStatus(gameVM);

                if (!IS_HEAD_TO_HEAD) {
                    self.StartGame(self.StartGame() ? false : true);
                }

                $("#encogWaitingDiv").show();
                $("#mainWaitingDiv").show();

                var counter = SESSION_COUNTER;
                sessionWaitText(counter);
                sessionWaitTextEncog(counter);

                sessionWaitText("");
                sessionWaitTextEncog("");
                $("#encogWaitingDiv").hide();
                $("#mainWaitingDiv").hide();

                if (CURR_SESSION_COUNTER < SESSION_COUNTER) {
                    //var counter = SESSION_COUNTER + 1;
                    //sessionWaitText("Waiting results for session # " + counter + "");
                    //sessionWaitTextEncog("Waiting results for session # " + counter + "");
                } else {
                    //sessionWaitText("");
                    //sessionWaitTextEncog("");
                    //$("#encogWaitingDiv").hide();
                    //$("#mainWaitingDiv").hide();
                }

                //if (CURR_SESSION_COUNTER < SESSION_COUNTER) {
                //    var counter = SESSION_COUNTER + 1;
                //    sessionWaitText("Waiting results for session # " + counter + "");
                //    sessionWaitTextEncog("Waiting results for session # " + counter + "");
                //} else {
                //    sessionWaitText("");
                //    sessionWaitTextEncog("");
                //    $("#encogWaitingDiv").hide();
                //    $("#mainWaitingDiv").hide();
                //}

                //if (sessionCounter < totalSessions) {
                //    var counter = sessionCounter + 1;

                //    sessionWaitText(" " + counter + "     ");
                //    sessionWaitTextUseAible(" " + counter + "     ");

                //    ee = 0;
                //    clearInterval(runTimeElapse);
                //    //runTimeElapse();

                //} else {

                //    sessionWaitText("");
                //    sessionWaitTextUseAible("");

                //    //$("#useAibleWaitingDiv").hide();
                //    //$("#mainWaitingDiv").hide();

                //    $("#sessionRandomnessSlider").slider("option", "min", 0);
                //    $("#sessionRandomnessSlider").slider("option", "max", totalSessions);
                //    $("#sessionRandomnessSlider").slider("value", totalSessions / 2);

                //    played(true);

                //    useAIbleShowChart(true);
                //}
            }

            client3.connect({
                //userName: "povwqgew",
                //password: "QVGLIyH-sTIw",
                keepAliveInterval: 600, // 10mins (60s*10)
                onSuccess: function () {

                    client3.subscribe(token + "/outputFromServer");
                    client3.subscribe(token + "/encog/lander/simulation_output");

                    console.log("subscribed to "+ token + "/encog/lander/simulation_output");

                    //drnnRepo.Play(token, "Lunar Lander MQTT Version", learn, totalSessions, startRandomness, endRandomness, maxBracket, minBracket, numSessionRandomness).done(function () {
                    //    console.log("useAIble done playing...");
                    //});

                    drnnRepo.PlayLanderEncog(token, "Lunar Lander Encog Version", true, totalSessions, encogSettings, sim.fuel(), sim.altitude()).done(function () {
                        console.log("useAIble playing...");
                    });

                    $("#encogWaitingDiv").show();
                    $("#mainWaitingDiv").show();

                    sessionCounter = 0;
                    var counter = SESSION_COUNTER + 1;
                    sessionWaitText(" " + counter + "     ");
                    sessionWaitTextEncog(" " + counter + "     ");

                    //ee = 0;
                    //clearInterval(runTimeElapse);

                    //if (!played()) {
                    //    runTimeElapse(1000);
                    //}

                    gameVM.currentPlayer("Encog");
                    gameVM.gameStatus("Loading data...");
                    //gameVM.nextSession("Number Of Sessions: Waiting...");

                    updateGameStatus(gameVM);


                    STARTED = false;
                    zzz = 0;
                    elapseInterval = setInterval(updateTimeElapse, 1000);
                }
            });
        } catch (exception) {
            console.log(exception);
        }

        //});
    };

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



