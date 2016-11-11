
var canvas = document.getElementById("useaible");
var context = canvas.getContext("2d");

var canvas2 = document.getElementById("tensorflow");
var mazeContext2 = canvas2.getContext("2d");

var canvas3 = document.getElementById("encog");
var mazeContext3 = canvas3.getContext("2d");

var currRectX = 425;
var currRectY = 3;

var pixelMultiplier = 10;
var mazeWidth = 50;
var mazeHeight = 50;


var intervalVar;
var mazeData = {};
var startingPosition;
var goalPosition;
var USER_TOKEN;

function MainVM() {

    var self = this;

    self.useAIbleMazeMaster = ko.observable();
    self.TensorflowMazeMaster = ko.observable();
    self.EncogMazeMaster = ko.observable(new EncogMazeMaster());

    self.CurrentCanvas = ko.observable();
    self.CurrentCanvasCtx = ko.observable();

    self.CurX = ko.observable();
    self.CurY = ko.observable();

    self.Maze2X = ko.observable();
    self.Maze2Y = ko.observable();

    self.Maze3X = ko.observable();
    self.Maze3Y = ko.observable();

    self.headTohead = ko.observable(false);
    self.gameContainer = ko.observable();

    self.SpeedOptions = ko.observableArray([{ Id: 30, Text: 'Faster' }, { Id: 45, Text: 'Fast' }, { Id: 60, Text: 'Normal' }, { Id: 75, Text: 'Slow' }, { Id: 90, Text: 'Slower' }]);
    self.Speed = ko.observable(self.SpeedOptions()[2]);

    self.HeadToHeadOptions = ko.observableArray(
        [
            { Id: 'useAIble-tensorflow', Name: 'useAIble vs Tensor Flow' },
            { Id: 'useAIble-encog', Name: 'useAIble vs Encog' }
        ]);
    self.SelectedHeadToHeadOption = ko.observable(null);
    self.ShowHeadToHeadOptions = ko.observable(false);

    self.PlayerOptions = ko.observableArray([{ Id: 1, Name: "Human" }, { Id: 2, Name: "useAIble" }, { Id: 3, Name: "Tensor Flow" }, { Id: 5, Name: 'Encog' }, { Id: 4, Name: "Head-To-Head" }]);
    self.SelectedPlayerOption = ko.observable(self.PlayerOptions()[0]);
    self.SelectedPlayerOption.subscribe(function (val) {

        self.useAIbleShowChartBtn(false);
        self.TensorFlowShowChartBtn(false);
        self.EncogShowChartBtn(false);

        $("#selected-player-hidden-input-maze").val(val.Name);

        $("#player-error").text("");
        
        if (val.Name == 'useAIble' || val.Name == 'Tensor Flow' || val.Name == 'Encog' || val.Name == 'Human') {

            self.useAIbleMazeMaster(new UseAIbleMazeMaster(drawRectangle, self.MazeGenerated, move, resetPosition, self.SessionData, self.useAIbleDonePlaying, self.Speed, self.CurrentCanvasCtx, self.CurX, self.CurY, self.useAIbleShowChartBtn, showComparisonChart));
            self.EncogMazeMaster(new EncogMazeMaster(drawRectangle, self.MazeGenerated, move, resetPosition, self.SessionData, self.EncogDonePlaying, self.Speed, self.CurrentCanvasCtx, self.Maze3X, self.Maze3Y, self.EncogShowChartBtn, showComparisonChart));
            self.TensorflowMazeMaster(new TFMazeMaster(drawRectangle, self.MazeGenerated, move, resetPosition, self.SessionData, self.TensorFlowDonePlaying, self.Speed, self.CurrentCanvasCtx, self.Maze2X, self.Maze2Y, self.TensorFlowShowChartBtn, showComparisonChart));

            $("#secondTab2").empty();

        }

        if (val.Name == 'useAIble' || val.Name == 'Human') {

            self.CurrentCanvas(canvas);
            self.CurrentCanvasCtx(context);

            self.headTohead(false);
            self.gameContainer("col-md-12x");

            self.ShowHeadToHeadOptions(false);
            self.SelectedHeadToHeadOption(null);

            MaximizeSidebar();

            $("#useAIble-canvas-container").show();
            $("#tensorflow-canvas-container").hide();
            $("#encog-canvas-container").hide();

        } else if (val.Name == 'Tensor Flow' || val.Name == 'Human') {

            self.CurrentCanvas(canvas2);
            self.CurrentCanvasCtx(mazeContext2);

            self.headTohead(false);
            self.gameContainer("col-md-12x");

            self.ShowHeadToHeadOptions(false);
            self.SelectedHeadToHeadOption(null);

            MaximizeSidebar();

            $("#useAIble-canvas-container").hide();
            $("#tensorflow-canvas-container").show();
            $("#encog-canvas-container").hide();

        } else if (val.Name == 'Encog' || val.Name == 'Human') {

            self.EncogMazeMaster().SelectedNumberOfNeuronOption(1);

            self.CurrentCanvas(canvas3);
            self.CurrentCanvasCtx(mazeContext3);

            self.headTohead(false);
            self.gameContainer("col-md-12x");

            self.ShowHeadToHeadOptions(false);
            self.SelectedHeadToHeadOption(null);

            self.EncogMazeMaster().SelectedTrainingMethod(self.EncogMazeMaster().EncogTrainingMethods()[1]);

            MaximizeSidebar();

            $("#useAIble-canvas-container").hide();
            $("#tensorflow-canvas-container").hide();
            $("#encog-canvas-container").show();

        } else if (val.Name == 'Head-To-Head') {

            $(".sessionContainer").hide();

            $("#useAIble-canvas-container").show();
            $("#tensorflow-canvas-container").show();
            $("#encog-canvas-container").show();

            self.headTohead(true);
            self.gameContainer("col-md-6");

            self.ShowHeadToHeadOptions(true);
            self.SelectedHeadToHeadOption(self.HeadToHeadOptions()[0]);

            self.useAIbleMazeMaster(new UseAIbleMazeMaster(drawRectangle, self.MazeGenerated, move, resetPosition, self.SessionData, self.useAIbleDonePlaying, self.Speed, ko.observable(context), self.CurX, self.CurY, self.useAIbleShowChartBtn, showComparisonChart));
            self.EncogMazeMaster(new EncogMazeMaster(drawRectangle, self.MazeGenerated, move, resetPosition, self.SessionData, self.EncogDonePlaying, self.Speed, ko.observable(mazeContext3), self.Maze3X, self.Maze3Y, self.EncogShowChartBtn, showComparisonChart));
            self.TensorflowMazeMaster(new TFMazeMaster(drawRectangle, self.MazeGenerated, move, resetPosition, self.SessionData, self.TensorFlowDonePlaying, self.Speed, ko.observable(mazeContext2), self.Maze2X, self.Maze2Y, self.TensorFlowShowChartBtn, showComparisonChart));

            self.EncogMazeMaster().SelectedTrainingMethod(self.EncogMazeMaster().EncogTrainingMethods()[1]);

            var getSelectedHead2HeadOption = function () {

                if (self.SelectedHeadToHeadOption()) {
                    if (self.SelectedHeadToHeadOption().Id == 'useAIble-tensorflow') {

                        $("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                        $("#encog-canvas-container").detach().appendTo(".mainCanvas");

                        $('#tensorflow-canvas-container').show();
                        $('#useAIble-canvas-container').show();
                        $('#encog-canvas-container').hide();

                    } else if (self.SelectedHeadToHeadOption().Id == 'useAIble-encog') {

                        self.EncogMazeMaster().SelectedNumberOfNeuronOption(1);

                        $("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                        $("#encog-canvas-container").detach().appendTo(".mainCanvas");

                        $('#tensorflow-canvas-container').hide();
                        $('#useAIble-canvas-container').show();
                        $('#encog-canvas-container').show();

                    }
                } else {

                    var currPlayer = self.SelectedPlayerOption().Name;
                    if (currPlayer == 'useAIble') {

                        $("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                        $("#encog-canvas-container").detach().appendTo(".mainCanvas");

                        $('#tensorflow-canvas-container').hide();
                        $('#useAIble-canvas-container').show();
                        $('#encog-canvas-container').hide();

                    } else if (currPlayer == 'Tensor Flow') {

                        $("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                        $("#encog-canvas-container").detach().appendTo(".mainCanvas");

                        $('#tensorflow-canvas-container').show();
                        $('#useAIble-canvas-container').hide();
                        $('#encog-canvas-container').hide();

                    } else if (currPlayer == 'Encog') {

                        self.EncogMazeMaster().SelectedNumberOfNeuronOption(1);

                        $("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                        $("#encog-canvas-container").detach().appendTo(".mainCanvas");

                        $('#tensorflow-canvas-container').hide();
                        $('#useAIble-canvas-container').hide();
                        $('#encog-canvas-container').show();
                    }
                }

            };

            self.SelectedHeadToHeadOption.subscribe(function (selectedHeadToHead) {

                if (selectedHeadToHead) {

                    $("#selected-head2head-options-hidden-input-maze").val(selectedHeadToHead.Id);

                    getSelectedHead2HeadOption();
                    MinimizeSidebar();
                }

            });

            getSelectedHead2HeadOption();
            MinimizeSidebar();

            $("#tensorflow-table-container-maze").detach().appendTo("#secondTab2");
            $("#encog-table-container-maze").detach().appendTo("#secondTab2");

        }

        if (self.MazeCreated()) {
            self.GenerateMaze();
        }

    });

    self.MazeCreated = ko.observable(false);
    self.MazeGenerated = ko.observable(false);
    self.MazeGenerated.subscribe(function () {

        startingPosition = self.useAIbleMazeMaster().MazeGridData.StartingPosition;
        goalPosition = self.useAIbleMazeMaster().MazeGridData.GoalPosition;

        if (self.SelectedPlayerOption().Name != 'Head-To-Head') {

            self.CurrentCanvas().setAttribute("width", self.SelectedMazeDimension().Value * pixelMultiplier);
            self.CurrentCanvas().setAttribute("height", self.SelectedMazeDimension().Value * pixelMultiplier);

            createMaze();

        } else {

            // useAIble
            canvas.setAttribute("width", self.SelectedMazeDimension().Value * pixelMultiplier);
            canvas.setAttribute("height", self.SelectedMazeDimension().Value * pixelMultiplier);

            // Tensorflow
            canvas2.setAttribute("width", self.SelectedMazeDimension().Value * pixelMultiplier);
            canvas2.setAttribute("height", self.SelectedMazeDimension().Value * pixelMultiplier);

            // Encog
            canvas3.setAttribute("width", self.SelectedMazeDimension().Value * pixelMultiplier);
            canvas3.setAttribute("height", self.SelectedMazeDimension().Value * pixelMultiplier);

            // Tensorflow
            self.Maze2X(startingPosition.X * pixelMultiplier);
            self.Maze2Y(startingPosition.Y * pixelMultiplier);

            // Encog
            self.Maze3X(startingPosition.X * pixelMultiplier);
            self.Maze3Y(startingPosition.Y * pixelMultiplier);

            createMaze();
        }

        //mazeData = useAIbleMazeMaster.MazeGrid;

        // useAIble
        self.CurX(startingPosition.X * pixelMultiplier);
        self.CurY(startingPosition.Y * pixelMultiplier);

        // Tensorflow
        self.Maze2X(startingPosition.X * pixelMultiplier);
        self.Maze2Y(startingPosition.Y * pixelMultiplier);

        // Encog
        self.Maze3X(startingPosition.X * pixelMultiplier);
        self.Maze3Y(startingPosition.Y * pixelMultiplier);



        self.MazeCreated(true);

    });

    self.SessionData = ko.observableArray([]);
    self.useAIbleDonePlaying = ko.observable(true);
    self.TensorFlowDonePlaying = ko.observable(true);
    self.EncogDonePlaying = ko.observable(true);

    self.useAIbleDonePlaying.subscribe(function (val) {
        //alert('useAIble-'+ val);
    });

    self.EncogDonePlaying.subscribe(function (val) {
        //alert('encog-' + val);
    });

    //self.DonePlaying = ko.computed(function () {
    //    if (self.SelectedPlayerOption().Name == 'Head-To-Head') {

    //        if (self.useAIbleDonePlaying() && self.TensorFlowDonePlaying() && self.EncogDonePlaying()) {
    //            if (self.SessionData()) {
    //                if (self.SessionData().length > 0) {
    //                    $(".outer-chart-container").show();
    //                    showComparisonChart(self.SessionData());
    //                    return true;
    //                }
    //            }
    //            return true;
    //        } else {
    //            return false;
    //        }

    //        //return self.useAIbleDonePlaying() && self.TensorFlowDonePlaying();
    //    } else {
    //        if (self.SelectedPlayerOption().Name == 'useAIble' || self.SelectedPlayerOption().Name == 'Human') {

    //            if (self.useAIbleDonePlaying() ) {
    //                if (self.SessionData()) {
    //                    if (self.SessionData().length > 0) {
    //                        $(".outer-chart-container").show();
    //                        showComparisonChart(self.SessionData());
    //                        return true;
    //                    }
    //                }
    //                return true;
    //            } else {
    //                return false;
    //            }

    //            //return self.useAIbleDonePlaying();
    //        } else if (self.SelectedPlayerOption().Name == 'Tensor Flow') {

    //            if (self.TensorFlowDonePlaying() == true) {
    //                if (self.SessionData()) {
    //                    if (self.SessionData().length > 0) {
    //                        $(".outer-chart-container").show();
    //                        showComparisonChart(self.SessionData());
    //                        return true;
    //                    }
    //                }
    //                return true;
    //            } else {
    //                return false;
    //            }

    //            //return self.TensorFlowDonePlaying();
    //        } else if (self.SelectedPlayerOption().Name == 'Encog') {

    //            if (self.EncogDonePlaying() == true) {
    //                if (self.SessionData()) {
    //                    if (self.SessionData().length > 0) {
    //                        $(".outer-chart-container").show();
    //                        showComparisonChart(self.SessionData());
    //                        return true;
    //                    }
    //                }
    //                return true;
    //            } else {
    //                return false;
    //            }

    //            //return self.TensorFlowDonePlaying();
    //        }
    //    }
    //});

    self.useAIbleSelected = ko.computed(function () {
        return self.SelectedPlayerOption().Name == 'useAIble' || self.SelectedPlayerOption().Name == 'Head-To-Head';
    });

    self.TensorflowSelected = ko.computed(function () {

        var isTensorflow = self.SelectedPlayerOption().Name == 'Tensor Flow';
        var isH2HTensorflow = false;

        if (self.SelectedHeadToHeadOption()) {
            isH2HTensorflow = self.SelectedHeadToHeadOption().Id == 'useAIble-tensorflow' ? true : false;
        }

        return isTensorflow || isH2HTensorflow;
    });

    self.EncogSelected = ko.computed(function () {

        var isEncog = self.SelectedPlayerOption().Name == 'Encog';
        var isH2HEncog = false;

        if (self.SelectedHeadToHeadOption()) {
            isH2HEncog = self.SelectedHeadToHeadOption().Id == 'useAIble-encog' ? true : false;
        }

        return isEncog || isH2HEncog;
    });

    self.HeadToHeadSelected = ko.computed(function () {
        return self.SelectedPlayerOption().Name == 'Head-To-Head';
    });

    self.Init = function () {

        self.SelectedPlayerOption(self.PlayerOptions()[0]);
        self.useAIbleMazeMaster().GetToken().done(function (token_res) {
            USER_TOKEN = token_res;
            self.SelectedMazeDimension(self.MazeDimensionOptions()[0]);
        });
    };

    self.MazeDimensionOptions = ko.observableArray([
        { Value: 8, Name: "8x8" },
        { Value: 10, Name: "10x10" },
        { Value: 12, Name: "12x12" },
        { Value: 20, Name: "20x20" },
        { Value: 30, Name: "30x30" },
        { Value: 40, Name: "40x40" },
        { Value: 50, Name: "50x50" }]);

    self.SelectedMazeDimension = ko.observable();
    self.SelectedMazeDimension.subscribe(function (val) {
        self.useAIbleMazeMaster().GenerateMaze(USER_TOKEN, val.Value);
        $("#maze-dimension-error").text("");
    });

    self.GenerateMaze = function () {
        self.useAIbleMazeMaster().GenerateMaze(USER_TOKEN, self.SelectedMazeDimension().Value);
    };

    var minimizeSettings = function () {
        $(".sidebarPanel, .newSideBar").addClass("minimized");
        $(".sidebarPanel .panel-body, .newSideBar .panel-body").fadeOut("slow", "linear");
    };

    self.PlayMaze = function () {

        var player = self.SelectedPlayerOption().Name;

        if (!self.SelectedMazeDimension()) {
            $("#maze-dimension-error").text("Please select preferred maze dimension");
        } else if (!self.MazeCreated()) {
            $("#maze-dimension-error").text("Please generate a maze");
        } else if (self.SelectedPlayerOption().Name == 'Human') {
            $("#player-error").text("Use arrow keys to play as human");
        }
        else {

            if (player == "useAIble") {
                playUseAIbleMaze();
            } else if (player == "Tensor Flow") {
                playTensorFlowMaze();
            } else if (player == "Encog") {
                playEncogMaze();
            }
            else if (player == "Head-To-Head") {

                var h2hPlayer = self.SelectedHeadToHeadOption().Id;

                if (h2hPlayer == 'useAIble-tensorflow') {
                    playUseAIbleMaze(self.TensorFlowDonePlaying);
                    playTensorFlowMaze(self.useAIbleDonePlaying);
                    minimizeSettings();
                } else if (h2hPlayer == 'useAIble-encog') {
                    playUseAIbleMaze(self.EncogDonePlaying);
                    playEncogMaze(self.useAIbleDonePlaying);
                    minimizeSettings();
                }

            }
        }

    };

    self.ReplayReady = ko.computed(function () {
        //if (self.useAIbleMazeMaster() != undefined) {
        //    return self.useAIbleMazeMaster().DonePlaying();
        //}
    });

    self.ReplayGame = function (caller, root) {

        var player = self.SelectedPlayerOption().Name;

        if (player == 'useAIble') {
            self.useAIbleMazeMaster().ReplayGame();
        } else if (player == 'Tensor Flow') {
            self.TensorflowMazeMaster().PlaySolution();
        } else if (player == 'Head-To-Head') {

            var h2hPlayer = self.SelectedHeadToHeadOption().Id;

            if (h2hPlayer == 'useAIble-tensorflow') {
                self.useAIbleMazeMaster().ReplayGame();
                self.TensorflowMazeMaster().PlaySolution();
            } else if (h2hPlayer == 'useAIble-encog') {
                self.useAIbleMazeMaster().ReplayGame();
                self.EncogMazeMaster().ReplayGame();
            }

            CloseSidebar();
        }
    };

    var createMaze = function () {

        var output = self.useAIbleMazeMaster().MazeGridData;

        var grid = output.Grid;
        var goalPosition = output.GoalPosition;
        var startingPosition = output.StartingPosition;

        $.each(grid, function (index, rows) {

            $.each(rows, function (index2, col) {

                var x = index * pixelMultiplier;
                var y = index2 * pixelMultiplier;

                mazeData[x + "-" + y] = col;

                if (self.SelectedPlayerOption().Name != 'Head-To-Head') {
                    drawRectangle(self.CurrentCanvasCtx, x, y, col == true ? 'black' : 'white');
                } else {
                    drawRectangle(ko.observable(context), x, y, col == true ? 'black' : 'white');
                    drawRectangle(ko.observable(mazeContext2), x, y, col == true ? 'black' : 'white');
                    drawRectangle(ko.observable(mazeContext3), x, y, col == true ? 'black' : 'white');
                }

            });

        });

        if (self.SelectedPlayerOption().Name != 'Head-To-Head') {
            drawRectangle(self.CurrentCanvasCtx, goalPosition.X * pixelMultiplier, goalPosition.Y * pixelMultiplier, 'red');
            drawRectangle(self.CurrentCanvasCtx, startingPosition.X * pixelMultiplier, startingPosition.Y * pixelMultiplier, 'violet');
        } else {
            drawRectangle(ko.observable(context), goalPosition.X * pixelMultiplier, goalPosition.Y * pixelMultiplier, 'red');
            drawRectangle(ko.observable(context), startingPosition.X * pixelMultiplier, startingPosition.Y * pixelMultiplier, 'violet');

            drawRectangle(ko.observable(mazeContext2), goalPosition.X * pixelMultiplier, goalPosition.Y * pixelMultiplier, 'red');
            drawRectangle(ko.observable(mazeContext2), startingPosition.X * pixelMultiplier, startingPosition.Y * pixelMultiplier, 'violet');

            drawRectangle(ko.observable(mazeContext3), goalPosition.X * pixelMultiplier, goalPosition.Y * pixelMultiplier, 'red');
            drawRectangle(ko.observable(mazeContext3), startingPosition.X * pixelMultiplier, startingPosition.Y * pixelMultiplier, 'violet');
        }

    };

    var playUseAIbleMaze = function (player2) {

        self.SessionData([]);

        var NUM_SESSIONS = self.NumberOfSessions();
        var S_RANDOMNESS = self.StartRandomness();
        var E_RANDOMNESS = self.EndRandomness();
        var MIN_BRACKET = self.MinLinearBracket();
        var MAX_BRACKET = self.MaxLinearBracket();
        var NUM_SESSION_RANDOMNESS = self.NumSessionRandomness();

        if (self.NetworkSettings().length == 0) {
            self.NetworkSettings.push(new RNNCoreSettings(1, self.StartRandomness(), self.EndRandomness(), 0, 0, 1, self.NumberOfSessions()));
        }

        var settings = self.NetworkSettings();

        self.useAIbleMazeMaster().Play(USER_TOKEN, NUM_SESSIONS, self.useAIbleMazeMaster().MazeGridData, settings, player2);
    };

    var playEncogMaze = function (player1) {

        self.SessionData([]);

        var NUM_SESSIONS = self.NumberOfSessions();
        var S_RANDOMNESS = self.StartRandomness();
        var E_RANDOMNESS = self.EndRandomness();
        var MIN_BRACKET = self.MinLinearBracket();
        var MAX_BRACKET = self.MaxLinearBracket();
        var NUM_SESSION_RANDOMNESS = self.NumSessionRandomness();

        var settings = self.NetworkSettings();

        self.EncogMazeMaster().Play(USER_TOKEN, NUM_SESSIONS, self.useAIbleMazeMaster().MazeGridData, settings, player1);
    };

    var playTensorFlowMaze = function (player1) {

        self.SessionData([]);

        self.TensorflowMazeMaster().Init(USER_TOKEN).done(function () {

            var NUM_SESSIONS = eval($("#sessionInput").val());
            var settings = {
                Sessions: NUM_SESSIONS,
                RandomActionProb: self.RandomActionProb(),
                RandomActionDecay: self.RandomActionDecay(),
                Hidden1Size: self.Hidden1Size(),
                Hidden2Size: self.Hidden2Size(),
                LearningRate: self.LearningRate(),
                MiniBatchSize: self.MiniBatchSize(),
                DiscountFactor: self.DiscountFactor(),
                TargetUpdateFreq: self.TargetUpdateFreq(),
                Maze: self.useAIbleMazeMaster().MazeGridData
            };

            self.TensorflowMazeMaster().StartSession(settings, player1);
        });
    };

    self.Max = ko.observable(50);
    self.Min = ko.observable(0);

    self.Values = ko.computed({
        read: function () {
            return [self.Min(), self.Max()];
        },
        write: function (newValues) {
            self.Min(newValues[0]);
            self.Max(newValues[1]);
        },
        owner: this
    });

    self.RangeText = ko.computed(function () {
        var min = self.Min();
        var max = self.Max();

        if (min == max) {
            return max + "%";
        } else {
            return min + "% ~ " + max + "%";
        }
    });


    // useAIble Settings
    self.useAIbleSettings = ko.observable();
    self.NumberOfSessions = ko.observable(100);
    self.NumSessionRandomness = ko.observable(self.NumberOfSessions());

    self.NumberOfSessions.subscribe(function (val) {
        
        self.NumSessionRandomness(val);

        self.NetworkSettings([]);

        var totalSessions = self.NumberOfSessions();
        var nextStartRange = totalSessions + 1;

        self.NetworkSettings.push(new RNNCoreSettings(1, self.StartRandomness(), self.EndRandomness(), 0, 0, 1, totalSessions));

    });

    self.StartRandomness = ko.observable(100);
    self.EndRandomness = ko.observable(0);

    self.Randomness = ko.computed({
        read: function () {
            return [self.StartRandomness(), self.EndRandomness()];
        },
        write: function (newValue) {
            self.StartRandomness(newValue[0]);
            self.EndRandomness(newValue[1]);
        }
    });

    self.MaxLinearBracket = ko.observable(15);
    self.MinLinearBracket = ko.observable(3);

    self.LinearBrackets = ko.computed({
        read: function () {
            return [self.MaxLinearBracket(), self.MinLinearBracket()];
        },
        write: function (newValue) {
            self.MaxLinearBracket(newValue[0]);
            self.MinLinearBracket(newValue[1]);
        }
    });

    self.WaitTimeElapse = ko.observable(0);
    self.WaitTimeElapseUseAible = ko.observable(0);
    self.WaitTimeElapseTF = ko.observable(0);

    self.IdArray = ko.observableArray();

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

        var S_RANDOMNESS = mainVM.StartRandomness();
        var E_RANDOMNESS = mainVM.EndRandomness();
        var MIN_BRACKET = mainVM.MinLinearBracket();
        var MAX_BRACKET = mainVM.MaxLinearBracket();
        var NUM_SESSION_RANDOMNESS = mainVM.NumSessionRandomness();

        var len = self.NetworkSettings().length;
        var startCycle = len > 0 ? lastRandomness().EndSessionRandomness() + 1 : 1;
        var endCycle = eval(NUM_SESSION_RANDOMNESS);
        var rstart = eval(S_RANDOMNESS);
        var rend = eval(E_RANDOMNESS);
        var maxLin = eval(MAX_BRACKET);
        var minLin = eval(MIN_BRACKET);

        var id = lastRandomness().Id() + 1;

        if (startCycle > endCycle) {
            $("#multiSettingsErr").text("Number of session randomness must be greater than " + startCycle);
            return false;
        } else {

            var numSessions = mainVM.NumberOfSessions();

            if (endCycle + 1 < numSessions) {
                $("#sessionRandomnessSlider").slider("option", "min", endCycle + 1);
                $("#sessionRandomnessSlider").slider("value", endCycle + 1);
            }

            self.NetworkSettings.push(new RNNCoreSettings(id, rstart, rend, maxLin, minLin, startCycle, endCycle));
        }
    };

    self.RemoveSettings = function (setting) {
        self.NetworkSettings.remove(setting);
    };

    self.ReplayButton = ko.observable(false);
    self.TfPlayGame = function () {
        if (self.SelectedPlayerOption().Name == 'Tensor Flow') {
            tfClient.PlaySolution();
            self.ReplayButton(true);
        } else if (self.SelectedPlayerOption().Name == 'useAIble') {

            mainVM.EnableStartButton(false);
            self.ReplayButton(true);

            mq.ReplayGame();
        } else if (self.SelectedPlayerOption().Name == 'Head-To-Head') {
            tfClient.PlaySolution();
            mainVM.EnableStartButton(false);
            self.ReplayButton(true);

            mq.ReplayGame();
        }
    };

    self.RandomActionProb = ko.observable(0.9);
    self.RandomActionDecay = ko.observable(0.99);
    self.Hidden1Size = ko.observable(200);
    self.Hidden2Size = ko.observable(100);
    self.LearningRate = ko.observable(0.002);
    self.MiniBatchSize = ko.observable(50);
    self.DiscountFactor = ko.observable(0.9);
    self.TargetUpdateFreq = ko.observable(300);

    self.ChartViewOptions = ko.observableArray([{ Id: 1, Text: "Default" }, { Id: 20, Text: "Per 20 Sessions" }, { Id: 50, Text: "Per 50 Sessions" }, { Id: 100, Text: "Per 100 Sessions" }, { Id: 150, Text: "Per 150 Sessions" },
        { Id: 200, Text: "Per 200 Sessions" }]);
    self.SelectedChartViewOption = ko.observable(self.ChartViewOptions()[3]);
    self.SelectedChartViewOption.subscribe(function (val) {
        showComparisonChart(self.SessionData());
    });

    self.FromChartPage = ko.observable(0);
    self.ToChartPage = ko.observable(99);

    self.PreviousChartPage = function () {
        if (self.FromChartPage() > 0) {
            self.FromChartPage(self.FromChartPage() - 99);
            self.ToChartPage(self.FromChartPage() + 99);
        }

        showComparisonChart(self.SessionData());
    };

    self.NextChartPage = function () {

        var sessions = eval($("#sessionInput").val());

        if (self.ToChartPage() < sessions) {
            self.FromChartPage(self.ToChartPage());
            self.ToChartPage(self.ToChartPage() + 99);
        }
        showComparisonChart(self.SessionData());
    };

    self.NUMBER_OF_CHART_POINTS = ko.observable(0);

    self.useAIbleAvgScore = ko.observable(0);
    self.useAIbleHighestScore = ko.observable(0);
    self.useAIbleLearnedAfter = ko.observable(0);

    self.TensorFlowAvgScore = ko.observable(0);
    self.TensorFlowHighestScore = ko.observable(0);
    self.TensorFlowLearnedAfter = ko.observable(0);

    self.EncogAvgScore = ko.observable(0);
    self.EncogHighestScore = ko.observable(0);
    self.EncogLearnedAfter = ko.observable(0);

    self.useAIbleShowChartBtn = ko.observable(false);
    self.TensorFlowShowChartBtn = ko.observable(false);
    self.EncogShowChartBtn = ko.observable(false);

    self.ShowChartBtn = ko.computed(function () {
        if (self.SelectedPlayerOption().Name == 'Head-To-Head') {

            if (self.SelectedHeadToHeadOption()) {

                var h2h = self.SelectedHeadToHeadOption().Id;

                if (h2h == 'useAIble-tensorflow') {
                    return self.useAIbleShowChartBtn() && self.TensorFlowShowChartBtn();
                } else if (h2h == 'useAIble-encog') {
                    return self.useAIbleShowChartBtn() && self.EncogShowChartBtn();
                }
            } else {
                return false;
            }

        } else if (self.SelectedPlayerOption().Name == 'useAIble') {
            return self.useAIbleShowChartBtn();
        } else if (self.SelectedPlayerOption().Name == 'Tensor Flow') {
            return self.TensorFlowShowChartBtn();
        } else if (self.SelectedPlayerOption().Name == 'Encog') {
            return self.EncogShowChartBtn();
        } else {
            return false;
        }
    });

    self.IsLogistic = ko.observable(false);
}

function showComparisonChart(gameQueue) {

    var useAIbleScores = [];
    var useAIbleSessions = [];

    var tensorFlowScores = [];
    var tensorFlowSessions = [];

    var encogScores = [];
    var encogSessions = [];

    $.each(gameQueue, function (i, v) {

        if (v.Type() == 'useAIble') {

            useAIbleScores.push(v.Score());
            useAIbleSessions.push(v.Id);

        } else if (v.Type() == 'tensorFlow') {

            tensorFlowScores.push(v.Score());
            tensorFlowSessions.push(v.Id);

        } else if (v.Type() == 'encog') {

            encogScores.push(v.Score);
            encogSessions.push(v.Id);
        }

    });

    var useAIbleChartData = {
        Name: "useAIble",
        Scores: useAIbleScores,
        Sessions: useAIbleSessions
    };

    var tensorFlowChartData = {
        Name: "Google Tensor Flow",
        Scores: tensorFlowScores,
        Sessions: tensorFlowSessions
    };

    var encogChartData = {
        Name: "Encog",
        Scores: encogScores,
        Sessions: encogSessions
    };

    var chartData = {
        useAIble: useAIbleChartData,
        TensorFlow: tensorFlowChartData,
        Encog: encogChartData
    };

    var summary = {
        useAIbleAvgScore: mainVM.useAIbleAvgScore,
        useAIbleHighestScore: mainVM.useAIbleHighestScore,
        useAIbleLearnedAfter: mainVM.useAIbleLearnedAfter,

        TensorFlowAvgScore: mainVM.TensorFlowAvgScore,
        TensorFlowHighestScore: mainVM.TensorFlowHighestScore,
        TensorFlowLearnedAfter: mainVM.TensorFlowLearnedAfter,

        EncogAvgScore: mainVM.EncogAvgScore,
        EncogHighestScore: mainVM.EncogHighestScore,
        EncogLearnedAfter: mainVM.EncogLearnedAfter
    };
    
    if (mainVM.SelectedPlayerOption().Name == 'Head-To-Head') {
        createChart(undefined, chartData, mainVM.SelectedChartViewOption(), mainVM.FromChartPage, mainVM.ToChartPage, summary, mainVM.NUMBER_OF_CHART_POINTS, false);
    } else if (mainVM.SelectedPlayerOption().Name == 'useAIble') {
        createChart('useAIble', chartData, mainVM.SelectedChartViewOption(), mainVM.FromChartPage, mainVM.ToChartPage, summary, mainVM.NUMBER_OF_CHART_POINTS, false);
    } else if (mainVM.SelectedPlayerOption().Name == 'Tensor Flow') {
        createChart('tensorFlow', chartData, mainVM.SelectedChartViewOption(), mainVM.FromChartPage, mainVM.ToChartPage, summary, mainVM.NUMBER_OF_CHART_POINTS, false);
    } else if (mainVM.SelectedPlayerOption().Name == 'Encog') {
        createChart('encog', chartData, mainVM.SelectedChartViewOption(), mainVM.FromChartPage, mainVM.ToChartPage, summary, mainVM.NUMBER_OF_CHART_POINTS, false);
    }
}

function drawRectangle(drawingArea, x, y, style) {

    //currRectX = x;
    //currRectY = y;
    drawingArea().beginPath();
    drawingArea().rect(x, y, pixelMultiplier, pixelMultiplier);
    drawingArea().closePath();
    drawingArea().fillStyle = style;
    drawingArea().fill();
}

function clearRectangle(drawingArea, x, y) {
    drawingArea().clearRect(x, y, pixelMultiplier, pixelMultiplier);
}

function resetPosition(drawingArea, X, Y) {
    // clear current position
    clearRectangle(drawingArea, X(), Y());

    if ((X() != (goalPosition.X * pixelMultiplier)) || (Y() != (goalPosition.Y * pixelMultiplier))) {
        drawRectangle(drawingArea, X(), Y(), 'white');
    } else {
        drawRectangle(drawingArea, X(), Y(), 'red');
    }

    // reset position
    X(startingPosition.X * pixelMultiplier);
    Y(startingPosition.Y * pixelMultiplier);

    drawRectangle(drawingArea, X(), Y(), 'violet');
}

var mainVM;
$(document).ready(function () {

    mainVM = new MainVM();

    ko.applyBindings(mainVM);

    mainVM.Init();

    $(".view-chart").on('click', function () {

        showComparisonChart(mainVM.SessionData());

    });

});

function move(drawingArea, direction, currX, currY, pathColor) {
    switch (direction) {
        case "left":
            var curX = currX() - pixelMultiplier;
            var curY = currY();
            var curXVal = mazeData[curX + "-" + curY];

            if (curXVal != undefined && !curXVal) {

                clearRectangle(drawingArea, currX(), currY());
                drawRectangle(drawingArea, currX(), currY(), pathColor);

                currX(curX);

                if (curX == goalPosition.X * pixelMultiplier && curY == goalPosition.Y * pixelMultiplier) {
                    drawRectangle(drawingArea, currX(), currY(), 'red');
                } else {
                    drawRectangle(drawingArea, currX(), currY(), 'violet');
                }

            } else if (curXVal != undefined && curXVal) {

                if (curX == goalPosition.X * pixelMultiplier && curY == goalPosition.Y * pixelMultiplier) {
                    clearRectangle(drawingArea, currX(), currY());
                    drawRectangle(drawingArea, currX(), currY(), 'red');
                    mainVM.DonePlaying(true);
                }

            }

            break;

        case 'up':

            var curX = currX();
            var curY = currY() - pixelMultiplier;
            var curXVal = mazeData[curX + "-" + curY];

            if (curXVal != undefined && !curXVal) {

                clearRectangle(drawingArea, currX(), currY());
                drawRectangle(drawingArea, currX(), currY(), pathColor);

                currY(curY);

                if (curX == goalPosition.X * pixelMultiplier && curY == goalPosition.Y * pixelMultiplier) {
                    drawRectangle(drawingArea, currX(), currY(), 'red');
                } else {
                    drawRectangle(drawingArea, currX(), currY(), 'violet');
                }

            } else if (curXVal != undefined && curXVal) {

                if (curX == goalPosition.X * pixelMultiplier && curY == goalPosition.Y * pixelMultiplier) {
                    clearRectangle(drawingArea, currX(), currY());
                    drawRectangle(drawingArea, currX(), currY(), 'red');
                    mainVM.DonePlaying(true);
                }

            }

            break;

        case 'right':

            var curX = currX() + pixelMultiplier;
            var curY = currY();
            var curXVal = mazeData[curX + "-" + curY];

            if (curXVal != undefined && !curXVal) {

                clearRectangle(drawingArea, currX(), currY());
                drawRectangle(drawingArea, currX(), currY(), pathColor);

                currX(curX);

                if (curX == goalPosition.X * pixelMultiplier && curY == goalPosition.Y * pixelMultiplier) {
                    drawRectangle(drawingArea, currX(), currY(), 'red');
                } else {
                    drawRectangle(drawingArea, currX(), currY(), 'violet');
                }

            } else if (curXVal != undefined && curXVal) {

                if (curX == goalPosition.X * pixelMultiplier && curY == goalPosition.Y * pixelMultiplier) {
                    clearRectangle(drawingArea, currX(), currY());
                    drawRectangle(drawingArea, currX(), currY(), 'red');
                    mainVM.DonePlaying(true);
                }

            }

            break;

        case 'down':

            var curX = currX();
            var curY = currY() + pixelMultiplier;
            var curXVal = mazeData[curX + "-" + curY];

            if (curXVal != undefined && !curXVal) {

                clearRectangle(drawingArea, currX(), currY());
                drawRectangle(drawingArea, currX(), currY(), pathColor);

                currY(curY);

                if (curX == goalPosition.X * pixelMultiplier && curY == goalPosition.Y * pixelMultiplier) {
                    drawRectangle(drawingArea, currX(), currY(), 'red');
                } else {
                    drawRectangle(drawingArea, currX(), currY(), 'violet');
                }

            } else if (curXVal != undefined && curXVal) {

                if (curX == goalPosition.X * pixelMultiplier && curY == goalPosition.Y * pixelMultiplier) {
                    clearRectangle(drawingArea, currX(), currY());
                    drawRectangle(drawingArea, currX(), currY(), 'red');
                    mainVM.DonePlaying(true);
                }

            }

            break;
    }
}

$(document).keydown(function (e) {
    switch (e.which) {
        case 37: // left

            move(context, 'left', mainVM.CurX, mainVM.CurY, 'white');


            break;

        case 38: // up

            move(context, 'up', mainVM.CurX, mainVM.CurY, 'white');

            break;

        case 39: // right

            move(context, 'right', mainVM.CurX, mainVM.CurY, 'white');

            break;

        case 40: // down

            move(context, 'down', mainVM.CurX, mainVM.CurY, 'white');

            break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

$(window).bind('beforeunload', function () {
    if (!mainVM.DonePlaying()) {
        return ' ';
    }
});