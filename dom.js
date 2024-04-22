const dom = {
  handleActions: function (handler) {
    if (typeof handler !== "object") {
      console.error(handler.constructor.name + " is invalid actions handler. You need to pass object.");
      return;
    }
    const elems = document.querySelectorAll("[data-action]")
    elems.forEach(elem => {
      const funcName = elem.dataset.action;
      if (typeof handler[funcName] === "undefined") {
        console.error(`No matching function found for ${funcName} in ${handler.constructor.name}`);
      } else {
        elem.addEventListener("click", handler[funcName].bind(handler));
      }
    });
  },
  handleRefs: function(handler) {
    if (typeof handler !== "object") {
      console.error(handler.constructor.name + " is invalid references handler. You need to pass object.");
      return;
    }
    const elems = document.querySelectorAll("[data-ref]")
    elems.forEach(elem => {
      if (!handler.refs)
        handler.refs = {};
      handler.refs[elem.dataset.ref] = elem;
    });
  }
}

module.exports = dom;