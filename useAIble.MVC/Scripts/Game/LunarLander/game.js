//lander image
var shipImage = new Image();
//shipImage.src = "/Content/img/lunarLander/lander.png";
shipImage.src = "/Content/img/lunarLander/newLander.svg";
//<img src="~/Content/img/lunarLander/newLander.svg" />
//background image
var bg = new Image();
bg.src = "/Content/img/lunarLander/lunarBackgroundSVG.svg";

//var ctx = document.getElementById("lunarLander").getContext('2d');


//ctx.canvas.height = 700;
//ctx.canvas.width = 700;
var WIDTH = 700; //ctx.canvas.width;
var HEIGHT = 700; //ctx.canvas.height;
var GRAVITY = 1.62;
var TERMINALVELOCITY = 40;
var THRUST = 10;
var steps = 0;
var startingAltitude = 0;
var horizonalAlignment = WIDTH / 2;
var thrustOn = false;
var score = 0;
var gameIsRunning;
var tfClient;
var mq;
var mqToken;
var encogLander;
   

//var sessions = 1;

//sound effects

var thrusterSound = new Audio("/Content/soundEffects/Rocket%20Thrusters-SoundBible.com-1432176431.mp3");
var crashSound = new Audio("/Content/soundEffects/Bomb-SoundBible.com-891110113.mp3");
var backgroundAudio = new Audio("/Content/soundEffects/Apollo11-%20Lunar%20Landing%20July%2020,%201969%20(mp3cut.net).mp3");
var landingSuccessful = new Audio("/Content/soundEffects/landed.mp3");
backgroundAudio.volume = 1;
crashSound.volume = 0.2;

var INITIAL_ALTITUDE = 10000;
var INITIAL_FUEL = 200;
var CURRENT_ALTITUDE = INITIAL_ALTITUDE;

//function addData() {
//    var self = this;

//    self.sample = ko.observableArray([
//        ]);

