function EncogMazeMaster(drawRectangle, mazeGenerated, move, resetPosition, sessionData, donePlaying, speed, currentCanvas, X, Y, encogShowChart, showComparisonChart) {

    var numSessions;
    var pixelMultiplier = 10;
    var repo = new DRNNRepository();
    var self = this;
    var USER_TOKEN;

    self.MazeGridData = {};
    self.MazeGrid = {};

    self.ShowHiddenLayerConfigPanel = ko.observable(true);
    self.ShowHideHiddenLayerConfigPanel = function () {

        if (self.ShowHiddenLayerConfigPanel()) {
            self.ShowHiddenLayerConfigPanel(false);
        } else {
            self.ShowHiddenLayerConfigPanel(true);
        }

    };

    self.HiddenLayerNeuronsInputs = ko.observableArray([]);
    self.SelectedNumberOfNeuronOption = ko.observable();
    self.SelectedNumberOfNeuronOption.subscribe(function (selected_num_neuron) {

        self.HiddenLayerNeuronsInputs([]);
        for (var i = 0; i < selected_num_neuron; i++) {
            self.HiddenLayerNeuronsInputs.push(new HiddenLayerNeuronVM());
        }

    });

    self.EncogTrainingMethods = ko.observableArray([
        { Id: 0, Name: 'Annealing' },
        { Id: 1, Name: 'Genetic' },
        { Id: 2, Name: 'Neural PSO' },
        { Id: 3, Name: 'Back Propagation' },
        { Id: 4, Name: 'Manhattan Propagation' },
        { Id: 5, Name: 'Quick Propagation' },
        { Id: 6, Name: 'Resilient Propagation' },
        { Id: 7, Name: 'SCG' },
        { Id: 8, Name: 'LMA' }
    ]);

    self.SelectedTrainingMethod = ko.observable(self.EncogTrainingMethods()[1]);
    self.SelectedTrainingMethod.subscribe(function (training_type) {

        if (training_type.Name != 'Annealing' && training_type.Name != 'Genetic' && training_type.Name != 'Neural PSO') {

            $.each(self.EncogTrainingMethods(), function (index, val) {
                if (val.Id == self.TrainingMethodType()) {
                    self.SelectedTrainingMethod(val);
                    return false;
                }
            });
            $("#encog-training-method").notify(training_type.Name + " will not work for this game.\nPick either Annealing, Genetic, \nand Neural PSO instead.", {
                clickToHide: true,
                autoHide: true,
                className: 'error',
                autoHideDelay: 7000,
                elementPosition: 'top left',
                style: 'bootstrap'
            });

            $("[data-notify-text=]").html('<span style="text-decoration:underline;color:blue;font-weight:bold;">' + training_type.Name + '</span> will not work for this game.<br/>Pick either <code>Annealing,</code> <code>Genetic,</code> <br/>or <code>Neural PSO</code> instead.');
            $("[data-notify-text=]").css('font-size', '10px');

            return;
        }
        self.TrainingMethodType(training_type.Id);
    });

    self.SetOptionsDisable = function (option, item) {
        if (item.Name != 'Annealing' && item.Name != 'Genetic' && item.Name != 'Neural PSO') {

            option.style.color = 'gray';

            ko.applyBindingsToNode(option, { disable: false }, item);
        }
    };

    self.HiddenLayerNeurons = ko.observable(50);
    self.TrainingMethodType = ko.observable(self.SelectedTrainingMethod().Id);
    self.Cycles = ko.observable(10);
    self.StartTemp = ko.observable(2);
    self.StopTemp = ko.observable(10);
    self.PopulationSize = ko.observable(10);
    self.Epochs = ko.observable(10);
    self.MinRandom = ko.observable(0);
    self.MaxRandom = ko.observable(100);

    self.GetToken = function () {

        var def = $.Deferred();

        repo.GetToken().done(function (token_res) {
            def.resolve(token_res.Token);
        });

        return def;
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

            encogShowChart(false);

        } else {

            $('#play-maze-btn').show();
            $('#sessionRandomnessSlider').slider('enable');
            $('#RandomnessSlider').slider('enable');
            $('#sessionSlider').slider('enable');

            encogShowChart(true);
        }

    };

    //self.DonePlaying = ko.observable(false);
    self.ReplayGame = function () {

        //donePlaying(false);

        var moveCounter = 0;

        var last_move = self.MoveList[self.MoveList.length - 1];
        var move_data = {
            Moves: last_move.Moves,
            BatchDone: last_move.BatchDone,
            Session: last_move.Session,
            SessionScore: last_move.SessionScore
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
                    //donePlaying(true);
                }

            }, 100);
        };

        start();

    };

    self.MoveList = [];
    self.StartGame = ko.observable(false);
    self.Playing = ko.observable(false);
    self.EncogSessionScores = [];
    self.TempSessionData = ko.observableArray([]);

    var USEAIBLE_DONE_PLAYING;
    var SESSION_COUNTER = 0;

    var sessionCount = 0;
    var CURR_SESSION_COUNT = 0;

    self.StartGame.subscribe(function (val) {

        if (!self.Playing()) {

            $.each(self.MoveList, function (index, value) {

                if (!value.BatchDone()) {

                    $("#loadingMazeEncog").text("");
                    $("#currentSessionEncog").text(value.Session);

                    var moveObj = value;
                    var moves = moveObj.Moves;
                    var len = moves.length;

                    var moveCounter = 0;

                    CURR_SESSION_COUNT++;

                    console.log("Playing session " + moveObj.Session);

                    self.Playing(true);

                    donePlaying(false);
                    disableSettingsControls(true);

                    if (IS_HEAD_TO_HEAD) {
                        ENCOG_CURRENT_GAME_DONE(false);
                        CURRENTLY_PLAYING = true;
                    }

                    //$.each(sessionData(), function (sess_index, sess_data) {
                    //    if (sess_data.Type() == 'encog') {
                    //        if (value.Session == sess_data.Id) {
                    //            sess_data.Playing(true);
                    //            return false;
                    //        }
                    //    }
                    //});

                    var start = function () {

                        setTimeout(function () {


                            var nextMove = moves[moveCounter];

                            if (nextMove == 0) {
                                $("#directionEncog").text('up');
                                move(currentCanvas, 'up', X, Y, 'white');
                            } else if (nextMove == 1) {
                                $("#directionEncog").text('right');
                                move(currentCanvas, 'right', X, Y, 'white');
                            } else if (nextMove == 2) {
                                $("#directionEncog").text('down');
                                move(currentCanvas, 'down', X, Y, 'white');
                            } else if (nextMove == 3) {
                                $("#directionEncog").text('left');
                                move(currentCanvas, 'left', X, Y, 'white');
                            }

                            moveCounter++;

                            if (moveCounter <= len) {
                                $("#loadingMazeEncog").text("Playing...");
                                disableSettingsControls(true);
                                start();
                            }
                            else if (moveCounter > len) {

                                value.BatchDone(true);
                                self.Playing(false);

                                    resetPosition(currentCanvas, X, Y);
                                //$("#loadingMazeEncog").text("Ready session " + eval(value.Session + 1));
                                    $("#loadingMazeEncog").text("Loading data...");
                                    $("#currentSessionEncog").text("");
                                    $("#directionEncog").text("");


                                    var sessDataObj = {
                                        Id: CURR_SESSION_COUNT,
                                        Score: moveObj.SessionScore,
                                        Type: ko.observable('encog'),
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

                                    if (IS_HEAD_TO_HEAD) {
                                        ENCOG_CURRENT_GAME_DONE(true);
                                    }

                                    CURRENTLY_PLAYING = false;


                                    //$.each(sessionData(), function (sess_index, sess_data) {
                                    //    if (sess_data.Type() == 'encog') {
                                    //        if (value.Session == sess_data.Id) {

                                    //            sess_data.Done(true);
                                    //            sess_data.Playing(false);


                                    //            var sessDataObj = {
                                    //                Id: SESSION_COUNTER,
                                    //                Score: sess_data.Score,
                                    //                Type: ko.observable('encog'),
                                    //                Playing: ko.observable(false),
                                    //                Done: ko.observable(true)
                                    //            };

                                    //            sessDataObj.Icon = ko.computed(function () {
                                    //                if (sessDataObj.Done()) {
                                    //                    return '<i class="fa fa-check-square-o" aria-hidden="true" title="Done Playing"></i>';
                                    //                } else if (!sessDataObj.Done() && sessDataObj.Playing()) {
                                    //                    return '<i class="fa fa-cog fa-spin fa-3x fa-fw" aria-hidden="true" title="Currently Playing"></i>';
                                    //                } else if (!sessDataObj.Done() && !sessDataObj.Playing()) {
                                    //                    return '<i class="fa fa-hourglass-half" aria-hidden="true" title="Pending"></i>';
                                    //                }
                                    //            });

                                    //            sessionData.push(sessDataObj);

                                    //            return false;
                                    //        }
                                    //    }
                                    //});

                                    console.log("Done playing session " + value.Session);

                                        var finished = false;

                                        if (self.TrainingMethodType() == 0) {
                                            finished = SESSION_COUNTER >= (self.Cycles() * self.Epochs());
                                        } else if (self.TrainingMethodType() == 1) {
                                            finished = SESSION_COUNTER >= (self.PopulationSize() * self.Epochs());
                                        }

                                        if (SESSION_COUNTER == CURR_SESSION_COUNT) {

                                            donePlaying(true);

                                            if (USEAIBLE_DONE_PLAYING != undefined) {

                                                $("#loadingMazeEncog").text("Done");
                                                $("#currentSessionEncog").text("");

                                                if (USEAIBLE_DONE_PLAYING()) {
                                                    disableSettingsControls(false);
                                                    //$(".outer-chart-container").show();
                                                    //showComparisonChart(sessionData());

                                                    $(".view-chart").show();

                                                }

                                            } else {

                                                disableSettingsControls(false);
                                                //$(".outer-chart-container").show();
                                                //showComparisonChart(sessionData());

                                                $("#loadingMazeEncog").text("Done");
                                                $("#currentSessionEncog").text("");

                                                $(".view-chart").show();
                                            }

                                            var table = $(".table-container");
                                            table.animate({ scrollTop: table.prop("scrollHeight") - table.height() });

                                            if (client3) {
                                                if (client3.isConnected()) {
                                                    client3.disconnect();
                                                }
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

    var USEAIBLE_DONE_PLAYING;
    var DONE_PLAYING;

    var USEAIBLE_CURRENT_GAME_DONE;
    var ENCOG_CURRENT_GAME_DONE;

    var IS_HEAD_TO_HEAD = false;
    var CURRENTLY_PLAYING = false;

    self.Play = function (userToken, sessions, maze, settings, useAIbleDonePlaying, useAIbleCurrentGameDonePlaying, encogCurrentGameDonePlaying) {

        try{

            var def = $.Deferred();

            SESSION_COUNTER = 0;
            CURR_SESSION_COUNT = 0;

            USER_TOKEN = userToken;
            numSessions = sessions;

            donePlaying(false);
            disableSettingsControls(true);

            USEAIBLE_DONE_PLAYING = useAIbleDonePlaying;
            DONE_PLAYING = donePlaying;

            USEAIBLE_CURRENT_GAME_DONE = useAIbleCurrentGameDonePlaying;
            ENCOG_CURRENT_GAME_DONE = encogCurrentGameDonePlaying;

            if (ENCOG_CURRENT_GAME_DONE) {
                ENCOG_CURRENT_GAME_DONE(false);
            }

            IS_HEAD_TO_HEAD = USEAIBLE_CURRENT_GAME_DONE ? true : false;

            self.MoveList = [];

            //client = new Paho.MQTT.Client("dev.useaible.com", 61614, repo.GenerateGUID());
            client3 = new Paho.MQTT.Client(MQTT_URL, MQTT_PORT, repo.GenerateGUID());

            client3.onConnectionLost = function (msg) {

                console.log(msg.errorMessage);

                //donePlaying(true);
                //disableSettingsControls(false);
            };

            client3.onMessageArrived = function (msg) {

                var destinationName = msg.destinationName;

                var mazeOutputsRoute = userToken + "/encog/maze/simulation_output";

                if (destinationName == mazeOutputsRoute) {

                    SESSION_COUNTER++;

                    if (IS_HEAD_TO_HEAD) {
                        if (SESSION_COUNTER == 1) {
                            ENCOG_CURRENT_GAME_DONE(true);
                        } else {
                            if (!CURRENTLY_PLAYING) {
                                ENCOG_CURRENT_GAME_DONE(true);
                            }
                        }
                    }

                    var output = eval("(" + msg.payloadString + ")");

                    var outputObj = {
                        Moves: output.Directions,
                        BatchDone: ko.observable(false),
                        Session: SESSION_COUNTER,
                        SessionScore: output.Score
                    };

                    self.MoveList.push(outputObj);

                    //var sessDataObj = {
                    //    Id: SESSION_COUNTER,
                    //    Score: output.Score,
                    //    Type: ko.observable('encog'),
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


                    if (!IS_HEAD_TO_HEAD) {
                        self.StartGame(self.StartGame() ? false : true);
                    }
                }

            };

            client3.connect({
                keepAliveInterval: 1800,
                timeout: 10000,
                onFailure: function (fl) {
                    console.log(fl.errorMessage);
                },
                onSuccess: function () {

                    sessionCount = 0;
                    disableSettingsControls(true);

                    $("#loadingMazeEncog").text("Loading data....");

                    client3.subscribe(userToken + "/encog/mazeMove");
                    client3.subscribe(userToken + "/mazeSessionScores");
                    client3.subscribe(userToken + "/mazeEpochScores");
                    client3.subscribe(userToken + "/encog/maze/simulation_output");

                    console.log("subscribed to mazeMove");

                    maze.Name = "Maze";

                    var neuronInputs = $.map(self.HiddenLayerNeuronsInputs(), function (neuron, i) {
                        return neuron.NeuronCount();
                    });

                    var mazeParams = {
                        MazeInfo: maze,
                        NumSessions: sessions,
                        Settings: settings,
                        HiddenLayerNeurons: self.HiddenLayerNeurons(),
                        TrainingMethodType: self.TrainingMethodType(),
                        Cycles: self.Cycles(),
                        StartTemp: self.StartTemp(),
                        StopTemp: self.StopTemp(),
                        PopulationSize: self.PopulationSize(),
                        Epochs: self.Epochs(),
                        MinRandom: self.MinRandom(),
                        MaxRandom: self.MaxRandom(),
                        HiddenLayerNeuronsInputs: neuronInputs
                    };

                    repo.PlayMazeEncog(userToken, sessions, mazeParams).done(function (res) {

                        console.log("Encog maze playing...");
                        def.resolve();

                    });
                }
            });
        } catch (exception) {
            console.log(exception);
        }

        return def;
    };

    var getSessionScores = function () {

        var def = $.Deferred();

        var counter = 0;
        $.each(self.EncogSessionScores, function (index_score, value_score) {
                        
            counter++;
            var sessDataObj = {
                Id: index_score + 1,
                Score: ko.observable(value_score),
                Type: ko.observable('encog'),
                Playing: ko.observable(false),
                Done: ko.observable(true)
            };

            sessDataObj.Icon = ko.observable();

            self.TempSessionData.push(sessDataObj);

            if (counter == self.EncogSessionScores.length) {
                def.resolve();
            }
        });

        return def;
    };

    var renderScores = function () {

        if (self.EncogSessionScores.length > 0) {
            var score = self.EncogSessionScores.shift();

            var sessDataObj = {
                Id: sessionData().length + 1,
                Score: ko.observable(score),
                Type: ko.observable('encog'),
                Playing: ko.observable(false),
                Done: ko.observable(true)
            };
            sessDataObj.Icon = ko.observable();

            sessionData.push(sessDataObj);
            setTimeout(renderScores, 50);
        }
    };

}
