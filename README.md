# Image Fit

A tiny script to allow an image to fill its container without altering its aspect ratio, prioritising the centre of the image.

## How It Works

The script compares the aspect ratio of the image, and its container, and applies classes to the image based on whether its height or width would need to be set to fill the space. The script checks if the image has loaded before doing these comparisons.

CSS can then be used from this point. Base CSS stylings are included.

## Usage
The imageFit function can be used with or without jQuery. 

Without jQuery:

```js
window.imageFit({
    // required properties
    img: document.getElementById('example-img'),
    container: document.getElementById('example-container'),

    // optional properties
    objectFit: true, // true by default - adds object-fit class (if supported) instead of 'tall' or 'wide' classes
    useMargins: /MSIE 7|MSIE 8/i.test(navigator.userAgent), // false by default - apply negative marginTop or marginLeft equal to half height or half width of the image
    resize: true, // true by default,
    customResize: true, // true by default - use customResize function (if available), and if resize is true
    checkOnResize: false, //false by default - whether to do image load check on resize. Useful if image src is likely to change. E.g. picture element

    // callbacks
    onCheck: function () {}, // before aspect ratio check and classes are added (fires on initial check and resize event)
    onSet: function () {} // after aspect ratio check and classes are added (fires on initial check and resize event)
});
```
    
With jQuery:

```js
$('#example-img').imageFit({
    // required properties
    container: $('#example-container'),

    // optional properties
    resize: true,
    objectFit: true,
    useMargins: /MSIE 7|MSIE 8/i.test(navigator.userAgent),
    customResize: true,
    checkOnResize: false,

    // callbacks
    onCheck: function () {},
    onSet: function () {}
});
```

The callbacks are called in the context of the selected image, so using `this` will reference the image.

## Classes used
- 'fitted' is added once the image has loaded and a calculation has been made
- 'fitted-object-fit' is applied if objectFit is set to true and object-fit is supported. If this class is added, no further checks will be made, and no further classes will be added
- 'fitted-wide' is applied if the image needs a **width** of 100% to fill the space
- 'fitted-tall' is applied if the image needs a **height** of 100% to fill the space
- 'fitted-margins' is applied if useMargins is set to true (and hence inline margin styling is being used to position the image)
- 'fitted-error' is applied if an error occurs when checking if the image has loaded e.g. the image src returning a 404

## Further Notes
The function expects **one image** and **one container**, if passed more than one (in an array), it will select the first one. If no image or container is passed in, the function will fail and return false.

The `objectFit` property is true by default as, when it is supported, this means that the resize check is not needed. However, it should be noted that applying object-fit may conflict with certain animations. E.g. in current Chrome (41), using object-fit prevents an opacity transition. It also halts the object-fit property from applying until the opacity transition would have ended.

The function will check the image's `currentSrc` property where possible when detecting if the image has loaded, to allow for use of `srcset` or the `<picture>` element. If the image src is likely to change at different window widths (e.g. via the the `<picture>` element), be sure to set `checkOnResize` to true, which will make the script always check that the current image src has loaded.