//}
//lander object
//var spaceShip = {
//    x: horizonalAlignment,
//    y: startingAltitude,
//    altitude:10000,
//    //width: 30,
//    //height: 30,
//    width: 20,
//    height: 20,
//    fuel: 200,
//    velocity: 0,
//    calculatedWidth: 0,
//    calculatedheigh: 0,
//    currentSprite: 0,
//    flying: true,
//    crashed: false,
//    shipStatus: ""
//}
function NewMainVM() {
    var self = this;
    
    self.gameContainer = ko.observable();
    self.Games = ko.observableArray([]);
    self.game = ko.observable();
    self.headTohead = ko.observable();
    self.Played = ko.observable(false);



    var getSelectedHead2HeadOption = function () {

        var games = self.Games();
        var len = self.Games().length;

        if (self.SelectedHeadToHeadOption()) {
            if (self.SelectedHeadToHeadOption().Id == 'useAIble-tensorflow') {

                //$("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                //$("#encog-canvas-container").detach().appendTo(".mainCanvas");

                //$('#tensorflow-canvas-container').show();
                //$('#useAIble-canvas-container').show();
                //$('#encog-canvas-container').hide();

                self.headTohead(true);
                self.gameContainer("col-md-6");

                //var len = mainVM.IdArray().length;

                //var games = self.Games();
                //var len = self.Games().length;

                for (i = 0; i < len; i++) {
                    if (i === 1) {

                        $("#" + games[1].Id()).appendTo(".newCavas");
                        $("#" + games[1].Id()).show()

                        $("#" + games[2].Id()).hide()
                        //mainVM.IdArray([]);
                        return false;
                    }
                }

            } else if (self.SelectedHeadToHeadOption().Id == 'useAIble-encog') {

                self.SelectedNumberOfNeuronOption(1);

                //$("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                //$("#encog-canvas-container").detach().appendTo(".mainCanvas");

                //$('#tensorflow-canvas-container').hide();
                //$('#useAIble-canvas-container').show();
                //$('#encog-canvas-container').show();

                self.headTohead(true);
                self.gameContainer("col-md-6");

                //var len = mainVM.IdArray().length;

                for (i = 0; i < len; i++) {
                    if (i === 2) {

                        $("#" + games[2].Id()).appendTo(".newCavas");
                        $("#" + games[2].Id()).show()

                        $("#" + games[1].Id()).hide();

                        //mainVM.IdArray([]);
                        return false;
                    }
                }

            }

        } else {

            var currPlayer = self.SelectedPlayerOption().Name;
            if (currPlayer == 'useAIble') {

                //$("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                //$("#encog-canvas-container").detach().appendTo(".mainCanvas");

                //$('#tensorflow-canvas-container').hide();
                //$('#useAIble-canvas-container').show();
                //$('#encog-canvas-container').hide();

            } else if (currPlayer == 'Tensor Flow') {

                //$("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                //$("#encog-canvas-container").detach().appendTo(".mainCanvas");

                //$('#tensorflow-canvas-container').show();
                //$('#useAIble-canvas-container').hide();
                //$('#encog-canvas-container').hide();

            } else if (currPlayer == 'Encog') {

                self.SelectedNumberOfNeuronOption(1);

                //$("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
                //$("#encog-canvas-container").detach().appendTo(".mainCanvas");

                //$('#tensorflow-canvas-container').hide();
                //$('#useAIble-canvas-container').hide();
                //$('#encog-canvas-container').show();
            }
        }

    };

    self.headTohead.subscribe(function (val) {

        var isH2h = false;
        if(val)
        {
            isH2h = true;
            self.Games([new GameVM(), new GameVM(), new GameVM()]);
        }
        else {

            self.Games([]);
            self.game(new GameVM());
            self.Games.push(self.game());

            isH2h = false;
        }

        $.when(loadBg(), loadShip()).done(function (b, s) {
            $.each(self.Games(), function (i, game) {
                game.canvasContext(document.getElementById("" + game.Id() + "").getContext('2d'));
                game.canvasContext().canvas.height = 700;
                game.canvasContext().canvas.width = 700;
                game.canvasContext().drawImage(bg, 200, 400, 400, 400, 0, 0, game.canvasContext().canvas.width, game.canvasContext().canvas.height);
                drawGame(game);
            });
            
            //self.ShowHeadToHeadOptions(true);
            //self.SelectedHeadToHeadOption(self.HeadToHeadOptions()[0]);

            //self.SelectedHeadToHeadOption.subscribe(function (selectedHeadToHead) {

            //    if (selectedHeadToHead) {

            //        //$("#selected-head2head-options-hidden-input-lander").val(selectedHeadToHead.Id);

            //        getSelectedHead2HeadOption();
            //        MinimizeSidebar();
            //    }

            //});

            if (isH2h) {

                self.ShowHeadToHeadOptions(true);
                self.SelectedHeadToHeadOption(self.HeadToHeadOptions()[0]);

                getSelectedHead2HeadOption();

            } else {

                self.ShowHeadToHeadOptions(false);
                self.SelectedHeadToHeadOption(null);

            }
        });
    });

    self.initialize = function () {
        if (self.headTohead()) {
            $.each(self.Games(), function (v, game) {
                game.spaceShip().altitude(self.SelectAltitude());
                game.spaceShip().fuel(self.SelectFuel());
                resetGame(game);
                drawGame(game);
            });
        }
        else {
            self.game().spaceShip().altitude(self.SelectAltitude());
            self.game().spaceShip().fuel(self.SelectFuel());
            resetGame(self.game());
            drawGame(self.game());
        }
        //self.spaceShip().altitude(self.SelectAltitude());
        //self.spaceShip().fuel(self.SelectFuel());
        //resetGame();
    }

    self.AltitudeOptions = ko.observableArray([{ Value: 10000, Name: "10,000m" }, { Value: 5000, Name: "5,000m" }, { Value: 3000, Name: "3,000m" }, { Value: 1000, Name: "1,000m" }, { Value: 500, Name: "500m" }, { Value: 100, Name: "100m" }]);
    self.SelectAltitude = ko.observable();

    self.FuelOptions = ko.observableArray([200, 100, 50, 20]);
    self.SelectFuel = ko.observable();

    self.PlayerOptions = ko.observableArray([
           { Id: 1, Name: "Human"
    },
           { Id: 2, Name: "useAIble"
    },
           { Id: 3, Name: "Tensor Flow" },
           { Id: 5, Name: "Encog" },
    { Id: 4, Name: "Head-To-Head" }]);

    self.SelectedPlayerOption = ko.observable(self.PlayerOptions()[0]);
    self.SelectedPlayerOption.subscribe(function (val) {

        $("#selected-player-hidden-input-lander").val(val.Name);

        if (val.Name == 'Tensor Flow') {
            self.NumberOfSessions(500);
        } else if (val.Name == 'Encog') {
            self.SelectedNumberOfNeuronOption(1);
        }
        else {
            self.NumberOfSessions(100);
        }
 
        //var game1 = self.Games()[0];
        //var game2 = self.Games()[1];
        if (val.Name == 'Head-To-Head') {

            //self.headTohead(true);
            //self.gameContainer("col-md-6");
            //for (i = 0; i < 2; i++) {
            //    if (i === 1) {
            //        $("#" + mainVM.IdArray()[2]).appendTo(".newCavas");
            //        mainVM.IdArray([]);
            //    }
            //}
            //var count = 0;
            //MinimizeSidebar();

            self.ShowHeadToHeadOptions(true);
            self.SelectedHeadToHeadOption(self.HeadToHeadOptions()[0]);

            getSelectedHead2HeadOption();
            MinimizeSidebar();

        } else {
            self.headTohead(false);
            self.gameContainer("col-md-12x");
            MaximizeSidebar();
        }

    });

    self.StartGame = function () {
        if (self.headTohead() == false) {
            //self.game(new GameVM());
            //self.Games.push(self.game());
            self.game().spaceShip().gameQueue([]);
            startGame(self.SelectedPlayerOption(), self.game());
        }
        else {

            if (self.SelectedHeadToHeadOption()) {

                var h2h = self.SelectedHeadToHeadOption().Id;

                var game1 = self.Games()[0];
                var game2 = self.Games()[1];
                var game3 = self.Games()[2];

                if (h2h == 'useAIble-tensorflow') {

                    startGame(self.PlayerOptions()[1], game1);
                    startGame(self.PlayerOptions()[2], game2);

                } else if (h2h == 'useAIble-encog') {

                    startGame(self.PlayerOptions()[1], game1);
                    startGame(self.PlayerOptions()[3], game3);

                }
            }

    }
    };

    self.SessionScores = ko.computed(function () {
        //return self.spaceShip().sessionScores();
    });

    self.GameQueue = ko.computed(function () {
        if (self.headTohead() != undefined && !self.headTohead()) {
           return self.game().spaceShip().gameQueue();
        } else if(self.headTohead() != undefined && self.headTohead()) {
            //$.each(self.Games(), function (i, game) {
                
            //});

            var game1 = self.Games()[0];
            var game2 = self.Games()[1];
            var game3 = self.Games()[2];
            
            var queue1 = game1.spaceShip().gameQueue();
            var queue2 = game2.spaceShip().gameQueue();
            var queue3 = game3.spaceShip().gameQueue();

            var newGameQueue = ko.observableArray();

            $.each(queue1, function (i, game) {
                //game.Type = ko.observable('useAIble');
                newGameQueue.push(game);
            });
            $.each(queue2, function (i, game) {
                //game.Type = ko.observable('tensorFlow');
                newGameQueue.push(game);
            });

            $.each(queue3, function (i, game) {
                //game.Type = ko.observable('tensorFlow');
                newGameQueue.push(game);
            });

            return newGameQueue();
        }
    });

    var mute = true;
    self.MuteGame = function () {
        if (mute) {
            crashSound.volume = 0;
            thrusterSound.volume = 0;
            backgroundAudio.volume = 0;
            crashSound.volume = 0;
            landingSuccessful.volume = 0;
            mute = false;
            self.MuteText("Unmute");
        } else {
            landingSuccessful.volume = 1;
            crashSound.volume = 0.5;
            thrusterSound.volume = 0.5;
            backgroundAudio.volume = 1;
            crashSound.volume = 0.2;
            mute = true;
            self.MuteText("Mute");
        }
    }
    self.MuteText = ko.observable("Mute");

    self.ResetGame = function () {
        resetGame();
        clearInterval(running);
    }

    self.SpeedOptions = ko.observableArray([
                            { Id: 30, Text: 'Faster'
    },
                            { Id: 45, Text: 'Fast'
    },
                            { Id: 60, Text: 'Normal'
    },
                            { Id: 75, Text: 'Slow'
    },
                            { Id: 90, Text: 'Slower' }]);
    self.Speed = ko.observable(self.SpeedOptions()[2]);
    self.Speed.subscribe(function (val) {
        //self.spaceShip().speed(val.Id);
    });

    self.HeadToHeadOptions = ko.observableArray(
        [
            { Id: 'useAIble-tensorflow', Name: 'useAIble vs Tensor Flow' },
            { Id: 'useAIble-encog', Name: 'useAIble vs Encog' }
        ]);
    self.SelectedHeadToHeadOption = ko.observable();
    self.ShowHeadToHeadOptions = ko.observable(false);
    self.SelectedHeadToHeadOption.subscribe(function (selectedHeadToHead) {

        $("#selected-head2head-options-hidden-input-lander").val(selectedHeadToHead.Id);

        if (selectedHeadToHead) {

            //$("#selected-head2head-options-hidden-input-lander").val(selectedHeadToHead.Id);

            getSelectedHead2HeadOption();



            MinimizeSidebar();
        }

    });

    self.sessions = ko.observable(1);
    self.EnableStartButton = ko.observable(true);
    self.SessionWaitText = ko.observable('');
    self.SessionWaitTextUseAible = ko.observable('');
    self.SessionWaitTextTF = ko.observable('');
    self.SessionWaitTextEncog = ko.observable('');

    self.useAIbleSettings = ko.observable();
    self.NumberOfSessions = ko.observable(100);
    self.NumSessionRandomness = ko.observable(self.NumberOfSessions());

    self.NumberOfSessions.subscribe(function (val) {
        
        self.NumSessionRandomness(val);

        self.NetworkSettings([]);

        var totalSessions = self.NumberOfSessions();//eval(self.NumberOfSessions() * 0.80);
        var nextStartRange = totalSessions + 1;
        //var nextEndRange = self.NumberOfSessions() - (self.NumberOfSessions() * .10);

        self.NetworkSettings.push(new RNNCoreSettings(1, self.StartRandomness(), self.EndRandomness(), self.MaxLinearBracket(), self.MinLinearBracket(), 1, totalSessions));

    });

    self.StartRandomness = ko.observable(30);
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
    self.WaitTimeElapseEncog = ko.observable(0);

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

        var S_RANDOMNESS = mainVM.StartRandomness(); // $("#RandomnessInput").val();//
        var E_RANDOMNESS = mainVM.EndRandomness(); // $("#RandomnessInput2").val();//
        var MIN_BRACKET = mainVM.MinLinearBracket(); // $("#linearBracketInput").val();//
        var MAX_BRACKET = mainVM.MaxLinearBracket(); // $("#linearBracketInput2").val();//
        var NUM_SESSION_RANDOMNESS = mainVM.NumSessionRandomness(); // $("#sessionRandomnessInput").val();//

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

            var numSessions = mainVM.NumberOfSessions(); //eval($("#sessionInput").val());

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
    self.TfPlayGame = function (player, root) {
        if (self.SelectedPlayerOption().Name == 'Tensor Flow') {
            tfClient.PlaySolution();
            self.ReplayButton(true);
        } else if (self.SelectedPlayerOption().Name == 'useAIble') {

            mainVM.EnableStartButton(false);
            self.ReplayButton(true);

            mq.ReplayGame();
        } else if (self.SelectedPlayerOption().Name == 'Head-To-Head') {

            if (player == 'useAIble') {
                mq.ReplayGame();
            } else if (player == 'tensorFlow') {
                tfClient.PlaySolution();
            }
            mainVM.EnableStartButton(false);
            self.ReplayButton(true);
        }
    };

    self.useAIbleDonePlaying = ko.observable(true);
    self.TensorFlowDonePlaying = ko.observable(true);
    self.EncogDonePlaying = ko.observable(true);

    self.DonePlaying = ko.computed(function () {
        if (self.headTohead() != undefined && self.headTohead()) {

            if (self.useAIbleDonePlaying() && self.TensorFlowDonePlaying()) {
                if (self.GameQueue()) {
                    if (self.GameQueue().length > 0) {
                        //$(".outer-chart-container").show();
                        //showComparisonChart(self.GameQueue());
                        return true;
                    }
                }
                return true;
            } else {
                return false;
            }

            //return self.useAIbleDonePlaying() && self.TensorFlowDonePlaying();
        } else {
            if (self.SelectedPlayerOption().Name == 'useAIble' || self.SelectedPlayerOption().Name == 'Human') {

                if (self.useAIbleDonePlaying() == true) {
                    if (self.GameQueue()) {
                        if (self.GameQueue().length > 0) {
                            //$(".outer-chart-container").show();
                            //showComparisonChart(self.GameQueue());
                            return true;
                        }
                    }
                    return true;
                } else {
                    return false;
                }

                //return self.useAIbleDonePlaying();
            } else if (self.SelectedPlayerOption().Name == 'Tensor Flow') {

                if (self.TensorFlowDonePlaying() == true) {
                    if (self.GameQueue()) {
                        if (self.GameQueue().length > 0) {
                            //$(".outer-chart-container").show();
                            //showComparisonChart(self.GameQueue());
                            return true;
                        }
                    }
                    return true;
                } else {
                    return false;
                }

                //return self.TensorFlowDonePlaying();
            } else if (self.SelectedPlayerOption().Name == 'Encog') {

                if (self.EncogDonePlaying() == true) {
                    if (self.GameQueue()) {
                        if (self.GameQueue().length > 0) {
                            //$(".outer-chart-container").show();
                            //showComparisonChart(self.GameQueue());
                            return true;
                        }
                    }
                    return true;
                } else {
                    return false;
                }

                //return self.TensorFlowDonePlaying();
            }
        }
    });

    self.RandomActionProb = ko.observable(0.9);
    self.RandomActionDecay = ko.observable(0.99);
    self.Hidden1Size = ko.observable(200);
    self.Hidden2Size = ko.observable(100);
    self.LearningRate = ko.observable(0.002);
    self.MiniBatchSize = ko.observable(50);
    self.DiscountFactor = ko.observable(0.9);
    self.TargetUpdateFreq = ko.observable(300);

    //self.ChartVM = ko.observable(new ChartVM(self.NumberOfSessions(), self.GameQueue, self.SelectedPlayerOption, self.SelectedHeadToHeadOption));

    self.ChartViewOptions = ko.observableArray([{ Id: 1, Text: "Default" }, { Id: 20, Text: "Per 20 Sessions" }, { Id: 50, Text: "Per 50 Sessions" }, { Id: 100, Text: "Per 100 Sessions" }, { Id: 150, Text: "Per 150 Sessions" },
        { Id: 200, Text: "Per 200 Sessions" }]);
    self.SelectedChartViewOption = ko.observable(self.ChartViewOptions()[3]);
    self.SelectedChartViewOption.subscribe(function (val) {
        //showComparisonChart(self.GameQueue());
    });

    self.FromChartPage = ko.observable(0);
    self.ToChartPage = ko.observable(99);

    self.PreviousChartPage = function () {
        if (self.FromChartPage() > 0) {
            self.FromChartPage(self.FromChartPage() - 99);
            self.ToChartPage(self.FromChartPage() + 99);
        }
        showComparisonChart(self.GameQueue());
    };

    self.NextChartPage = function () {

        var sessions = eval($("#sessionInput").val());

        if (self.ToChartPage() < sessions) {
            self.FromChartPage(self.ToChartPage());
            self.ToChartPage(self.ToChartPage() + 99);
        }
        showComparisonChart(self.GameQueue());
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

            return self.useAIbleShowChartBtn() && (self.TensorFlowShowChartBtn() || self.EncogShowChartBtn());

        } else if (self.SelectedPlayerOption().Name == 'useAIble') {
            return self.useAIbleShowChartBtn();
        } else if (self.SelectedPlayerOption().Name == 'Tensor Flow') {
            return self.TensorFlowShowChartBtn();
        }
    });

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



    // Encog settings
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


    self.IsLogistic = ko.observable(false);
}

