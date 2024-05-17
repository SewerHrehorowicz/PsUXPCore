/**
 * Methods for handling templates
 */
const templatesExtension = {
  templates: {},

  cloneTemplate: function(name, variables, container) {
    let template = this.templates[name];
    if (typeof template !== "object") {
      console.error(`Trying to clone "${name}" template, but it doesn't exist in ${this.name}`);
    }
    let clone = template.cloneNode(true);
    clone.classList.add(clone.dataset.template);
    clone.removeAttribute("data-template");
    
    // handle variables if any passed
    if (typeof variables === "object") {
      for (let key in variables) {
        let value = variables[key];
        let node = clone.querySelector(`[data-variable="${key}"]`);
        if (typeof node === "object")
          node.innerHTML = value;
      }
    }

    let actions = clone.querySelectorAll(`[data-action]`);
    actions.forEach(action => {
      let actionName = action.dataset.action;
      // common function to handle individual action in dom, to be implemented
      console.log(`trying to handle ${actionName} for ${this.name}`);
    })

    if (typeof container === "object") {
      container.appendChild(clone);
    } else {
      return clone;
    }
  }
};

/**
 * Bunch of helper methods to work with dom & automatic collection of references & events handling.
 */
const dom = {
  handlersRegistry: {},

  extend: function(handler, extension) {
    for (let each in extension) {
      handler[each] = extension[each];
    }
  },

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
   * Handles reference for single dom element.
   * References are set in [data-ref="refName"], 
   * and are accessed like object.refs.refName
   * @param {*} elem 
   * @param {*} handler - object that stores reference
   * @returns 
   */
  handleRef: function (elem, handler, refName) {
    if (!handler.refs)
      handler.refs = {};
    refName ||= elem.dataset.ref;
    handler.refs[refName] = elem;
  },

  handleActionType: function (handler, type) {
    try {
      if (!this.hasHandler(handler))
        return;
      const selector = type == "click" ? "[data-action]" : `[data-action-${type}]`;
      const actionType = type == "click" ? "action" : "action" + type[0].toUpperCase() + type.slice(1);
      const elems = document.querySelectorAll(selector);
      elems.forEach(elem => {
        const actionName = elem.dataset[actionType];
        if (typeof handler[actionName] === "undefined") {
          console.error(`No matching function found for ${actionName} in ${handler.constructor.name}`);
        } else {
          if (type == "init") { // init action passes element, not event
            handler[actionName](elem);
          } else {
            elem.addEventListener(type, handler[actionName].bind(handler));
          }

          this.handleRef(elem, handler, actionName);
        }
      });
    } catch (e) {
      console.error("actions handling error " + e);
    }
  },

  handleActions: function (handler) {
    this.handleActionType(handler, "init"); // @todo we probably don't need it
    this.handleActionType(handler, "click");
    this.handleActionType(handler, "input");
  },

  handleRefs: function (handler) {
    if (!this.hasHandler(handler))
      return;
    const elems = document.querySelectorAll("[data-ref]")
    elems.forEach(elem => {
      this.handleRef(elem, handler);
    });
  },

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