// Probably precede use of this plugin with Modernizr to validate SVG foreignObject support

// Many thanks to Mark Dalgleish for his base jQuery plugin template:
// http://markdalgleish.com/2011/05/creating-highly-configurable-jquery-plugins/

(function(window, $){


    var XRayGlasses = function(elem, options){
        xrayglasses = this;
        xrayglasses.elem = elem;
        xrayglasses.$elem = $(elem);
        xrayglasses.options = options;
    };
    
    XRayGlasses.prototype = {
        
        // default configuration, can be overridden at instatiation
        defaults: {
            overlayOpacity: 0.8,
            width: 150,
            height: 150,
            toggleKeyCode: 88, // 88 corresponds to "X" key!
        },
        
        // constructor function
        init: function(){
            
            // merge defaults with custom option overrides
            xrayglasses.config = $.extend({}, xrayglasses.defaults, xrayglasses.options);
            
            // set up global vars to keep track of things
            xrayglasses.data = {
                page: $(document),
                viewport: $(window),
                body: $('body'),
                pageWrapper: xrayglasses.$elem
            };
            
            xrayglasses.attach();
            
            // register event handlers
            xrayglasses.data.viewport
                .on('scroll', xrayglasses.updateFixedPositions)
                .on('resize', xrayglasses.update)
                .on('mousemove', xrayglasses.move)
                .on('keyup keydown', xrayglasses.keypress);
                
            // apply options
            xrayglasses.data.overlay.css({
                fill: 'rgba(0,0,0,' + xrayglasses.config.overlayOpacity + ')'
            });
            
            return xrayglasses;
            
        },
        
        // insert the xrayview HTML + SVG into the page
        attach: function(){
            
            // generate the markup for the xray view
            var xrayview = 
                $('<svg id="xrayglasses" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                    '<defs>' +
                        '<filter id="filter">' +
                            '<feGaussianBlur stdDeviation="10"></feGaussianBlur>' +
                        '</filter>' +
                        '<mask id="mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">' +
                            '<ellipse cx="50%" cy="50%" rx="120px" ry="120px" fill="white" filter="url(#filter)" />' +
                        '</mask>' +
                    '</defs>' +
                    '<rect id="xrayglassesOverlay" width="100%" height="100%" />' +
                    '<foreignObject width="100%" height="100%" style="mask: url(#mask);">' +
                        '<div class="wrapper"></div>' +
                    '</foreignObject>' +
                '</svg>');

            // append it to the page
            xrayglasses.data.pageWrapper.after(xrayview);
            
            // add some more data variables            
            xrayglasses.data.xrayglasses = $('#xrayglasses');
            xrayglasses.data.overlay = $('#xrayglassesOverlay');
            xrayglasses.data.embeddedMaskEllipse = $('#mask ellipse');
            xrayglasses.data.xrayglassesContent = $('#xrayglasses .wrapper');
            
            // do an initial render 
            xrayglasses.update();
              
        },
        
        // sync the xrayglasses DOM with the page DOM
        update: function(){
            
            // clone the current page structure into the xrayglasses
            xrayglasses.data.xrayglassesContent.html(xrayglasses.data.pageWrapper.html());
        
            // synchronize the dimensions of the xray view with those of the page
            xrayglasses.data.pageWidth = xrayglasses.data.viewport.width();
            xrayglasses.data.pageHeight = xrayglasses.data.page.height() > xrayglasses.data.viewport.height() ? xrayglasses.data.page.height() : xrayglasses.data.viewport.height();
        
            xrayglasses.data.xrayglasses.attr({
                width: xrayglasses.data.pageWidth,
                height: xrayglasses.data.pageHeight
            });
        
            xrayglasses.data.overlay.attr({
                width: xrayglasses.data.pageWidth,
                height: xrayglasses.data.pageHeight
            });
        
            xrayglasses.data.xrayglassesContent.css({
                height: xrayglasses.data.pageHeight,
                paddingLeft: xrayglasses.data.body.css('marginLeft'),
                paddingRight: xrayglasses.data.body.css('marginRight')
            });
            
            // the dimension change may have affected fixed-position elements too
            xrayglasses.updateFixedPositions();
            
        },
        
        move: function(e){
            // WebKit
            xrayglasses.data.xrayglassesContent.css({
                '-webkit-mask-position-x': e.pageX - 150,
                '-webkit-mask-position-y': e.pageY - 150
            });
            // other browsers
            xrayglasses.data.embeddedMaskEllipse.attr({
                cx: e.pageX,
                cy: e.pageY
            });
        },
        
        // fixed positions are not honored for HTML elements inside SVG foreignobjects, so fake it
        updateFixedPositions: function(){
            var scrollTop = xrayglasses.data.viewport.scrollTop();
            var scrollLeft = xrayglasses.data.viewport.scrollLeft();
            xrayglasses.data.xrayglasses.find('.fixed').each(function(){
                $(this).css({
                    marginTop: $(this).css('top') == 'auto' ? 'auto' : scrollTop,
                    marginLeft: $(this).css('left') == 'auto' ? 'auto' : scrollLeft
                });
            });
        },


        keypress: function(e){
            // TODO: make sure no form inputs have focus first, that could get annoying fast!
            if((e.keyCode || e.which) == xrayglasses.config.toggleKeyCode){
                var isPressed = (e.type === 'keydown');
                var doShow = xrayglasses.data.xrayglasses.css('opacity') < 0.5;
                if(isPressed === doShow) {
                    //xrayglassesPrompt.fadeTo(150, doShow ? 0 : 1);
                    xrayglasses.data.xrayglasses.fadeTo(100, doShow ? 1 : 0);
                }
            }
        }
        
    };
    
    XRayGlasses.defaults = XRayGlasses.prototype.defaults
    
    $.fn.xrayglasses = function(options) {
        return this.each(function() {
            new XRayGlasses(this, options).init();
        });
    };

    window.XRayGlasses = XRayGlasses;

})(window, jQuery);