/*
 * Fit image to container without altering aspect ratio, prioritising the centre of the image
 * Leon Slater
 * http://mynamesleon.com
 * github.com/mynamesleon/imageFit
 */

window.imageFit = window.imageFit || new function ($) {
    'use strict';

    var _funcs = [],
        _jqIncl = typeof $ !== 'undefined',
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
            },

            /*
             * Merge to objects
             * @param t {object}: target
             * @param o {object}: object to merge into target
             * @return {object}: new object from merge
             */
            merge: function (t, o) {
                var n = t,
                    i;
                for (i in o) {
                    if (o.hasOwnProperty(i)) {
                        n[i] = o[i];
                    }
                }
                return n;
            },

            /*
             * Add class(es) to element
             * @param e {element}: element to add class(es) to
             * @param c {string}: space delimitted class(es) to add
             */
            addClass: function (e, c) {
                var cur = ' ' + e.className + ' ',
                    cs = c.split(' '),
                    n = '',
                    i = 0;

                for (i; i < cs.length; i += 1) {
                    if (cur.indexOf(' ' + cs[i] + ' ') === -1 && cs[i] !== '') {
                        n += ' ' + cs[i];
                    }
                }
                e.className += n;
            },

            /*
             * Remove class(es) from element
             * @param e {element}: element to remove class(es) from
             * @param c {string}: space delimitted class(es) to remove
             */
            removeClass: function (e, c) {
                var cur = ' ' + e.className + ' ',
                    cs = c.split(' '),
                    i = 0;

                for (i; i < cs.length; i += 1) {
                    cur = cur.replace(' ' + cs[i] + ' ', ' ');
                }
                e.className = cur.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''); // remove white space
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
                run: function () {
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
                _helpers.removeClass(opts.img, 'fitted-tall fitted-wide');
                _helpers.checkCallback(opts.onCheck, opts.img); // fire at aspect ratio check stage

                var aspectRatio = (opts.img.clientHeight / opts.img.clientWidth) * 100,
                    containerAspectRatio = (opts.container.clientHeight / opts.container.clientWidth) * 100,
                    imageType = aspectRatio < containerAspectRatio ? 'fitted-tall' : 'fitted-wide';

                _helpers.addClass(opts.img, 'fitted ' + imageType);

                // margin check - apply negative marginTop or marginLeft
                if (opts.useMargins) {
                    _helpers.addClass(opts.img, 'fitted-margins');
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
                    _helpers.addClass(opts.img, 'fitted fitted-object-fit');
                    return;
                }

                _helpers.checkCallback(opts.onPreLoad, opts.img);

                // set load and error events before setting src to prevent issues in old IE
                img.onload = function () {
                    _module.checkAndSet(opts);
                    _module.resize.bind(opts, toBindResize);
                };
                img.onerror = function () {
                    _helpers.addClass(opts.img, 'fitted-error');
                };
                img.src = opts.img.currentSrc || opts.img.src;
            },

            /*
             * Add classes to image based on image and container aspect ratio comparison
             * @param opts {object}: see _defaults above for properties
             */
            init: function (opts) {
                // select first image if there are multiple (or jQuery object)
                if (opts.img.length) {
                    opts.img = opts.img[0];
                }
                // select first container if there are multiple
                if (opts.container.length) {
                    opts.container = opts.container[0];
                }
                // ensure an image and container have been passed in
                if (_helpers.isNullOrUndefined(opts.img) || _helpers.isNullOrUndefined(opts.container)) {
                    return;
                }
                // initialise checks
                _module.run(_helpers.merge(_defaults, opts), true);
            }
        };

    // bind resize event once regardless and do checks for funcs to fire in _module.resize.run
    // to prevent too many event listeners being bound on the window
    if (typeof window.addEventListener !== 'undefined') {
        window.addEventListener('resize', _module.resize.run);
    } else {
        window.attachEvent('onresize', _module.resize.run);
    }

    // create jQuery plugin version
    if (_jqIncl) {
        $.fn.imageFit = function (opts) {
            opts.img = this;
            _module.init(opts);
            return this;
        };
    }

    return function (opts) {
        _module.init(opts);
    };

}(window.jQuery);
