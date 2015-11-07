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

            /*
             * required property - container to compare image against
             * @return {element|undefined}
             */
            container: function () {
                var e = this.parentNode,
                    r;

                while (e.nodeType !== 9) { // stop at document
                    if ((' ' + e.className + ' ').indexOf(' image-fit-container ') > -1) {
                        r = e;
                        break;
                    }
                    e = e.parentNode; // set el to parent node
                }
                return r;
            },

            // optional
            objectFit: true, // use object-fit if supported
            useMargins: false, // apply negative marginTop or marginLeft equal to half height or half width of the image
            resize: true, // do checks on resize
            checkOnResize: false, // do image load check on resize

            // callbacks
            onPreLoad: function () {}, // before image load check - will also fire on resize if checkOnResize is true
            onCheck: function () {}, // before aspect ratio check and classes are added
            onSet: function () {} // after aspect ratio check and classes are added
        },

        _helpers = {

            /*
             * handle elements for consistent response
             * @param elem {element(s)}: HTMLElement or HTMLCollection or jQuery object
             * @return {array}: elements array
             */
            handleElems: function (elem) {
                var result = [],
                    i = 0;

                if (typeof elem !== 'undefined' && elem !== null) {
                    if (typeof elem.length === 'undefined') { // handle single element
                        result.push(elem);
                    } else if (elem.length) { // handle multiple
                        for (i = 0; i < elem.length; i += 1) {
                            result.push(elem[i]);
                        }
                    }
                }
                return result;
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
             * Merge objects
             * @param {object(s)}: objects to merge together
             * @return {object}: new object from merge
             */
            merge: function () {
                var a = arguments,
                    n = {},
                    i = 0,
                    o,
                    p;

                for (i = 0; i < a.length; i += 1) {
                    o = a[i];
                    for (p in o) {
                        if (o.hasOwnProperty(p)) {
                            n[p] = o[p];
                        }
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
                 * @param opts {object}: original data object from imageFit function
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
                 * @param opts {object}: original data object from imageFit function
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
             * @param opts {object}: original data object from imageFit function
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
             * @param opts {object}: original data object from imageFit function
             * @param toBindResize {boolean}: whether to bind resize events or not - important for if img load is checked on resize
             */
            run: function (opts, toBindResize) {
                var img = new Image();

                _helpers.checkCallback(opts.onPreLoad, opts.img);

                // use object fit if supported
                if (opts.objectFit && _objFit) {
                    _helpers.addClass(opts.img, 'fitted fitted-object-fit');
                    // set resize to allow onPreLoad callback to still be used
                    if (opts.checkOnResize) {
                        _module.resize.bind(opts, toBindResize);
                    }
                    return;
                }

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
             * check and handle container from options
             * @param opts {object}: original data object from imageFit function
             */
            prep: function (opts) {
                // handle function variant for the container
                if (typeof opts.container === 'function') {
                    opts.container = opts.container.call(opts.img);
                }
                // handle passed in container(s)
                opts.container = _helpers.handleElems(opts.container);
                // ensure the container exists
                if (!opts.container.length) {
                    return;
                }
                // force use of first one
                opts.container = opts.container[0];
                // store data and initialise checks
                opts.img.imageFitData = opts;
                _module.run(opts, true);
            },

            /*
             * Add classes to image based on image and container aspect ratio comparison
             * @param img {element(s)}
             * @param opts {object}: see _defaults above for properties
             */
            init: function (img, opts) {
                var i = 0,
                    toTrigger = typeof opts === 'string' && opts === 'update';

                // handle passed in image(s)
                img = _helpers.handleElems(img);
                // start prep - include image within main object
                for (i = 0; i < img.length; i += 1) {
                    if (toTrigger && typeof (opts = img[i].imageFitData) !== 'undefined') {
                        _module.run(opts, false);
                    } else {
                        _module.prep(_helpers.merge(_defaults, opts, { img: img[i] }));
                    }
                }
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
            _module.init(this, opts);
            return this;
        };
    }

    return function (img, opts) {
        _module.init(img, opts);
    };

}(window.jQuery);
