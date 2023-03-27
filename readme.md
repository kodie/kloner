# kloner

[![npm package version](https://img.shields.io/npm/v/kloner.svg?style=flat-square)](https://www.npmjs.com/package/kloner)
[![Travis build status](https://img.shields.io/travis/com/kodie/kloner.svg?style=flat-square)](https://travis-ci.com/kodie/kloner)
[![npm package downloads](https://img.shields.io/npm/dt/kloner.svg?style=flat-square)](https://www.npmjs.com/package/kloner)
[![code style](https://img.shields.io/badge/code_style-standard-yellow.svg?style=flat-square)](https://github.com/standard/standard)
[![license](https://img.shields.io/github/license/kodie/kloner.svg?style=flat-square)](license.md)

A tiny, dependency-free JavaScript module for cloning/repeating elements.

**Note: This module is in beta and the documentation is incomplete.**


## Demo

Visit https://kloner.js.org


## Installation


### Manual Download

Download [dist/kloner.min.js](dist/kloner.min.js) and place the following HTML in your page's head element:

```html
<script type="text/javascript" src="dist/kloner.min.js"></script>
```


### CDN (Courtesy of [jsDelivr](https://jsdelivr.com))

Place the following HTML in your page's head element (check to make sure the version in the URL is the version you want):

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/kodie/kloner@0.0.2/dist/kloner.min.js"></script>
```


### [NPM](https://npmjs.com)

```
npm install kloner --save
```

```js
// ES6
import kloner from 'kloner'

// CommonJS
const kloner = require('kloner')
```


### [GPM](https://github.com/itsahappymedium/gpm)

```
gpm install kodie/kloner --save
```


### [Bower](https://bower.io)

```
bower install kodie/kloner --save
```


## Usage

### `kloner` Function

`kloner([containerSelector], [childSelector], [options])`

Initializes kloner.


#### Parameters

 - `containerSelector` (Optional) - 
 
 - `childSelector` (Optional) - 

 - `options` (Optional) - 


#### Examples

```js
window.addEventListener('load', function () {
  kloner()
})
```


#### Options

```js
{
  afterAdd: null,
  afterRemove: null,
  beforeAdd: null,
  beforeRemove: null,
  childSelector: '[data-kloner-template], :scope > *',
  containerSelector: '[data-kloner], .kloner',
  max: null,
  min: 0,
  parameters: null,
  start: 0,
  template: null
}
```


## Related

 - [colorfield](https://github.com/kodie/colorfield) - A tiny, dependency-free, color input field helper that utilizes the native color picker.

 - [filebokz](https://github.com/kodie/filebokz) - A tiny, dependency-free, highly customizable and configurable, easy to use file input with some pretty sweet features.

 - [hashjump](https://github.com/kodie/hashjump) - A tiny, dependency-free JavaScript module for handling anchor links and scrolling elements into view.

 - [minitaur](https://github.com/kodie/minitaur) - The ultimate, dependency-free, easy to use, JavaScript plugin for creating and managing modals.

 - [vanishing-fields](https://github.com/kodie/vanishing-fields) - A dependency-free, easy to use, JavaScript plugin for hiding and showing fields.


## License

MIT. See the [license file](license.md) for more info.