function GameVM() {

    var self = this;

    self.Id = ko.observable(guid());
    self.canvasContext = ko.observable();

    self.spaceShip = ko.observable({
        x: ko.observable(horizonalAlignment),
        y: ko.observable(0),
        altitude: ko.observable(mainVM.SelectAltitude()),
        width: ko.observable(20),
        height: ko.observable(20),
        fuel: ko.observable(mainVM.SelectFuel()),
        crashed: ko.observable(false),
        velocity: ko.observable(0),
        calculatedWidth: ko.observable(0),
        calculatedHeight: ko.observable(0),
        currentSprite: ko.observable(0),
        shipStatus: ko.observable(""),
        thrust: ko.observable(false),
        sessionScores: ko.observableArray([]),
        gameQueue: ko.observableArray([]),
        speed: ko.observable(50)
    });
    
    mainVM.IdArray.push(self.Id());
    $(".lunarLander").remove();

    self.spaceShip().score = ko.computed(function () {
        return Math.round((self.spaceShip().fuel() * 10) + steps + (self.spaceShip().velocity() * 1000));
    });

    self.spaceShip().flying = ko.computed(function () {
        return self.spaceShip().altitude() > 0;
    });

    self.sessions = ko.observable(1);

}

function stepsTurn(gameVM) {

    steps++;
    gameVM.spaceShip().velocity(gameVM.spaceShip().velocity() - GRAVITY);
    gameVM.spaceShip().altitude(gameVM.spaceShip().altitude() + gameVM.spaceShip().velocity());

    if (gameVM.spaceShip().thrust() == true && gameVM.spaceShip().fuel() > 0) {
        gameVM.spaceShip().fuel(gameVM.spaceShip().fuel() - 1);
        gameVM.spaceShip().velocity(gameVM.spaceShip().velocity() + THRUST);
    }

    gameVM.spaceShip().velocity(Math.max(-TERMINALVELOCITY, gameVM.spaceShip().velocity()));
    gameVM.spaceShip().velocity(Math.min(TERMINALVELOCITY, gameVM.spaceShip().velocity()));

    if (gameVM.spaceShip().altitude() < 0) {

        gameVM.spaceShip().altitude(0);

        //mainVM.spaceShip().score((mainVM.spaceShip().fuel() * 10) + steps + (mainVM.spaceShip().velocity() * 10000));

        crashDetector(gameVM);

        //mainVM.spaceShip().flying(false);

        if (gameVM.spaceShip().crashed() === true) {
            gameVM.spaceShip().shipStatus("Crashed");
        } else {
            gameVM.spaceShip().shipStatus("successful");
            landingSuccessful.play();
        }
        clearInterval(running);


    }

    gameVM.spaceShip().y(((10000 - gameVM.spaceShip().altitude()) * ((HEIGHT - (gameVM.spaceShip().height() * 2)) * 0.0001)));
}

