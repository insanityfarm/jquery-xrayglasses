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
            toggleKeyCode:  88, // 88 corresponds to "X" key!
            lens:           'binoculars',
            scale:          1.0
        },
        
        // constructor function
        init: function(){
            
            // merge defaults with custom option overrides
            xrayglasses.config = $.extend({}, xrayglasses.defaults, xrayglasses.options);
            
            // set up global vars to keep track of things
            xrayglasses.data = {
                page:           $(document),
                viewport:       $(window),
                body:           $('body'),
                pageWrapper:    xrayglasses.$elem,
                lensImage:      '',
                lensWidth:      0,
                lensHeight:     0
            };
            
            xrayglasses.attach();
            
            // register event handlers
            xrayglasses.data.viewport
                .on('scroll', xrayglasses.updateFixedPositions)
                .on('resize', xrayglasses.update)
                .on('mousemove', xrayglasses.move)
                .on('keyup keydown', xrayglasses.keypress);
            
            return xrayglasses;
            
        },
        
        // insert the xrayview HTML + SVG into the page
        attach: function(){
        
            // callback for attaching after lens image is ready
            var onImageReady = function(){
                            
                xrayglasses.data.lensWidth = this.width * xrayglasses.config.scale;
                xrayglasses.data.lensHeight = this.height * xrayglasses.config.scale;
                
                // generate the markup for the xray view
                var xrayview = 
                    $('<svg id="xrayglasses" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                        '<defs>' +
                            '<mask id="mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">' +
                                '<image width="' + xrayglasses.data.lensWidth + 'px" height="' + xrayglasses.data.lensHeight + 'px" xlink:href="' + xrayglasses.data.lensImage + '"></image>' +
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
                xrayglasses.data.embeddedMaskLens = $('#mask image');
                xrayglasses.data.xrayglassesContent = $('#xrayglasses .wrapper');

                xrayglasses.data.xrayglassesContent.css({
                    '-webkit-mask-image':   "url('" + xrayglasses.data.lensImage + "')",
                    '-webkit-mask-size':    xrayglasses.data.lensWidth + "px " + xrayglasses.data.lensHeight + "px"
                });
    
                // apply options
                xrayglasses.data.overlay.css({
                    fill: 'rgba(0,0,0,' + xrayglasses.config.overlayOpacity + ')'
                });

                // do an initial render 
                xrayglasses.update();
                
            }
            
            // fetch the lens image and get its dimensions before attaching
            $("<img/>", {
                src:    xrayglasses.data.lensImage = xrayglasses.getLensImage(),
                load:   onImageReady
            });
              
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
                '-webkit-mask-position-x': e.pageX - (xrayglasses.data.lensWidth / 2),
                '-webkit-mask-position-y': e.pageY - (xrayglasses.data.lensHeight / 2)
            });
            // other browsers
            xrayglasses.data.embeddedMaskLens.attr({
                x: e.pageX - (xrayglasses.data.lensWidth / 2),
                y: e.pageY - (xrayglasses.data.lensHeight / 2)
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
                    xrayglasses.data.xrayglasses.fadeTo(100, doShow ? 1 : 0);
                }
            }
        },
        
        // return the URL to the lens image, either by URL or by name for a predefined one
        getLensImage: function(){
            return predefinedLenses.hasOwnProperty(xrayglasses.config.lens) ? predefinedLenses[xrayglasses.config.lens] : xrayglasses.config.lens;
        }
        
    };
    
    XRayGlasses.defaults = XRayGlasses.prototype.defaults;
    
    $.fn.xrayglasses = function(options) {
        return this.each(function() {
            new XRayGlasses(this, options).init();
        });
    };

    window.XRayGlasses = XRayGlasses;

})(window, jQuery);

