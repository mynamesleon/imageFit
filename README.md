# Image Fit

A tiny script to allow an image to fill its container without altering its aspect ratio, prioritising the centre of the image.

## How It Works

For anyone familiar with using background images and `background-size: cover;` - imageFit does that, but with image tags.

Sadly, `background-size` only works back to IE9, and its image-based counterpart `object-fit` only works for the very latest browsers. I needed a solution that could be used for content-managed images, that could be any size or aspect ratio, and would work back to IE7.

The script compares the aspect ratio of the image, and its container, and applies classes to the image based on whether its height or width would need to be set to fill the space. The script checks if the image has loaded before doing these comparisons.

CSS can then be used from this point. Base CSS stylings are included.

The script also includes detection of the `object-fit` property, and makes use of it in supported browsers. You can choose how to approach the others, but the sample styles included use the `transform` properties using `translateX(-50%)` or `translateY(-50%)` to reposition the image in IE9+. The script can also apply the necessary negative margins to reposition the image, which my example is doing in IE7 and 8.

## Usage
ImageFit can be used as a jQuery plugin or a standard function. It takes an image (or images), and an object of options.

Standard function:

```js
imageFit(document.getElementById('example-img'), {
    // container used for comparison - requires an element or function
    // by default, checks parents and uses the first one found with the "image-fit-container" class
    container: document.getElementById('example-container'),

    // optional
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
    // container used for comparison
    container: $('#example-container'),

    // optional
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
If `objectFit` is set to true, and the browser supports the object-fit CSS property, only the `onPreLoad` callback is usable (if the `resize` and `checkOnResize` options are true). This is because no image load or positioning checks are required in this instance, because object-fit can handle all of the image positioning without any further intervention. The `onPreLoad` function is still usable should you wish to set a different image src (for instance at specific breakpoints).

## Classes used
- 'fitted' is added once the image has loaded and a calculation has been made
- 'fitted-object-fit' is applied if objectFit is set to true and object-fit is supported. If this class is added, no further checks will be made, and no further classes will be added
- 'fitted-wide' is applied if the image needs a **width** of 100% to fill the space
- 'fitted-tall' is applied if the image needs a **height** of 100% to fill the space
- 'fitted-margins' is applied if useMargins is set to true (and hence inline margin styling is being used to position the image)
- 'fitted-error' is applied if an error occurs when checking if the image has loaded e.g. the image src returning a 404

## Further Notes
As of version 2, the plugin will work if multiple images are passed in - the options will be applied for each.

The `container` property can be an element or function. If a function is used, it will need to return an element. If multiple elements are passed in (e.g. from a jQuery object), then only the first one will be used.

The `objectFit` property is true by default as, when it is supported, this means that the resize check is not needed. However, it should be noted that applying object-fit may conflict with certain animations. E.g. in recent versions of Chrome (41 and up by my observations), using object-fit prevents an opacity transition. It also halts the object-fit property from applying until the opacity transition would have ended.

The function will check the image's `currentSrc` property where possible when detecting if the image has loaded, to allow for use of `srcset` or the `<picture>` element. If the image src is likely to change at different window widths (e.g. via the `<picture>` element), be sure to set `checkOnResize` to true, which will make the script always check that the current image src has loaded.

## Changelog
v2.0.1
- correction in default container function

v2.0.0
- added ability to have multiple images passed in
- enabled the `onPreLoad` callback to be usable when `objectFit` is true and supported, on both load, and resize (if `resize` and `checkOnResize` options are both set to true)
- enabled the `container` property to take a function which is given the image being used as its context
- corrected bug where the default options were being altered after each use of the plugin
