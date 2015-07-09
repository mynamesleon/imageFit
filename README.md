# Image Fit

A tiny jQuery dependent script to allow an image to fill its container without altering its aspect ratio, prioritising the centre of the image.

## How It Works

The script compares the aspect ratio of the image, and its container, and applies classes to the image based on whether its height or width would need to be set to fill the space. The script checks if the image has loaded before doing these comparisons.

CSS can then be used from this point. Base CSS stylings are included.

The example styles used here rely on `object-fit` in supported browsers, and the `transform` property otherwise using `translateX(-50%)` or `translateY(-50%)` to reposition the image. The script can also apply the necessary negative margins to reposition the image.

## Usage
ImageFit can be used as a jQuery plugin or a standard function:

Standard function:

```js
imageFit({
    // required properties
    img: document.getElementById('example-img'),
    container: document.getElementById('example-container'),

    // optional properties
    objectFit: true, // true by default - adds 'fitted-object-fit' class (if supported) instead of 'fitted-tall' or 'fitted-wide' classes
    useMargins: /MSIE 7|MSIE 8/i.test(navigator.userAgent), // false by default - apply negative marginTop or marginLeft equal to half height or half width of the image
    resize: true, // true by default,
    checkOnResize: false, // false by default - whether to do image load check on resize. Useful if image src is likely to change. E.g. picture element

    // callbacks
    onPreLoad: function () {}, // before image load check - will also fire on resize if checkOnResize is true
    onCheck: function () {}, // before aspect ratio check and classes are added (fires on initial check and resize event)
    onSet: function () {} // after aspect ratio check and classes are added (fires on initial check and resize event)
});
```

jQuery plugin:

```js
$('#example-img').imageFit({
    // required properties
    container: $('#example-container'),

    // optional properties
    resize: true,
    objectFit: true,
    useMargins: /MSIE 7|MSIE 8/i.test(navigator.userAgent),
    checkOnResize: false,

    // callbacks
    onPreLoad: function () {},
    onCheck: function () {},
    onSet: function () {}
});
```

The callbacks are called in the context of the selected image, so `this` will reference the image.

### object-fit
If `objectFit` is set to true, and the browser supports the object-fit CSS property, *all* of the callbacks and other optional paramaters will *not* be used. This is because no further JS checks are needed, because object-fit can handle all of the image positioning without any further intervention.

## Classes used
- 'fitted' is added once the image has loaded and a calculation has been made
- 'fitted-object-fit' is applied if objectFit is set to true and object-fit is supported. If this class is added, no further checks will be made, and no further classes will be added
- 'fitted-wide' is applied if the image needs a **width** of 100% to fill the space
- 'fitted-tall' is applied if the image needs a **height** of 100% to fill the space
- 'fitted-margins' is applied if useMargins is set to true (and hence inline margin styling is being used to position the image)
- 'fitted-error' is applied if an error occurs when checking if the image has loaded e.g. the image src returning a 404

## Further Notes
The function expects **one image** and **one container**, if passed more than one, it will select the first one. If no image or container is passed in, the function will fail and return false.

The `objectFit` property is true by default as, when it is supported, this means that the resize check is not needed. However, it should be noted that applying object-fit may conflict with certain animations. E.g. in current Chrome (41), using object-fit prevents an opacity transition. It also halts the object-fit property from applying until the opacity transition would have ended.

The function will check the image's `currentSrc` property where possible when detecting if the image has loaded, to allow for use of `srcset` or the `<picture>` element. If the image src is likely to change at different window widths (e.g. via the `<picture>` element), be sure to set `checkOnResize` to true, which will make the script always check that the current image src has loaded.