function crashDetector(gameVM) {
    if (gameVM.spaceShip().altitude() === 0 && gameVM.spaceShip().velocity() < -20) {
        gameVM.spaceShip().currentSprite(shipImage.width / 2);
        gameVM.spaceShip().crashed(true);
        crashSound.play();
    }
    if (gameVM.spaceShip().altitude() === 0 && gameVM.spaceShip().velocity() > -20 && gameVM.spaceShip().velocity() < -10) {
        gameVM.spaceShip().currentSprite(((shipImage.width / 2) + (shipImage.width / 4)));
        gameVM.spaceShip().crashed(true);
        crashSound.play();
    }
}

function shipMoving(gameVM) {
    if (gameVM.spaceShip().y() < HEIGHT - gameVM.spaceShip().height()) {
        //isThursterOn();
    } else {
        gameVM.spaceShip().y() = HEIGHT - gameVM.spaceShip().height();
    }
}

function drawSpaceship(gameVM) {
    shipMoving(gameVM);
    if (gameVM.spaceShip().thrust() === false || gameVM.spaceShip().altitude() === 0 || gameVM.spaceShip().fuel() === 0) {
        gameVM.spaceShip().currentSprite(0);
        thrusterSound.pause();
    } else {
        gameVM.spaceShip().currentSprite(shipImage.width / 4);
        //thrusterSound.muted = false;
        thrusterSound.play();
    }
    crashDetector(gameVM);
    gameVM.canvasContext().drawImage(shipImage, gameVM.spaceShip().currentSprite(), 0, shipImage.width / 4, shipImage.height, gameVM.spaceShip().x(), gameVM.spaceShip().y(), gameVM.spaceShip().calculatedWidth(), gameVM.spaceShip().calculatedHeight());
}

