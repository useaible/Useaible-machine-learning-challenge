function ChartVM(numSessions, sessionData, regularPlayer, headtoheadPlayer) {

    var self = this;
    var sessions = numSessions;

    self.SessionData = ko.observable(sessionData);
    self.SelectedPlayerOption = ko.observable(regularPlayer);
    self.SelectedHeadToHeadOption = ko.observable(headtoheadPlayer);
    
    self.ChartViewOptions = ko.observableArray([{ Id: 1, Text: "Default" }, { Id: 20, Text: "Per 20 Sessions" }, { Id: 50, Text: "Per 50 Sessions" }, { Id: 100, Text: "Per 100 Sessions" }, { Id: 150, Text: "Per 150 Sessions" },
        { Id: 200, Text: "Per 200 Sessions" }]);
    self.SelectedChartViewOption = ko.observable(self.ChartViewOptions()[3]);
    self.SelectedChartViewOption.subscribe(function (val) {
        showComparisonChart(self);
    });

    self.FromChartPage = ko.observable(0);
    self.ToChartPage = ko.observable(99);

    self.PreviousChartPage = function () {
        if (self.FromChartPage() > 0) {
            self.FromChartPage(self.FromChartPage() - 99);
            self.ToChartPage(self.FromChartPage() + 99);
        }

        showComparisonChart(self);
    };

    self.NextChartPage = function () {

        if (self.ToChartPage() < sessions) {
            self.FromChartPage(self.ToChartPage());
            self.ToChartPage(self.ToChartPage() + 99);
        }
        showComparisonChart(self);
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
}

function showComparisonChart(chartVM) {

    var useAIbleScores = [];
    var useAIbleSessions = [];

    var tensorFlowScores = [];
    var tensorFlowSessions = [];

    var encogScores = [];
    var encogSessions = [];

    $.each(chartVM.SessionData(), function (i, v) {

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
        useAIbleAvgScore: chartVM.useAIbleAvgScore,
        useAIbleHighestScore: chartVM.useAIbleHighestScore,
        useAIbleLearnedAfter: chartVM.useAIbleLearnedAfter,

        TensorFlowAvgScore: chartVM.TensorFlowAvgScore,
        TensorFlowHighestScore: chartVM.TensorFlowHighestScore,
        TensorFlowLearnedAfter: chartVM.TensorFlowLearnedAfter,

        EncogAvgScore: chartVM.EncogAvgScore,
        EncogHighestScore: chartVM.EncogHighestScore,
        EncogLearnedAfter: chartVM.EncogLearnedAfter
    };

    if (chartVM.SelectedPlayerOption().Name == 'Head-To-Head') {
        createChart(undefined, chartData, chartVM.SelectedChartViewOption(), chartVM.FromChartPage, chartVM.ToChartPage, summary, chartVM.NUMBER_OF_CHART_POINTS);
    } else if (chartVM.SelectedPlayerOption().Name == 'useAIble') {
        createChart('useAIble', chartData, chartVM.SelectedChartViewOption(), chartVM.FromChartPage, chartVM.ToChartPage, summary, chartVM.NUMBER_OF_CHART_POINTS);
    } else if (chartVM.SelectedPlayerOption().Name == 'Tensor Flow') {
        createChart('tensorFlow', chartData, chartVM.SelectedChartViewOption(), chartVM.FromChartPage, chartVM.ToChartPage, summary, chartVM.NUMBER_OF_CHART_POINTS);
    } else if (chartVM.SelectedPlayerOption().Name == 'Encog') {
        createChart('encog', chartData, chartVM.SelectedChartViewOption(), chartVM.FromChartPage, chartVM.ToChartPage, summary, chartVM.NUMBER_OF_CHART_POINTS);
    }
}