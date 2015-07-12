/*
 * Fit image to container without altering aspect ratio, prioritising the centre of the image
 * Leon Slater
 * http://mynamesleon.com
 * requisites: jQuery >= 1.9.1
 */

window.imageFit = window.imageFit || new function ($) {

    'use strict';

    if (typeof $ === 'undefined') {
        return function() {
            throw new Error('jQuery is required');
        };
    }

    var _funcs = [],
        _objFit = typeof window.document.createElement('div').style.objectFit !== 'undefined', // check object-fit support

        // default options
        _defaults = {
            img: undefined,
            container: undefined,

            // optional
            objectFit: true, // use object-fit if supported
            useMargins: false, // apply negative marginTop or marginLeft equal to half height or half width of the image
            resize: true, // do checks on resize
            checkOnResize: false, // do image load check on resize. Useful if image is likely to change via developer adjustment, picture element, etc.

            // callbacks
            onPreLoad: function () {}, // before image load check - will also fire on resize if checkOnResize is true
            onCheck: function () {}, // before aspect ratio check and classes are added
            onSet: function () {} // after aspect ratio check and classes are added
        },

        _helpers = {

            /*
             * Null or undefined check
             * @param p {misc}
             * @return {boolean}: if p is null or undefined
             */
            isNullOrUndefined: function (p) {
                return typeof p === 'undefined' || p === null;
            },

            /*
             * Function check
             * @param f {function}
             * @param c {misc}: function context
             */
            checkCallback: function (f, c) {
                if (typeof f === 'function') {
                    f.call(c);
                }
            }
        },

        _module = {

            resize: {

                timer: undefined, // store set timeout used to ensure calculations only fire on resize end

                /*
                 * Set functions to call on resize
                 * @param data {object}: original data object from imageFit function
                 * @param toBindResize {boolean}: whether resize should be bound - true on initial check, false later
                 *      important for if checkOnResize is true
                 */
                bind: function (opts, toBindResize) {
                    // check if resize should be used
                    if (!opts.resize) {
                        return;
                    }
                    // prevent binding resize again when checkOnResize is true
                    if (!toBindResize) {
                        return;
                    }
                    // push all data info to funcs array to call in resize later
                    _funcs.push(opts);
                },

                /*
                 * Resize check to determine which function to fire - fired on resize end
                 * @param {object}: original data object from imageFit function
                 */
                check: function (opts) {
                    if (opts.checkOnResize) {
                        _module.run(opts, false);
                    } else {
                        _module.checkAndSet(opts);
                    }
                },

                /*
                 * resize end call
                 */
                call: function () {
                    // do not proceed if no data was pushed into the _funcs array
                    if (!_funcs.length) {
                        return;
                    }
                    if (_module.resize.timer) {
                        clearTimeout(_module.resize.timer);
                    }
                    _module.resize.timer = setTimeout(function () {
                        var i = 0;
                        for (i; i < _funcs.length; i += 1) {
                            _module.resize.check(_funcs[i]);
                        }
                    }, 100);
                }

            },

            /*
             * Compare aspect ratio of image and container and set 'fitted-tall' or 'fitted-wide' class accordingly
             *      positioning adjustment expected from CSS
             *      if marginCheck is true, will apply negative marginTop or marginLeft accordingly
             * @param {object}: original data object from imageFit function
             */
            checkAndSet: function (opts) {
                var $img = $(opts.img),
                    $container = $(opts.container);

                $img.removeClass('fitted-tall fitted-wide');
                _helpers.checkCallback(opts.onCheck, opts.img); // fire at aspect ratio check stage

                var aspectRatio = (opts.img.clientHeight / opts.img.clientWidth) * 100,
                    containerAspectRatio = (opts.container.clientHeight / opts.container.clientWidth) * 100,
                    imageType = aspectRatio < containerAspectRatio ? 'fitted-tall' : 'fitted-wide';

                $img.addClass('fitted ' + imageType);

                // margin check - apply negative marginTop or marginLeft
                if (opts.useMargins) {
                    $img.addClass('fitted-margins');
                    if (imageType === 'fitted-tall') {
                        opts.img.style.marginLeft = -(opts.img.clientWidth / 2) + 'px'; // need to get width again after class added
                        opts.img.style.marginTop = '';
                    } else {
                        opts.img.style.marginLeft = '';
                        opts.img.style.marginTop = -(opts.img.clientHeight / 2) + 'px'; // need to get height again after class added
                    }
                }

                _helpers.checkCallback(opts.onSet, opts.img); // fire once classes are set
            },


            /*
             * Add object-fit class if object-fit is supported - otherwise, check image load
             * @param {object}: original data object from imageFit function
             * @param {boolean}: whether to bind resize events or not - important for if img load is checked on resize
             */
            run: function (opts, toBindResize) {
                var img = new Image(),
                    useObjFit = opts.objectFit && _objFit;

                // use object fit if supported - image load detection not needed in this case
                if (useObjFit) {
                    $(opts.img).addClass('fitted fitted-object-fit');
                    return;
                }

                _helpers.checkCallback(opts.onPreLoad, opts.img);

                // set load and error events before setting src to prevent issues in old IE
                img.onload = function () {
                    _module.checkAndSet(opts);
                    _module.resize.bind(opts, toBindResize);
                };
                img.onerror = function () {
                    $(opts.img).addClass('fitted-error');
                };
                img.src = opts.img.currentSrc || opts.img.src;
            },

            /*
             * Add class 'fitted-tall' or 'fitted-wide' to image based on image and container aspect ratio comparison:
             *      'fitted-tall' if it needs height 100%, 'fitted-wide' if it needs width '100%'
             * @param opts {object}: properties...
             *      img {element}: singular expected. If passed multiple, will take first one
             *      container {element}: singular expected. If passed multiple, will take first one
             *      objectFit {boolean} optional: use objectFit (if supported) - true by default - adds 'fitted-object-fit' class
             *      useMargins {boolean} optional: to apply negative margin based on adjustment needed - false by default
             *          uses marginTop, or marginLeft
             *      resize {boolean} optional: do checks on resize - true by default
             *      checkOnResize: {boolean} optional: do image load check on resize - false by default
             *          Useful if image src is likely to change. E.g. picture element
             *      onCheck {function} optional: before aspect ratio check and classes are added (fires on initial check and resize event)
             *      onSet {function} optional: after aspect ratio check and classes are added (fires on initial check and resize event)
             */
            init: function (opts) {
                // ensure an image and container have been passed in
                if (_helpers.isNullOrUndefined(opts.img) || _helpers.isNullOrUndefined(opts.container)) {
                    return;
                }
                // select first image if there are multiple (or jQuery object)
                if (opts.img.length) {
                    opts.img = opts.img[0];
                }
                // select first container if there are multiple
                if (opts.container.length) {
                    opts.container = opts.container[0];
                }
                // initialise checks
                _module.run($.extend({}, _defaults, opts), true);
            }
        };

    // bind resize event once regardless and do checks for funcs to fire in _module.resize.call
    // to prevent too many event listeners being bound on the window
    $(window).on('resize', _module.resize.call);

    // create jQuery plugin version
    $.fn.imageFit = function (opts) {
        opts.img = this;
        _module.init(opts);
        return this;
    };

    return function (opts) {
        _module.init(opts);
    };

}(window.jQuery);