function informationBoard(gameVM) {
    var altitude = parseInt(gameVM.spaceShip().y())
    gameVM.canvasContext().fillStyle = 'rgba(225,225,225,0.5)'
    gameVM.canvasContext().fillRect(gameVM.canvasContext().canvas.width - 220, 20, 200, 200);
    gameVM.canvasContext().font = '15pt Courier New';
    gameVM.canvasContext().fillStyle = "white";
    gameVM.canvasContext().fillText("Information", gameVM.canvasContext().canvas.width - 210, 50);
    gameVM.canvasContext().font = '10pt Courier New';
    gameVM.canvasContext().fillStyle = "white";
    //ctx.fillText("Altitude: " + ((HEIGHT - spaceShip.height) - altitude), ctx.canvas.width - 210, 70);
    gameVM.canvasContext().fillText("Session(s): " + gameVM.sessions(), gameVM.canvasContext().canvas.width - 210, 150);
    gameVM.canvasContext().fillText("Altitude: " + parseFloat(gameVM.spaceShip().altitude()).toFixed(2), gameVM.canvasContext().canvas.width - 210, 70);

    gameVM.canvasContext().fillText("Fuel: " + gameVM.spaceShip().fuel(), gameVM.canvasContext().canvas.width - 210, 90);
    gameVM.canvasContext().fillText("Steps: " + steps, gameVM.canvasContext().canvas.width - 210, 110);
    gameVM.canvasContext().fillText("Velocity: " + parseFloat(gameVM.spaceShip().velocity()).toFixed(2) + " m/s", gameVM.canvasContext().canvas.width - 210, 130);
    gameVM.canvasContext().fillText("Score: " + parseInt(gameVM.spaceShip().score()), gameVM.canvasContext().canvas.width - 210, 170);
    gameVM.canvasContext().fillText("Landing: " + gameVM.spaceShip().shipStatus(), gameVM.canvasContext().canvas.width - 210, 190);

    CURRENT_ALTITUDE = gameVM.spaceShip().altitude();
}

