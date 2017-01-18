function MQSimulator(sim, runGame, gameVM, resetGame, currentSession,
    networkSettings, enableStartButton,
    sessionWaitText, waitTimeElapse, donePlaying, sessionWaitTextUseAible,
    waitTimeElapseUseAible, played, useAIbleShowChart, showComparisonChart,
    sessionData, updateGameStatus, useAIbleCurrentGameDonePlaying) {

    var self = this;
    var drnnRepo = new DRNNRepository();
    var sessions = {};
    var doneSessions = {};
    var sessionCounter = 0;
    var gameDone = true;
    var USER_TOKEN;

    var ee = 0;

    //var totalSessions = networkSettings().Temp_Num_Sessions;
    //var startRandomness = networkSettings().StartRandomness;
    //var endRandomness = networkSettings().EndRandomness;
    //var maxBracket = networkSettings().MaxLinearBracket;
    //var minBracket = networkSettings().MinLinearBracket;
    //var learn = networkSettings().Learn;
    //var numSessionRandomness = networkSettings().NumSessionRandomness;

    var totalSessions = networkSettings().NumberOfSessions;
    var rnnNetworkSettings = networkSettings().Settings;

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

        $('#maze-dimension-options').prop('disabled', disabled);
        $('#maze-randomize-btn').prop('disabled', disabled);
        $('#maze-player-options').prop('disabled', disabled);


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

            useAIbleShowChart(false);

        } else {

            $('#play-lander-btn').show();
            $('#sessionRandomnessSlider').slider('enable');
            $('#RandomnessSlider').slider('enable');
            $('#sessionSlider').slider('enable');

            useAIbleShowChart(true);
        }

    };

    var CURRENT_SESSION;

    self.StartGame.subscribe(function (val) {

        if (self.StartNewGame() && self.SessionDone()) {

            var newGame;
            if (self.GameQueue().length > 0) {
                $.each(self.GameQueue(), function (game_index, game_data) {

                    var allowPlay = !game_data.Done() && game_data.Data;

                    if (allowPlay) {

                        useAIbleCurrentGameDonePlaying(false);
                        CURRENTLY_PLAYING = true;

                        //STARTED = true;
                        //zzz = 0;
                        //clearInterval(elapseInterval);

                        //gameVM.gameStatus("Playing session " + game_data.Session);
                        //gameVM.timeElapse("");
                        //updateGameStatus(gameVM);

                        donePlaying(false);
                        disableSettingsControls(true);

                        var gameCounter = 0;

                        self.SessionDone(false);
                        self.StartNewGame(false);

                        game_data.Playing(true);

                        CURRENT_SESSION = game_data.Session;

                        currentSession(game_data.Session);
                        //$("#nextSessionLabel").text("Playing session # " + game_data.Session + "...");

                        var results = game_data.Data;
                        var outputLen = results.length;

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

                                    STARTED = true;
                                    zzz = 0;
                                    clearInterval(elapseInterval);

                                    gameVM.gameStatus("Playing session " + game_data.Session);
                                    gameVM.timeElapse("");
                                    updateGameStatus(gameVM);

                                    disableSettingsControls(true);
                                    start();
                                }
                                else if (gameCounter == outputLen) {

                                    if (IS_HEAD_TO_HEAD) {
                                        useAIbleCurrentGameDonePlaying(true);
                                    }

                                    CURRENTLY_PLAYING = false;

                                    self.SessionDone(true);
                                    self.StartNewGame(true);
                                    game_data.Done(true);
                                    game_data.Playing(false);

                                    sim.sessionScores.push({
                                        Id: game_data.Session, Score: game_data.Score
                                    });

                                    //console.log("session = " + game_data.Session + " fuel =" + sim.fuel() + ", altitude = " + sim.altitude() + ", velocity = " + sim.velocity());

                                    resetGame(gameVM);

                                    if (game_data.Session == totalSessions) {

                                        STARTED = true;
                                        zzz = 0;
                                        clearInterval(elapseInterval);
                                        //elapseInterval = setInterval(updateTimeElapse, 1000);

                                        //enableStartButton(true);

                                        //disconnect = new Paho.MQTT.Message("disconnected");
                                        //disconnect.destinationName = USER_TOKEN + "/disconnect";

                                        //client.send(disconnect);

                                        donePlaying(true);

                                        if (PLAYER2_DONE_PLAYING) {
                                            if (PLAYER2_DONE_PLAYING()) {
                                                //$(".outer-chart-container").show();
                                                //showComparisonChart(sessionData());
                                                disableSettingsControls(false);
                                                $(".view-chart").show();

                                                updateGameStatus(gameVM);
                                            }
                                        } else {
                                            //$(".outer-chart-container").show();
                                            //showComparisonChart(sessionData());
                                            disableSettingsControls(false);
                                            $(".view-chart").show();

                                            updateGameStatus(gameVM);
                                        }

                                        $.each(self.GameQueue(), function (iii, vvv) {
                                            if (vvv.Type() == 'useAIble') {
                                                vvv.Playing(false);
                                                vvv.Done(true);
                                            }
                                        });

                                        gameVM.gameStatus("Done");
                                        gameVM.timeElapse("");

                                        updateGameStatus(gameVM);

                                        if (client) {
                                            if (client.isConnected()) {
                                                client.disconnect();
                                            }
                                        }

                                    } else {

                                        var hasUnfinished = false;
                                        $.each(self.GameQueue(), function (iii, vvv) {
                                            if (vvv.Type() == 'useAIble') {
                                                if (!vvv.Done()) {
                                                    hasUnfinished = true;
                                                    return false;
                                                }
                                            }
                                        });

                                        if (hasUnfinished) {

                                            //gameVM.gameStatus("Ready session " + eval(game_data.Session + 1));
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
                                                useAIbleCurrentGameDonePlaying(false);
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

        client.connect({
            keepAliveInterval: 10000,
            timeout: 10000,
            onFailure: function (fl) {
                console.log(fl.errorMessage);
            },
            onSuccess: function () {

                client.subscribe(userToken + "/outputFromServer");

                console.log("subscribed to useAIble lunar lander with token = " + userToken);

                if (!donePlaying() == true) {
                    gameVM.gameStatus("Loading data...");
                    updateGameStatus(gameVM);
                }
            }
        });
    };

    var PLAYER2_DONE_PLAYING;
    var PLAYER2_CURRENT_GAME_DONE;
    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;

    self.Play = function (token, player2DonePlaying, player2CurrentGameDonePlaying, newGameTrigger, useAIbleStarted, player2Started) {

        try{

            //sim.gameQueue([]);
            //self.GameQueue([]);

            $(".view-chart").hide();
            disableSettingsControls(true);

            USER_TOKEN = token;
            enableStartButton(false);

            sessionCounter = 0;
            PLAYER2_DONE_PLAYING = player2DonePlaying;

            PLAYER2_CURRENT_GAME_DONE = player2CurrentGameDonePlaying;

            useAIbleCurrentGameDonePlaying(false);
            IS_HEAD_TO_HEAD = PLAYER2_CURRENT_GAME_DONE ? true : false;

            ee = 0;

            //client = new Paho.MQTT.Client("dev.useaible.com", 61614, drnnRepo.GenerateGUID());
            client = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, drnnRepo.GenerateGUID());

            client.onConnectionLost = function (res) {

                if (!donePlaying() == true) {

                    console.log(res.errorMessage);
                    gameVM.gameStatus("Loading data...");

                    STARTED = false;
                    zzz = 0;
                    clearInterval(elapseInterval);
                    elapseInterval = setInterval(updateTimeElapse, 1000);
                }

                //donePlaying(true);
                //disableSettingsControls(false);
                //connect(token);
            }

            client.onMessageArrived = function (msg) {

                sessionCounter++;

                if (sessionCounter == 1) {
                    useAIbleCurrentGameDonePlaying(true);
                } else {
                    if (!CURRENTLY_PLAYING) {
                        useAIbleCurrentGameDonePlaying(true);
                    }
                }

                var output = eval("(" + msg.payloadString + ")");

                var gameObj = {
                    Session: output.Session,
                    Done: ko.observable(false),
                    Playing: ko.observable(false),
                    Data: output.Outputs,
                    Score: output.Score,
                    Type: ko.observable('useAIble')
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

                self.GameQueue.push(gameObj);

                //sim.gameQueue(self.GameQueue());

                if (sessionCounter <= totalSessions) {

                    var counter = sessionCounter + 1;

                    updateGameStatus(gameVM);

                    if (!IS_HEAD_TO_HEAD) {
                        self.StartGame(self.StartGame() ? false : true);
                    }

                } else {

                    sessionWaitText("");
                    sessionWaitTextUseAible("");

                    $("#useAibleWaitingDiv").hide();
                    $("#mainWaitingDiv").hide();

                    $("#sessionRandomnessSlider").slider("option", "min", 0);
                    $("#sessionRandomnessSlider").slider("option", "max", totalSessions);
                    $("#sessionRandomnessSlider").slider("value", totalSessions / 2);

                    played(true);

                    useAIbleShowChart(true);

                    gameVM.gameStatus("Done");
                    gameVM.timeElapse("");

                    updateGameStatus(gameVM);
                }
            }

            client.connect({
                //userName: "povwqgew",
                //password: "QVGLIyH-sTIw",
                keepAliveInterval: 10000,
                timeout: 10000,
                onFailure: function (fl) {
                    console.log(fl.errorMessage);
                },
                onSuccess: function () {

                    client.subscribe(token + "/outputFromServer");

                    console.log("subscribed to useAIble lunar lander with token = " + token);

                    //drnnRepo.Play(token, "Lunar Lander MQTT Version", learn, totalSessions, startRandomness, endRandomness, maxBracket, minBracket, numSessionRandomness).done(function () {
                    //    console.log("useAIble done playing...");
                    //});

                    drnnRepo.Play(token, "Lunar Lander MQTT Version", true, totalSessions, rnnNetworkSettings, sim.fuel(), sim.altitude()).done(function () {
                        console.log("useAIble playing...");
                    });

                    $("#useAibleWaitingDiv").show();
                    $("#mainWaitingDiv").show();

                    sessionCounter = 0;
                    var counter = sessionCounter + 1;
                    sessionWaitText(" " + counter + "     ");
                    sessionWaitTextUseAible(" " + counter + "     ");

                    gameVM.currentPlayer("useAIble");
                    gameVM.gameStatus("Loading data...");

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



