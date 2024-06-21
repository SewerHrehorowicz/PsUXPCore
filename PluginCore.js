const storage = require("./storage.js");

/**
 * Base class for all plugins. Handles basic initialization and forces implementation of callbacks.
 */
class PluginCore {
  async onDocumentChanged() {
    console.error("onDocumentChanged is not implemented. Use it to populate view with proper data for active document");
  }

  async onPluginInitialized() {
    console.error("onPluginInit is not implemented. Use it to handle events.");
  }

  async onSave() {
    console.error("onSave is not implemented. Use it to do stuff when document is saved.");
  }

  async init() {
    
    // common initialization, always needed
    await storage.loadPluginData();
    require('photoshop').action.addNotificationListener([
      { event: "select" },
      { event: "open" },
      { event: "close" },
      { event: "make" }
    ], this.onDocumentChanged.bind(this));
    require('photoshop').action.addNotificationListener([
      { event: "save" }
    ], this.onSave.bind(this));

    // custon initialization & view refresh afterwards
    await this.onPluginInitialized();
    await this.onDocumentChanged();
  }

  constructor() {
    this.init();
  }
}

module.exports = PluginCore;