//draw game
function drawGame(gameVM) {
    gameVM.canvasContext().clearRect(0, 0, WIDTH, HEIGHT);
    //ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
    //checkSpaceship Altitude
    aboveNormalAltitude(gameVM);
    informationBoard(gameVM);
    drawSpaceship(gameVM);
}

function aboveNormalAltitude(gameVM) {
    if (gameVM.spaceShip().altitude() > 10000) {
        gameVM.canvasContext().drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, gameVM.canvasContext().canvas.width, gameVM.canvasContext().canvas.height);
        gameVM.spaceShip().y(500 - (Math.abs(gameVM.spaceShip().y()) / 2));
        gameVM.spaceShip().calculatedWidth(gameVM.spaceShip().width());
        gameVM.spaceShip().calculatedHeight(gameVM.spaceShip().height());
    } else {

        gameVM.canvasContext().drawImage(bg, 200, 400, 400, 400, 0, 0, gameVM.canvasContext().canvas.width, gameVM.canvasContext().canvas.height);
        gameVM.spaceShip().calculatedWidth(gameVM.spaceShip().width() * 2);
        gameVM.spaceShip().calculatedHeight(gameVM.spaceShip().height() * 2);
    }
    if (gameVM.spaceShip().altitude() < 3000) {
        gameVM.canvasContext().drawImage(bg, 289, 580, 220, 220, 0, 0, gameVM.canvasContext().canvas.width, gameVM.canvasContext().canvas.height);
        //spaceShip.y = Math.abs(spaceShip.y) / 2; //268
        gameVM.spaceShip().y((3000 - gameVM.spaceShip().altitude()) * ((HEIGHT - (gameVM.spaceShip().height() * 2)) * 0.000266));
        gameVM.spaceShip().y(gameVM.spaceShip().y() * 1.2);
        gameVM.spaceShip().calculatedWidth(gameVM.spaceShip().width() * 3);
        gameVM.spaceShip().calculatedHeight(gameVM.spaceShip().height() * 3);
    }
}

function runGame(gameVM) {
    stepsTurn(gameVM);
    drawGame(gameVM);
}

