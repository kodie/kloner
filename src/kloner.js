/*!
  kloner v0.0.2 (https://kloner.js.org)
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
        let data = {} // eslint-disable-line prefer-const

        if (opts.template) {
          const templateContainer = document.createElement(null)

          templateContainer.innerHTML = opts.template

          const templateElement = templateContainer.firstElementChild
          const template = templateElement.cloneNode(true)

          data.template = template
          data.templateIndex = 0

          templateContainer.remove()
        } else {
          const templateElement = container.querySelector(opts.childSelector)

          if (!templateElement) {
            console.warn('[kloner] No template found:', opts.childSelector)
            return
          }

          const template = templateElement.cloneNode(true)

          data.template = template
          data.templateIndex = Array.prototype.indexOf.call(container.children, templateElement)

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

        data.count = count
        data.constCount = count
        container.kloner = opts
        container.klonerData = data

        kloner.initializeTriggers(container)

        if (opts.start) {
          let extraChildren = opts.start

          if (!Array.isArray(extraChildren) && Number.isInteger(parseInt(extraChildren))) {
            extraChildren = Array((parseInt(extraChildren) - container.klonerData.count) || 0).fill({})
          }

          if (Array.isArray(extraChildren)) {
            extraChildren.forEach(childParameters => {
              opts.add(null, { parameters: childParameters })
            })
          }
        }

        if (opts.min && container.klonerData.count < parseInt(opts.min)) {
          for (let k = 0; k < (parseInt(opts.min) - container.klonerData.count); k++) {
            opts.add()
          }
        }

        if (opts.max && container.klonerData.count > parseInt(opts.max)) {
          for (let l = 0; l < (container.klonerData.count - parseInt(opts.max)); l++) {
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
        const count = container.klonerData.count
        const elementCount = opts.updateChildren ? count : container.klonerData.constCount

        if (opts.max && count >= parseInt(opts.max)) {
          return
        }

        const elements = container.querySelectorAll(opts.childSelector)
        const element = container.klonerData.template.cloneNode(true)

        kloner.replaceParameters(element, Object.assign({}, opts.parameters || {}, {
          index: elementCount,
          number: (elementCount + 1)
        }))

        if (opts.beforeAdd && opts.beforeAdd(container, element, opts) === false) {
          return false
        }

        const elementIndex = atIndex ?? elements.length ?? container.klonerData.templateIndex

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

        container.klonerData.count++
        container.klonerData.constCount++

        if (opts.updateChildren) {
          kloner.updateChildren(container)
        }

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
  afterChildUpdate: null,
  afterRemove: null,
  beforeAdd: null,
  beforeChildUpdate: null,
  beforeRemove: null,
  childSelector: '[data-kloner-template], :scope > *',
  containerSelector: '[data-kloner], .kloner',
  max: null,
  min: 0,
  parameters: null,
  start: 0,
  template: null,
  updateChildren: false
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
            if (!addElements[j].klonerData || !addElements[j].klonerData.trigger) {
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

              if (!addElements[j].klonerData) {
                addElements[j].klonerData = {}
              }

              addElements[j].klonerData.trigger = true
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
            if (!removeElements[k].klonerData || !removeElements[k].klonerData.trigger) {
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

              if (!removeElements[k].klonerData) {
                removeElements[k].klonerData = {}
              }

              removeElements[k].klonerData.trigger = true
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
            countElements[l].textContent = container.klonerData.count
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
        const count = container.klonerData.count

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

        container.klonerData.count--

        if (opts.updateChildren) {
          kloner.updateChildren(container)
        }

        kloner.initializeTriggers(container)

        if (opts.afterRemove) {
          opts.afterRemove(container, element, opts)
        }
      })(containers[i])
    }
  }
}

kloner.replaceParameters = (element, parameters) => {
  if (!element.klonerData) {
    element.klonerData = {}
  }

  if (!element.klonerData.initialContent) {
    element.klonerData.initialContent = element.innerHTML
  }

  element.klonerData.parameters = Object.assign({}, element.klonerData.parameters, parameters || {})

  element.innerHTML = element.klonerData.initialContent
    .replaceAll(/\{kloner-(\w+)\}/g, (match, key) => element.klonerData.parameters[key] ?? match)
}

kloner.updateChildren = (containerSelector) => {
  if (!containerSelector) containerSelector = kloner.defaultOptions.containerSelector

  const containers = kloner.getInstances(containerSelector, true)

  if (containers && containers.length) {
    for (let i = 0; i < containers.length; i++) {
      (function (container) {
        const opts = container.kloner
        const elements = container.querySelectorAll(opts.childSelector)

        if (elements) {
          for (let j = 0; j < elements.length; j++) {
            const element = elements[j]

            if (opts.beforeChildUpdate && opts.beforeChildUpdate(container, element, opts) === false) {
              continue
            }

            kloner.replaceParameters(element, {
              index: j,
              number: (j + 1)
            })

            if (opts.afterChildUpdate) {
              opts.afterChildUpdate(container, element, opts)
            }
          }
        }
      })(containers[i])
    }
  }
}

export default kloner
