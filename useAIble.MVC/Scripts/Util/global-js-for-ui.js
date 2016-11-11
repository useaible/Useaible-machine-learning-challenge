
//----------------------------filter for IOS devices----------------------------------//

    var ios = false, p = navigator.platform;
    if (p == 'iPad' || p == 'Iphone' || p == 'Ipod') {
        $('.maximize-tab').hide();       
        ios = true;
    }
    if (ios == false) {
        $('.maximize-tab').show();
    }

//--------------------------end filter for IOS devices--------------------------------//
    //------------------------------ full screen function---------------------------------------------//

    var db, gridConten, isfullscreen = false;

    var gridHeight, gridContentHeight;

    function toggleFullScreen() {
        db = document.querySelector(".k-grid");
        gridContent = document.querySelector(".k-grid-content");
        //gridHeight = document.querySelector("#grid").style.height();
        

        gridContentHeight = $('.k-grid-content').css("height");
        gridHeight = $('#grid, #chunk-grid').css("height");
        gridHeight2 = $('#useAIbleGridPreview').css("height");
        //if (!db.fullscreenElement &&   
        //    !db.mozFullScreenElement && !db.webkitFullscreenElement && !db.msFullscreenElement) {  // current working methods
        if (isfullscreen == false) {
            if (db.requestFullscreen) {
                db.requestFullscreen();
            } else if (db.msRequestFullscreen) {
                db.msRequestFullscreen();
            } else if (db.mozRequestFullScreen) {
                db.mozRequestFullScreen();
            } else if (db.webkitRequestFullscreen) {
                db.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
            isfullscreen = true;
            db.style.width = window.screen.width + "px";
            db.style.height = window.screen.height + "px";
            var contentHeight = window.screen.height;
            contentHeight = window.screen.height - 120;

            gridContent.style.height = contentHeight + "px";
            console.log(contentHeight);
            
        } else {

            if (db.exitFullscreen) {

                db.exitFullscreen();
            } else if (db.msExitFullscreen) {

                db.msExitFullscreen();
            } else if (db.mozCancelFullScreen) {

                db.mozCancelFullScreen();
            } else if (db.webkitExitFullscreen) {

                db.webkitExitFullscreen();
            }
            isfullscreen = false;
            gridContent.style.height = 480 + "px";
            db.style.height = 480 + "px";
            db.style.width = "100%";

        }
    }
    //$(document).escape(function () {
    //    alert('ESC button pressed');
    //});


    //document.bind('keyup', function (e) {
    //        alert("fulllscreen off");
    //})

$(function () {
    gridContent = document.querySelector(".k-grid-content");
    
    $("#grid, #example, #useAIbleGridPreview, #chunk-grid ").bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function (e) {


        var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
        var event = state ? 'FullscreenOn' : 'FullscreenOff';
  
        if (event == "FullscreenOff") {
            
            gridContent.style.height = gridContentHeight;
   
            if (typeof gridHeight == "undefined") {
                db.style.height = gridHeight2;
            } else {
                db.style.height = gridHeight;
            }
            db.style.width = "100%";
            isfullscreen = false;
        }else{
            isfullscreen = true;
        }
    });
});
$(function () {
    //$('.icon-hovered').after("<span class='word-hint'>wordhint sample</span>")
    //$(".fa").hover(
    //    alert("hovered"),
    //    //function () {
    //    //    $this.after($("<span class='word-hint'>wordhint sample</span>"));
    //    //},
    //    //function () {
    //    //    $this.find("span:last").remove();
    //    //}


    //);

});

//------------------------------end of full screen function---------------------------------------------//


//---------------------------------adjust main container height---------------------------------------------//
$(function () {
    var hayit = (($(window).height() - 152) + 'px');
    $('.tab-content').css('min-height', hayit);

    //var expandableContentHeight = (($(window).height() - 320) + 'px');
    //$('.expandable-panel .tab-content').css({ 'height': expandableContentHeight, 'min-height': 'initial' });
    var expandableContentHeight = (($('.tab-content').height() - 140) + 'px');
    $('.expandable-panel .tab-content').css({ 'height': expandableContentHeight, 'min-height': 'initial' });

    //---------------------------------adjust main container height---------------------------------------------//

    //$('.right-side-sidebar').resizable({
    //    handles: 'w',
    //    //minWidth: 400,
    //    //maxWidth: 1200,
    //    ghost: false,
    //});

    //$('.right-side-planogram-window').resizable({
    //    handles: 'e',
    //    //minWidth: 400,
    //    //maxWidth: 1200,
    //    ghost: false,
    //});


    //if($('.row').inneeWidth() > 992)
    //{

    //}
    //$('center-table').on('scroll', function () {
    //    $('center-table').addClass('fixed-table');
    //    alert('test');
    //});

    //-------------------make div fix--------------------//
    var check = $('.fixed-top');
    if (check.length) {
        var fixTable = $('.fixed-top').offset().top;
        //var fixmeTop = $('.center-table').offset().top;
        $(window).scroll(function () {
            var currentScroll = $(window).scrollTop();
            if (currentScroll >= fixTable) {
                $('.fixed-top').css({
                    position: 'fixed',
                }), $('.center-table').addClass('planogram-fixed'), $('.sidebar-mod-item').addClass('item-mod-fixed');
                $('.top-center-fix-planogram').css('width', '75%');
            } else {
                $('.fixed-top').css({
                    position: 'static'
                }), $('.center-table').removeClass('planogram-fixed'), $('.sidebar-mod-item').removeClass('item-mod-fixed');
                $('.top-center-fix-planogram').css('width', 'initial');
            }
        });
    }else{
    }
    //-------------------End of make div fix--------------------//


    //---------------scroll window horizontaly -------------//
    var scrollHandle = 0,
        scroll = 5,
        parent = $('.container');
    $('.panner').on('mousedown', function () {

    });

    $('.panner').on('mouseup', function () {

    });

    function startScrolling(modifier, step) {

    }

    function endScrolling() {
        
    }

    //---------------End of scroll window horizontaly -------------//

    //--------------accordion active  trigger----------//
    function openAccordionPanel(panelNumber){

    }


    //-----------end of accordion active  trigger----------//

    //----------Blinking Jquery------------//

    function blink(selector) {
        $(selector).fadeTo('slow', 0.5, function () {
            $(this).fadeTo('slow', 1, function () {
                blink(this);
            });
        });
    }

    blink('.blinking');

    //----------Blinking Jquery------------//


});







