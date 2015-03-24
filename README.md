# Image Fit

A tiny script to allow an image to fill its container without altering its aspect ratio, prioritising the centre of the image.

## How It Works

The script compares the aspect ratio of the image, and its container, and applies a class based on whether the image's height or width needs to be set to fill the space (because width or height would be greater than that of the container if it was set to fill the space using the class applied)

CSS can then be used from this point

## Usage
The imageFit function exposed can be used with or without jQuery. 

Note: the function expects **one image** and **one container**, if passed more than one (in an array), it will select the first one.

Without jQuery:

```js
window.imageFit({
    // required properties
    img: document.getElementById('example-img'),
    container: document.getElementById('example-container'),

    // optional properties
    resize: true, // true by default,
    objectFit: true, // true by default - adds object-fit class (if supported) instead of 'tall' or 'wide' classes
    useMargins: /MSIE 7|MSIE 8/i.test(navigator.userAgent), // false by default - apply negative marginTop or marginLeft equal to half height or half width of the image
    customResize: true, // true by default - use customResize function (if available), and if resize is true

    // callbacks
    onCheck: function () {}, // before aspect ratio check and classes are added
    onSet: function () {} // after aspect ratio check and classes are added
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

    // callbacks
    onCheck: function () {},
    onSet: function () {}
});
```

The `objectFit` property is true by default as, when it is supported, this means that the resize check is not needed. However, it should be noted that applying object-fit may conflict with certain animations. E.g. in current Chrome (41), using object-fit prevents an opacity transition. It also halts the object-fit property from applying until the opacity transition would have ended.

#### Variants

The repo includes both a jQuery dependent, and a jQuery independent version. The jQuery independent version includes custom methods for trim (to ensure it is cross-browser), hasClass, addClass, and removeClass methods, it is therefore slightly larger than the jQuery dependent version.