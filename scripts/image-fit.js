/*
 * imageFit
 */
(function ($) {
    'use strict';

    var funcs = [],
        objFit = window.document.createElement('div').style.objectFit !== undefined,
        jqIncl = $ !== undefined, // check if jQuery is included the page
        resizeTimer,

        /*
         * Check if element has class - uses jQuery hasClass if available
         * @param {element}: element to check
         * @param {string}: class to check
         * @return {boolean}: whether element has that class
         */
        hasClass = function (e, c) {
            if (jqIncl) {
                return $(e).hasClass(c);
            }
            
            var i = 0,
                classes = e.className.split(' ');
            for (i; i < classes.length; i += 1) {
                if (c === classes[i]) {
                    return true;
                }
            }
            return false;
        },

        /*
         * Trim string - only used if jQuery is not included
         * @param {string}: string to trim
         * @return {string}: trimmed string
         */
        trim = function (s) {
            return String.prototype.trim ? s.trim() : s.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        },

        /*
         * Add class(es) to element - uses jQuery addClass if available
         * @param {element}: element to add class(es) to
         * @param {string}: space delimitted class(es) to add
         */
        addClass = function (e, c) {
            if (jqIncl) {
                $(e).addClass(c);
                return;
            }
            
            var i = 0;
            c = c.split(' '); // create array from class string
            for (i; i < c.length; i += 1) {
                if (c.hasOwnProperty(i)) {
                    if (!hasClass(e, c[i])) { // check elem doesn't have class already
                        e.className = trim(e.className) + ' ' + c[i];
                    }
                }
            }
        },

        /*
         * Remove class(es) from element - uses jQuery removeClass if available
         * @param {element}: element to remove class(es) from
         * @param {string}: space delimitted class(es) to remove
         */
        removeClass = function (e, c) {
            if (jqIncl) {
                $(e).removeClass(c);
                return;
            }
            
            var i = 0;
            c = c.split(' '); // create array from class string
            for (i; i < c.length; i += 1) {
                if (c.hasOwnProperty(i)) {
                    e.className = e.className.replace(c[i], '');
                }
            }
            e.className = trim(e.className); // remove white space
        },

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
            removeClass(data.img, 'fitted-tall fitted-wide');

            // fire callback at aspect check stage
            checkCallback(data.onCheck);

            var aspectRatio = (data.img.clientHeight / data.img.clientWidth) * 100,
                containerAspectRatio = (data.container.clientHeight / data.container.clientWidth) * 100,
                imageType = aspectRatio < containerAspectRatio ? 'fitted-tall' : 'fitted-wide';

            addClass(data.img, 'fitted ' + imageType);

            // margin check - apply negative marginTop or marginLeft
            if (data.useMargins) {
                addClass(data.img, 'fitted-margins');
                if (imageType === 'fitted-tall') {
                    data.img.style.marginLeft = -(data.img.clientWidth / 2) + 'px'; // need to get width again after class added
                    data.img.style.marginTop = '';
                } else {
                    data.img.style.marginLeft = '';
                    data.img.style.marginTop = -(data.img.clientHeight / 2) + 'px'; // need to get height again after class added
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
            var img = new Image(),
                useObjFit = data.objectFit !== false && objFit;
            
            // use object fit if supported - image load detection not needed in this case
            if (useObjFit) {
                addClass(data.img, 'fitted fitted-object-fit');
                return;
            }

            img.onload = function () {
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
            };
            img.onerror = function () {
                addClass(data.img, 'fitted-error');
            };
            img.src = data.img.currentSrc || data.img.src;
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
     * Add class 'fitted-tall' or 'fitted-wide' to image based on image and container aspect ratio comparison:
     *      'fitted-tall' if it needs height 100%, 'fitted-wide' if it needs width '100%'
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
    if (window.addEventListener) {
        window.addEventListener('resize', callFuncs);
    } else {
        window.attachEvent('onresize', callFuncs);
    }

    // create jQuery plugin version
    if (jqIncl) {
        $.fn.imageFit = function (data) {
            data.img = this;
            window.imageFit(data);
        };
    }

}(window.jQuery));