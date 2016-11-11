
$('.expandable-box').on('resize',function () {
    //alert($('.expandable-box').width());
    //$("body").prepend("<div>" + $('.expandable-box').width() + "</div>");
    //$('#page-title').html($('.expandable-box').width())
    $('#gridWrapp').css('margin-right', ($('.expandable-box').width())+4);
    
});




//$(window).resize(function () {
//    var width;
//    width = (window).width();
//    alert(width);
//    alert('worlk');
//});
//if (screen.width >= 767) {
//    alert('screen.width');
//}
var responsiveWidth = '465px';
if (document.documentElement.clientWidth < 767) {
    //alert('document.documentElement.clientWidth');
    var responsiveWidth = '100%';
}
//if ($(window).width() >= 767) {
//    alert('screen.width');
//}

function expandableMenu(grid, panelbar, propertyPanelVisible) {
    function open(toggleOpen){
        $('.expandable-box').animate({ 'width': responsiveWidth}, 400);
        $('#gridWrapp').animate({ 'margin-right': responsiveWidth}, 400);
        $('.fa-caret-left').addClass('fa-caret-right');
        $('.fa-caret-left').removeClass('fa-caret-left');
        $('.expandable-panel').fadeIn();
        $(".tooltipp").fadeOut(600).addClass("fadeOut");
        $("#resizable").resizable({
            handles: 'w',
            minWidth: 400,
            maxWidth: 1200,
            ghost: false,
        });

        propertyPanelVisible = true;
    }
    function close(toggleOpen) {
        $('.expandable-box').animate({ 'width': '26px' }, 400);
        $('#gridWrapp').animate({ 'margin-right': '26px' }, 400);
        $('.fa-caret-right').addClass('fa-caret-left');
        $('.fa-caret-right').removeClass('fa-caret-right');
        $('.expandable-panel').fadeOut();
        $("#resizable").resizable('destroy');
        propertyPanelVisible = false;
    }
    
    $(document.body).on('click', '.box-toggle-button', function () {
        var toggleOpen = this;
        return (toggleOpen.t = !toggleOpen.t) ? open(toggleOpen) : close(toggleOpen);
    });

    $(document.body).on('click', '#createsources', (open));
    //$(document.body).on('click', '.expandable-cancel-button', (close));

    $(grid).on('click', function () {

        if (propertyPanelVisible) {

            $('.expandable-box').animate({ 'width': '26px' }, 400);
            $('#gridWrapp').animate({ 'margin-right': '26px' }, 400);
            $('.fa-caret-right').addClass('fa-caret-left');
            $('.fa-caret-right').removeClass('fa-caret-right');
            $('.expandable-panel').fadeOut();
            $("#resizable").resizable('destroy');
            propertyPanelVisible = false;
        }
    });

    $(document.body).on('click', '.fade-when-clicked', function () {
        $('.message-box-modal').fadeOut();
    });
    //-----------------------------sortable script---------------------------------//
    //panelBar.kendoSortable({
    //    hint: function (element) {
    //        return element.clone().addClass("hint");
    //    },
    //    placeholder: function (element) {
    //        return element.clone().css({
    //            "opacity": 0.3,
    //            "border": "1px dashed #000000",
    //            "background": "#ffffff"
    //        }).addClass("placeholder").text("Drop Here");
    //    },
    //    cursor: "move",
    //    cursorOffset: {
    //        top: -10,
    //        left: -55
    //    },
    //    ignore: "input"

    //});
    //----------------------end sortable script---------------------------------//

    //panelBar.kendoPanelBar({});





    //-----------------------shake function--------------------------------------//


    //$(".expandable-box").load(function () {
    //    // do fading 3 times
    //    for (i = 0; i < 3; i++) {
    //        $(this).fadeTo('slow', 0.5).fadeTo('slow', 1.0);

    //});

    $(function(){
        $(window).bind("load", function () {

            //for (i = 0; i < 3; i++) {
            //    $(".expandable-box").fadeTo('slow', 0.5).fadeTo('slow', 1.0).css("border", "2px solid #F47E20").css("background", "").addClass("animated shake");
            //}
            
            $(".expandable-box").addClass("animated shakes");
            $(".tooltipp").show().addClass("animated flash");

        });
    });




    //--------------------------------------------------------------------- X and Y Axis animation and  Total difference code -----------------------------------------------------------//
    $(function () {

   
        //modal script

        //$('#select').change(function () {

        //    if ($(this).val() == "0") {
        //        $(".set-values").hide();
        //        $(".for-each").show();
        //    }
        //    if ($(this).val() == "1") {
        //        $(".for-each").hide();
        //        $(".set-values").show();
        //    }

        //});

        //$('input[type="checkbox"]').click(function () {

        //    if ($(this).val() == "total") {
        //        $(".difference-selected").hide();
        //    }
        //    if ($(this).val() == "difference") {
        //        $(".difference-selected").show();
        //    }
        //});

        //X and Y axis label color change
        $(".radio-button-container label").first().css({ 'color': '#FF8400' });


        //$('input[type="radio"]').on('click', function () {
        $(document.body).on('click', 'input[type="radio"]', '.delineation5', function () {
            //if ($(this).is(':checked')) {
            //    $(".radio-button-container label").css({ 'color': '#ffffff' });
            //    $(this).next().css({ 'color': '#FF8400' });
            //} else {


           
            $(this).next().css({ 'color': '#ffffff' });

            //}
          

            if ($(this).attr('id') == 'xaxis') {
                $('.x-axis').css({ 'background': '#F47E20' }).animate({ 'background': '#F47E20', 'opacity': '1', 'z-index': '2', 'width': '47px' });
                $('.x-axis-letter').animate({ 'color': '#F47E20', 'opacity': '1', 'z-index': '2' });
                $('.y-axis').css({ 'background': '#ffffff' }).animate({ 'background': '#ffffff', 'opacity': '0.2', 'z-index': '1', 'height': '42px' });
                $('.y-axis-letter').animate({ 'color': '#ffffff', 'opacity': '0.7', 'z-index': '1' });
                $('.x-axis-label').animate({ 'color': '#F47E20' });
                $('.y-axis-label').animate({ 'color': '#ffffff' });
                //$(this).next().css({ 'color': '#FF8400' });
            }
            else if ($(this).attr('id') == 'yaxis') {

                $('.y-axis').css({ 'background': '#F47E20' }).animate({ 'opacity': '1', 'z-index': '2', 'height': '45px' });
                $('.y-axis-letter').animate({ 'color': '#F47E20', 'opacity': '1', 'z-index': '2' });
                $('.x-axis').css({ 'background': '#ffffff' }).animate({ 'background': '#ffffff', 'opacity': '0.2', 'z-index': '1', 'width': '42px' });
                $('.x-axis-letter').animate({ 'color': '#ffffff', 'opacity': '0.7', 'z-index': '1' });
                $('.y-axis-label').animate({ 'color': '#F47E20' });
                $('.x-axis-label').animate({ 'color': '#ffffff' });
            }
            else {

            }
        });



        if ($('#yaxis').is(':checked')) {
            //$("#txtAge").show();  // checked
            //alert("y is selected");
        }
        else
            $("#txtAge").hide();  // unchecked



        //X and Y axis label color change

        //total and difference selector
        $('input[type="checkbox"]').on('click', function () {
  
            if ($(this).val() == "difference") {
                if ($(this).is(':checked')) {
                    $(this);
                    $('.difference-selected').show();

                } else {
                    $('.difference-selected').hide();
                }
            } else {

            }
        });



        
    });
    $(document.body).on('click', '#line-progress-cover .add-panel-button', (XandYanimation));

    $(document.body).on('click', '#line-progress-cover .fa-puzzle-piece', (XandYanimation));

    //x and y animation function
    function XandYanimation() {
        if ($('#yaxis').is(':checked')) {
            $('.y-axis').css({ 'background': '#F47E20' }).animate({ 'opacity': '1', 'z-index': '2', 'height': '45px' });
            $('.y-axis-letter').animate({ 'color': '#F47E20', 'opacity': '1', 'z-index': '2' });
            $('.x-axis').css({ 'background': '#ffffff' }).animate({ 'background': '#ffffff', 'opacity': '0.2', 'z-index': '1', 'width': '42px' });
            $('.x-axis-letter').animate({ 'color': '#ffffff', 'opacity': '0.7', 'z-index': '1' });
            $('.y-axis-label').animate({ 'color': '#F47E20' });
            $('.x-axis-label').animate({ 'color': '#ffffff' });
        }
        else if ($('#xaxis').is(':checked')) {
            $('.x-axis').css({ 'background': '#F47E20' }).animate({ 'background': '#F47E20', 'opacity': '1', 'z-index': '2', 'width': '47px' });
            $('.x-axis-letter').animate({ 'color': '#F47E20', 'opacity': '1', 'z-index': '2' });
            $('.y-axis').css({ 'background': '#ffffff' }).animate({ 'background': '#ffffff', 'opacity': '0.2', 'z-index': '1', 'height': '42px' });
            $('.y-axis-letter').animate({ 'color': '#ffffff', 'opacity': '0.7', 'z-index': '1' });
            $('.x-axis-label').animate({ 'color': '#F47E20' });
            $('.y-axis-label').animate({ 'color': '#ffffff' });
        }
        else {

        }
    }

    
    //------------------------------------------------expandable box  mini modal script ---------------------------------------------------------//

    $(document.body).on('click', '.mini-modal .fa-times', (closeModal));
    $(document.body).on('click', '.mini-modal .cancel-button', (closeModal));
    $(document.body).on('click', '.save-as-button', function () {
        //$('.modal-disable-cover').fadeIn();

        //$('.inner-modal-body-container').html(
                 //'<div><input type="text" data-bind="value: SaveAsName" class="k-textbox k-widget" style=" width: 100%"></div>' +
                //'<div class="pull-right button-container" style="margin-top:20px;">' +
                //   ' <button class="k-button" data-bind="click: SaveAs">Save</button>' +
                //    '<button class="k-button cancel-button" data-bind="click: SaveAs" style="margin-left: 12px;">Cancel</button>' +
                //'</div>'
        //);
        //$('.mini-modal-head').html(
        //    '<i class="fa fa-floppy-o"></i>' +
        //    '<span id="modal-build-title">Save Changes</span>' +
        //    '<i class="fa fa-times"></i>'
        //);

    });
    function closeModal() {
        $('.modal-disable-cover').fadeOut();
    }

    //--------------------------------------------- end of  expandable box  mini modal script -------------------------------------------------------//


    //$(window).load(function () {

    //var status=0;
    //function adjustGridColumn(){
    //    //alert($('#gridWrapp').width())
    //    //alert('working');
    //    //alert(gridwidth);
    //    var gridwidth = ($("#gridWrapp").width() - 20);
    //    $('col').css('width', '30px', '!important');
    //    $('table').css('width', gridwidth, '!important');
    //    $('.k-grid td').css('padding', '2px', 'line-height', '1em');
    //}
    //});
    //function backToNormalColumn() {
    //    //$('col').css('width', '150px', '!important');
    //    //$('table').css('width', gridwidth, '!important');
    //    //$('.k-grid td').css('padding', '.4em .6em', 'line-height', '1.6em');
    //    //alert('back to normal');

    //}

    //$(document.body).on('change','.column-grid-selector', function () {
    //    var dropdownvalue = $(".column-grid-selector option:selected").text();
        
    
    //    if (dropdownvalue == "Fit On Grid"){
    //        status = 0;
           
    
    //    } else if (dropdownvalue == "Default") {
    //        status = 1;
    //        //$('.expandable-box').on('resize', (backToNormalColumn));
    
    //    } else {
    //        status = 3;

    //    }


    //    if (status == 0) {
           
    //        $('.expandable-box').on('resize', (adjustGridColumn));
    //        alert(status);
    //        $('.box-toggle-button').on('click', (adjustGridColumn));
            
    //    }
    //    else if (status == 1) {
    //        $('.expandable-box').on('resize', (backToNormalColumn));
    //        alert(status);
    //    }
    //});
       

   

    //-----------------------End of shake function--------------------------------------//

    //$("button").click(function () {
    //    $("div")
    //      .animate({ left: "+=200px" }, 2000)
    //      .animate({ top: "0px" }, 600)
    //      .queue(function () {
    //          $(this).toggleClass("red").dequeue();
    //      })
    //      .animate({ left: "10px", top: "30px" }, 700);
    //});
}


