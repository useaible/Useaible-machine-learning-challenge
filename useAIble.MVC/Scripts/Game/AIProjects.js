//function testing() {
//    alert("testing is working");
//}
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

$('.coming-soon').tooltip({
    //animation: fadeIn,
    //container: '.coming-soon .text',
    //delay: { "show": 500, "hide": 100 },
    delay: { show: 500, hide: 100 },
    title: "Coming soon"
});

if ($(window).width() > 993 || document.documentElement.clientWidth > 993) {
    var timeoutId;
    $(".left-side-menu").hover(function () {

        $(this).css({ "width": "180px", "box-shadow": "0px 4px 10px 0px #000000" });
        if (!timeoutId) {
            timeoutId = window.setTimeout(function () {
                timeoutId = null;
                $(".left-side-menu .text").fadeIn();
                //$('.coming-soon').tooltip({
                //    //animation: fadeIn,
                //    //container: '.coming-soon .text',
                //    //delay: { "show": 500, "hide": 100 },
                //    delay: {show: 500, hide: 100},
                //    title: "Coming soonsss"
                //});
            }, 300);
        }

        //alert("added");

        $(window).on('scroll', function () {
            var y_scroll_pos = window.pageyoffset;
            var scroll_pos_test = 50;             // set to whatever you want it to be
            console.log(y_scroll_pos);
            if (y_scroll_pos > scroll_pos_test) {
                $(".left-side-menu").css({ "position": "fixed", "margin-top": "0" });
            } else {
                $(".left-side-menu").css({ "position": "absolute", "margin-top": "86px" });
            }
        });


    },
    function () {
        //$(this).css("width", "50px");
        $(this).css({ "width": "50px", "box-shadow": "none" });
        $(".left-side-menu .text").hide();
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            timeoutId = null;
        }
        else {

        }
    });



    // trigger sidebar on scroll;

}
else {
    //Add your javascript for small screens here 
}

function isNumber(e) {
    var charCode = (e.which) ? e.which : e.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}

//when head2head is selected

function MinimizeSidebar() {
    $(".canvasContainer").removeClass("col-md-6").addClass("col-md-12x");
    $(".sidebarPanel, .newSideBar").addClass("expanded");
    $(".sessionContainer, .newSessionData").hide();
    $("#tensorFlowOptions").appendTo(".secondPanelPlaceholder");
    //$(".sidebarPanel, .newSideBar").addClass("minimized");
    //$(".sidebarPanel .panel-body, .newSideBar .panel-body").fadeOut("slow", "linear");
    //$(".panel-primary>.panel-heading").append('<i class="fa fa-chevron-circle-right" aria-hidden="true"></i>');


    //$("#canvas2").appendTo(".newCavas");

    $(".second-setting").appendTo(".settingTab2");
    $(".sidebarHeight #secondSession").appendTo(".sessionTab2");

    var selectedHeadToHeadOptionLogistics = $("#selected-head2head-options-hidden-input").val();
    var selectedHeadToHeadOptionMaze = $("#selected-head2head-options-hidden-input-maze").val();
    var selectedHeadToHeadOptionLander = $("#selected-head2head-options-hidden-input-lander").val();

    if (selectedHeadToHeadOptionLogistics == 'useAIble-tensorflow') {

        $("#tensorflow").detach().appendTo(".newCavas");
        $("#encog").detach().appendTo(".mainCanvas");

        $(".second-setting").appendTo(".settingTab2");

        $(".settingTab2").remove("#encog-settings-panel");
        $("#encog-settings-panel").appendTo("#encog-settings-container");

    } else if (selectedHeadToHeadOptionLogistics == 'useAIble-encog') {

        $("#encog").detach().appendTo(".newCavas");
        $("#tensorflow").detach().appendTo(".mainCanvas");

        $("#encog-settings-panel").appendTo(".settingTab2");

    } else if (selectedHeadToHeadOptionMaze == 'useAIble-tensorflow') {

        $("#tensorflow-canvas-container").detach().appendTo(".newCavas");
        $("#encog-canvas-container").detach().appendTo(".mainCanvas");


// tensorflow settings
        $(".settingTab2").remove("#encog-settings-maze");
        $(".tensorflow-settings-maze").detach().appendTo(".settingTab2");

//// tensorflow session score table
//        $("#secondTab2").remove(".encog-table-maze");
//        $("#secondTab2").remove(".tensorflow-table-maze");
//        $(".tensorflow-table-maze").detach().appendTo("#secondTab2");


    } else if (selectedHeadToHeadOptionMaze == 'useAIble-encog') {

        $("#encog-canvas-container").detach().appendTo(".newCavas");
        $("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");

// tensorflow settings
        $("#encog-settings-maze").detach().appendTo(".settingTab2");
        $(".settingTab2").remove(".tensorflow-settings-maze");


        //// tensorflow session score table
        //$("#secondTab2").remove(".encog-table-maze");
        //$("#secondTab2").remove(".tensorflow-table-maze");
        //$(".encog-table-maze").detach().appendTo("#secondTab2");

    } else if (selectedHeadToHeadOptionLander == 'useAIble-tensorflow') {

        $("#player2-settings-container").remove("#encog-settings-lander");
        $("#tensorflow-settings-lander").detach().appendTo("#player2-settings-container");

    } else if (selectedHeadToHeadOptionLander == 'useAIble-encog') {

        $("#encog-settings-lander").detach().appendTo("#player2-settings-container");
        $("#player2-settings-container").remove("#tensorflow-settings-lander");
    }

    $(".game-container .nav-tabs").show();
    $("#firstSideBar").text("Useaible");
    $(".panel-primary>.panel-heading").append('<i class="fa fa-chevron-circle-right" aria-hidden="true"></i>');
}

