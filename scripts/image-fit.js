/*
 * imageFit plugin - fit image to container without altering aspect ratio, prioritising the centre of the image
 */
(function ($) {
    'use strict';

    var funcs = [],
        objFit = typeof window.document.createElement('div').style.objectFit !== 'undefined', // check object-fit support
        jqIncl = typeof $ !== 'undefined', // check if jQuery is included the page
        customResizeIncl = typeof window.customResize !== 'undefined', // check if custom resize is included
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
                if (!hasClass(e, c[i])) { // check elem doesn't have class already
                    e.className = trim(e.className) + ' ' + c[i];
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
                e.className = e.className.replace(c[i], '');
            }
            e.className = trim(e.className); // remove white space
        },

        /*
         * Function check
         * @param {function}: function to fire
         */
        checkCallback = function (f, i) {
            if (typeof f === 'function') {
                f.call(i);
            }
        },

        /*
         * Compare aspect ratio of image and container and set 'fitted-tall' or 'fitted-wide' class accordingly
         *      positioning adjustment expected from CSS
         *      if marginCheck is true, will apply negative marginTop or marginLeft accordingly
         * @param {object}: original data object from imageFit function
         */
        setImgClasses = function (data) {
            removeClass(data.img, 'fitted-tall fitted-wide');

            // fire callback at aspect check stage
            checkCallback(data.onCheck, data.img);

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
            checkCallback(data.onSet, data.img);
        },

        /*
         * Resize call - fired on resize end (or in custom resize)
         * @param {object}: original data object from imageFit function
         */
        resizeCall = function (data) {
            if (data.checkOnResize) {
                initChecks(data, false);
            } else {
                setImgClasses(data);
            }
        },

        /*
         * Set functions to call on resize
         * @param {object}: original data object from imageFit function
         * @param {boolean}: whether resize should be bound - true on initial check, false later
         *      important for if checkOnResize is true
         */
        bindResize = function (data, toBindResize) {
            // check if resize should be used
            if (data.resize === false) {
                return;
            }
            // prevent binding resize again when checkOnResize is true
            if (!toBindResize) {
                return;
            }
            // check if customResize is available and should be used
            if (data.customResize !== false && customResizeIncl) {
                window.customResize.bind(function () {
                    resizeCall(data);
                });
                return;
            }
            // push all data info to funcs array to call in resize later
            funcs.push(data);
        },

        /*
         * Add object-fit class if object-fit is supported - otherwise, check image load
         * @param {object}: original data object from imageFit function
         * @param {boolean}: whether to bind resize events or not - important for if img load is checked on resize
         */
        initChecks = function (data, toBindResize) {
            var img = new Image(),
                useObjFit = data.objectFit !== false && objFit;

            // use object fit if supported - image load detection not needed in this case
            if (useObjFit) {
                addClass(data.img, 'fitted fitted-object-fit');
                return;
            }
            // set load and error events before setting src to prevent issues in old IE
            img.onload = function () {
                setImgClasses(data);
                bindResize(data, toBindResize);
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
                    resizeCall(funcs[i]);
                }
            }, 100);
        };

    /**
     * Add class 'fitted-tall' or 'fitted-wide' to image based on image and container aspect ratio comparison:
     *      'fitted-tall' if it needs height 100%, 'fitted-wide' if it needs width '100%'
     * @param {object}: properties...
     *      img {element}: singular expected. If passed multiple, will take first one
     *      container {element}: singular expected. If passed multiple, will take first one
     *      objectFit {boolean} optional: use objectFit (if supported) - true by default - adds 'fitted-object-fit' class
     *      useMargins {boolean} optional: to apply negative margin based on adjustment needed - false by default
     *          uses marginTop, or marginLeft
     *      resize {boolean} optional: do checks on resize - true by default
     *      customResize: {boolean} optional: to use customResize function (if available), and if resize is true - true by default
     *      checkOnResize: {boolean} optional: do image load check on resize - false by default
     *          Useful if image src is likely to change. E.g. picture element
     *      onCheck {function} optional: before aspect ratio check and classes are added (fires on initial check and resize event)
     *      onSet {function} optional: after aspect ratio check and classes are added (fires on initial check and resize event)
     */
    window.imageFit = function (data) {
        // ensure an image and container have been passed in
        if (typeof data.img === 'undefined' || typeof data.container === 'undefined' || data.img === null || data.container === null) {
            return false; // return false in this case to identify the cause
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
        initChecks(data, true);
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