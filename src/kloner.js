/*!
  kloner v0.0.1 (https://kloner.js.org)
  by Kodie Grantham (https://kodieg.com)
*/

const kloner = (containerSelector, childSelector, options) => {
  if (childSelector && childSelector.constructor === Object) {
    options = childSelector
    childSelector = null
  }

  if (containerSelector && containerSelector.constructor === Object) {
    options = containerSelector
    containerSelector = null
  }

  options = Object.assign({}, kloner.defaultOptions, options || {})

  if (containerSelector) {
    options.containerSelector = containerSelector
  }

  if (childSelector) {
    options.childSelector = childSelector
  }

  const containers = kloner.getInstances(options.containerSelector)

  if (containers && containers.length) {
    for (let i = 0; i < containers.length; i++) {
      (function (container) {
        const funcs = {
          add: function (atIndex, options) {
            return kloner.add(container, atIndex, options)
          },
          remove: function (atIndex, options) {
            return kloner.remove(container, atIndex, options)
          }
        }

        const opts = Object.assign({}, options, kloner.getAttributeOptions(container), funcs)

        if (opts.template) {
          const templateContainer = document.createElement(null)

          templateContainer.innerHTML = opts.template

          const templateElement = templateContainer.firstElementChild
          const template = templateElement.cloneNode(true)

          container.klonerTemplate = template
          container.klonerTemplateIndex = 0

          templateContainer.remove()
        } else {
          const templateElement = container.querySelector(opts.childSelector)

          if (!templateElement) {
            console.warn('[kloner] No template found:', opts.childSelector)
            return
          }

          const template = templateElement.cloneNode(true)

          container.klonerTemplate = template
          container.klonerTemplateIndex = Array.prototype.indexOf.call(container.children, templateElement)

          if (templateElement.matches('[data-kloner-template]')) {
            templateElement.remove()
          }
        }

        const existingChildren = container.querySelectorAll(opts.childSelector)
        const count = existingChildren.length

        for (let j = 0; j < count; j++) {
          kloner.replaceParameters(existingChildren[j], Object.assign({}, opts.parameters || {}, {
            index: j,
            number: (j + 1)
          }))
        }

        container.kloner = opts
        container.klonerCount = count

        kloner.initializeTriggers(container)

        if (opts.start) {
          let extraChildren = opts.start

          if (!Array.isArray(extraChildren) && Number.isInteger(parseInt(extraChildren))) {
            extraChildren = Array((parseInt(extraChildren) - container.klonerCount) || 0).fill({})
          }

          if (Array.isArray(extraChildren)) {
            extraChildren.forEach(childParameters => {
              opts.add(null, { parameters: childParameters })
            })
          }
        }

        if (opts.min && container.klonerCount < parseInt(opts.min)) {
          for (let k = 0; k < (parseInt(opts.min) - container.klonerCount); k++) {
            opts.add()
          }
        }

        if (opts.max && container.klonerCount > parseInt(opts.max)) {
          for (let l = 0; l < (container.klonerCount - parseInt(opts.max)); l++) {
            opts.remove()
          }
        }
      })(containers[i])
    }
  }

  if (containers.length) {
    if (containers.length === 1) {
      return containers[0]
    }

    return containers
  }

  return false
}

kloner.add = (containerSelector, atIndex, options) => {
  if (atIndex && atIndex.constructor === Object) {
    options = atIndex
    atIndex = null
  }

  if (containerSelector && containerSelector.constructor === Object) {
    options = containerSelector
    containerSelector = null
  }

  if (!containerSelector) containerSelector = kloner.defaultOptions.containerSelector

  const containers = kloner.getInstances(containerSelector, true)

  if (containers && containers.length) {
    for (let i = 0; i < containers.length; i++) {
      (function (container) {
        const opts = Object.assign({}, container.kloner, kloner.getAttributeOptions(container), options)
        const count = container.klonerCount

        if (opts.max && count >= parseInt(opts.max)) {
          return
        }

        const elements = container.querySelectorAll(opts.childSelector)
        const element = container.klonerTemplate.cloneNode(true)

        kloner.replaceParameters(element, Object.assign({}, opts.parameters || {}, {
          index: count,
          number: (count + 1)
        }))

        if (opts.beforeAdd && opts.beforeAdd(container, element, opts) === false) {
          return false
        }

        const elementIndex = atIndex ?? elements.length ?? container.klonerTemplateIndex

        if (elementIndex) {
          if (elementIndex >= container.children.length) {
            container.append(element)
          } else {
            container.insertBefore(
              element,
              container.children[elementIndex]
            )
          }
        } else {
          container.prepend(element)
        }

        container.klonerCount++

        kloner.initializeTriggers(container)

        if (opts.afterAdd) {
          opts.afterAdd(container, element, opts)
        }
      })(containers[i])
    }
  }
}

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
}