// set up container for lens definitions (which will be concatenated below this by gulp) 
var predefinedLenses = {};
predefinedLenses['binoculars-soft'] = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MzAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNTMwIDMwMCI+PGRlZnM+PGZpbHRlciBpZD0iYSIgeD0iLS4wNiIgd2lkdGg9IjEuMTIiIHk9Ii0uMDYiIGhlaWdodD0iMS4xMiIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSI3LjUiLz48L2ZpbHRlcj48ZmlsdGVyIGlkPSJiIiB4PSItLjA2IiB3aWR0aD0iMS4xMiIgeT0iLS4wNiIgaGVpZ2h0PSIxLjEyIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjcuNSIvPjwvZmlsdGVyPjwvZGVmcz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC03NTIuMzYyKSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxNjgiIGN5PSI4ODQuMzYyIiByPSIxNTAiIHRyYW5zZm9ybT0ibWF0cml4KC44OTI4NSAwIDAgLjg4NjI2IDEwIDExOS42OTYpIiBmaWx0ZXI9InVybCgjYSkiLz48Y2lyY2xlIHI9IjE1MCIgY3k9IjkwMi4zNjIiIGN4PSIzODAiIHRyYW5zZm9ybT0ibWF0cml4KC44OTI4NSAwIDAgLjg4NjI2IDMwLjcxNiAxMDMuNzQzKSIgZmlsdGVyPSJ1cmwoI2IpIi8+PC9nPjwvc3ZnPg==';
predefinedLenses['binoculars'] = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MzAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNTMwIDMwMCI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtNzUyLjM2MikiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGNpcmNsZSBjeD0iMTUwIiBjeT0iOTAyLjM2MiIgcj0iMTUwIi8+PGNpcmNsZSByPSIxNTAiIGN5PSI5MDIuMzYyIiBjeD0iMzgwIi8+PC9nPjwvc3ZnPg==';
predefinedLenses['crosshair'] = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iYSI+PHN0b3Agb2Zmc2V0PSIwIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLW9wYWNpdHk9Ii41MDIiLz48L2xpbmVhckdyYWRpZW50PjxyYWRpYWxHcmFkaWVudCB4bGluazpocmVmPSIjYSIgaWQ9ImIiIGN4PSIxNTAiIGN5PSIxNTAiIGZ4PSIxNTAiIGZ5PSIxNTAiIHI9IjEzOS45MTIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIi8+PC9kZWZzPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTc1Mi4zNjIpIj48Y2lyY2xlIGN4PSIxNDkuNzUiIGN5PSI5MDIuNjEyIiByPSIxNDQuOTM5IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLW9wYWNpdHk9Ii41MDIiLz48cGF0aCBkPSJNMTQ3LjUgMTAuMDg4QTE0MCAxNDAgMCAwIDAgMTAuMTI1IDE0Ny41SDMwVjE0MGg1djcuNWgxNVYxNDBoNXY3LjVoMTVWMTQwaDV2Ny41aDE1VjE0MGg1djcuNWgxNVYxNDBoNXY3LjVoMTVWMTQwaDV2Ny41aDEyLjVWMTM1SDE0MHYtNWg3LjV2LTE1SDE0MHYtNWg3LjVWOTVIMTQwdi01aDcuNVY3NUgxNDB2LTVoNy41VjU1SDE0MHYtNWg3LjVWMzVIMTQwdi01aDcuNVYxMC4wODh6bTUgLjAzN1YzMGg3LjV2NWgtNy41djE1aDcuNXY1aC03LjV2MTVoNy41djVoLTcuNXYxNWg3LjV2NWgtNy41djE1aDcuNXY1aC03LjV2MTVoNy41djVoLTcuNXYxMi41SDE2NVYxNDBoNXY3LjVoMTVWMTQwaDV2Ny41aDE1VjE0MGg1djcuNWgxNVYxNDBoNXY3LjVoMTVWMTQwaDV2Ny41aDE1VjE0MGg1djcuNWgxOS45MTJBMTQwIDE0MCAwIDAgMCAxNTIuNSAxMC4xMjV6TTEwLjA4OCAxNTIuNUExNDAgMTQwIDAgMCAwIDE0Ny41IDI4OS44NzVWMjcwSDE0MHYtNWg3LjV2LTE1SDE0MHYtNWg3LjV2LTE1SDE0MHYtNWg3LjV2LTE1SDE0MHYtNWg3LjV2LTE1SDE0MHYtNWg3LjV2LTE1SDE0MHYtNWg3LjV2LTEyLjVIMTM1djcuNWgtNXYtNy41aC0xNXY3LjVoLTV2LTcuNUg5NXY3LjVoLTV2LTcuNUg3NXY3LjVoLTV2LTcuNUg1NXY3LjVoLTV2LTcuNUgzNXY3LjVoLTV2LTcuNUgxMC4wODh6bTE0Mi40MTIgMFYxNjVoNy41djVoLTcuNXYxNWg3LjV2NWgtNy41djE1aDcuNXY1aC03LjV2MTVoNy41djVoLTcuNXYxNWg3LjV2NWgtNy41djE1aDcuNXY1aC03LjV2MTkuOTEyQTE0MCAxNDAgMCAwIDAgMjg5Ljg3NSAxNTIuNUgyNzB2Ny41aC01di03LjVoLTE1djcuNWgtNXYtNy41aC0xNXY3LjVoLTV2LTcuNWgtMTV2Ny41aC01di03LjVoLTE1djcuNWgtNXYtNy41aC0xNXY3LjVoLTV2LTcuNWgtMTIuNXoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgNzUyLjM2MikiIGZpbGw9InVybCgjYikiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=';
predefinedLenses['round-soft'] = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PGRlZnM+PGZpbHRlciBpZD0iYSIgeD0iLS4wNiIgd2lkdGg9IjEuMTIiIHk9Ii0uMDYiIGhlaWdodD0iMS4xMiIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSI3LjQ3MyIvPjwvZmlsdGVyPjwvZGVmcz48ZWxsaXBzZSBjeD0iMTUwIiBjeT0iOTAyLjM2MiIgcng9IjE0OS40NjUiIHJ5PSIxNDkuNDY1IiB0cmFuc2Zvcm09Im1hdHJpeCguODk2MDUgMCAwIC44ODk2NSAxNS41OTIgLTY1MS43MSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+';
predefinedLenses['round'] = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PGNpcmNsZSBjeD0iMTUwIiBjeT0iOTAyLjM2MiIgcj0iMTUwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTc1Mi4zNjIpIi8+PC9zdmc+';