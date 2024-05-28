/**
 * Methods for handling templates;
 * this becomes handler
 */
const templatesExtension = {
  templates: {},

  /**
   * Clones a template element, handles variables, actions, and stores references.
   *
   * @param {Object} [params={}] - Parameters for cloning and handling a template.
   * @param {string} params.name - The name of the template to clone.
   * @param {Object} [params.variables] - Optional variables to replace in the cloned template.
   * @param {Element} [params.container] - Optional container element to append the cloned template.
   *
   * @returns {Element|undefined} Returns the cloned template or undefined if container is specified.
   *
   * @description
   * Clones the template specified by `name`, handles variables and actions defined within the template, and optionally appends the cloned template to a container element.
   * If `variables` are provided, replaces corresponding data-variable attributes in the cloned template with the values.
   * Stores variables and references within the cloned template for future access in event handlers.
   * Recursively attaches event listeners to elements and their descendants based on data-action attributes.
   * Stores references within the cloned template using `dom.handleRefs` for access in event handlers.
   */
  cloneTemplate: function ({name, variables, container} = {}) {
    let template = this.templates[name];
    if (typeof template !== "object") {
      console.error(`Trying to clone "${name}" template, but it doesn't exist in ${this.name}`);
    }
    let templateClone = template.cloneNode(true);
    templateClone.classList.add(templateClone.dataset.template);
    templateClone.removeAttribute("data-template");

    // handle variables if any passed
    if (typeof variables === "object") {
      for (let key in variables) {
        let value = variables[key];
        let node = templateClone.querySelector(`[data-variable="${key}"]`);
        if (typeof node === "object")
          node.innerHTML = value;
      }
    }
    templateClone.variables = variables; // store variables to access them later

    dom.handleRefs(templateClone, templateClone); // also store refs for templace, so they can be accessed in event handlers

    dom.handleActionsRecursively({elem: templateClone, handler: this, template: templateClone});

    if (typeof container === "object") {
      container.appendChild(templateClone);
    } else {
      return templateClone;
    }
  }
};

/**
 * Bunch of helper methods to work with dom & automatic collection of references & events handling.
 */
const dom = {
  handlersRegistry: {},

  extend: function (handler, extension) {
    for (let each in extension) {
      handler[each] = extension[each];
    }
  },

  // new main function to register handler once & handle all stuff
  registerHandler: function (handler, name = handler.constructor.name) {
    handler.name = name;
    this.handlersRegistry[name] = handler;
    this.extend(handler, templatesExtension);
    this.handleTemplates(name);
  },

  hasHandler: function (handler) {
    if (typeof handler !== "object") {
      console.error(handler.constructor.name + " is invalid handler. You need to pass object.");
      return false;
    }
    return true;
  },

  

  /**
   * Recursively attaches event listeners to elements and their descendants based on data-action attributes.
   *
   * @param {Object} [params={}] - Parameters for handling actions recursively.
   * @param {Element} params.elem - The root DOM element from which to start handling actions and iterate through descendants.
   * @param {Object} params.handler - The handler object containing action methods.
   * @param {*} params.template - Template reference passed down to event handlers.
   *
   * @description
   * This function iterates over all elements and their descendants starting from `elem`. It looks for `data-action-*` attributes on each element and attaches event listeners based on these attributes.
   * Each `data-action-*` attribute specifies an action to be handled by `handler` when the corresponding event (`click` by default) occurs on the element.
   */
  handleActionsRecursively: function ({elem, handler, template} = {}) {
    for (let key in elem.dataset) {
      if (key.startsWith("action")) {
        console.log(`handle acrions recursively for ${elem.tag}`);
        console.dir(elem);
        const splittedType = key.split("action")[1];
        const type = splittedType == "" ? "click" : splittedType.toLowerCase();
        const action = elem.dataset[key];
        elem.template = template;
        this.handleActionForElem({ 
          elem: elem, 
          handler: handler, 
          action: action, 
          type: type,
          template: template
        });
      }
    }

    Array.from(elem.children).forEach(child => this.handleActionsRecursively({
      elem: child, 
      handler: handler, 
      template: template
    }));
  },

  /**
  * Attaches an event listener to a specified element for a given action method from a handler object.
  *
  * @param {Object} args - The arguments for handling the action.
  * @param {Object} args.handler - The handler object containing the action method.
  * @param {string} args.action - The name of the action method in the handler object to be invoked.
  * @param {Element} args.elem - The DOM element to which the event listener will be attached.
  * @param {string} args.type - The type of event (e.g., "click", "mouseover") to listen for on the element.
  *
  * @throws Will throw an error if the handler is not passed, is not an object, or does not contain the specified action method.
  */
  handleActionForElem: function ({ handler, action, elem, type, template } = {}) {
    try {
      console.log(`Handling ${type} action ${action} for ${elem.tagName} elem`);
      if (typeof handler === "undefined") throw "no handler passed";
      if (typeof handler !== "object") throw "handler is not an object";
      if (typeof handler[action] !== "function") throw `Missing ${handler.name}.${action}() action.`;
      elem.template = template;
      elem.addEventListener(type, handler[action].bind(handler));
      this.handleRef(elem, handler, action);
    } catch (e) {
      console.error("error handling action: " + e);
    }
  },

  /**
   * Main function to handle actions, call in once on start.
   * By default grabs actions from whole document. Override actionsContainer if you don't want this behavior.
   * @param {*} handler 
   * @param {*} actionsContainer 
   */
  handleActions: function (handler, actionsContainer = document) {
    this.handleActionsRecursively({elem: actionsContainer, handler: handler});
  },

  /**
   * Handles reference for single dom element.
   * References are set in [data-ref="refName"], 
   * and are accessed like object.refs.refName
   * @param {*} elem 
   * @param {*} handler - object that stores reference
   * @returns 
   */
  handleRef: function (elem, handler, refName) {
    console.log("handling refs for elem " + elem.innerText);
    console.dir(elem);
    if (!handler.refs)
      handler.refs = {};
    refName ||= elem.dataset.ref;
    handler.refs[refName] = elem;
    console.dir(handler);
  },

  handleRefs: function (handler, container = document) {
    if (!this.hasHandler(handler))
      return;
    const elems = container.querySelectorAll("[data-ref]")
    elems.forEach(elem => {
      this.handleRef(elem, handler);
    });
  },

  // internal function
  // @todo example usage
  handleTemplates: function (handlerName) {
    console.log("trying handle templates");
    const templatesRoots = document.querySelectorAll(`[data-templates-for="${handlerName}"]`);
    templatesRoots.forEach(templatesRoot => {
      let handler = this.handlersRegistry[handlerName];
      if (typeof handler !== "undefined") { // how to check if it's valid handler? proper handler can have properties and methods
        console.log(`trying to handle templates for ${handlerName}`);
        let templates = templatesRoot.querySelectorAll(`[data-template]`);
        templates.forEach(template => {
          console.log("trying to register template " + template.dataset.template);
          if (typeof handler.templates !== "object")
            handler.templates = {};
          handler.templates[template.dataset.template] = template;

        });
      } else {
        console.error(`You're trying to handle templates for ${handlerName}, but there's no handler assiciated with it. Perhaps you forgot for call dom.registerHandler(${handlerName})?`)
      }
    });
  }
};

module.exports = dom;