kloner.getAttributeOptions = (containerSelector) => {
  if (!containerSelector) containerSelector = kloner.defaultOptions.containerSelector

  const container = kloner.getInstances(containerSelector, false, true)

  if (container) {
    const data = Object.assign({}, container.dataset)
    const regexp = /kloner([A-Z].*)/

    return Object.keys(data)
      .filter(key => regexp.test(key))
      .reduce((obj, key) => {
        const match = key.match(regexp)
        const newKey = match[1][0].toLowerCase() + match[1].slice(1)
        obj[newKey] = data[key]
        return obj
      }, {})
  }

  return {}
}

kloner.getInstances = (elements, verify, single) => {
  if (typeof elements === 'string') {
    elements = document.querySelectorAll(elements)
  } else if (elements instanceof HTMLElement) {
    elements = [elements]
  }

  if (verify) {
    let verifiedElements = [] // eslint-disable-line prefer-const

    for (let i = 0; i < elements.length; i++) {
      (function (container) {
        if (!container.kloner) {
          console.warn('Element doesn\'t appear to be a kloner instance:', container)
          return
        }

        verifiedElements.push(container)
      })(elements[i])
    }

    return verifiedElements
  }

  if (elements.length && single) {
    return elements[0]
  }

  return elements
}

kloner.initializeTriggers = (containerSelector) => {
  if (!containerSelector) containerSelector = kloner.defaultOptions.containerSelector

  const containers = kloner.getInstances(containerSelector, true)

  if (containers && containers.length) {
    for (let i = 0; i < containers.length; i++) {
      (function (container) {
        let addElements = container.querySelectorAll('[data-kloner-add]')

        if (container.id) {
          addElements = Array.prototype.slice.call(addElements).concat(
            Array.prototype.slice.call(
              document.querySelectorAll('[data-kloner-add="' + container.id + '"]')
            )
          )
        }

        if (addElements.length) {
          for (let j = 0; j < addElements.length; j++) {
            if (!addElements[j].klonerTrigger) {
              addElements[j].addEventListener('click', function (e) {
                let atIndex = null

                if (!addElements[j].dataset.klonerAdd.length) {
                  const child = addElements[j].closest(container.kloner.childSelector)

                  if (child) {
                    atIndex = Array.prototype.indexOf.call(container.children, child)
                  }
                }

                container.kloner.add(atIndex, kloner.getAttributeOptions(addElements[j]))
              })

              addElements[j].klonerTrigger = true
            }
          }
        }

        let removeElements = container.querySelectorAll('[data-kloner-remove]')

        if (container.id) {
          removeElements = Array.prototype.slice.call(removeElements).concat(
            Array.prototype.slice.call(
              document.querySelectorAll('[data-kloner-remove="' + container.id + '"]')
            )
          )
        }

        if (removeElements.length) {
          for (let k = 0; k < removeElements.length; k++) {
            if (!removeElements[k].klonerTrigger) {
              removeElements[k].addEventListener('click', function (e) {
                let atIndex = null

                if (!removeElements[k].dataset.klonerRemove.length) {
                  const child = removeElements[k].closest(container.kloner.childSelector)

                  if (child) {
                    atIndex = Array.prototype.indexOf.call(container.children, child)
                  }
                }

                container.kloner.remove(atIndex, kloner.getAttributeOptions(removeElements[k]))
              })

              removeElements[k].klonerTrigger = true
            }
          }
        }

        let countElements = container.querySelectorAll('[data-kloner-count]')

        if (container.id) {
          countElements = Array.prototype.slice.call(countElements).concat(
            Array.prototype.slice.call(
              document.querySelectorAll('[data-kloner-count="' + container.id + '"]')
            )
          )
        }

        if (countElements.length) {
          for (let l = 0; l < countElements.length; l++) {
            countElements[l].textContent = container.klonerCount
          }
        }
      })(containers[i])
    }
  }
}

kloner.remove = (containerSelector, atIndex, options) => {
  if (atIndex && atIndex.constructor === Object) {
    options = atIndex
    atIndex = null
  }

  if (containerSelector && containerSelector.constructor === Object) {
    options = containerSelector
    containerSelector = null
  }

  if (!containerSelector) containerSelector = kloner.defaultOptions.containerSelector

  const containers = kloner.getInstances(containerSelector, true)

  if (containers && containers.length) {
    for (let i = 0; i < containers.length; i++) {
      (function (container) {
        const opts = Object.assign({}, container.kloner, kloner.getAttributeOptions(container), options)
        const count = container.klonerCount

        if (count <= 0 || (opts.min && count <= parseInt(opts.min))) {
          return
        }

        const elements = container.querySelectorAll(opts.childSelector)
        const indexLimit = (elements.length - 1)
        let elementIndex = atIndex ?? indexLimit

        if (elementIndex > indexLimit) {
          elementIndex = indexLimit
        }

        const element = elements[elementIndex]

        if (opts.beforeRemove && opts.beforeRemove(container, element, opts) === false) {
          return false
        }

        element.remove()

        container.klonerCount--

        kloner.initializeTriggers(container)

        if (opts.afterRemove) {
          opts.afterRemove(container, element, opts)
        }
      })(containers[i])
    }
  }
}

kloner.replaceParameters = (element, parameters) => {
  element.innerHTML = element.innerHTML.replaceAll(/\{kloner-(\w+)\}/g, (match, key) => parameters[key] ?? match)
}

export default kloner
