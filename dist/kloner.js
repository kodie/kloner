(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.kloner = factory());
})(this, (function () { 'use strict';

  /*!
    kloner v0.0.1 (https://kloner.js.org)
    by Kodie Grantham (https://kodieg.com)
  */

  var kloner = function kloner(containerSelector, childSelector, options) {
    if (childSelector && childSelector.constructor === Object) {
      options = childSelector;
      childSelector = null;
    }
    if (containerSelector && containerSelector.constructor === Object) {
      options = containerSelector;
      containerSelector = null;
    }
    options = Object.assign({}, kloner.defaultOptions, options || {});
    if (containerSelector) {
      options.containerSelector = containerSelector;
    }
    if (childSelector) {
      options.childSelector = childSelector;
    }
    var containers = kloner.getInstances(options.containerSelector);
    if (containers && containers.length) {
      for (var i = 0; i < containers.length; i++) {
        (function (container) {
          var funcs = {
            add: function add(atIndex, options) {
              return kloner.add(container, atIndex, options);
            },
            remove: function remove(atIndex, options) {
              return kloner.remove(container, atIndex, options);
            }
          };
          var opts = Object.assign({}, options, kloner.getAttributeOptions(container), funcs);
          if (opts.template) {
            var templateContainer = document.createElement(null);
            templateContainer.innerHTML = opts.template;
            var templateElement = templateContainer.firstElementChild;
            var template = templateElement.cloneNode(true);
            container.klonerTemplate = template;
            container.klonerTemplateIndex = 0;
            templateContainer.remove();
          } else {
            var _templateElement = container.querySelector(opts.childSelector);
            if (!_templateElement) {
              console.warn('[kloner] No template found:', opts.childSelector);
              return;
            }
            var _template = _templateElement.cloneNode(true);
            container.klonerTemplate = _template;
            container.klonerTemplateIndex = Array.prototype.indexOf.call(container.children, _templateElement);
            if (_templateElement.matches('[data-kloner-template]')) {
              _templateElement.remove();
            }
          }
          var existingChildren = container.querySelectorAll(opts.childSelector);
          var count = existingChildren.length;
          for (var j = 0; j < count; j++) {
            kloner.replaceParameters(existingChildren[j], Object.assign({}, opts.parameters || {}, {
              index: j,
              number: j + 1
            }));
          }
          container.kloner = opts;
          container.klonerCount = count;
          kloner.initializeTriggers(container);
          if (opts.start) {
            var extraChildren = opts.start;
            if (!Array.isArray(extraChildren) && Number.isInteger(parseInt(extraChildren))) {
              extraChildren = Array(parseInt(extraChildren) - container.klonerCount || 0).fill({});
            }
            if (Array.isArray(extraChildren)) {
              extraChildren.forEach(function (childParameters) {
                opts.add(null, {
                  parameters: childParameters
                });
              });
            }
          }
          if (opts.min && container.klonerCount < parseInt(opts.min)) {
            for (var k = 0; k < parseInt(opts.min) - container.klonerCount; k++) {
              opts.add();
            }
          }
          if (opts.max && container.klonerCount > parseInt(opts.max)) {
            for (var l = 0; l < container.klonerCount - parseInt(opts.max); l++) {
              opts.remove();
            }
          }
        })(containers[i]);
      }
    }
    if (containers.length) {
      if (containers.length === 1) {
        return containers[0];
      }
      return containers;
    }
    return false;
  };
  kloner.add = function (containerSelector, atIndex, options) {
    if (atIndex && atIndex.constructor === Object) {
      options = atIndex;
      atIndex = null;
    }
    if (containerSelector && containerSelector.constructor === Object) {
      options = containerSelector;
      containerSelector = null;
    }
    options = Object.assign({}, kloner.defaultOptions, options || {});
    if (containerSelector) {
      options.containerSelector = containerSelector;
    }
    var containers = kloner.getInstances(options.containerSelector, true);
    if (containers && containers.length) {
      for (var i = 0; i < containers.length; i++) {
        (function (container) {
          var _ref, _atIndex;
          var opts = Object.assign({}, options, options.kloner, kloner.getAttributeOptions(container));
          var count = container.klonerCount;
          if (opts.max && count >= parseInt(opts.max)) {
            return;
          }
          var elements = container.querySelectorAll(opts.childSelector);
          var element = container.klonerTemplate.cloneNode(true);
          kloner.replaceParameters(element, Object.assign({}, opts.parameters || {}, {
            index: count,
            number: count + 1
          }));
          if (opts.beforeAdd && opts.beforeAdd(container, element, opts) === false) {
            return false;
          }
          var elementIndex = (_ref = (_atIndex = atIndex) !== null && _atIndex !== void 0 ? _atIndex : elements.length) !== null && _ref !== void 0 ? _ref : container.klonerTemplateIndex;
          if (elementIndex) {
            if (elementIndex >= container.children.length) {
              container.append(element);
            } else {
              container.insertBefore(element, container.children[elementIndex]);
            }
          } else {
            container.prepend(element);
          }
          container.klonerCount++;
          kloner.initializeTriggers(container);
          if (opts.afterAdd) {
            opts.afterAdd(container, element, opts);
          }
        })(containers[i]);
      }
    }
  };
  kloner.defaultOptions = {
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
  };
  kloner.getAttributeOptions = function (containerSelector) {
    if (!containerSelector) containerSelector = kloner.defaultOptions.containerSelector;
    var container = kloner.getInstances(containerSelector, false, true);
    if (container) {
      var data = Object.assign({}, container.dataset);
      var regexp = /kloner([A-Z].*)/;
      return Object.keys(data).filter(function (key) {
        return regexp.test(key);
      }).reduce(function (obj, key) {
        var match = key.match(regexp);
        var newKey = match[1][0].toLowerCase() + match[1].slice(1);
        obj[newKey] = data[key];
        return obj;
      }, {});
    }
    return {};
  };
  kloner.getInstances = function (elements, verify, single) {
    if (typeof elements === 'string') {
      elements = document.querySelectorAll(elements);
    } else if (elements instanceof HTMLElement) {
      elements = [elements];
    }
    if (verify) {
      var verifiedElements = []; // eslint-disable-line prefer-const

      for (var i = 0; i < elements.length; i++) {
        (function (container) {
          if (!container.kloner) {
            console.warn('Element doesn\'t appear to be a kloner instance:', container);
            return;
          }
          verifiedElements.push(container);
        })(elements[i]);
      }
      return verifiedElements;
    }
    if (elements.length && single) {
      return elements[0];
    }
    return elements;
  };
  kloner.initializeTriggers = function (containerSelector) {
    if (!containerSelector) containerSelector = kloner.defaultOptions.containerSelector;
    var containers = kloner.getInstances(containerSelector, true);
    if (containers && containers.length) {
      for (var i = 0; i < containers.length; i++) {
        (function (container) {
          var addElements = container.querySelectorAll('[data-kloner-add]');
          if (container.id) {
            addElements = Array.prototype.slice.call(addElements).concat(Array.prototype.slice.call(document.querySelectorAll('[data-kloner-add="' + container.id + '"]')));
          }
          if (addElements.length) {
            var _loop = function _loop(j) {
              if (!addElements[j].klonerTrigger) {
                addElements[j].addEventListener('click', function (e) {
                  var atIndex = null;
                  if (!addElements[j].dataset.klonerAdd.length) {
                    var child = addElements[j].closest(container.kloner.childSelector);
                    if (child) {
                      atIndex = Array.prototype.indexOf.call(container.children, child);
                    }
                  }
                  container.kloner.add(atIndex, kloner.getAttributeOptions(addElements[j]));
                });
                addElements[j].klonerTrigger = true;
              }
            };
            for (var j = 0; j < addElements.length; j++) {
              _loop(j);
            }
          }
          var removeElements = container.querySelectorAll('[data-kloner-remove]');
          if (container.id) {
            removeElements = Array.prototype.slice.call(removeElements).concat(Array.prototype.slice.call(document.querySelectorAll('[data-kloner-remove="' + container.id + '"]')));
          }
          if (removeElements.length) {
            var _loop2 = function _loop2(k) {
              if (!removeElements[k].klonerTrigger) {
                removeElements[k].addEventListener('click', function (e) {
                  var atIndex = null;
                  if (!removeElements[k].dataset.klonerRemove.length) {
                    var child = removeElements[k].closest(container.kloner.childSelector);
                    if (child) {
                      atIndex = Array.prototype.indexOf.call(container.children, child);
                    }
                  }
                  container.kloner.remove(atIndex, kloner.getAttributeOptions(removeElements[k]));
                });
                removeElements[k].klonerTrigger = true;
              }
            };
            for (var k = 0; k < removeElements.length; k++) {
              _loop2(k);
            }
          }
          var countElements = container.querySelectorAll('[data-kloner-count]');
          if (container.id) {
            countElements = Array.prototype.slice.call(countElements).concat(Array.prototype.slice.call(document.querySelectorAll('[data-kloner-count="' + container.id + '"]')));
          }
          if (countElements.length) {
            for (var l = 0; l < countElements.length; l++) {
              countElements[l].textContent = container.klonerCount;
            }
          }
        })(containers[i]);
      }
    }
  };
  kloner.remove = function (containerSelector, atIndex, options) {
    if (atIndex && atIndex.constructor === Object) {
      options = atIndex;
      atIndex = null;
    }
    if (containerSelector && containerSelector.constructor === Object) {
      options = containerSelector;
      containerSelector = null;
    }
    options = Object.assign({}, kloner.defaultOptions, options || {});
    if (containerSelector) {
      options.containerSelector = containerSelector;
    }
    var containers = kloner.getInstances(options.containerSelector, true);
    if (containers && containers.length) {
      for (var i = 0; i < containers.length; i++) {
        (function (container) {
          var _atIndex2;
          var opts = Object.assign({}, options, options.kloner, kloner.getAttributeOptions(container));
          var count = container.klonerCount;
          if (count <= 0 || opts.min && count <= parseInt(opts.min)) {
            return;
          }
          var elements = container.querySelectorAll(opts.childSelector);
          var indexLimit = elements.length - 1;
          var elementIndex = (_atIndex2 = atIndex) !== null && _atIndex2 !== void 0 ? _atIndex2 : indexLimit;
          if (elementIndex > indexLimit) {
            elementIndex = indexLimit;
          }
          var element = elements[elementIndex];
          if (opts.beforeRemove && opts.beforeRemove(container, element, opts) === false) {
            return false;
          }
          element.remove();
          container.klonerCount--;
          kloner.initializeTriggers(container);
          if (opts.afterRemove) {
            opts.afterRemove(container, element, opts);
          }
        })(containers[i]);
      }
    }
  };
  kloner.replaceParameters = function (element, parameters) {
    element.innerHTML = element.innerHTML.replaceAll(/\{kloner-(\w+)\}/g, function (match, key) {
      var _parameters$key;
      return (_parameters$key = parameters[key]) !== null && _parameters$key !== void 0 ? _parameters$key : match;
    });
  };

  return kloner;

}));
//# sourceMappingURL=kloner.js.map
