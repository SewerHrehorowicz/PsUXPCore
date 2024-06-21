const fs = require("uxp").storage.localFileSystem;
const app = require('photoshop').app;
const core = require('photoshop').core;
const action = require("photoshop").action;
// !WARNING! - do not require any other parts of PsUXPCore to avoid loop!


/**
 * Utility functions to use across various modules.
 */
const functions = {
  generateUniqueId: function () {
    const randomString = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return randomString + timestamp;
  },

  getLayerByIdAndName: function (id, name, layersGroup) {
    let layers = layersGroup || app.activeDocument.layers;
    for (let i = 0; i < layers.length; i++) {
      let layer = layers[i];
      if (layer.id === id && layer.name === name) {
        return layer;
      } else if (layer.kind === "group") {
        let found = this.getLayerByIdAndName(id, name, layer.layers);
        if (found != null)
          return found;
      }
    }
  },

  getLayerByName(name, layers = app.activeDocument.layers) {
    for (let i = 0; i < layers.length; i++) {
      let layer = layers[i];
      if (layer.name === name) {
        console.log(`Found ${name} layer`);
        return layer;
      } else if (layer.kind === "group") {
        let found = this.getLayerByName(name, layer.layers);
        if (found != null)
          return found;
      }
    }
  },

  getLayerId(name) {
    const layer = this.getLayerByName(name);
    if (typeof layer !== "undefined")
      return layer.id;
  },

  findChildLayer: function (rootLayer, childName) {
    for (let i = 0; i < rootLayer.layers.length; i++) {
      let found = rootLayer.layers[i];
      if (found.name == childName) {
        return found;
      }
    }
  },

  getLayerCenter: function (layer) {
    return {
      x: layer.bounds._right - layer.bounds.width / 2,
      y: layer.bounds._bottom - layer.bounds.height / 2
    }
  },

  getSelectedPixelLayer() {
    if (app.activeDocument.activeLayers.length != 1)
      return null;
    if (app.activeDocument.activeLayers[0].kind === "group")
      return null;
    return app.activeDocument.activeLayers[0];
  },

  getDocumentIndex(id) {
    for (let i = 0; i < app.documents.length; i++) {
      if (app.documents[i].id === id) {
        return i;
      }
    }
    return -1;
  },

  async runModalFunction({ callback, commandName }) {
    await require("photoshop").core.executeAsModal(callback, { "commandName": commandName });
  },

  async setActiveDocumentById(id) {
    let offset = this.getDocumentIndex(app.activeDocument.id) - this.getDocumentIndex(id);
    async function actionCommands() {
      let command = { "_obj": "select", "_target": [{ "_offset": offset, "_ref": "document" }], "documentID": id, "forceNotify": true };
      await action.batchPlay([command], {});
    }
    await this.runModalFunction({ callback: actionCommands, commandName: "setActiveDocumentById" });
  },

  async pasteLayerInto({layerName, containerId}) {
    async function paste() {
      let command = [
        { "_obj": "paste", "antiAlias": { "_enum": "antiAliasType", "_value": "antiAliasNone" }, "as": { "_class": "pixel" } },
        { "_obj": "set", "_target": [{ "_enum": "ordinal", "_ref": "layer", "_value": "targetEnum" }], "to": { "_obj": "layer", "name": layerName } },
        { "_obj": "move", "_target": [{ "_enum": "ordinal", "_ref": "layer", "_value": "targetEnum" }], "adjustment": false, "layerID": [15407], "to": { "_index": 276, "_ref": "layer" }, "version": 5 }
      ];
      await action.batchPlay(command, {});
    }
    await this.runModalFunction({ callback: paste, commandName: "paste" });
  },

  async duplicateAndRasterize(layerName) {
    const layerId = this.getLayerId(layerName);
    async function copyRasterized() {
      console.log(`Will try to duplicate and rasterize ${layerName} layer with id ${layerId}`);
      let command = [
        { "_obj": "select", "_target": [{ "_name": layerName, "_ref": "layer" }], "layerID": [layerId], "makeVisible": false },
        { "_obj": "show", "null": [{ "_enum": "ordinal", "_ref": "layer", "_value": "targetEnum" }] },
        { "_obj": "copyToLayer" },
        { "_obj": "mergeLayersNew" },
        { "_obj": "set", "_target": [{ "_property": "selection", "_ref": "channel" }], "to": { "_enum": "channel", "_ref": "channel", "_value": "transparencyEnum" } },
        { "_obj": "copyEvent", "copyHint": "pixels" }
        // Usuń bieżącego warstwa
        // {"_obj":"delete","_target":[{"_enum":"ordinal","_ref":"layer","_value":"targetEnum"}],"layerID":[16774]}
      ];
      try {
        result = await action.batchPlay(command, {});
      } catch (e) {
        console.error("error duplicating layer " + e);
      }

    }
    await this.runModalFunction({ callback: copyRasterized, commandName: "copyRasterized" });
  }
}

module.exports = functions;