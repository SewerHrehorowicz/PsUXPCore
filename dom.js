/**
 * Bunch of helper methods to work with dom & automatic collection of references & events handling.
 */
const dom = {
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
  }
}

module.exports = dom;