function startGame(type, gameVM) {



    //if (mainVM.DonePlaying()) {

    var NUM_SESSIONS = mainVM.NumberOfSessions();//eval($("#sessionInput").val());//
    var S_RANDOMNESS = mainVM.StartRandomness();//eval($("#RandomnessInput").val());//
    var E_RANDOMNESS = mainVM.EndRandomness();//eval($("#RandomnessInput2").val());//
    var MIN_BRACKET = mainVM.MinLinearBracket();//eval($("#linearBracketInput").val());//
    var MAX_BRACKET = mainVM.MaxLinearBracket();//eval($("#linearBracketInput2").val());//
    var NUM_SESSION_RANDOMNESS = mainVM.NumSessionRandomness();//eval($("#sessionRandomnessInput").val());


        if (type.Name == "Human") {
            // human player
            playAsHuman();
        }
        else if (type.Name == "useAIble") {

            if (mainVM.NetworkSettings().length == 0) {

                mainVM.NetworkSettings.push(new RNNCoreSettings(1, mainVM.StartRandomness(), mainVM.EndRandomness(), mainVM.MaxLinearBracket(), mainVM.MinLinearBracket(), 1, mainVM.NumberOfSessions()));
            }

            mainVM.useAIbleSettings({ NumberOfSessions: NUM_SESSIONS, Settings: mainVM.NetworkSettings() });

            mainVM.EnableStartButton(false);
            mainVM.ReplayButton(true);
            mainVM.useAIbleDonePlaying(false);

            mq = new MQSimulator(
                gameVM.spaceShip(),
                runGame,
                gameVM,
                resetGame,
                gameVM.sessions,
                mainVM.useAIbleSettings,
                mainVM.EnableStartButton,
                mainVM.SessionWaitText,
                mainVM.WaitTimeElapse,
                mainVM.useAIbleDonePlaying,
                mainVM.SessionWaitTextUseAible,
                mainVM.WaitTimeElapseUseAible,
                mainVM.Played,
                mainVM.useAIbleShowChartBtn,
                showComparisonChart, mainVM.GameQueue);

            mq.GetToken().done(function (res) {
                mqToken = res;

                if (mainVM.headTohead()) {

                    var h2h = mainVM.SelectedHeadToHeadOption();

                    if (h2h) {
                        var h2hOption = h2h.Id;

                        if (h2hOption == 'useAIble-tensorflow') {
                            mainVM.TensorFlowDonePlaying(false);
                            mq.Play(mqToken, mainVM.TensorFlowDonePlaying);
                        } else if (h2hOption == 'useAIble-encog') {
                            mainVM.EncogDonePlaying(false);
                            mq.Play(mqToken, mainVM.EncogDonePlaying);
                        }
                    }
                } else {
                    mq.Play(mqToken);
                }
            });

        } else if (type.Name == "Tensor Flow") {

            var drnnRepo = new DRNNRepository();

            drnnRepo.GetToken().done(function (token_res) {

                mainVM.ReplayButton(true);

                mainVM.EnableStartButton(false);
                mainVM.TensorFlowDonePlaying(false);

                tfClient = new TensorFlowClient(
                    gameVM.spaceShip(),
                    runGame,
                    gameVM,
                    resetGame,
                    gameVM.sessions,
                    mainVM.SessionWaitText,
                    {
                        Sessions: NUM_SESSIONS,
                        Fuel: mainVM.SelectFuel(),
                        Altitude: mainVM.SelectAltitude(),
                        RandomActionProb: mainVM.RandomActionProb(),
                        RandomActionDecay: mainVM.RandomActionDecay(),
                        Hidden1Size: mainVM.Hidden1Size(),
                        Hidden2Size: mainVM.Hidden2Size(),
                        LearningRate: mainVM.LearningRate(),
                        MiniBatchSize: mainVM.MiniBatchSize(),
                        DiscountFactor: mainVM.DiscountFactor(),
                        TargetUpdateFreq: mainVM.TargetUpdateFreq(),
                        UserToken: token_res.Token
                    },
                    mainVM.EnableStartButton,
                    mainVM.TensorFlowDonePlaying,
                    mainVM.SessionWaitTextTF,
                    mainVM.WaitTimeElapseTF,
                    mainVM.TensorFlowShowChartBtn);

                tfClient.Init();
            });

        } else if (type.Name == "Encog") {

            var neuronInputs = $.map(mainVM.HiddenLayerNeuronsInputs(), function (neuron, i) {
                return neuron.NeuronCount();
            });

            var encogSettings = {

                Sessions: NUM_SESSIONS,
                HiddenLayerNeurons: mainVM.HiddenLayerNeurons(),
                TrainingMethodType: mainVM.TrainingMethodType(),
                Cycles: mainVM.Cycles(),
                StartTemp: mainVM.StartTemp(),
                StopTemp: mainVM.StopTemp(),
                PopulationSize: mainVM.PopulationSize(),
                Epochs: mainVM.Epochs(),
                MinRandom: mainVM.MinRandom(),
                MaxRandom: mainVM.MaxRandom(),
                HiddenLayerNeuronsInputs: neuronInputs
            };

            mainVM.EnableStartButton(false);
            mainVM.ReplayButton(true);
            mainVM.EncogDonePlaying(false);
            mainVM.useAIbleDonePlaying(false);

            encogLander = new EncogLunarLander(
                gameVM.spaceShip(),
                runGame,
                gameVM,
                resetGame,
                gameVM.sessions,
                encogSettings,
                mainVM.EnableStartButton,
                mainVM.SessionWaitText,
                mainVM.WaitTimeElapse,
                mainVM.EncogDonePlaying,
                mainVM.SessionWaitTextEncog,
                mainVM.WaitTimeElapseEncog,
                mainVM.Played,
                mainVM.EncogShowChartBtn,
                showComparisonChart, mainVM.GameQueue);

            encogLander.GetToken().done(function (res) {
                if (mainVM.headTohead()) {
                    encogLander.Play(res, mainVM.useAIbleDonePlaying);
                } else {
                    encogLander.Play(res);
                }
            });

        }
    //} else {
    //    alert("You are not allowed to play when game is already in progress!");
    //}
}

function trainUseAIble(simulator) {
    simulator.Train(mainVM.spaceShip(), runGame, resetGame).done(function (deferRes) {
        mainVM.sessions(mainVM.sessions() + 1);
        if (deferRes < NUM_SESSIONS) {
            trainUseAIble(simulator);
        }
    });
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
}

