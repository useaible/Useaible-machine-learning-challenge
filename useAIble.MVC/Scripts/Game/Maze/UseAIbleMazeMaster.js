function UseAIbleMazeMaster(drawRectangle, mazeGenerated, move, resetPosition, sessionData, donePlaying, speed, currentCanvas, X, Y, useAIbleShowChart, showComparisionChart) {

    var numSessions;
    var pixelMultiplier = 10;
    var repo = new DRNNRepository();
    var self = this;
    var USER_TOKEN;

    self.MazeGridData = {};
    self.MazeGrid = {};

    self.GetToken = function () {

        var def = $.Deferred();

        repo.GetToken().done(function (token_res) {
            def.resolve(token_res.Token);
        });

        return def;
    };

    self.CreateMaze = function () {


        //var output = self.MazeGridData;

        //var grid = output.Grid;
        //var goalPosition = output.GoalPosition;
        //var startingPosition = output.StartingPosition;

        //$.each(grid, function (index, rows) {

        //    $.each(rows, function (index2, col) {

        //        var x = index * pixelMultiplier;
        //        var y = index2 * pixelMultiplier;

        //        self.MazeGrid[x + "-" + y] = col;

        //        drawRectangle(currentCanvas, x, y, col == true ? 'black' : 'white');

        //    });

        //});

        ////var goalPos = self.MazeGrid[goalPosition.X]

        //drawRectangle(currentCanvas, goalPosition.X * pixelMultiplier, goalPosition.Y * pixelMultiplier, 'red');
        //drawRectangle(currentCanvas, startingPosition.X * pixelMultiplier, startingPosition.Y * pixelMultiplier, 'violet');

    };

    self.GenerateMaze = function (userToken, dimension) {
        repo.GenerateMaze(userToken, dimension, dimension).done(function (maze_res) {

            self.MazeGridData = maze_res;

            mazeGenerated(mazeGenerated() ? false : true);

        });
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

    //self.DonePlaying = ko.observable(false);
    self.ReplayGame = function () {

        donePlaying(false);

        var moveCounter = 0;

        var last_move = self.MoveList[self.MoveList.length - 1];
        var move_data = {
            Moves: last_move.Moves,
            BatchDone: last_move.BatchDone,
            Session: last_move.Session,
            Score: last_move.SessionScore,
            Done: last_move.Done
        };

        var moves = move_data.Moves;
        var outputLen = moves.length;

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

                if (moveCounter < outputLen) {
                    start();
                }
                else if (moveCounter == outputLen) {
                    resetPosition(currentCanvas, X, Y);
                    donePlaying(true);
                }

            }, 100);
        };

        start();

    };

    self.MoveList = [];
    self.StartGame = ko.observable(false);
    self.Playing = ko.observable(false);

    self.StartGame.subscribe(function (val) {

        if (!self.Playing()) {

            //donePlaying(false);
            //self.DonePlaying(false);

            $.each(self.MoveList, function (index, value) {

                if (!value.BatchDone()) {

                    if (IS_HEAD_TO_HEAD) {
                        CURRENT_GAME_DONE(false);
                    }

                    CURRENTLY_PLAYING = true;

                    $("#loadingMaze").text("");
                    $("#currentSession").text(value.Session);

                    var moveObj = value;
                    var moves = moveObj.Moves;
                    var len = moves.length;

                    var moveCounter = 0;

                    console.log("Playing session " + value.Session);

                    self.Playing(true);

                    donePlaying(false);
                    disableSettingsControls(true);

                    $.each(sessionData(), function (sess_index, sess_data) {
                        if (sess_data.Type() == 'useAIble') {
                            if (value.Session == sess_data.Id) {
                                sess_data.Playing(true);
                                return false;
                            }
                        }
                    });

                    var start = function () {

                        setTimeout(function () {


                            var nextMove = moves[moveCounter];

                            if (nextMove == 0) {
                                $("#direction").text('up');
                                move(currentCanvas, 'up', X, Y, 'white');
                            } else if (nextMove == 1) {
                                $("#direction").text('right');
                                move(currentCanvas, 'right', X, Y, 'white');
                            } else if (nextMove == 2) {
                                $("#direction").text('down');
                                move(currentCanvas, 'down', X, Y, 'white');
                            } else if (nextMove == 3) {
                                $("#direction").text('left');
                                move(currentCanvas, 'left', X, Y, 'white');
                            }

                            moveCounter++;

                            if (moveCounter < len) {
                                $("#loadingMaze").text("Playing...");
                                disableSettingsControls(true);
                                start();
                            }
                            else if(moveCounter == len) {

                                $("#loadingMaze").text("Loading data...");

                                value.BatchDone(true);
                                self.Playing(false);

                                if (value.Done) {

                                    if (IS_HEAD_TO_HEAD) {
                                        CURRENT_GAME_DONE(true);
                                    }

                                    CURRENTLY_PLAYING = false;

                                    resetPosition(currentCanvas, X, Y);
                                    //$("#loadingMaze").text("Ready session "+ eval(value.Session + 1));
                                    $("#loadingMaze").text("Loading data...");
                                    $("#currentSession").text("");
                                    $("#direction").text('');

                                    //sessionData.push({
                                    //    Id: moveObj.Session,
                                    //    Score: moveObj.Score,
                                    //    Type: ko.observable('useAIble')
                                    //});

                                    //var exist = false;
                                    //var sess;
                                    //$.each(sessionData(), function (sess_index, sess_data) {
                                    //    if (sess_data.Type() == 'useAIble') {
                                    //        if (value.Session == sess_data.Id) {
                                    //            sess_data.Done(true);
                                    //            sess_data.Playing(false);
                                    //            return false;
                                    //        }
                                    //    }
                                    //});

                                    var sessDataObj = {
                                        Id: value.Session,
                                        Score: ko.observable(moveObj.Score),
                                        Type: ko.observable('useAIble'),
                                        Playing: ko.observable(false),
                                        Done: ko.observable(true)
                                    };

                                    sessDataObj.Icon = ko.computed(function () {
                                        if (sessDataObj.Done()) {
                                            return '<i class="fa fa-check-square-o" aria-hidden="true" title="Done Playing"></i>';
                                        } else if (!sessDataObj.Done() && sessDataObj.Playing()) {
                                            return '<i class="fa fa-cog fa-spin fa-3x fa-fw" aria-hidden="true" title="Currently Playing"></i>';
                                        } else if (!sessDataObj.Done() && !sessDataObj.Playing()) {
                                            return '<i class="fa fa-hourglass-half" aria-hidden="true" title="Pending"></i>';
                                        }
                                    });

                                    sessionData.push(sessDataObj);

                                    console.log("Done playing session " + value.Session);

                                    
                                    if (numSessions == value.Session) {

                                        $("#loadingMaze").text("Done");
                                        $("#currentSession").text("");

                                        //disconnect = new Paho.MQTT.Message("disconnected");
                                        //disconnect.destinationName = USER_TOKEN +"/disconnect";

                                        //client.send(disconnect);

                                        donePlaying(true);

                                        if (PLAYER2_DONE_PLAYING != undefined) {

                                            if (PLAYER2_DONE_PLAYING()) {
                                                disableSettingsControls(false);
                                                //$(".outer-chart-container").show();
                                                //showComparisionChart(sessionData());
                                                $(".view-chart").show();
                                            }

                                        } else {
                                            disableSettingsControls(false);
                                            //$(".outer-chart-container").show();
                                            //showComparisionChart(sessionData());
                                            $(".view-chart").show();
                                        }

                                        //self.DonePlaying(true);

                                        //console.log("client disconnected");

                                        if (client) {
                                            if (client.isConnected()) {
                                                client.disconnect();
                                            }
                                        }
                                    }
                                } else {
                                    if (IS_HEAD_TO_HEAD) {
                                        self.StartGame(self.StartGame() ? false : true);
                                    }
                                }

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

    var sessionCount = 0;

    var PLAYER2_DONE_PLAYING;
    var PLAYER2_CURRENT_GAME_DONE;
    var CURRENT_GAME_DONE;
    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;
    var USEAIBLE_BATCH_DONE;

    self.Play = function (userToken, sessions, maze, settings, player2DonePlaying, player2CurrentGameDonePlaying, useAIbleCurrentGameDonePlaying, useAIbleBatchDone) {

        try {

            sessionData([]);

            sessionCount = 0;

            USER_TOKEN = userToken;
            numSessions = sessions;

            donePlaying(false);

            PLAYER2_DONE_PLAYING = player2DonePlaying;
            PLAYER2_CURRENT_GAME_DONE = player2CurrentGameDonePlaying;
            CURRENT_GAME_DONE = useAIbleCurrentGameDonePlaying;

            if (CURRENT_GAME_DONE) {
                CURRENT_GAME_DONE(false);
            }

            USEAIBLE_BATCH_DONE = useAIbleBatchDone;

            if (USEAIBLE_BATCH_DONE) {
                USEAIBLE_BATCH_DONE(true);
            }

            IS_HEAD_TO_HEAD = PLAYER2_CURRENT_GAME_DONE ? true : false;

            disableSettingsControls(true);

            self.MoveList = [];

            //client = new Paho.MQTT.Client("dev.useaible.com", 61614, repo.GenerateGUID());
            client = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, repo.GenerateGUID());

            client.onConnectionLost = function (msg) {

                console.log(msg.errorMessage);

                //donePlaying(true);
                //disableSettingsControls(false);
            };

            client.onMessageArrived = function (msg) {

                var destinationName = msg.destinationName;
                var currentRequest = userToken + "/mazeMove";

                if (destinationName == currentRequest) {

                    sessionCount++;

                    if (IS_HEAD_TO_HEAD) {

                        if (sessionCount == 1) {
                            CURRENT_GAME_DONE(true);
                        } else {
                            if (!CURRENTLY_PLAYING) {
                                CURRENT_GAME_DONE(true);
                            } else {
                                self.StartGame(self.StartGame() ? false : true);
                            }
                        }
                    }

                    //if (sessionCount >= sessions) {
                    //    useAIbleShowChart(true);
                    //}

                    var output = eval("(" + msg.payloadString + ")");

                    var outputObj = {
                        Moves: output.Moves,
                        BatchDone: ko.observable(false),
                        Session: output.Session,
                        Score: output.SessionScore,
                        Done: output.Done
                    };

                    var exist = false;
                    var sess;
                    $.each(sessionData(), function (sess_index, sess_data) {
                        if (sess_data.Type() == 'useAIble') {
                            if (output.Session == sess_data.Id) {
                                exist = true;
                                sess = sess_data;
                                return false;
                            }
                        }
                    });

                    if (exist) {
                        if (output.Done) {
                            sess.Score(output.SessionScore);
                        }
                    } else if(!exist) {

                        //var sessDataObj = {
                        //    Id: output.Session,
                        //    Score: ko.observable(output.SessionScore),
                        //    Type: ko.observable('useAIble'),
                        //    Playing: ko.observable(false),
                        //    Done: ko.observable(false)
                        //};

                        //sessDataObj.Icon = ko.computed(function () {
                        //    if (sessDataObj.Done()) {
                        //        return '<i class="fa fa-check-square-o" aria-hidden="true" title="Done Playing"></i>';
                        //    } else if (!sessDataObj.Done() && sessDataObj.Playing()) {
                        //        return '<i class="fa fa-cog fa-spin fa-3x fa-fw" aria-hidden="true" title="Currently Playing"></i>';
                        //    } else if (!sessDataObj.Done() && !sessDataObj.Playing()) {
                        //        return '<i class="fa fa-hourglass-half" aria-hidden="true" title="Pending"></i>';
                        //    }
                        //});

                        //sessionData.push(sessDataObj);
                    }

                    self.MoveList.push(outputObj);
                    //console.log(ko.toJS(self.MoveList));

                    console.log("Session " +output.Session + " arrived.");

                    console.log("Session " + output.Session + ", Count = " + output.Moves.length + ", Done = " + output.Done);

                    if (!IS_HEAD_TO_HEAD) {
                        self.StartGame(self.StartGame() ? false : true);
                    }

                } else {
                    console.log("not my request");
                }

            };

            client.connect({
                keepAliveInterval: 1800,
                timeout: 10000,
                onFailure: function (fl) {
                    console.log(fl.errorMessage);
                },
                onSuccess: function () {

                    $(".view-chart").hide();

                    disableSettingsControls(true);

                    $("#loadingMaze").text("Loading data....");

                    client.subscribe(userToken + "/mazeMove");

                    console.log("subscribed to mazeMove");

                    maze.Name = "Maze";

                    var mazeParams = {
                        Maze: maze,
                        Settings: settings
                    };

                    repo.PlayMaze(userToken, sessions, mazeParams).done(function (res) {



                    });
                }
            });
        } catch (exception) {
            console.log(exception);
        }

    };

}