function MaximizeSidebar() {

    $(".canvasContainer").removeClass("col-md-12x").addClass("col-md-6");
    $(".sidebarPanel, .newSideBar").removeClass("expanded");
    $(".sessionContainer").show();
    $("#tensorFlowOptions").appendTo(".tensor-flow-container");
    $(".sidebarPanel, .newSideBar").removeClass("minimized");
    $(".sidebarPanel .panel-body, .newSideBar .panel-body").fadeIn("slow", "linear");
    $(".panel-primary>.panel-heading>.fa").remove();

    //$("#canvas2").appendTo(".mainCanvas");

    //$("#tensorflow").appendTo(".mainCanvas");


    //var selectedHeadToHeadOption = $("#selected-head2head-options-hidden-input").val();
    //var selectedHeadToHeadOptionMaze = $("#selected-head2head-options-hidden-input-maze").val();

    var selectedPlayerOption = $("#selected-player-hidden-input-maze").val();
    var selectedPlayerOptionLander = $("#selected-player-hidden-input-lander").val();

    //if (selectedHeadToHeadOption == 'useAIble-tensorflow') {
    //    $("#tensorflow").detach().appendTo(".mainCanvas");
    //} else if (selectedHeadToHeadOption == 'useAIble-encog') {
    //    $("#encog").detach().appendTo(".mainCanvas");
    //}

    //else
    if (selectedPlayerOption == 'Tensor Flow') {

        $("#tensorflow-canvas-container").detach().appendTo(".mainCanvas");
        $(".tensorflow-settings-maze").detach().appendTo("#tensorflow-settings-container-maze");

    } else if (selectedPlayerOption == 'Encog') {

        $("#encog-canvas-container").detach().appendTo(".mainCanvas");
        $("#encog-settings-maze").detach().appendTo("#encog-settings-container-maze");

    } else if (selectedPlayerOptionLander == 'Tensor Flow') {

        $("#tensorflow-settings-lander").detach().appendTo("#tensorflow-settings-container-lander");

    } else if (selectedPlayerOptionLander == 'Encog') {

        $("#encog-settings-lander").detach().appendTo("#encog-settings-container-lander");
    }


    //$(".second-setting").appendTo(".tensor-flow-container");
    //$("#secondSession").detach().appendTo("secondSessionContainer");
    $(".game-container .nav-tabs").hide();
    $("#firstSideBar").text("Settings");

    isClose = false;

}
function OpenSidebar() {
    $(".panel-primary>.panel-heading>.fa-chevron-circle-left").remove();
    $(".panel-primary>.panel-heading").append('<i class="fa fa-chevron-circle-right" aria-hidden="true"></i>');
    $(".sidebarPanel, .newSideBar").removeClass("minimized");
    $(".sidebarPanel .panel-body, .newSideBar .panel-body").fadeIn("slow", "linear");
}
function CloseSidebar() {
    $(".panel-primary>.panel-heading>.fa-chevron-circle-right").remove();
    $(".panel-primary>.panel-heading").append('<i class="fa fa-chevron-circle-left" aria-hidden="true"></i>');

    $(".sidebarPanel, .newSideBar").addClass("minimized");
    $(".sidebarPanel .panel-body, .newSideBar .panel-body").fadeOut("slow", "linear");
}
var isClose = false;
$(document.body).on('click', '.expanded .panel-heading', function () {
    //$(".minimized .panel-heading").on('click', function () {
    if (!isClose) {
        OpenSidebar();
        isClose = true;
    } else {
        CloseSidebar();
        isClose = false;
    }
    //$(".sidebarPanel, .newSideBar").toggleClass("minimized");
    //$(".sidebarPanel .panel-body, .newSideBar .panel-body").fadeToggle("slow", "linear");
});
$(".outer-chart-container", ".close-button").on("click", function () {
    $(".outer-chart-container").fadeOut();
});
$(".inner-chart-container").on("click", function (e) {
    e.stopPropagation();
});
$(".view-chart").on('click', function () {
    $(".outer-chart-container").fadeIn();
});

