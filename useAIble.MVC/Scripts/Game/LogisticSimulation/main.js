var PAPER_IMG;
var TRUCK_IMG;
var ORDER_IMG;

var RETAILER_IMG;
var WHOLESALER_IMG;
var DISTRIBUTOR_IMG;
var FACTORY_IMG;

var CANVAS_BG_IMG;

function MainVM() {

    var self = this;
    var USER_TOKEN;
    var USER_TOKEN_TF;
    var USER_TOKEN_ENCOG;
    var NO_OF_DAYS_INTERVAL = 0;

    // double window toggle trigger for head to thead
    self.headTohead = ko.observable(false);
    self.gameContainer = ko.observable();

    // for single player
    self.SingleCanvas = ko.observable();

    // for head to head
    self.useAIbleCanvasHH = ko.observable();
    self.TensorflowCanvasHH = ko.observable();

    self.useAIbleSimulator = ko.observable(new useAIbleSimulator(self.useAIbleDonePlaying, self.SessionData, self.useAIbleShowChartBtn, self.ShowComparisonChart));
    self.TensorFlowSimulator = ko.observable(new TensorFlowSimulator(self.TensorflowDonePlaying, self.SessionData, self.TensorFlowShowChartBtn, self.ShowComparisonChart));
    self.EncogSimulator = ko.observable(new EncogSimulator(self.EncogDonePlaying, self.SessionData, self.EncogShowChartBtn, self.ShowComparisonChart));

    self.HeadToHeadOptions = ko.observableArray(
        [
            { Id: 'useAIble-tensorflow', Name: 'useAIble vs Tensor Flow' },
            { Id: 'useAIble-encog', Name: 'useAIble vs Encog' }
        ]);
    self.SelectedHeadToHeadOption = ko.observable(null);
    self.ShowHeadToHeadOptions = ko.observable(false);

    self.useAIbleSimulator().SelectedPlayerOption.subscribe(function (selected) {

        //$( "input[value='Hot Fuzz']" )
        
        if (imagesLoaded) {
            var player = mainVM.useAIbleSimulator().SelectedPlayerOption().Name;

            if (player == 'useAIble') {

                ctx.canvas.width = 1000;
                ctx.canvas.height = 850;

                ctx.canvas.setAttribute('uid','left-canvas');
                tensorflowCtx.canvas.setAttribute('uid', '');
                encogCtx.canvas.setAttribute('uid', '');

                self.SingleCanvas(ctx);

                self.useAIbleSimulator().Canvas(ctx);

                self.InitGameElements(ctx, {
                    CANVAS_BG_CACHE: self.useAIbleSimulator().CANVAS_BG_CACHE,
                    RETAILER_CACHE: self.useAIbleSimulator().RETAILER_CACHE,
                    WHOLESALER_CACHE: self.useAIbleSimulator().WHOLESALER_CACHE,
                    DISTRIBUTOR_CACHE: self.useAIbleSimulator().DISTRIBUTOR_CACHE,
                    FACTORY_CACHE: self.useAIbleSimulator().FACTORY_CACHE,
                    RETAILER_PAPER_CACHE: self.useAIbleSimulator().RETAILER_PAPER_CACHE,
                    WHOLESALER_PAPER_CACHE: self.useAIbleSimulator().WHOLESALER_PAPER_CACHE,
                    DISTRIBUTOR_PAPER_CACHE: self.useAIbleSimulator().DISTRIBUTOR_PAPER_CACHE,
                    FACTORY_PAPER_CACHE: self.useAIbleSimulator().FACTORY_PAPER_CACHE,
                    DAY_PAPER_CACHE: self.useAIbleSimulator().DAY_PAPER_CACHE,
                    ROAD_PAPER_CACHE: self.useAIbleSimulator().ROAD_PAPER_CACHE
                });

                // UI Change code

                self.ShowHeadToHeadOptions(false);
                self.SelectedHeadToHeadOption(null);
                
                self.headTohead(false);
                self.gameContainer("col-md-12x");
                MaximizeSidebar();

                // para sa beer (head-to-head)
                $("#useAIble-table-container").appendTo("#secondTab1");

                $("#secondTab1").remove("#encog-table-container");
                $("#secondTab1").remove("#tensorflow-table-container");

                $('#useAIble').show();
                $('#tensorflow').hide();
                $('#encog').hide();

            } else if (player == 'Tensor Flow') {

                tensorflowCtx.canvas.width = 1000;
                tensorflowCtx.canvas.height = 850;

                tensorflowCtx.canvas.setAttribute('uid', 'left-canvas');
                ctx.canvas.setAttribute('uid', '');
                encogCtx.canvas.setAttribute('uid','');

                self.SingleCanvas(tensorflowCtx);

                self.TensorFlowSimulator().Canvas(tensorflowCtx);

                self.InitGameElements(tensorflowCtx, {
                    CANVAS_BG_CACHE: self.TensorFlowSimulator().CANVAS_BG_CACHE,
                    RETAILER_CACHE: self.TensorFlowSimulator().RETAILER_CACHE,
                    WHOLESALER_CACHE: self.TensorFlowSimulator().WHOLESALER_CACHE,
                    DISTRIBUTOR_CACHE: self.TensorFlowSimulator().DISTRIBUTOR_CACHE,
                    FACTORY_CACHE: self.TensorFlowSimulator().FACTORY_CACHE,
                    RETAILER_PAPER_CACHE: self.TensorFlowSimulator().RETAILER_PAPER_CACHE,
                    WHOLESALER_PAPER_CACHE: self.TensorFlowSimulator().WHOLESALER_PAPER_CACHE,
                    DISTRIBUTOR_PAPER_CACHE: self.TensorFlowSimulator().DISTRIBUTOR_PAPER_CACHE,
                    FACTORY_PAPER_CACHE: self.TensorFlowSimulator().FACTORY_PAPER_CACHE,
                    DAY_PAPER_CACHE: self.TensorFlowSimulator().DAY_PAPER_CACHE,
                    ROAD_PAPER_CACHE: self.TensorFlowSimulator().ROAD_PAPER_CACHE
                });

                // UI Change code

                self.ShowHeadToHeadOptions(false);
                self.SelectedHeadToHeadOption(null);
                
                self.headTohead(false);
                self.gameContainer("col-md-12x");
                MaximizeSidebar();

                // para sa beer (head-to-head)
                $("#secondTab1").remove("#useAIble-table-container");
                $("#secondTab1").remove("#encog-table-container");

                $("#tensorflow-table-container").appendTo("#secondTab1");

                $("#tensorflow").detach().appendTo(".mainCanvas");
                $("#encog").detach().appendTo(".mainCanvas");

                $('#useAIble').hide();
                $('#tensorflow').show();
                $('#encog').hide();

            } else if (player == 'Encog') {

                self.EncogSimulator().SelectedNumberOfNeuronOption(1);

                encogCtx.canvas.width = 1000;
                encogCtx.canvas.height = 850;

                encogCtx.canvas.setAttribute('uid', 'left-canvas');
                ctx.canvas.setAttribute('uid', '');
                tensorflowCtx.canvas.setAttribute('uid', '');

                self.SingleCanvas(encogCtx);

                self.EncogSimulator().Canvas(encogCtx);

                self.InitGameElements(encogCtx, {
                    CANVAS_BG_CACHE: self.EncogSimulator().CANVAS_BG_CACHE,
                    RETAILER_CACHE: self.EncogSimulator().RETAILER_CACHE,
                    WHOLESALER_CACHE: self.EncogSimulator().WHOLESALER_CACHE,
                    DISTRIBUTOR_CACHE: self.EncogSimulator().DISTRIBUTOR_CACHE,
                    FACTORY_CACHE: self.EncogSimulator().FACTORY_CACHE,
                    RETAILER_PAPER_CACHE: self.EncogSimulator().RETAILER_PAPER_CACHE,
                    WHOLESALER_PAPER_CACHE: self.EncogSimulator().WHOLESALER_PAPER_CACHE,
                    DISTRIBUTOR_PAPER_CACHE: self.EncogSimulator().DISTRIBUTOR_PAPER_CACHE,
                    FACTORY_PAPER_CACHE: self.EncogSimulator().FACTORY_PAPER_CACHE,
                    DAY_PAPER_CACHE: self.EncogSimulator().DAY_PAPER_CACHE,
                    ROAD_PAPER_CACHE: self.EncogSimulator().ROAD_PAPER_CACHE
                });

                // UI Change code

                self.ShowHeadToHeadOptions(false);
                self.SelectedHeadToHeadOption(null);

                self.headTohead(false);
                self.gameContainer("col-md-12x");
                MaximizeSidebar();

                // para sa beer (head-to-head)
                $("#secondTab1").remove("#useAIble-table-container");
                $("#secondTab1").remove("#tensorflow-table-container");

                $("#encog-table-container").appendTo("#secondTab1");

                $("#tensorflow").detach().appendTo(".mainCanvas");
                $("#encog").detach().appendTo(".mainCanvas");
                $("#encog-settings-panel").detach().appendTo("#encog-settings-container");

                $('#useAIble').hide();
                $('#tensorflow').hide();
                $('#encog').show();

            } else if (player == 'Head-To-Head') {

                self.useAIbleSimulator().Canvas(ctx);
                self.TensorFlowSimulator().Canvas(tensorflowCtx);
                self.EncogSimulator().Canvas(encogCtx);

                self.InitGameElements(ctx, {
                    CANVAS_BG_CACHE: self.useAIbleSimulator().CANVAS_BG_CACHE,
                    RETAILER_CACHE: self.useAIbleSimulator().RETAILER_CACHE,
                    WHOLESALER_CACHE: self.useAIbleSimulator().WHOLESALER_CACHE,
                    DISTRIBUTOR_CACHE: self.useAIbleSimulator().DISTRIBUTOR_CACHE,
                    FACTORY_CACHE: self.useAIbleSimulator().FACTORY_CACHE,
                    RETAILER_PAPER_CACHE: self.useAIbleSimulator().RETAILER_PAPER_CACHE,
                    WHOLESALER_PAPER_CACHE: self.useAIbleSimulator().WHOLESALER_PAPER_CACHE,
                    DISTRIBUTOR_PAPER_CACHE: self.useAIbleSimulator().DISTRIBUTOR_PAPER_CACHE,
                    FACTORY_PAPER_CACHE: self.useAIbleSimulator().FACTORY_PAPER_CACHE,
                    DAY_PAPER_CACHE: self.useAIbleSimulator().DAY_PAPER_CACHE,
                    ROAD_PAPER_CACHE: self.useAIbleSimulator().ROAD_PAPER_CACHE
                });

                self.InitGameElements(tensorflowCtx, {
                    CANVAS_BG_CACHE: self.TensorFlowSimulator().CANVAS_BG_CACHE,
                    RETAILER_CACHE: self.TensorFlowSimulator().RETAILER_CACHE,
                    WHOLESALER_CACHE: self.TensorFlowSimulator().WHOLESALER_CACHE,
                    DISTRIBUTOR_CACHE: self.TensorFlowSimulator().DISTRIBUTOR_CACHE,
                    FACTORY_CACHE: self.TensorFlowSimulator().FACTORY_CACHE,
                    RETAILER_PAPER_CACHE: self.TensorFlowSimulator().RETAILER_PAPER_CACHE,
                    WHOLESALER_PAPER_CACHE: self.TensorFlowSimulator().WHOLESALER_PAPER_CACHE,
                    DISTRIBUTOR_PAPER_CACHE: self.TensorFlowSimulator().DISTRIBUTOR_PAPER_CACHE,
                    FACTORY_PAPER_CACHE: self.TensorFlowSimulator().FACTORY_PAPER_CACHE,
                    DAY_PAPER_CACHE: self.TensorFlowSimulator().DAY_PAPER_CACHE,
                    ROAD_PAPER_CACHE: self.TensorFlowSimulator().ROAD_PAPER_CACHE
                });

                self.InitGameElements(encogCtx, {
                    CANVAS_BG_CACHE: self.EncogSimulator().CANVAS_BG_CACHE,
                    RETAILER_CACHE: self.EncogSimulator().RETAILER_CACHE,
                    WHOLESALER_CACHE: self.EncogSimulator().WHOLESALER_CACHE,
                    DISTRIBUTOR_CACHE: self.EncogSimulator().DISTRIBUTOR_CACHE,
                    FACTORY_CACHE: self.EncogSimulator().FACTORY_CACHE,
                    RETAILER_PAPER_CACHE: self.EncogSimulator().RETAILER_PAPER_CACHE,
                    WHOLESALER_PAPER_CACHE: self.EncogSimulator().WHOLESALER_PAPER_CACHE,
                    DISTRIBUTOR_PAPER_CACHE: self.EncogSimulator().DISTRIBUTOR_PAPER_CACHE,
                    FACTORY_PAPER_CACHE: self.EncogSimulator().FACTORY_PAPER_CACHE,
                    DAY_PAPER_CACHE: self.EncogSimulator().DAY_PAPER_CACHE,
                    ROAD_PAPER_CACHE: self.EncogSimulator().ROAD_PAPER_CACHE
                });

                // UI Change code

                self.ShowHeadToHeadOptions(true);
                self.SelectedHeadToHeadOption(self.HeadToHeadOptions()[0]);
                
                self.headTohead(true);

                var getSelectedHead2HeadOption = function () {

                    if (self.SelectedHeadToHeadOption()) {
                        if (self.SelectedHeadToHeadOption().Id == 'useAIble-tensorflow') {

                            $("#tensorflow").detach().appendTo(".mainCanvas");
                            $("#encog").detach().appendTo(".mainCanvas");

                            $('#tensorflow').show();
                            $('#useAIble').show();
                            $('#encog').hide();

                            $("#useAIble-table-container").appendTo(".headtohead-simulation-1");
                            $("#secondTab21").remove("#encog-table-container");
                            $(".sessionTab2").remove("#encog-table-container");

                            $("#tensorflow-table-container").appendTo("#secondTab21");

                        } else if (self.SelectedHeadToHeadOption().Id == 'useAIble-encog') {

                            self.EncogSimulator().SelectedNumberOfNeuronOption(1);

                            $("#tensorflow").detach().appendTo(".mainCanvas");
                            $("#encog").detach().appendTo(".mainCanvas");

                            $('#tensorflow').hide();
                            $('#useAIble').show();
                            $('#encog').show();

                            $("#useAIble-table-container").appendTo(".headtohead-simulation-1");
                            $("#secondTab21").remove("#tensorflow-table-container");
                            $(".sessionTab2").remove("#tensorflow-table-container");

                            $("#encog-table-container").appendTo("#secondTab21");

                        }
                    } else {

                        var currPlayer = self.useAIbleSimulator().SelectedPlayerOption().Name;
                        if (currPlayer == 'useAIble') {

                            $("#tensorflow").detach().appendTo(".mainCanvas");
                            $("#encog").detach().appendTo(".mainCanvas");

                            $('#tensorflow').hide();
                            $('#useAIble').show();
                            $('#encog').hide();
                        } else if (currPlayer == 'Tensor Flow') {

                            $("#tensorflow").detach().appendTo(".mainCanvas");
                            $("#encog").detach().appendTo(".mainCanvas");

                            $('#tensorflow').show();
                            $('#useAIble').hide();
                            $('#encog').hide();
                        } else if (currPlayer == 'Encog') {

                            self.EncogSimulator().SelectedNumberOfNeuronOption(1);

                            $("#tensorflow").detach().appendTo(".mainCanvas");
                            $("#encog").detach().appendTo(".mainCanvas");

                            $('#tensorflow').hide();
                            $('#useAIble').hide();
                            $('#encog').show();
                        }
                    }

                };

                getSelectedHead2HeadOption();

                self.gameContainer("col-md-6");
                MinimizeSidebar();

                self.SelectedHeadToHeadOption.subscribe(function (selectedHeadToHead) {

                    getSelectedHead2HeadOption();
                    MinimizeSidebar();

                });
            }
        }

    });

    self.showHideText = ko.observable("Show");


    self.toggleAdvancedOptions = ko.observable(false);
    self.toggleAdvanced = function () {

        if (self.toggleAdvancedOptions() === true) {
            self.showHideText("Show");
            self.toggleAdvancedOptions(false);

        } else {
            self.showHideText("Hide");
            self.toggleAdvancedOptions(true);
        }

        //self.toggleAdvancedOptions(!self.toggleAdvancedOptions());
    };

    self.useAIbleSelected = ko.computed(function () {
        return self.useAIbleSimulator().SelectedPlayerOption().Name == 'useAIble' || self.useAIbleSimulator().SelectedPlayerOption().Name == 'Head-To-Head';
    });

    self.TensorflowSelected = ko.computed(function () {

        var isTensorflow = self.useAIbleSimulator().SelectedPlayerOption().Name == 'Tensor Flow';
        var isH2HTensorflow = false;

        if (self.SelectedHeadToHeadOption()) {
            isH2HTensorflow = self.SelectedHeadToHeadOption().Id == 'useAIble-tensorflow' ? true : false;
        }

        return isTensorflow || isH2HTensorflow;
    });

    self.EncogSelected = ko.computed(function () {

        var isEncog = self.useAIbleSimulator().SelectedPlayerOption().Name == 'Encog';
        var isH2HEncog = false;

        if (self.SelectedHeadToHeadOption()) {
            isH2HEncog = self.SelectedHeadToHeadOption().Id == 'useAIble-encog' ? true : false;
        }

        return isEncog || isH2HEncog;
    });

    self.HeadToHeadSelected = ko.computed(function () {
        return self.useAIbleSimulator().SelectedPlayerOption().Name == 'Head-To-Head';
    });

    self.Init = function () {

        var def = $.Deferred();

        self.useAIbleSimulator().GetToken().done(function (token_res) {
            USER_TOKEN = token_res;
            self.useAIbleSimulatorInit();


            self.useAIbleSimulator().GetToken().done(function (token_res_tf) {

                USER_TOKEN_TF = token_res_tf;

                self.TensorflowSimulatorInit();

                self.EncogSimulatorInit();

                def.resolve();
            });

        });

        return def;
    };

    self.useAIbleSimulatorInit = function () {

        self.useAIbleSimulator().Init(USER_TOKEN, {
            UpdatePlayerDetails: self.UpdatePlayerDetails,
            UpdateSummaryDetails: self.SummaryDetails
        });
    };

    self.TensorflowSimulatorInit = function () {
        self.TensorFlowSimulator().Init(USER_TOKEN_TF, {
            UpdatePlayerDetails: self.UpdatePlayerDetails,
            UpdateSummaryDetails: self.SummaryDetails
        });
    };

    self.EncogSimulatorInit = function () {
        self.EncogSimulator().Init(USER_TOKEN, {
            UpdatePlayerDetails: self.UpdatePlayerDetails,
            UpdateSummaryDetails: self.SummaryDetails
        });
    };

    var minimizeSettings = function () {
        $(".sidebarPanel, .newSideBar").addClass("minimized");
        $(".sidebarPanel .panel-body, .newSideBar .panel-body").fadeOut("slow", "linear");
    };

    self.useAIbleDonePlaying = ko.observable(true);
    self.TensorflowDonePlaying = ko.observable(true);
    self.EncogDonePlaying = ko.observable(true);
    self.IsLogistic = ko.observable(true);

    self.PlayGame = function () {

        NO_OF_DAYS_INTERVAL = eval(self.useAIbleSimulator().SelectedSpeedOption().Id / 1000);

        var player = self.useAIbleSimulator().SelectedPlayerOption().Name;

        if (player == 'Human') {

        } else if (player == 'useAIble') {
            self.useAIbleDonePlaying(false);
            self.useAIbleShowChartBtn(false);
            playUseAIble();
        } else if (player == 'Tensor Flow') {
            self.TensorflowDonePlaying(false);
            self.TensorFlowShowChartBtn(false);
            playTensorflow();
        } else if (player == 'Encog') {
            self.EncogDonePlaying(false);
            self.EncogShowChartBtn(false);
            playEncog();
        }
        else if (player == 'Head-To-Head') {

            var h2hPlayer = self.SelectedHeadToHeadOption().Id;

            if (h2hPlayer == 'useAIble-tensorflow') {

                self.useAIbleDonePlaying(false);
                self.TensorflowDonePlaying(false);
                self.useAIbleShowChartBtn(false);
                self.TensorFlowShowChartBtn(false);

                playUseAIble(self.TensorflowDonePlaying);
                playTensorflow(self.useAIbleDonePlaying);

                minimizeSettings();

            } else if (h2hPlayer == 'useAIble-encog') {

                self.useAIbleDonePlaying(false);
                self.EncogDonePlaying(false);
                self.useAIbleShowChartBtn(false);
                self.EncogShowChartBtn(false);

                playUseAIble(self.EncogDonePlaying);
                playEncog(self.useAIbleDonePlaying);

                minimizeSettings();
            }
        }
    };

    var playUseAIble = function (player2) {

        self.useAIbleSimulator().SessionScores([]);
        self.useAIbleSimulator().Day("");
        self.useAIbleSimulator().PlayerDetails([]);
        self.useAIbleSimulator().CurrentSession(0);
        self.useAIbleSimulator().CurrentStatus("");
        //self.useAIbleSimulator().NetworkSettings([]);
        self.useAIbleSimulator().Logistics([]);

        self.SummaryDetails(self.useAIbleSimulator().Canvas(), {
            CurrentStatus: self.useAIbleSimulator().CurrentStatus(),
            CurrentSession: self.useAIbleSimulator().CurrentSession(),
            CurrentSessionScore: self.useAIbleSimulator().CurrentSessionScore()
        });

        var updatePlayerDetails = {
            UpdatePlayerDetails: self.UpdatePlayerDetails,
            UpdateSummaryDetails: self.SummaryDetails
        };

        var moveBeer = {
            MoveRetailerToWholeSaler: self.MoveRetailerToWholeSaler,
            MoveWholeSalerToDistributor: self.MoveWholeSalerToDistributor,
            MoveDistributorToFactory: self.MoveDistributorToFactory,
            MoveFactoryToDistributor: self.MoveFactoryToDistributor,
            MoveDistributorToWholeSaler: self.MoveDistributorToWholeSaler,
            MoveWholeSalerToRetailer: self.MoveWholeSalerToRetailer
        };

        self.useAIbleSimulator().Play(USER_TOKEN, updatePlayerDetails, moveBeer, player2, self.SessionData, self.ShowComparisonChart);

    };

    var playTensorflow = function (useAIble) {

        self.TensorFlowSimulator().SessionScores([]);
        self.TensorFlowSimulator().Day("");
        self.TensorFlowSimulator().PlayerDetails([]);
        self.TensorFlowSimulator().CurrentSession(0);
        self.TensorFlowSimulator().CurrentStatus("");
        self.TensorFlowSimulator().Logistics([]);

        self.SummaryDetails(self.TensorFlowSimulator().Canvas(), {
            CurrentStatus: self.TensorFlowSimulator().CurrentStatus(),
            CurrentSession: self.TensorFlowSimulator().CurrentSession(),
            CurrentSessionScore: self.TensorFlowSimulator().CurrentSessionScore()
        });

        var updatePlayerDetails = {
            UpdatePlayerDetails: self.UpdatePlayerDetails,
            UpdateSummaryDetails: self.SummaryDetails
        };

        var moveBeer = {
            MoveRetailerToWholeSaler: self.MoveRetailerToWholeSaler,
            MoveWholeSalerToDistributor: self.MoveWholeSalerToDistributor,
            MoveDistributorToFactory: self.MoveDistributorToFactory,
            MoveFactoryToDistributor: self.MoveFactoryToDistributor,
            MoveDistributorToWholeSaler: self.MoveDistributorToWholeSaler,
            MoveWholeSalerToRetailer: self.MoveWholeSalerToRetailer
        };

        self.TensorFlowSimulator().Play(USER_TOKEN_TF, self.useAIbleSimulator().NumberOfSessions(), self.useAIbleSimulator().LogisticSettings(), updatePlayerDetails , moveBeer, self.useAIbleSimulator().SelectedSpeedOption, useAIble, self.SessionData, self.ShowComparisonChart, self.TensorflowDonePlaying, self.TensorFlowShowChartBtn);
    };

    var playEncog = function (useAIble) {

        self.EncogSimulator().SessionScores([]);
        self.EncogSimulator().Day("");
        self.EncogSimulator().PlayerDetails([]);
        self.EncogSimulator().CurrentSession(0);
        self.EncogSimulator().CurrentStatus("");
        self.EncogSimulator().Logistics([]);

        self.SummaryDetails(self.EncogSimulator().Canvas(), {
            CurrentStatus: self.EncogSimulator().CurrentStatus(),
            CurrentSession: self.EncogSimulator().CurrentSession(),
            CurrentSessionScore: self.EncogSimulator().CurrentSessionScore()
        });

        var updatePlayerDetails = {
            UpdatePlayerDetails: self.UpdatePlayerDetails,
            UpdateSummaryDetails: self.SummaryDetails
        };

        var moveBeer = {
            MoveRetailerToWholeSaler: self.MoveRetailerToWholeSaler,
            MoveWholeSalerToDistributor: self.MoveWholeSalerToDistributor,
            MoveDistributorToFactory: self.MoveDistributorToFactory,
            MoveFactoryToDistributor: self.MoveFactoryToDistributor,
            MoveDistributorToWholeSaler: self.MoveDistributorToWholeSaler,
            MoveWholeSalerToRetailer: self.MoveWholeSalerToRetailer
        };

        self.EncogSimulator().Play(USER_TOKEN, self.useAIbleSimulator().NumberOfSessions(), self.useAIbleSimulator().LogisticSettings(), updatePlayerDetails, moveBeer, self.useAIbleSimulator().SelectedSpeedOption, useAIble, self.SessionData, self.ShowComparisonChart, self.EncogDonePlaying, self.EncogShowChartBtn);
    };

    // Load Multiple Images
    self.loadImages = function (sources, callback) {
        var images = {};
        var loadImages = 0;
        var numImages = 0;

        for (var src in sources) {
            numImages++;
        }
        for (var src in sources) {
            images[src] = new Image();
            images[src].onload = function () {
                if (++loadImages >= numImages) {
                    callback(images);
                }
            };
            images[src].src = sources[src];
        }
    };

    self.sources = {
        bg: '/Content/img/AiProjects/LogisticsSimulations/background.svg',
        retailer: '/Content/img/AiProjects/LogisticsSimulations/retailer.svg',
        wholesaler: '/Content/img/AiProjects/LogisticsSimulations/wholesaler.svg',
        distributor: '/Content/img/AiProjects/LogisticsSimulations/distributor.svg',
        factory: '/Content/img/AiProjects/LogisticsSimulations/factory.svg',
        truck: '/Content/img/AiProjects/LogisticsSimulations/truck.svg',
        order: '/Content/img/AiProjects/LogisticsSimulations/order.svg',
        paper: '/Content/img/AiProjects/LogisticsSimulations/paper.png',
        up: '/Content/img/AiProjects/LogisticsSimulations/up.svg',
        down: '/Content/img/AiProjects/LogisticsSimulations/down.svg'
    };

    //end of Load Multiple Images

    self.UpdatePlayerDetails = function (canvas, papersCacheVars, DAY_PAPER, details, data) {

        canvas.putImageData(DAY_PAPER, 0, 0);

        $.each(details, function (index, player) {

            var name = player.Name();

            switch (name) {
                case "Retailer":
                    drawRetailer(canvas, player, papersCacheVars.RETAILER_PAPER_CACHE, data);
                    break;
                case "WholeSaler":
                    drawWholesaler(canvas, player, papersCacheVars.WHOLESALER_PAPER_CACHE, data);
                    break;
                case "Distributor":
                    drawDistributor(canvas, player, papersCacheVars.DISTRIBUTOR_PAPER_CACHE, data);
                    break;
                case "Factory":
                    drawFactory(canvas, player, papersCacheVars.FACTORY_PAPER_CACHE, data);
                    break;
            }
        });

    };

    var imgDistDimension = 35;
    var distributionSpeedIncreaseDecrease = 3;

    var distanceTraveled = 205;
    var carY = 370;

    //var defaultDistributionSpeed = 30;
    self.MoveRetailerToWholeSaler = function (canvas, speed) {

        var distributionSpeed = eval((distanceTraveled / distributionSpeedIncreaseDecrease) * speed);

        var x1 = 125, y1 = 170, w11 = imgDistDimension, w12 = imgDistDimension;
        var stopAt = eval(x1 + distanceTraveled);

        self.MoveBeer(canvas, x1, y1, 'orange', distributionSpeed, stopAt, false);
    };

    self.MoveWholeSalerToRetailer = function (canvas, speed) {

        var distributionSpeed = eval((distanceTraveled / distributionSpeedIncreaseDecrease) * speed);

        var x2 = 320, y2 = carY, w21 = imgDistDimension, w22 = imgDistDimension;
        var stopAt = eval(x2 - distanceTraveled);

        self.MoveBeer(canvas, x2, y2, 'red', distributionSpeed, stopAt, true);
    };

    self.MoveWholeSalerToDistributor = function (canvas, speed) {

        var distributionSpeed = eval((distanceTraveled / distributionSpeedIncreaseDecrease) * speed);

        var x1 = 365, y1 = 170, w11 = imgDistDimension, w12 = imgDistDimension;
        var stopAt = eval(x1 + distanceTraveled);

        self.MoveBeer(canvas, x1, y1, 'lightgreen', distributionSpeed, stopAt, false);
    };

    self.MoveDistributorToWholeSaler = function (canvas, speed) {

        var distributionSpeed = eval((distanceTraveled / distributionSpeedIncreaseDecrease) * speed);

        var x1 = 560, y1 = carY, w11 = imgDistDimension, w12 = imgDistDimension;
        var stopAt = eval(x1 - distanceTraveled);

        self.MoveBeer(canvas, x1, y1, 'green', distributionSpeed, stopAt, true);
    };

    self.MoveDistributorToFactory = function (canvas, speed) {

        var distributionSpeed = eval((distanceTraveled / distributionSpeedIncreaseDecrease) * speed);

        var x1 = 615, y1 = 170, w11 = imgDistDimension, w12 = imgDistDimension;
        var stopAt = eval(x1 + distanceTraveled);

        self.MoveBeer(canvas, x1, y1, 'lightblue', distributionSpeed, stopAt, false);
    };

    self.MoveFactoryToDistributor = function (canvas, speed) {

        var distributionSpeed = eval((distanceTraveled / distributionSpeedIncreaseDecrease) * speed);

        var x1 = 810, y1 = carY, w11 = imgDistDimension, w12 = imgDistDimension;
        var stopAt = eval(x1 - distanceTraveled);

        self.MoveBeer(canvas,x1, y1, 'blue', distributionSpeed, stopAt, true);
    };

    self.MoveBeer = function (canvas, x, y, color, speed, stopAt, isDescending) {

        var def = $.Deferred();
        var moveCounter = 0;

        var w11 = imgDistDimension, w12 = imgDistDimension;
        var startMoving = function () {

            var tt = setTimeout(function () {

                if (isDescending == true) {


                    clearRect(canvas, x + distributionSpeedIncreaseDecrease, y, w11, w12);
                    createImage(canvas, x, y, w11, w12, color, isDescending);

                    if (x > stopAt) {
                        startMoving();
                    } else if (x == stopAt) {
                        clearTimeout(this);
                    }

                    x = x - distributionSpeedIncreaseDecrease;
                    def.resolve();
                } else {

                    clearRect(canvas, x - distributionSpeedIncreaseDecrease, y, w11, w12);
                    createImage(canvas, x, y, w11, w12, color, isDescending);

                    if (x <= stopAt) {
                        startMoving();
                    } else if (x == stopAt) {
                        clearTimeout(this);
                    }

                    x = x + distributionSpeedIncreaseDecrease;
                    def.resolve();
                }


            }, speed);
        };

        restoreRoadPaper(canvas);

        startMoving();

        return def;
    };

    var restoreRoadPaper = function (canvas) {
        //canvas.putImageData(ROAD_PAPER_CACHE, 20, 350);
    };

    self.SummaryDetails = function (canvas, summary) {

        clearRect(canvas, 740, 10, 250, 150);

        canvas.fillStyle = "rgba(255,255,255,0.60)";
        canvas.fillRect(740, 10, 250, 150);
        canvas.fillStyle = "black";
        canvas.font = "25px Arial";
        canvas.fillText("Summary", 800, 35);
        canvas.fillStyle = "rgb(0, 106, 149)";
        canvas.font = "15px Arial";

        //ctx.fillText("Status:  " + self.useAIbleSimulator().CurrentStatus(), 745, 60);
        //ctx.fillText("Session:  " + eval(self.useAIbleSimulator().CurrentSession() + 1), 745, 80);
        //ctx.fillText("Storage cost per day:  " + "$0.5", 745, 100);
        //ctx.fillText("Backlog cost per day:  " + "$1.0", 745, 120);
        //ctx.fillText("Last Session Score:   " + self.useAIbleSimulator().CurrentSessionScore(), 745, 140);

        canvas.fillText("Status:  " + summary.CurrentStatus, 745, 60);
        canvas.fillText("Session:  " + eval(summary.CurrentSession + 1), 745, 80);
        canvas.fillText("Storage cost per day:  " + "$0.5", 745, 100);
        canvas.fillText("Backlog cost per day:  " + "$1.0", 745, 120);
        canvas.fillText("Last Session Score:   " + summary.CurrentSessionScore, 745, 140);

    };

    self.GetImages = function () {

        var def = $.Deferred();
        self.loadImages(self.sources, function (images) {

            CANVAS_BG_IMG = images.bg;

            RETAILER_IMG = images.retailer;
            WHOLESALER_IMG = images.wholesaler;
            DISTRIBUTOR_IMG = images.distributor;
            FACTORY_IMG = images.factory;

            PAPER_IMG = images.paper;
            ORDER_IMG = images.order;
            TRUCK_IMG = images.truck;

            def.resolve();

        });

        return def;
    };

    self.InitGameElements = function (canvas, cacheImagesStorageVars) {

        clearRect(canvas, 0, 0, 1000, 850);

        canvas.drawImage(CANVAS_BG_IMG, 0, 0, 1000, 850);
        cacheImagesStorageVars.CANVAS_BG_CACHE(canvas.getImageData(0, 0, 1000, 850));

        canvas.drawImage(RETAILER_IMG, 43, 210, 150, 150);
        cacheImagesStorageVars.RETAILER_CACHE(canvas.getImageData(43, 210, 150, 150));

        canvas.drawImage(WHOLESALER_IMG, 265, 181, 180, 180);
        cacheImagesStorageVars.WHOLESALER_CACHE(canvas.getImageData(265, 181, 180, 180));

        canvas.drawImage(DISTRIBUTOR_IMG, 520, 181, 180, 180);
        cacheImagesStorageVars.DISTRIBUTOR_CACHE(canvas.getImageData(520, 181, 180, 180));

        canvas.drawImage(FACTORY_IMG, 780, 180, 180, 180);
        cacheImagesStorageVars.FACTORY_CACHE(canvas.getImageData(780, 180, 180, 180));

        canvas.drawImage(PAPER_IMG, 0, 420, 260, 400);
        cacheImagesStorageVars.RETAILER_PAPER_CACHE(canvas.getImageData(0, 420, 260, 400));

        canvas.drawImage(PAPER_IMG, 246, 420, 260, 400);
        cacheImagesStorageVars.WHOLESALER_PAPER_CACHE(canvas.getImageData(246, 420, 260, 400));

        canvas.drawImage(PAPER_IMG, 493, 420, 260, 400);
        cacheImagesStorageVars.DISTRIBUTOR_PAPER_CACHE(canvas.getImageData(493, 420, 260, 400));

        canvas.drawImage(PAPER_IMG, 743, 420, 260, 400);
        cacheImagesStorageVars.FACTORY_PAPER_CACHE(canvas.getImageData(743, 420, 260, 400));

        // summary
        canvas.fillStyle = "rgba(255,255,255,0.60)";
        canvas.fillRect(740, 10, 250, 150);
        canvas.fillStyle = "black";
        canvas.font = "25px Arial";
        canvas.fillText("Summary", 800, 35);
        canvas.fillStyle = "rgb(0, 106, 149)";
        canvas.font = "15px Arial";
        canvas.fillText("Status:  " + self.useAIbleSimulator().CurrentStatus(), 745, 60);
        canvas.fillText("Session:  " + eval(self.useAIbleSimulator().CurrentSession() + 1), 745, 80);
        canvas.fillText("Storage cost per day:  " + "$0.5", 745, 100);
        canvas.fillText("Backlog cost per day:  " + "$1.0", 745, 120);
        canvas.fillText("Last Session Score:   " + self.useAIbleSimulator().CurrentSessionScore(), 745, 140);


        // day image
        canvas.drawImage(PAPER_IMG, 0, 0, 180, 100);
        cacheImagesStorageVars.DAY_PAPER_CACHE(canvas.getImageData(0, 0, 180, 100));

        // transparent image
        canvas.globalAlpha = 0;
        canvas.drawImage(PAPER_IMG, 20, 350, 1020, 73);
        cacheImagesStorageVars.ROAD_PAPER_CACHE(canvas.getImageData(20, 350, 1020, 73));
        canvas.globalAlpha = 1;
    };

    var drawRetailer = function (canvas, player, retailerPaperCache, data) {

        if (player.Name() == 'None') {
            console.log(player);
            return;
        }

        canvas.putImageData(retailerPaperCache, 0, 420);

        var x = 42;

        canvas.font = "40px Handlee";
        
        canvas.fillText("Day: " + data.Day(), 10, 60);

        canvas.font = "35px Handlee";
        canvas.fillText("Retailer", x, 496);
        canvas.font = "20px Handlee";
        canvas.fillText("Inventory:   " + player.Inventory(), x, 553);
        canvas.fillText("Expected:   " + player.Expected(), x, 572);
        canvas.fillText("Shipped:   " + player.Shipped(), x, 591);
        canvas.fillText("Ordered:   " + player.Ordered(), x, 610);
        canvas.fillText("Storage Cost:   " + player.StorageCost(), x, 664);
        canvas.fillText("Backlog Cost:   " + player.BacklogCost(), x, 683);



        var outputs = data.FinalResults();

        if (outputs.length > 0) {
            $.each(outputs, function (index, value) {

                if (value.Name == "Retailer_Min") {
                    player.MinStockLevel(value.Value);
                } else if (value.Name == "Retailer_Max") {
                    player.MaxStockLevel(value.Value);
                }

            });
        }
        canvas.font = "23px Handlee";
        canvas.fillText("Player Settings", x, 721);
        canvas.fillStyle = "red";
        canvas.font = "20px Handlee";
        canvas.fillText("Min Stock Level:   " + (player.MinStockLevel() != undefined ? player.MinStockLevel() : ""), x, 740);
        canvas.fillText("Max Stock Level:   " + (player.MaxStockLevel() != undefined ? player.MaxStockLevel() : ""), x, 759);
        canvas.fillStyle = "rgb(0, 106, 149)";
    };

    var drawWholesaler = function (canvas, player, wholesalerPaperCache, data) {

        if (player.Name() == 'None') {
            console.log(player);
            return;
        }

        canvas.putImageData(wholesalerPaperCache, 246, 420);

        var x = 290;

        canvas.font = "35px Handlee";

        canvas.fillText("Wholesaler", x, 496);
        canvas.font = "20px Handlee";
        canvas.fillText("Inventory:   " + player.Inventory(), x, 553);
        canvas.fillText("Expected:   " + player.Expected(), x, 572);
        canvas.fillText("Shipped:   " + player.Shipped(), x, 591);
        canvas.fillText("Ordered:   " + player.Ordered(), x, 610);
        canvas.fillText("Storage Cost:   " + player.StorageCost(), x, 664);
        canvas.fillText("Backlog Cost:   " + player.BacklogCost(), x, 683);

        var outputs = data.FinalResults();
        if (outputs.length > 0) {
            $.each(outputs, function (index, value) {
                if (value.Name == "WholeSaler_Min") {
                    player.MinStockLevel(value.Value);
                } else if (value.Name == "WholeSaler_Max") {
                    player.MaxStockLevel(value.Value);
                }
            });
        }

        canvas.font = "23px Handlee";
        canvas.fillText("Player Settings", x, 721);
        canvas.fillStyle = "red";
        canvas.font = "20px Handlee";
        canvas.fillText("Min Stock Level:   " + (player.MinStockLevel() != undefined ? player.MinStockLevel() : ""), x, 740);
        canvas.fillText("Max Stock Level:   " + (player.MaxStockLevel() != undefined ? player.MaxStockLevel() : ""), x, 759);
        canvas.fillStyle = "rgb(0, 106, 149)";

        //canvas.fillText("Min Stock Level:   " + (player.MinStockLevel() ? player.MinStockLevel() : ""), x, 721);
        //canvas.fillText("Max Stock Level:   " + (player.MaxStockLevel() ? player.MaxStockLevel() : ""), x, 740);

    };

    var drawDistributor = function (canvas, player, distributorPaperCache, data) {

        if (player.Name() == 'None') {
            console.log(player);
            return;
        }

        canvas.putImageData(distributorPaperCache, 493, 420);

        var x = 535;

        canvas.font = "35px Handlee";

        canvas.fillText("Distributor", x, 496);
        canvas.font = "20px Handlee";
        canvas.fillText("Inventory:   " + player.Inventory(), x, 553);
        canvas.fillText("Expected:   " + player.Expected(), x, 572);
        canvas.fillText("Shipped:   " + player.Shipped(), x, 591);
        canvas.fillText("Ordered:   " + player.Ordered(), x, 610);
        canvas.fillText("Storage Cost:   " + player.StorageCost(), x, 664);
        canvas.fillText("Backlog Cost:   " + player.BacklogCost(), x, 683);


        var outputs = data.FinalResults();

        if (outputs.length > 0) {
            $.each(outputs, function (index, value) {

                if (value.Name == "Distributor_Min") {
                    player.MinStockLevel(value.Value);
                } else if (value.Name == "Distributor_Max") {
                    player.MaxStockLevel(value.Value);
                }

            });
        }
        canvas.font = "23px Handlee";
        canvas.fillText("Player Settings", x, 721);
        canvas.fillStyle = "red";
        canvas.font = "20px Handlee";
        canvas.fillText("Min Stock Level:   " + (player.MinStockLevel() != undefined ? player.MinStockLevel() : ""), x, 740);
        canvas.fillText("Max Stock Level:   " + (player.MaxStockLevel() != undefined ? player.MaxStockLevel() : ""), x, 759);
        canvas.fillStyle = "rgb(0, 106, 149)";

        //canvas.fillText("Min Stock Level:   " + (player.MinStockLevel() ? player.MinStockLevel() : ""), x, 721);
        //canvas.fillText("Max Stock Level:   " + (player.MaxStockLevel() ? player.MaxStockLevel() : ""), x, 740);

    };

    var drawFactory = function (canvas, player, factoryPaperCache, data) {

        if (player.Name() == 'None') {
            console.log(player);
            return;
        }

        canvas.putImageData(factoryPaperCache, 743, 420);

        var x = 785;

        canvas.font = "35px Handlee";

        canvas.fillText("Factory", x, 496);
        canvas.font = "20px Handlee";
        canvas.fillText("Inventory:   " + player.Inventory(), x, 553);
        canvas.fillText("Expected:   " + player.Expected(), x, 572);
        canvas.fillText("Shipped:   " + player.Shipped(), x, 591);
        canvas.fillText("Ordered:   " + player.Ordered(), x, 610);
        canvas.fillText("Storage Cost:   " + player.StorageCost(), x, 664);
        canvas.fillText("Backlog Cost:   " + player.BacklogCost(), x, 683);

        var outputs = data.FinalResults();

        if (outputs.length > 0) {
            $.each(outputs, function (index, value) {

                if (value.Name == "Factory_Min") {
                    player.MinStockLevel(value.Value);
                } else if (value.Name == "Factory_Max") {
                    player.MaxStockLevel(value.Value);
                } else if (value.Name == "Factory_Units_Per_Day") {
                    player.UnitsPerDay(value.Value);
                }

            });
        }

        canvas.font = "23px Handlee";
        canvas.fillText("Player Settings", x, 721);
        canvas.fillStyle = "red";
        canvas.font = "20px Handlee";
        canvas.fillText("Min Stock Level:   " + (player.MinStockLevel() != undefined ? player.MinStockLevel() : ""), x, 740);
        canvas.fillText("Max Stock Level:   " + (player.MaxStockLevel() != undefined ? player.MaxStockLevel() : ""), x, 759);
        canvas.fillText("Units Per Day:   " + (player.UnitsPerDay() != undefined ? player.UnitsPerDay() : ""), x, 778);
        canvas.fillStyle = "rgb(0, 106, 149)";

        //canvas.fillText("Min Stock Level:   " + (player.MinStockLevel() ? player.MinStockLevel() : ""), x, 721);
        //canvas.fillText("Max Stock Level:   " + (player.MaxStockLevel() ? player.MaxStockLevel() : ""), x, 740);
        //canvas.fillText("Units Per Day:   " + (player.UnitsPerDay() ? player.UnitsPerDay() : ""), x, 759);

    };

    var createImage = function (canvas, x, y, w, h, bg, isOrder) {
        canvas.drawImage(isOrder == true ? TRUCK_IMG : ORDER_IMG, x, y, w, h);
    };

    var clearRect = function (canvas, x, y, w, h) {
        canvas.clearRect(x, y, w, h);
    };

    // charting
    self.SessionData = ko.computed(function () {

        var player = self.useAIbleSimulator().SelectedPlayerOption().Name;
        var sessionScores = [];

        if (player == 'useAIble') {
            //sessionScores = self.useAIbleSimulator().SessionScores();

            sessionScores = [];
            $.each(self.useAIbleSimulator().SessionScores(), function (i, v) {
                v.Type = ko.observable('useAIble');
                sessionScores.push(v);
            });

        } else if (player == 'Tensor Flow') {
            //sessionScores = self.TensorFlowSimulator().SessionScores();

            sessionScores = [];
            $.each(self.TensorFlowSimulator().SessionScores(), function (i, v) {
                v.Type = ko.observable('tensorflow');
                sessionScores.push(v);
            });

        } else if (player == 'Encog') {
            //sessionScores = self.TensorFlowSimulator().SessionScores();

            sessionScores = [];
            $.each(self.EncogSimulator().SessionScores(), function (i, v) {
                v.Type = ko.observable('encog');
                sessionScores.push(v);
            });

        }
        else if (player == 'Head-To-Head') {

            var sessionScores = [];

            if (self.SelectedHeadToHeadOption()) {

                var h2h = self.SelectedHeadToHeadOption().Id;

                if (h2h == 'useAIble-tensorflow') {
                    $.each(self.useAIbleSimulator().SessionScores(), function (index, val) {
                        val.Type = ko.observable('useAIble');
                        sessionScores.push(val);
                    });
                    $.each(self.TensorFlowSimulator().SessionScores(), function (index, val) {
                        val.Type = ko.observable('tensorflow');
                        sessionScores.push(val);
                    });
                } else if (h2h == 'useAIble-encog') {
                    $.each(self.useAIbleSimulator().SessionScores(), function (index, val) {
                        val.Type = ko.observable('useAIble');
                        sessionScores.push(val);
                    });
                    $.each(self.EncogSimulator().SessionScores(), function (index, val) {
                        val.Type = ko.observable('encog');
                        sessionScores.push(val);
                    });
                }
            }

        }

        return sessionScores;
    });

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
        if (self.useAIbleSimulator().SelectedPlayerOption().Name == 'Head-To-Head') {

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

        } else if (self.useAIbleSimulator().SelectedPlayerOption().Name == 'useAIble') {
            return self.useAIbleShowChartBtn();
        } else if (self.useAIbleSimulator().SelectedPlayerOption().Name == 'Tensor Flow') {
            return self.TensorFlowShowChartBtn();
        } else if (self.useAIbleSimulator().SelectedPlayerOption().Name == 'Encog') {
            return self.EncogShowChartBtn();
        } else {
            return false;
        }
    });

    self.ShowComparisonChart = function (gameData) {

        var useAIbleScores = [];
        var useAIbleSessions = [];

        var tensorFlowScores = [];
        var tensorFlowSessions = [];

        var encogScores = [];
        var encogSessions = [];

        $.each(gameData, function (i, v) {

            if (v.Type() == 'useAIble') {

                useAIbleScores.push(eval(v.Score.replace('$', '').replace(',', '')));
                useAIbleSessions.push(v.Session);

            } else if (v.Type() == 'tensorFlow') {

                tensorFlowScores.push(eval(v.Score.replace('$', '').replace(',', '')));
                tensorFlowSessions.push(v.Session);

            } else if (v.Type() == 'encog') {

                encogScores.push(eval(v.Score.replace('$', '').replace(',', '')));
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
            useAIbleAvgScore: self.useAIbleAvgScore,
            useAIbleHighestScore: self.useAIbleHighestScore,
            useAIbleLearnedAfter: self.useAIbleLearnedAfter,

            TensorFlowAvgScore: self.TensorFlowAvgScore,
            TensorFlowHighestScore: self.TensorFlowHighestScore,
            TensorFlowLearnedAfter: self.TensorFlowLearnedAfter,

            EncogAvgScore: self.EncogAvgScore,
            EncogHighestScore: self.EncogHighestScore,
            EncogLearnedAfter: self.EncogLearnedAfter
        };


        if (self.useAIbleSimulator().SelectedPlayerOption().Name == 'Head-To-Head') {
            createChart(undefined, chartData, self.SelectedChartViewOption(), self.FromChartPage, self.ToChartPage, summary, self.NUMBER_OF_CHART_POINTS, true);
        } else if (self.useAIbleSimulator().SelectedPlayerOption().Name == 'useAIble') {
            createChart('useAIble', chartData, self.SelectedChartViewOption(), self.FromChartPage, self.ToChartPage, summary, self.NUMBER_OF_CHART_POINTS, true);
        } else if (self.useAIbleSimulator().SelectedPlayerOption().Name == 'Tensor Flow') {
            createChart('tensorFlow', chartData, self.SelectedChartViewOption(), self.FromChartPage, self.ToChartPage, summary, self.NUMBER_OF_CHART_POINTS, true);
        } else if (self.useAIbleSimulator().SelectedPlayerOption().Name == 'Encog') {
            createChart('encog', chartData, self.SelectedChartViewOption(), self.FromChartPage, self.ToChartPage, summary, self.NUMBER_OF_CHART_POINTS, true);
        }
    };
}