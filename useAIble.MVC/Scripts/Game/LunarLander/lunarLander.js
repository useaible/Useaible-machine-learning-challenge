
$(function () {
        // Optional Settings JS

        // Number of Sessions
        $("#sessionSlider").slider({
            range: "min",
            value: 50,
            min: 1,
            max: 5000,
            slide: function (event, ui) {
                $("#sessionInput").val(ui.value);
                //$("#sessionRandomnessSlider").slider("option", "max", ui.value);
                //$("#sessionRandomnessInput").val(Math.round(ui.value / 2));

                $("#sessionRandomnessSlider").slider("value", Math.round(ui.value / 2));
                $("#sessionRandomnessSlider").slider("option", "max", ui.value);
            },
            change: function (event, ui) {
                
                $("#sessionRandomnessSlider").slider("value", Math.round(ui.value / 2));
                $("#sessionRandomnessSlider").slider("option", "max", ui.value);
            }
        });

        //$("#sessionSlider").on('slidestop', function (event, ui) {
        //    $("#sessionRandomnessSlider").slider("value", ui.value / 2);
        //    //$("#sessionRandomnessSlider").slider("option", "max", ui.value);
        //});

        $("#sessionInput").keyup(function () {
            $("#sessionSlider").slider("value", $(this).val());
            $("#sessionRandomnessSlider").slider("value", Math.round($(this).val() / 2));
            $("#sessionRandomnessSlider").slider("option", "max", $(this).val());
        });
    //Number of Session Randomness
        $("#sessionRandomnessSlider").slider({
            range: "min",
            value: Math.round($("#sessionInput").val()/2),
            min: 0,
            //max: $('#sessionInput').val(),
            slide: function (event, ui) {
                $("#sessionRandomnessInput").val(ui.value);
            },
            change: function (event, ui) {
                $("#sessionRandomnessInput").val(ui.value);
            }
        });
        $("#sessionRandomnessInput").keyup(function () {
            $("#sessionRandomnessSlider").slider("value", $(this).val())
        });
        //Linear Bracket
        $("#linearBracketSlide").slider({
            range: true,
            min: 0,
            max: 100,
            values: [3, 15],
            slide: function (event, ui) {
                $("#linearBracketInput").val(ui.values[0]);
                $("#linearBracketInput2").val(ui.values[1]);
            }
        });
        $("#linearBracketInput").keyup(function () {
            $("#linearBracketSlide").slider("values", 0, Math.min($(this).val(), $("#linearBracketSlide").slider("values", 1)));
        });

        $("#linearBracketInput2").keyup(function () {
            $("#linearBracketSlide").slider("values", 1, Math.max($(this).val(), $("#linearBracketSlide").slider("values", 0)));
        });

        //Randomness
        $("#RandomnessSlider").slider({
            range: true,
            min: 0,
            max: 100,
            values: [50, 100],
            slide: function (event, ui) {
                var start = 100 - ui.values[0];
                var end = 100 - ui.values[1];
                console.log("starting" + start + "  -- ending: " + end);
                $("#RandomnessInput").val(start);
                $("#RandomnessInput2").val(end);
            }
        });

        var starting = 100 - $("#RandomnessSlider").slider("values", 0);
        var ending = 100 - $("#RandomnessSlider").slider("values", 1);

        $("#RandomnessInput").keyup(function () {
            var start = (100 - $(this).val());
            $("#RandomnessSlider").slider("values", 0, Math.min(start, $("#RandomnessSlider").slider("values", 1)));
            console.log("starting" + starting + "  -- ending: " + ending);
        });

        $("#RandomnessInput2").keyup(function () {
            var end = (100 - $(this).val());
            $("#RandomnessSlider").slider("values", 1, Math.max(end, $("#RandomnessSlider").slider("values", 0)));
        });

     

});
