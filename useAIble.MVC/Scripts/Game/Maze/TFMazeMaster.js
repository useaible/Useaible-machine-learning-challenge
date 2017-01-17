function TFMazeMaster(drawRectangle, mazeGenerated, move, resetPosition, sessionData, donePlaying, speed, currentCanvas, X, Y, tensorFlowShowChart) {

    var self = this;
    var sessionCounter = 0;
    var repo = new DRNNRepository();
    var USER_TOKEN;
    var SESSIONS;

    self.Init = function (token) {

        donePlaying(false);

        var def = $.Deferred();
        client2 = new Paho.MQTT.Client("invirmq.southeastasia.cloudapp.azure.com", 15675, "/ws", token);

        // set callback handlers
        client2.onConnectionLost = onConnectionLost;
        client2.onMessageArrived = onMessageArrived;

        client2.connect({
            onSuccess: function () {

                USER_TOKEN = token;

                client2.subscribe("tensorflow.actions.maze." + USER_TOKEN);
                client2.subscribe("tensorflow.play_maze." + USER_TOKEN);

                $("#loadingMaze2").text("Loading data...");
                $(".view-chart").hide();

                disableSettingsControls(true);

                def.resolve();
            }
        });
        return def;
    };

    self.BestMoves = [];
    self.PlaySolution = function () {

        var moves = self.BestMoves;
        var len = moves.length;

        var moveCounter = 0;
        self.Playing(true);

        var start = function () {

            setTimeout(function () {

                var nextMove = moves[moveCounter];

                if (nextMove == 0) {
                    move(currentCanvas, 'up', X, Y, 'orange');
                } else if (nextMove == 1) {
                    move(currentCanvas, 'right', X, Y, 'orange');
                } else if (nextMove == 2) {
                    move(currentCanvas, 'down', X, Y, 'orange');
                } else if (nextMove == 3) {
                    move(currentCanvas, 'left', X, Y, 'orange');
                }

                moveCounter++;

                if (moveCounter < len) {
                    start();
                }
                else if (moveCounter == len) {
                    resetPosition(currentCanvas, X, Y);
                }

            }, speed().Id);
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
        } else {
            $('#play-maze-btn').show();
            $('#sessionRandomnessSlider').slider('enable');
            $('#RandomnessSlider').slider('enable');
            $('#sessionSlider').slider('enable');
        }

    };
    
    var USEAIBLE_DONE_PLAYING;
    var DONE_PLAYING;

    var USEAIBLE_CURRENT_GAME_DONE;
    var TENSORFLOW_CURRENT_GAME_DONE;

    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;

    self.StartSession = function (settings, useAIbleDonePlaying, useAIbleCurrentGameDonePlaying, tensorflowCurrentGameDonePlaying) {

        SESSIONS = settings.Sessions;

        USEAIBLE_DONE_PLAYING = useAIbleDonePlaying;
        DONE_PLAYING = donePlaying;

        USEAIBLE_CURRENT_GAME_DONE = useAIbleCurrentGameDonePlaying;
        TENSORFLOW_CURRENT_GAME_DONE = tensorflowCurrentGameDonePlaying;

        if (TENSORFLOW_CURRENT_GAME_DONE) {
            TENSORFLOW_CURRENT_GAME_DONE(false);
        }

        IS_HEAD_TO_HEAD = USEAIBLE_CURRENT_GAME_DONE ? true : false;

        //todo: pass the initial altitude and fuel
        var data = {}

        var msg = ko.toJSON({
            Sessions: settings.Sessions,
            random_action_prob: settings.RandomActionProb,
            RANDOM_ACTION_DECAY: settings.RandomActionDecay,
            HIDDEN1_SIZE: settings.Hidden1Size,
            HIDDEN2_SIZE: settings.Hidden2Size,
            LEARNING_RATE: settings.LearningRate,
            MINIBATCH_SIZE: settings.MiniBatchSize,
            DISCOUNT_FACTOR: settings.DiscountFactor,
            TARGET_UPDATE_FREQ: settings.TargetUpdateFreq,
            Game: 'maze',
            MazeInfo: settings.Maze,
            USER_TOKEN: USER_TOKEN
        });

        start = new Paho.MQTT.Message(msg);
        start.destinationName = "tensorflow.train.maze";

        client2.send(start);

    };

    self.MoveList = [];
    self.StartGame = ko.observable(false);
    self.Playing = ko.observable(false);
    self.StartGame.subscribe(function () {

        if (!self.Playing()) {

            //donePlaying(false);
            //$("#loadingMaze2").text("Playing...");

            $.each(self.MoveList, function (index, value) {

                //if (!value.Done() && (index % 100) == 0) {
                if (!value.Done()) {

                    $("#loadingMaze2").text("");
                    //$("#currentSession2").text(value.Session + "-" + (value.Session + 99));
                    $("#currentSession2").text(value.Session);

                    var moveObj = value;
                    var moves = moveObj.Moves;
                    var len = moves.length;

                    var moveCounter = 0;
                    self.Playing(true);
                    //donePlaying(false);

                    if (IS_HEAD_TO_HEAD) {
                        TENSORFLOW_CURRENT_GAME_DONE(false);
                        CURRENTLY_PLAYING = true;
                    }

                    var start = function () {

                        setTimeout(function () {

                            var nextMove = moves[moveCounter];

                            if (nextMove == 0) {
                                $("#directionTF").text('up');
                                move(currentCanvas, 'up', X, Y, 'white');
                            } else if (nextMove == 1) {
                                $("#directionTF").text('right');
                                move(currentCanvas, 'right', X, Y, 'white');
                            } else if (nextMove == 2) {
                                $("#directionTF").text('down');
                                move(currentCanvas, 'down', X, Y, 'white');
                            } else if (nextMove == 3) {
                                $("#directionTF").text('left');
                                move(currentCanvas, 'left', X, Y, 'white');
                            }

                            moveCounter++;

                            if (moveCounter < len) {
                                $("#loadingMaze2").text("Playing...");
                                $.each(sessionData(), function (sess_index, sess_data) {
                                    if (sess_data.Type() == 'tensorFlow') {
                                        if (sess_data.Id >= value.Session) {
                                            sess_data.Playing(true);
                                            return false;
                                        }
                                    }
                                });
                                start();
                            }
                            else {

                                //$("#loadingMaze2").text("Ready session " + eval(value.Session + 1));
                                $("#loadingMaze2").text("Loading data...");
                                $("#currentSession2").text("");
                                $("#directionTF").text('');

                                value.Done(true);
                                self.Playing(false);

                                //$.each(sessionData(), function (sess_index, sess_data) {
                                //    if (sess_data.Type() == 'tensorFlow') {
                                //        if (sess_data.Id >= value.Session) {
                                //            sess_data.Done(true);
                                //            sess_data.Playing(false);
                                //            return false;
                                //        }
                                //    }
                                //});

                                var sessDataObj = {
                                    Id: value.Session,
                                    Score: ko.observable(value.Score),
                                    Type: ko.observable('tensorFlow'),
                                    Playing: ko.observable(false),
                                    Done: ko.observable(true)
                                };

                                sessDataObj.Icon = ko.computed(function () {
                                    if (sessDataObj.Done()) {
                                        return '<i class="fa fa-check-square-o" aria-hidden="true" title="Done Playing"></i>';
                                    } else if (!sessDataObj.Done() && sessDataObj.Playing()) {
                                        return '<i class="fa fa-rocket" aria-hidden="true" title="Currently Playing"></i>';
                                    } else if (!sessDataObj.Done() && !sessDataObj.Playing()) {
                                        return '<i class="fa fa-hourglass-half" aria-hidden="true" title="Pending"></i>';
                                    }
                                });

                                sessionData.push(sessDataObj);

                                if (IS_HEAD_TO_HEAD) {
                                    TENSORFLOW_CURRENT_GAME_DONE(true);
                                }

                                CURRENTLY_PLAYING = false;

                                //if (value.Session + 100 >= SESSIONS) {
                                if (value.Session == SESSIONS) {

                                    //$.each(sessionData(), function (sess_index, sess_data) {
                                    //    if (sess_data.Type() == 'tensorFlow') {
                                    //        sess_data.Done(true);
                                    //        sess_data.Playing(false);
                                    //    }
                                    //});

                                    $("#loadingMaze2").text("Done");
                                    $("#currentSession2").text("");
                                    donePlaying(true);

                                    if (USEAIBLE_DONE_PLAYING) {
                                        if (USEAIBLE_DONE_PLAYING()) {
                                            disableSettingsControls(false);
                                            $(".view-chart").show();
                                        }
                                    } else {
                                        disableSettingsControls(false);
                                        $(".view-chart").show();
                                    }
                                }

                                resetPosition(currentCanvas, X, Y);

                                if (!IS_HEAD_TO_HEAD) {
                                    self.StartGame(self.StartGame() ? false : true);
                                }
                            }

                        }, speed().Id);
                    };

                    start();

                    return false;
                }

            });
        }

    });

    var onMessageArrived = function (message) {

        var output = eval("(" + message.payloadString + ")");

        if (message.destinationName == "tensorflow/actions/maze/"+ USER_TOKEN) {

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

            var outputObj = {
                Moves: output.data,
                Session: output.session,
                Score: output.score,
                Done: ko.observable(false)
            };

            //var sessDataObj = {
            //    Id: outputObj.Session,
            //    Score: ko.observable(outputObj.Score),
            //    Type: ko.observable('tensorFlow'),
            //    Playing: ko.observable(false),
            //    Done: ko.observable(false)
            //};

            //sessDataObj.Icon = ko.computed(function () {
            //    if (sessDataObj.Done()) {
            //        return '<i class="fa fa-check-square-o" aria-hidden="true" title="Done Playing"></i>';
            //    } else if (!sessDataObj.Done() && sessDataObj.Playing()) {
            //        return '<i class="fa fa-rocket" aria-hidden="true" title="Currently Playing"></i>';
            //    } else if (!sessDataObj.Done() && !sessDataObj.Playing()) {
            //        return '<i class="fa fa-hourglass-half" aria-hidden="true" title="Pending"></i>';
            //    }
            //});

            //sessionData.push(sessDataObj);

            self.MoveList.push(outputObj);

            if (sessionCounter >= SESSIONS) {

                //tensorFlowShowChart(true);
            }

            if (!IS_HEAD_TO_HEAD) {
                self.StartGame(self.StartGame() ? false : true);
            }

        } else if (message.destinationName == "tensorflow/play_maze/" + USER_TOKEN) {
            self.BestMoves = output.data;
        }

    };

    var onConnectionLost = function (responseObject) {
        if (responseObject.errorCode !== 0) {
            donePlaying(true);
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
    };

}