function resetGame(gameVM) {

    gameVM.spaceShip().altitude(mainVM.SelectAltitude());
    gameVM.spaceShip().y(0);
    gameVM.spaceShip().fuel(mainVM.SelectFuel());
    steps = 0;
    gameVM.spaceShip().velocity(0);
    gameVM.spaceShip().crashed(false);
    gameVM.spaceShip().shipStatus("");
}

function loadBg() {
    var def = $.Deferred();
    bg.src = "/Content/img/lunarLander/lunarBackgroundSVG.svg";
    bg.onload = function (e) {
        def.resolve();
    };
    return def;
}

function loadShip() {
    var def = $.Deferred();
    shipImage.src = "/Content/img/lunarLander/newLander.svg"
    shipImage.onload = function (e) {
        def.resolve();
    };
    return def;
}

function init() {

    mainVM.headTohead(false);
    $.when(loadBg(), loadShip()).done(function (b, s) {
        $.each(mainVM.Games(), function (i, game) {
            game.canvasContext(document.getElementById("" + game.Id() + "").getContext('2d'));
            game.canvasContext().canvas.height = 700;
            game.canvasContext().canvas.width = 700;
            game.canvasContext().drawImage(bg, 200, 400, 400, 400, 0, 0, game.canvasContext().canvas.width, game.canvasContext().canvas.height);
            drawGame(game);
        });
    });
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

            useAIbleScores.push(v.Score);
            useAIbleSessions.push(v.Session);

        } else if (v.Type() == 'tensorFlow') {

            tensorFlowScores.push(v.Score);
            tensorFlowSessions.push(v.Session);

        } else if (v.Type() == 'encog') {

            encogScores.push(v.Score);
            encogSessions.push(v.Session);
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

//function showComparisonChart(gameQueue) {

//    var useAIbleScores = [];
//    var useAIbleSessions = [];

//    var tensorFlowScores = [];
//    var tensorFlowSessions = [];

//    $.each(gameQueue, function (i, v) {

//        if (v.Type() == 'useAIble') {

//            useAIbleScores.push(v.Score);
//            useAIbleSessions.push(v.Session);

//        } else if (v.Type() == 'tensorFlow') {

//            tensorFlowScores.push(v.Score);
//            tensorFlowSessions.push(v.Session);

//        }

//    });

//    var useAIbleChartData = {
//        Name: "useAIble",
//        Scores: useAIbleScores,
//        Sessions: useAIbleSessions
//    };

//    var tensorFlowChartData = {
//        Name: "Google Tensor Flow",
//        Scores: tensorFlowScores,
//        Sessions: tensorFlowSessions
//    };

//    var chartData = {
//        useAIble: useAIbleChartData,
//        TensorFlow: tensorFlowChartData
//    };

//    var summary = {
//        useAIbleAvgScore: mainVM.useAIbleAvgScore,
//        useAIbleHighestScore: mainVM.useAIbleHighestScore,
//        useAIbleLearnedAfter: mainVM.useAIbleLearnedAfter,
//        TensorFlowAvgScore: mainVM.TensorFlowAvgScore,
//        TensorFlowHighestScore: mainVM.TensorFlowHighestScore,
//        TensorFlowLearnedAfter: mainVM.TensorFlowLearnedAfter
//    };

//    if (mainVM.SelectedPlayerOption().Name == 'Head-To-Head') {
//        createChart(undefined, chartData, mainVM.SelectedChartViewOption(), mainVM.FromChartPage, mainVM.ToChartPage, summary);
//    } else if (mainVM.SelectedPlayerOption().Name == 'useAIble') {
//        createChart('useAIble', chartData, mainVM.SelectedChartViewOption(), mainVM.FromChartPage, mainVM.ToChartPage, summary);
//    } else if (mainVM.SelectedPlayerOption().Name == 'Tensor Flow') {
//        createChart('tensorFlow', chartData, mainVM.SelectedChartViewOption(), mainVM.FromChartPage, mainVM.ToChartPage, summary);
//    }

//}


var mainVM;
$(document).ready(function () {

    mainVM = new NewMainVM();

    ko.applyBindings(mainVM);


    init();

    //open charts
    $(".view-chart").on('click', function () {

        showComparisonChart(mainVM.GameQueue());

    });
});
//human Player Codes
//keyboard function
document.onkeydown = function (e) {
    var key = e.which;
    if (key === 87 || key === 38) {
        mainVM.game().spaceShip().thrust(true);
    }
    if (key === 13) {
        e.preventDefault();
        startGame();
    }
    if (key === 82) {
        e.preventDefault();
        resetGame();
    }
}
document.onkeyup = function (e) {
    if (e.keyCode == 87 || e.keyCode == 38) {
        mainVM.game().spaceShip().thrust(false);
    }
}
var running;
function playAsHuman() {
    resetGame(mainVM.game());
    clearInterval(running);
    running = setInterval(function () { runGame(mainVM.game()) }, 80);
    var human;
    this.human = true;
}
function pauseGame() {
    clearInterval(running);
}

$(window).bind('beforeunload', function () {
    if (!mainVM.EnableStartButton()) {
        return ' ';
    }
});
