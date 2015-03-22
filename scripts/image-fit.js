(function () {
    'use strict';

    var funcs = [],
        objFit = window.document.createElement('div').style.objectFit !== undefined,
        resizeTimer,

        /*
         * Check if element has class
         * @param {element}: element to check
         * @param {string}: class to check
         * @return {boolean}: whether element has that class
         */
        hasClass = function (e, c) {
            return e.className.indexOf(c) > -1;
        },

        /*
         * Trim string
         * @param {string}: string to trim
         * @return {string}: trimmed string
         */
        trim = function (s) {
            return s.replace(/^\s+|\s+$/gm, '');
        },

        /*
         * Add class(es) to element
         * @param {element}: element to add class(es) to
         * @param {array}: class(es) to add
         */
        addClass = function (e, c) {
            var i = 0;
            for (i; i < c.length; i += 1) {
                if (c.hasOwnProperty(i)) {
                    if (!hasClass(e, c[i])) { // check elem doesn't have class already
                        e.className = trim(e.className) + ' ' + c[i];
                    }
                }
            }
        },

        /*
         * Remove class(es) from element
         * @param {element}: element to remove class(es) from
         * @param {array}: class(es) to remove
         */
        removeClass = function (e, c) {
            var i = 0;
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
            removeClass(data.img, ['fitted-tall', 'fitted-wide']);

            // fire callback at aspect check stage
            checkCallback(data.onCheck);

            var imgWidth = data.img.clientWidth,
                imgHeight = data.img.clientHeight,
                aspectRatio = (imgHeight / imgWidth) * 100,
                containerAspectRatio = (data.container.clientHeight / data.container.clientWidth) * 100,
                imageType = aspectRatio < containerAspectRatio ? 'fitted-tall' : 'fitted-wide';

            addClass(data.img, ['fitted', imageType]);

            // margin check - apply negative marginTop or marginLeft
            if (data.useMargins) {
                addClass(data.img, ['fitted-margins']);
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
            var img = new Image();

            // use object fit if supported
            if (data.objectFit !== false && objFit) {
                addClass(data.img, ['fitted', 'fitted-object-fit']);
                return;
            }

            img.onload = function () {
                setImgClasses(data);
                // push all data info to funcs array to call in resize later
                if (data.resize !== false) {
                    funcs.push(data);
                }
            };
            img.onerror = function () {
                addClass(data.img, ['fitted-error']);
            };
            img.src = data.img.getAttribute('src');
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
     *      onCheck {function} optional: before aspect ratio check and classes are added
     *      onSet {function} optional: after aspect ratio check and classes are added
     */
    window.imageFit = function (data) {
        // ensure an image and container have been passed in
        if (data.img === undefined || data.container === undefined) {
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

    if (window.jQuery) {
        window.jQuery.fn.imageFit = function (data) {
            data.img = this;
            window.imageFit(data);
        };
    }

}());