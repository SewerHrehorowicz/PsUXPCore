class Events {
  #allEvents = {};

  addEventListener({event, listener}) {
    if (this.#allEvents[event] !== "object") {
      this.#allEvents[event] = { listeners: [] };
    }
    if (!this.#allEvents[event].listeners.includes(listener))
      this.#allEvents[event].listeners.push(listener);
  }

  triggerEvent({event}) {
    console.log("Will try to trigger event " + event)
    for (let _event in this.#allEvents) {
      if (_event == event) {
        for (let listener in this.#allEvents[event].listeners) {
          console.log("triggering listener function for " + event);
          this.#allEvents[event].listeners[listener]();
        }
      }
    }
  }

  //list of events?
  onDocumentChanged = "onDocumentChanged";
}

const events = new Events();

module.exports = events;