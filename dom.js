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

  handleActions: function (handler) {
    if (!this.hasHandler(handler))
      return;
    const elems = document.querySelectorAll("[data-action]")
    elems.forEach(elem => {
      const funcName = elem.dataset.action;
      if (typeof handler[funcName] === "undefined") {
        console.error(`No matching function found for ${funcName} in ${handler.constructor.name}`);
      } else {
        elem.addEventListener("click", handler[funcName].bind(handler));
        this.handleRef(elem, handler, funcName);
      }
    });
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