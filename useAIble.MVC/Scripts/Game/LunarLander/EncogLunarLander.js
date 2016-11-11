function EncogLunarLander(sim, runGame, gameVM, resetGame, currentSession, encogSettings, enableStartButton, sessionWaitText, waitTimeElapse, donePlaying, sessionWaitTextEncog, waitTimeElapseEncog, played, encogShowChart, showComparisonChart, sessionData) {

    var self = this;
    var drnnRepo = new DRNNRepository();
    var sessions = {};
    var doneSessions = {};
    var sessionCounter = 0;
    var gameDone = true;
    var client;
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
            $('#play-maze-btn').hide();
            $('#sessionRandomnessSlider').slider('disable');
            $('#RandomnessSlider').slider('disable');
            $('#sessionSlider').slider('disable');

            encogShowChart(false);

        } else {

            $('#play-maze-btn').show();
            $('#sessionRandomnessSlider').slider('enable');
            $('#RandomnessSlider').slider('enable');
            $('#sessionSlider').slider('enable');

            encogShowChart(true);
        }

    };

    var USEAIBLE_DONE_PLAYING;
    var SESSION_COUNTER = 0;
    var CURR_SESSION_COUNTER = 0;


    self.StartGame.subscribe(function (val) {

        if (self.StartNewGame() && self.SessionDone()) {

            var newGame;
            if (self.GameQueue().length > 0) {
                $.each(self.GameQueue(), function (game_index, game_data) {
                    if (!game_data.Done()) {

                        var gameCounter = 0;

                        self.SessionDone(false);
                        self.StartNewGame(false);

                        game_data.Playing(true);

                        currentSession(game_data.Session);

                        var results = game_data.Data;
                        var outputLen = results.length;

                        CURR_SESSION_COUNTER++;

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

                                    self.SessionDone(true);
                                    self.StartNewGame(true);
                                    game_data.Done(true);
                                    game_data.Playing(false);

                                    sim.sessionScores.push({
                                        Id: game_data.Session, Score: game_data.Score
                                    });

                                    console.log("session = " + game_data.Session + " fuel =" + sim.fuel() + ", altitude = " + sim.altitude() + ", velocity = " + sim.velocity());

                                    resetGame(gameVM);

                                    if (CURR_SESSION_COUNTER == SESSION_COUNTER) {

                                        donePlaying(true);

                                        if (USEAIBLE_DONE_PLAYING != undefined) {
                                            if (USEAIBLE_DONE_PLAYING()) {
                                                $(".outer-chart-container").show();
                                                showComparisonChart(sessionData());
                                                disableSettingsControls(false);
                                            }
                                        } else {
                                            $(".outer-chart-container").show();
                                            showComparisonChart(sessionData());
                                            disableSettingsControls(false);
                                        }
                                    }

                                    self.StartGame(self.StartGame() ? false : true);
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

    self.GetToken = function () {

        var def = $.Deferred();

        drnnRepo.GetToken().done(function (token_res) {

            var token = token_res.Token;
            def.resolve(token);
        });

        return def;
    };

    self.Play = function (token, useAIbleDonePlaying) {

        disableSettingsControls(true);

        USER_TOKEN = token;
        enableStartButton(false);

        sessionCounter = 0;

        ee = 0;

        SESSION_COUNTER = 0;
        CURR_SESSION_COUNTER = 0;
        USEAIBLE_DONE_PLAYING = useAIbleDonePlaying;

        client = new Paho.MQTT.Client("dev.useaible.com", 61614, drnnRepo.GenerateGUID());

        client.onConnectionLost = function (res) {
            donePlaying(true);
            console.log("connection lost");
            disableSettingsControls(false);
        }

        client.onMessageArrived = function (msg) {

            sessionCounter++;

            SESSION_COUNTER++;

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

            self.GameQueue.push(gameObj);

            sim.gameQueue(self.GameQueue());

            if (CURR_SESSION_COUNTER < SESSION_COUNTER) {
                var counter = SESSION_COUNTER + 1;
                sessionWaitText("Waiting results for session # " + counter + "");
                sessionWaitTextEncog("Waiting results for session # " + counter + "");
            } else {
                sessionWaitText("");
                sessionWaitTextEncog("");
                $("#encogWaitingDiv").hide();
                $("#mainWaitingDiv").hide();
            }

            self.StartGame(self.StartGame() ? false : true);

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

        client.connect({
            //userName: "povwqgew",
            //password: "QVGLIyH-sTIw",
            keepAliveInterval: 600, // 10mins (60s*10)
            onSuccess: function () {

                client.subscribe(token + "/outputFromServer");
                client.subscribe(token + "/encog/lander/simulation_output");

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

                ee = 0;
                clearInterval(runTimeElapse);

                if (!played()) {
                    runTimeElapse(1000);
                }
            }
        });

        //});
    };

    var runTimeElapse = function (elapse) {

        setTimeout(function () {

            ee++;

            var tt = toTime(ee);

            waitTimeElapse(tt);
            waitTimeElapseEncog(tt);
            runTimeElapse(elapse);
        }, elapse);
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



