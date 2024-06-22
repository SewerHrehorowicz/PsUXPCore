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

  getLayerById: function (id, layersGroup) {
    let layers = layersGroup || app.activeDocument.layers;
    for (let i = 0; i < layers.length; i++) {
      let layer = layers[i];
      if (layer.id === id) {
        console.log("found layer by id " + id + ", name: " + layer.name + " (" + layer.id + ")");
        console.dir(layer);
        return layer;
      } else if (layer.kind === "group") {
        let found = this.getLayerById(id, layer.layers);
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

  // switch to getting index by path, as it's unique identifier
  getDocumentIndex({id, path}) {
    for (let i = 0; i < app.documents.length; i++) {
      if (typeof path !== "undefined" && app.documents[i].path === path) {
        return i;
      }
      if (typeof id !== "undefined" && app.documents[i].id === id) {
        return i;
      }
    }
    return -1;
  },

  async runModalFunction({ callback, commandName }) {
    await require("photoshop").core.executeAsModal(callback, { "commandName": commandName });
  },

  async runModalFunction2({command, commandName}) {
    async function actionCommands() {
      await action.batchPlay(command, {});
    }
    await this.runModalFunction({ callback: actionCommands, commandName: "closeWithoutSaving" });
  },

  // switch to getting it by path
  async setActiveDocumentById(id) {
    let offset = this.getDocumentIndex({id: app.activeDocument.id}) - this.getDocumentIndex({id: id});
    async function actionCommands() {
      let command = { "_obj": "select", "_target": [{ "_offset": offset, "_ref": "document" }], "documentID": id, "forceNotify": true };
      await action.batchPlay([command], {});
    }
    await this.runModalFunction({ callback: actionCommands, commandName: "setActiveDocumentById" });
  },

  // need both name & id
  async pasteLayerInto({ layerName, containerId }) {
    async function paste() {
      let command = [
        { "_obj": "select", "_target": [{ "_name": layerName, "_ref": "layer" }], "layerID": [containerId], "makeVisible": false },
        { "_obj": "set", "_target": [{ "_property": "selection", "_ref": "channel" }], "to": { "_enum": "ordinal", "_value": "allEnum" } },
        { "_obj": "delete" },
        { "_obj": "paste", "antiAlias": { "_enum": "antiAliasType", "_value": "antiAliasNone" }, "as": { "_class": "pixel" } }
      ];
      try {
        await action.batchPlay(command, {});
      } catch (e) {
        console.error(`error pasting layer ${layerName} into container ${containerId}: ${e}`);
      }

    }
    await this.runModalFunction({ callback: paste, commandName: "paste" });
  },

  async copyRasterizedDuplicate({layerName}) {
    const layerId = this.getLayerId(layerName);
    let command = [
      { "_obj": "select", "_target": [{ "_name": layerName, "_ref": "layer" }], "layerID": [layerId], "makeVisible": false },
      { "_obj": "show", "null": [{ "_enum": "ordinal", "_ref": "layer", "_value": "targetEnum" }] },
      { "_obj": "copyToLayer" },
      { "_obj": "mergeLayersNew" },
      { "_obj": "set", "_target": [{ "_property": "selection", "_ref": "channel" }], "to": { "_enum": "channel", "_ref": "channel", "_value": "transparencyEnum" } },
      { "_obj": "copyEvent", "copyHint": "pixels" }
    ];
    await this.runModalFunction2({ command: command, commandName: "closeWithoutSaving" });
  },

  async translateLayer({ layerName, layerID, top, left }) {
    async function actionCommands() {
      let command = [
        { "_obj": "select", "_target": [{ "_name": layerName, "_ref": "layer" }], "layerID": [layerID], "makeVisible": false },
        { "_obj": "move", "_target": [{ "_enum": "ordinal", "_ref": "layer", "_value": "targetEnum" }], "to": { "_obj": "offset", "horizontal": { "_unit": "pixelsUnit", "_value": left }, "vertical": { "_unit": "pixelsUnit", "_value": top } } }
      ]
      result = await action.batchPlay(command, {});
    }
    await this.runModalFunction({ callback: actionCommands, commandName: "translateActiveLayer" });
  },

  async translateCurrentLayer({ top, left }) {
    console.log(`will try to translate layer ${app.activeDocument.activeLayers[0].name} by top: ${top}, left: ${left}`);
    top = parseInt(top);
    left = parseInt(left);
    async function actionCommands() {
      let command = [
        { "_obj": "move", "_target": [{ "_enum": "ordinal", "_ref": "layer", "_value": "targetEnum" }], "to": { "_obj": "offset", "horizontal": { "_unit": "pixelsUnit", "_value": top }, "vertical": { "_unit": "pixelsUnit", "_value": left } } }
      ]
      result = await action.batchPlay(command, {});
    }
    await this.runModalFunction({ callback: actionCommands, commandName: "translateActiveLayer" });
  },

  async selectlayer({ layerID }) {
    async function selectlayer() {
      let command = [
        { "_obj": "select", "_target": [{ "_name": "stone_24mm", "_ref": "layer" }], "layerID": [layerID], "makeVisible": false }
      ];
      try {
        action.batchPlay(command, {});
      } catch (e) {
        console.error(`error translating ${layerID} layer: ${e}`);
      }

    }
    await this.runModalFunction({ callback: selectlayer, commandName: "selectlayer" });
  },

  async closeWithoutSaving({documentID}) {
    let command = [{ "_obj": "close", "documentID": documentID, "forceNotify": true, "saving": { "_enum": "yesNo", "_value": "no" } }];
    await this.runModalFunction2({ command: command, commandName: "closeWithoutSaving" });
  }
}

module.exports = functions;