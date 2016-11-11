//Create Chart function


function createChart(player, chartData, chartOption, fromChartPage, toChartPage, summary, numOfChartPt, islogistic) {
    bySomething = 100;//chartOption.Id;
    //chartData = '{"useAIble":{"Name":"useAIble","Scores":[-39886,-6239,-31582,-39823,-12200,-17609,-35344,-15714,-17609,-39849,-12200,-11924,-28077,-17609,-8686,-39818,-39827,-10581,-8962,-6239,-2486,-2486,-11335,-6515,-7030,1303,1303,-2486,-7067,-11096,-2486,4265,-10029,-2486,-10305,512,-8962,-2486,-2486,-2486,-2486,-7030,-6239,-5724,-5724,-8686,-10305,-5724,-2486,-6515,-5724,-8962,4265,2407,-15327,-5724,-6791,-2210,-5724,-20184,-7067,-315,-5724,-4859,-2210,-8686,-4344,-2210,-4896,-9477,-8686,-5135,-7067,-8686,-8962,-8962,-8962,-8962,-7067,-6515,-591,-1934,-7545,-591,-7067,-7067,-2210,-2210,-2210,-8686,-6791,-8686,-8686,-591,-4896,-2210,-2210,-2210,1303,1303,-2210,-2210,-2210,1027,-4344,-591,-2210,1303,1579,-2210,-2210,-2210,-2210,-2210,1027,-3553,-7067,-7067,-7067,-7067,-7067,-7067,1303,1303,1303,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265,4265],"Sessions":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250]},"TensorFlow":{"Name":"Google Tensor Flow","Scores":[-39889,-39888,-39888,-39882,-39889,-39877,-39888,-39855,-39878,-39883,-39880,-39895,-39886,-39893,-39890,-39880,-39879,-39869,-39871,-39874,-39875,-39866,-39891,-39866,-39880,-39893,-39878,-39888,-39892,-39871,-39896,-39873,-39907,-39887,-39885,-39888,-39888,-39886,-39867,-39869,-39865,-39868,-39884,-39872,-39867,-39873,-39867,-39866,-39887,-39885,-39884,-39882,-39891,-39863,-39863,-39871,-39866,-39872,-39891,-39874,-39862,-39863,-39863,-39876,-39839,-39867,-39873,-39898,-39874,-39862,-39877,-39878,-39877,-39869,-39882,-39871,-39885,-39887,-39877,-39873,-39874,-39880,-39888,-39871,-39858,-39895,-39888,-39846,-39866,-39877,-39881,-39864,-39879,-39876,-39889,-39873,-39893,-39882,-39888,-39891,-39868,-39892,-39882,-39886,-39863,-39882,-39866,-39871,-39852,-39874,-39855,-39873,-39856,-39844,-39875,-39871,-39874,-39860,-39877,-39852,-39875,-39878,-39889,-39869,-39885,-39865,-39877,-39873,-39855,-39879,-39864,-39883,-2486.000000000007,-39882,-39872,-39884,-39879,-39885,-39877,-39880,-39879,-39885,-39877,-39882,-39887,-39866,-39882,-39879,-39874,-39872,-39896,-39879,-39860,-39886,-39878,-39867,-39882,-39892,-39888,-39882,-39879,-39873,-39870,-39868,-39886,-39853,-39877,-39865,-39875,-39876,-39903,-39892,-39860,-39882,-39872,-39853,-39869,-39871,-39886,-39861,-39874,-39880,-39882,-39874,-39885,-39870,-39883,-39866,-39872,-39851,-39875,-39883,-39868,-39876,-39873,-39877,-39882,-39861,-39884,-39872,-39877,-39883,-39878,-39867,-39886,-39871,-39865,-39880,-39870,-39871,-39869,-39873,-39875,-39878,-39883,-39843,-39877,-39876,-39889,-39884,-39880,-39890,-39892,-39879,-39881,-39861,-39858,-39873,-39885,-39881,-39864,-39871,-39864,-39869,-39868,-39892,-39850,-39872,-39885,-39862,-39879,-39866,-39854,-39873,-39853,-39883,-39883,-39871,-39877,-39887],"Sessions":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250]}}';
    //chartData = eval("(" + chartData + ")");
    var categories;
    var max;
    var min;

    var scores1;
    var scores2;
    var scores3;
   
    var summaryTitle = "";

    if (player != undefined) {
        if (player == 'useAIble') {
            if (bySomething != undefined) {
                var sessions = [];
                var from = 0;
                var to = 0;
                var len = chartData.useAIble.Sessions.length;

                from = fromChartPage();
                if (fromChartPage() + 100 >= chartData.useAIble.Sessions.length) {
                    toChartPage(chartData.useAIble.Sessions.length);
                }

                to = toChartPage();

                for (i = from; i <= to; i++) {
                    sessions.push(chartData.useAIble.Sessions[i]);
                }

                categories = sessions;

                var scoresUseAIble = [];
                for (i = from; i < to; i++) {
                    scoresUseAIble.push(chartData.useAIble.Scores[i]);
                }

                scores1 = scoresUseAIble;

                max = scores1.max();
                min = scores1.min();

                var useAIbleSum = 0;
                $.each(chartData.useAIble.Scores, function (index, val) {
                    useAIbleSum += val;
                });

                var learnedAfter;
                $.each(chartData.useAIble.Scores, function (index, val) {
                    if (val > 0) {
                        learnedAfter = index + 1;
                        return false;
                    }
                });

                var avg = useAIbleSum / len;

                summary.useAIbleAvgScore(parseInt(avg));
                summary.useAIbleHighestScore(chartData.useAIble.Scores.max());

                if (islogistic) {
                    summary.useAIbleLearnedAfter(chartData.useAIble.Scores.min());
                } else {
                    summary.useAIbleLearnedAfter(learnedAfter);
                }

            } else {

                categories = chartData.useAIble.Sessions;
                //max = Math.max(chartData.useAIble.Scores);
                //min = Math.min(chartData.useAIble.Scores);

                max = chartData.useAIble.Scores.max();
                min = chartData.useAIble.Scores.min();
            }


            summaryTitle = "(useAIble)";

        } else if (player == 'tensorFlow') {

            if (bySomething != undefined) {
                
                var sessions = [];
                var from = 0;
                var to = 0;
                var len = chartData.TensorFlow.Sessions.length;

                from = fromChartPage();
                if (fromChartPage() + 100 >= chartData.TensorFlow.Sessions.length) {
                    toChartPage(chartData.TensorFlow.Sessions.length);
                }

                to = toChartPage();

                for (i = from; i <= to; i++) {
                    sessions.push(chartData.TensorFlow.Sessions[i]);
                }

                categories = sessions;

                var scoresTF = [];
                for (i = from; i < to; i++) {
                    scoresTF.push(chartData.TensorFlow.Scores[i]);
                }

                scores2 = scoresTF;

                max = scores2.max();
                min = scores2.min();

                var tfSum = 0;
                $.each(chartData.TensorFlow.Scores, function (index, val) {
                    tfSum += val;
                });

                var learnedAfter;
                $.each(chartData.TensorFlow.Scores, function (index, val) {
                    if (val > 0) {
                        learnedAfter = index + 1;
                        return false;
                    }
                });

                var avg = tfSum / len;

                summary.TensorFlowAvgScore(parseInt(avg));
                summary.TensorFlowHighestScore(chartData.TensorFlow.Scores.max());

                if (islogistic) {
                    summary.TensorFlowLearnedAfter(chartData.TensorFlow.Scores.min());
                } else {
                    summary.TensorFlowLearnedAfter(learnedAfter);
                }

            } else {
                categories = chartData.TensorFlow.Sessions;
                //max = Math.max(chartData.TensorFlow.Scores);
                //min = Math.min(chartData.TensorFlow.Scores);

                max = chartData.TensorFlow.Scores.max();
                min = chartData.TensorFlow.Scores.min();
            }

            summaryTitle = "(Google Tensorflow)";

        } else if (player == 'encog') {

            if (bySomething != undefined) {

                var sessions = [];
                var from = 0;
                var to = 0;
                var len = chartData.Encog.Sessions.length;

                from = fromChartPage();
                if (fromChartPage() + 100 >= chartData.Encog.Sessions.length) {
                    toChartPage(chartData.Encog.Sessions.length);
                }

                to = toChartPage();

                for (i = from; i <= to; i++) {
                    sessions.push(chartData.Encog.Sessions[i]);
                }

                categories = sessions;

                var scoresEncog = [];
                for (i = from; i < to; i++) {
                    scoresEncog.push(chartData.Encog.Scores[i]);
                }

                scores3 = scoresEncog;

                max = scores3.max();
                min = scores3.min();

                var encogSum = 0;
                $.each(chartData.Encog.Scores, function (index, val) {
                    encogSum += val;
                });

                var learnedAfter;
                $.each(chartData.Encog.Scores, function (index, val) {
                    if (val > 0) {
                        learnedAfter = index + 1;
                        return false;
                    }
                });

                var avg = encogSum / len;

                summary.EncogAvgScore(parseInt(avg));
                summary.EncogHighestScore(chartData.Encog.Scores.max());

                if (islogistic) {
                    summary.EncogLearnedAfter(chartData.Encog.Scores.min());
                } else {
                    summary.EncogLearnedAfter(learnedAfter);
                }

            } else {
                categories = chartData.Encog.Sessions;
                //max = Math.max(chartData.TensorFlow.Scores);
                //min = Math.min(chartData.TensorFlow.Scores);

                max = chartData.Encog.Scores.max();
                min = chartData.Encog.Scores.min();
            }

            summaryTitle = "(Encog)";
        }
    } else {

        if (bySomething != undefined) {


            if (chartData.Encog.Sessions.length > 0) {

                summaryTitle = "(useAIble vs Encog)";


                var sessions = [];

                var from = 0;
                var to = 0;
                var len = chartData.useAIble.Sessions.length;
                var len2 = chartData.Encog.Sessions.length;

                var newlen = len > len2 ? len : len2;

                from = fromChartPage();

                if (fromChartPage() + 100 >= newlen) {
                    toChartPage(newlen);
                }

                to = toChartPage();

                for (i = from; i < to; i++) {

                    sessions.push(i+1);

                    //if (i < len2) {
                    //    sessions.push(chartData.Encog.Sessions[i]);
                    //}
                }

                categories = sessions;

                var scoresUseAIble = [];

                for (i = from; i < to; i++) {

                    if (i < len) {
                        scoresUseAIble.push(chartData.useAIble.Scores[i]);
                    }
                }

                scores1 = scoresUseAIble;

                var scoresEncog = [];
                for (i = from; i < to; i++) {
                    if (i < len2) {
                        scoresEncog.push(chartData.Encog.Scores[i]);
                    }
                }

                scores2 = scoresEncog;

                var useAIbleMax = scores1.max();
                var encogMax = scores2.max();

                var useAIbleMin = scores1.min();
                var encogMin = scores2.min();

                max = useAIbleMax > encogMax ? useAIbleMax : encogMax;
                min = useAIbleMin < encogMin ? useAIbleMin : encogMin;


                var useAIbleSum = 0;
                $.each(chartData.useAIble.Scores, function (index, val) {
                    useAIbleSum += val;
                });

                var useAIbleLearnedAfter;
                $.each(chartData.useAIble.Scores, function (index, val) {
                    if (val > 0) {
                        useAIbleLearnedAfter = index + 1;
                        return false;
                    }
                });

                var avgUseAIble = useAIbleSum / len;

                summary.useAIbleAvgScore(parseInt(avgUseAIble));
                summary.useAIbleHighestScore(chartData.useAIble.Scores.max());

                if (islogistic) {
                    summary.useAIbleLearnedAfter(chartData.useAIble.Scores.min());
                } else {
                    summary.useAIbleLearnedAfter(useAIbleLearnedAfter);
                }

                // encog
                var encogSum = 0;
                $.each(chartData.Encog.Scores, function (index, val) {
                    encogSum += val;
                });

                var encogLearnedAfter;
                $.each(chartData.Encog.Scores, function (index, val) {
                    if (val > 0) {
                        encogLearnedAfter = index + 1;
                        return false;
                    }
                });

                var avgEncog = encogSum / len2;

                summary.EncogAvgScore(parseInt(avgEncog));
                summary.EncogHighestScore(chartData.Encog.Scores.max());

                if (islogistic) {
                    summary.EncogLearnedAfter(chartData.Encog.Scores.min());
                } else {
                    summary.EncogLearnedAfter(encogLearnedAfter);
                }


            } else {

                summaryTitle = "(useAIble vs Google Tensorflow)";

                var sessions = [];

                var from = 0;
                var to = 0;
                var len = chartData.useAIble.Sessions.length;

                from = fromChartPage();

                if (fromChartPage() + 100 >= len) {
                    toChartPage(len);
                }

                to = toChartPage();

                for (i = from; i <= to; i++) {
                    sessions.push(chartData.useAIble.Sessions[i]);
                }

                categories = sessions;

                var scoresUseAIble = [];

                for (i = from; i < to; i++) {
                    scoresUseAIble.push(chartData.useAIble.Scores[i]);
                }

                scores1 = scoresUseAIble;

                var scoresTF = [];
                for (i = from; i < to; i++) {
                    scoresTF.push(chartData.TensorFlow.Scores[i]);
                }

                scores2 = scoresTF;

                var useAIbleMax = scores1.max();
                var tensorFlowMax = scores2.max();

                var useAIbleMin = scores1.min();
                var tensorFlowMin = scores2.min();

                max = useAIbleMax > tensorFlowMax ? useAIbleMax : tensorFlowMax;
                min = useAIbleMin < tensorFlowMin ? useAIbleMin : tensorFlowMin;


                var useAIbleSum = 0;
                $.each(chartData.useAIble.Scores, function (index, val) {
                    useAIbleSum += val;
                });

                var useAIbleLearnedAfter;
                $.each(chartData.useAIble.Scores, function (index, val) {
                    if (val > 0) {
                        useAIbleLearnedAfter = index + 1;
                        return false;
                    }
                });

                var avgUseAIble = useAIbleSum / len;

                summary.useAIbleAvgScore(parseInt(avgUseAIble));
                summary.useAIbleHighestScore(chartData.useAIble.Scores.max());

                if (islogistic) {
                    summary.useAIbleLearnedAfter(chartData.useAIble.Scores.min());
                } else {
                    summary.useAIbleLearnedAfter(useAIbleLearnedAfter);
                }

                // tensor flow
                var tfSum = 0;
                $.each(chartData.TensorFlow.Scores, function (index, val) {
                    tfSum += val;
                });

                var tfLearnedAfter;
                $.each(chartData.TensorFlow.Scores, function (index, val) {
                    if (val > 0) {
                        tfLearnedAfter = index + 1;
                        return false;
                    }
                });

                var avgTF = tfSum / len;

                summary.TensorFlowAvgScore(parseInt(avgTF));
                summary.TensorFlowHighestScore(chartData.TensorFlow.Scores.max());

                if (islogistic) {
                    summary.TensorFlowLearnedAfter(chartData.TensorFlow.Scores.min());
                } else {
                    summary.TensorFlowLearnedAfter(tfLearnedAfter);
                }

            }

        } else {

            categories = chartData.useAIble.Sessions;

            var useAIbleMax = chartData.useAIble.Scores.max();
            var tensorFlowMax = chartData.TensorFlow.Scores.max();

            var useAIbleMin = chartData.useAIble.Scores.min();
            var tensorFlowMin = chartData.TensorFlow.Scores.min();

            max = useAIbleMax > tensorFlowMax ? useAIbleMax : tensorFlowMax;
            min = useAIbleMin < tensorFlowMin ? useAIbleMin : tensorFlowMin;
        }
    }



    if (chartData.Encog.Sessions.length) {

        var newlen = chartData.Encog.Sessions.length > chartData.useAIble.Sessions.length ? chartData.Encog.Sessions.length : chartData.useAIble.Sessions.length

        numOfChartPt(newlen);

    } else {
        numOfChartPt(chartData.useAIble.Sessions.length);
    }


    $("#chart").kendoChart({
        title: {
            text: "Game Summary Chart "+ summaryTitle
        },
        legend: {
            position: "bottom",
            visible: player != "useAIble" && player != "tensorFlow" && player != "encog"
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            type: "line",
            style: "smooth"
        },
        series: [
        {
            name: chartData.useAIble.Name,
            data: scores1//chartData.useAIble.Scores
        }, {
            name: chartData.TensorFlow.Name,
            data: scores2//chartData.TensorFlow.Scores
        }, {
            name: chartData.Encog.Name,
            data: scores3//chartData.TensorFlow.Scores
        }],
        valueAxis: {
            min: min-1000,
            labels: {
                format: "##,#",
                text: "Scores"
            },
            line: {
                visible: false
            }
            ,
            axisCrossingValue: min
        },
        categoryAxis: {
            categories: categories,
            majorGridLines: {
                visible: false
            },
            labels: {
                rotation: "auto",
                text: "Sessions"
            }
        },
        tooltip: {
            visible: true,
            format: "{0}%",
            template: "#= series.name #: #= value #"
        }
    });
}

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

Array.prototype.min = function () {
    return Math.min.apply(null, this);
};
