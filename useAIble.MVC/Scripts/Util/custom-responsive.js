function CustomResponsive() {   
    var self = this;
    var width1;

    if ($(window).width() >= 1024 ) {
       
    }
    else if ($(window).width() >= 1024) {

    }
    else if ($(window).width() >= 480) {

    }
    else if ($(window).width() >= 320) {

    }
    else if ($(window).width() >= 240) {

    } else {

    }

    self.RepsonsiveNoteArea = function () {
        if ($(window).width() > 1200) {

        }
        else if ($(window).width() < 1200 && $(window).width() > 992) {
            changeNoteArea()
        }
        else if ($(window).width() < 992 && $(window).width() > 480) {
            changeNoteArea()
        }
        else if ($(window).width() < 480 && $(window).width() > 320) {

        }
        else if ($(window).width() < 320) {

        } else {

        }
    }

    self.ResponsiveFlipSwitch = function () {
        //--------bootstrap resolution-----------//

        if ($(window).width() > 1200) {

        }
        else if ($(window).width() < 1200 && $(window).width() > 992) {
            //makes the switch smaller in the optimize results
            resizeFlipSwitch(13, 40, 21, 13, 15);
        }
        else if ($(window).width() < 992 && $(window).width() > 480) {
            resizeFlipSwitch(13, 40, 21, 13, 15);
        }
        else if ($(window).width() < 480 && $(window).width() > 320) {
            resizeFlipSwitch(13, 40, 21, 13, 15);
        }
        else if ($(window).width() < 320) {
            resizeFlipSwitch(13, 40, 21, 13, 15);
        } else {

        }
        //--------bootstrap resolution-----------//
    };

    function resizeFlipSwitch(label_size, main_width, main_height, handle_width, handle_height) {
        $(".km-switch-label-on").css('font-size', label_size);
        $(".km-switch-label-off").css('font-size', label_size);
        $(".flip-switch").each(function () {
            var flip = $(this);
            var parent = flip.parent();

            // resize main container
            parent.width(main_width);
            parent.height(main_height);

            // resize handle
            var sw = flip.data("kendoMobileSwitch");
            sw.handle.width(handle_width);
            sw.handle.height(handle_height);

            sw.refresh();
        });
    }

    
    //remove note from the right corner in the product advisert page
    function changeNoteArea() {
        var notes = $('.notes-area').html();
        $('.left-side-note').show().after(notes);
        $('.hide-this-on-ipad').hide();
    }

 

}