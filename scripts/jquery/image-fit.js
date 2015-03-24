/*
 * jQuery dependent imageFit variant
 */

(function ($) {
    'use strict';

    var funcs = [],
        objFit = window.document.createElement('div').style.objectFit !== undefined,
        resizeTimer,

        /*
         * Function check
         * @param {function}: function to fire
         */
        checkCallback = function (f) {
            if (typeof f === 'function') {
                f();
            }
        },

        /*
         * Compare aspect ratio of image and container and set 'tall' or 'wide' class accordingly
         *      positioning adjustment expected from CSS
         *      if marginCheck property is true, will apply negative marginTop or marginLeft accordingly
         * @param {object}: original data object from imageFit function
         */
        setImgClasses = function (data) {
            var $img = $(data.img),
                $container = $(data.container),
                aspectRatio,
                containerAspectRatio,
                imageType;
            
            $img.removeClass('fitted-tall fitted-wide');

            // fire callback at aspect check stage
            checkCallback(data.onCheck);

            aspectRatio = ($img.height() / $img.width()) * 100;
            containerAspectRatio = ($container.height() / $container.width()) * 100;
            imageType = aspectRatio < containerAspectRatio ? 'fitted-tall' : 'fitted-wide';

            $img.addClass('fitted ' + imageType);

            // margin check - apply negative marginTop or marginLeft
            if (data.useMargins) {
                $img.addClass('fitted-margins');
                if (imageType === 'fitted-tall') {
                    $img.css({
                        marginLeft: -($img.width() / 2) + 'px', // need to get width again after class added
                        marginTop: ''
                    });
                } else {
                    $img.css({
                        marginLeft: '',
                        marginTop: -($img.height() / 2) + 'px' // need to get height again after class added
                    });
                }
            }

            // fire callback once classes are set
            checkCallback(data.onSet);
        },

        /*
         * Add object-fit class if object-fit is supported - otherwise, check image load
         * @param {object}: original data object from imageFit function
         */
        initChecks = function (data) {
            var img = new Image();

            // use object fit if supported
            if (data.objectFit !== false && objFit) {
                $(data.img).addClass('fitted fitted-object-fit');
                return;
            }

            $(img).on({
                load: function () {
                    setImgClasses(data);
                    // push all data info to funcs array to call in resize later
                    if (data.resize !== false) {
                        if (data.customResize !== false && window.customResize !== undefined) {
                            window.customResize.bind(function () {
                                setImgClasses(data);
                            });
                        } else {
                            funcs.push(data);
                        }
                    }
                },
                error: function () {
                    $(data.img).addClass('fitted-error');
                }
            }).attr('src', data.img.src);
        },

        /*
         * Function to call resize funcs stored in funcs array - fires on resize end
         */
        callFuncs = function () {
            if (resizeTimer) {
                clearTimeout(resizeTimer);
            }
            resizeTimer = setTimeout(function () {
                var i = 0;
                for (i; i < funcs.length; i += 1) {
                    setImgClasses(funcs[i]);
                }
            }, 100);
        };

    /**
     * Add class 'tall' or 'wide' to image based on image and container aspect ratio comparison:
     *      'tall' if it needs height 100%, 'wide' if it needs width '100%'
     * @param {object}: properties...
     *      img {element}: singular expected. If passed multiple, will take first one
     *      container {element}: singular expected. If passed multiple, will take first one
     *      resize {boolean} optional: do checks on resize - true by default
     *      objectFit {boolean} optional: use objectFit (if supported) - true by default - adds 'obj-fit' class
     *      useMargins {boolean} optional: to apply negative margin based on adjustment needed
     *          uses marginTop, or marginLeft
     *      customResize: {boolean} optional: to use customResize function (if available), and if resize is true - true by default
     *      onCheck {function} optional: before aspect ratio check and classes are added
     *      onSet {function} optional: after aspect ratio check and classes are added
     */
    window.imageFit = function (data) {
        // ensure an image and container have been passed in
        if (data.img === undefined || data.container === undefined || data.img === null || data.container === null) {
            return;
        }
        // select first image if there are multiple
        if (data.img.length) {
            data.img = data.img[0];
        }
        // select first container if there are multiple
        if (data.container.length) {
            data.container = data.container[0];
        }
        // initialise checks
        initChecks(data);
    };

    // bind resize event
    $(window).on('resize', callFuncs);

    $.fn.imageFit = function (data) {
        data.img = this;
        window.imageFit(data);
    };

}(window.jQuery));