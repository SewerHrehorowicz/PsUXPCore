const fs = require('uxp').storage.localFileSystem;
const app = require("photoshop").app;

const storage = {
  pluginDataFile: "pluginData.json",

  pluginData: {},

  documentData: {},

  getDocPath: function () {
    if (app.activeDocument == null)
      return null;
    return app.activeDocument.path;
  },

  /**
   * Returns unique, persistent, transferrable id of document, stored in meta description.
   * It attepmts to load it first, for safety (in case it's called before loadDocumentData).
   * @returns unique string
   */
  getDocumentId: async function () {
    await this.loadDocumentData();
    if (typeof this.documentData.id === "undefined") {
      const randomString = Math.random().toString(36).substring(2, 10);
      const timestamp = Date.now().toString(36);
      const uniqueId = randomString + timestamp;
      this.documentData.id = uniqueId;
      await this.saveDocumentData();
      // await app.activeDocument.save(); need to save document so id is not lost
    }
    return this.documentData.id;
  },

  /**
   * Loads data transferrable with document, stored in meta description.
   * Call it always on select, save, open, close, make 
   */
  loadDocumentData: async function () {
    if (this.getDocPath() == null) {
      this.documentData = {};
    }
    try {
      async function getDescription() {
        let result;
        let psAction = require("photoshop").action;
        let command = [
          { "_obj": "get", "_target": [{ "_property": "fileInfo", "_ref": "property" }, { "_enum": "ordinal", "_ref": "document", "_value": "targetEnum" }] }
        ];
        return result = await psAction.batchPlay(command, {});
      }
      let meta = await require("photoshop").core.executeAsModal(getDescription, { "commandName": "Action Commands" });
      let caption = meta[0].fileInfo.caption;
      if (typeof caption === "undefined") {
        this.documentData = {}; // creates empty object so it's possible to later write data
      } else {
        this.documentData = JSON.parse(meta[0].fileInfo.caption);
        console.log(`${app.activeDocument.name} document data found and loaded`);
      }
    } catch (e) {
      console.dir(e);
    }
  },

  saveDocumentData: async function (obj) {
    let stringObj = JSON.stringify(this.documentData);
    if (typeof obj !== "undefined")
      stringObj = JSON.stringify(obj);
    async function setDescription() {
      let result;
      let psAction = require("photoshop").action;

      let command = [
        { "_obj": "set", "_target": [{ "_property": "fileInfo", "_ref": "property" }, { "_enum": "ordinal", "_ref": "document", "_value": "targetEnum" }], "to": { "_obj": "fileInfo", "caption": stringObj } }
      ];
      result = await psAction.batchPlay(command, {});
    }

    await require("photoshop").core.executeAsModal(setDescription, { "commandName": "Action Commands" });

  },

  getOrCreateFolder: async function (path) {
    try {
      await fs.getEntryWithUrl(path);
    } catch (e) {
      await fs.createEntryWithUrl(path, { type: "folder" })
    }
  },

  pathToUrl: function (path) {
    let newPath = path.replace(/\\/g, "/");
    return newPath.replace(/^([A-Z]):/i, (match, driveLetter) => `file:/${driveLetter.toLowerCase()}:`);
  },

  /**
   * Loads plugin data and should be called only once at start.
   */
  loadPluginData: async function () {
    try {
      const jsonFile = await fs.createEntryWithUrl(`plugin-data:/${this.pluginDataFile}`, { overwrite: true });
      const fileContent = await jsonFile.read();
      this.pluginData = JSON.parse(fileContent);
    } catch (e) {
      if (e.code == -4058) {
        console.log(`${this.pluginDataFile} hasn't beed created yet, ignoring.`);
      } else {
        console.error("loading data error: " + e);
      }
      return;
    }
    console.log(`${this.pluginDataFile} imported into storage.data`);
  },

  savePluginData: async function (data) {
    try {
      const _data = data || this.pluginData;
      const file = await fs.createEntryWithUrl(`plugin-data:/${this.pluginDataFile}`, { overwrite: true });
      await file.write(JSON.stringify(_data));
      console.log(`Data saved to: ${file.nativePath}`);
    } catch (e) {
      console.error("saving data error: " + e);
    }
  },

  getData: function (address, dataObject) {
    let keys = address.split(".");
    let data = dataObject;
    let addrString = "";

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let sep = i == 0 ? "" : ".";
      data = data[key];
      addrString += sep + key;
      if (typeof data == "undefined") {
        console.warn(`No data found for key ${addrString}`);
        return null;
      }
    }
    return data;
  },

  getDataSafe: function (address, dataObject, fallbackValue) {
    let data = this.getData(address, dataObject);
    if (data == null)
      return fallbackValue;
    return data;
  },

  setData: async function (address, data, dataObject) {
    let keys = address.split(".");

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (i === keys.length - 1) {
        dataObject[key] = data;
      } else {
        if (typeof dataObject[key] === "undefined") {
          dataObject[key] = {};
        }
        dataObject = dataObject[key];
      }
    }
  },

  getDocumentData: function (address) {
    return this.getData(address, this.documentData);
  },

  getDocumentDataSafe: function (adress, fallbackValue) {
    return this.getDataSafe(adress, this.documentData, fallbackValue);
  },

  setDocumentData: async function (address, data) {
    this.setData(address, data, this.documentData);
    await this.saveDocumentData();
  },

  /**
   * Allows safely accessing nested keys in pluginData. It returns null if fails to find key at any depth level.
   * @param {*} address - ex "some.nested.keys"
   * @returns 
   */
  getPluginData: function (address) {
    return this.getData(address, this.pluginData);
  },

  /**
   * Sets plugin data safely, and creates necessary structure if required.
   * Automatically saves data to file.
   * @param {*} address 
   * @param {*} data 
   */
  setPluginData: async function (address, data) {
    this.setData(address, data, this.pluginData);
    await this.savePluginData();
  },

  /**
   * Tries to get plugin data, and if not found, returns default value;
   * @param {*} address 
   * @param {*} fallbackValue 
   * @returns 
   */
  getPluginDataSafe: function (address, fallbackValue) {
    return this.getDataSafe(address, this.pluginData, fallbackValue);
  }
}

module.exports = storage;