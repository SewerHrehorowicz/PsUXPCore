const fs = require('uxp').storage.localFileSystem;

const storage = {
  pluginDataFile: "pluginData.json",

  pluginData: {},

  documentData: {},

  // @todo get rid of async?
  getOrCreateDocumentId: async function () {
    await this.loadDocumentData();
    if (typeof this.documentData.id === "undefined") {
      const randomString = Math.random().toString(36).substring(2, 10);
      const timestamp = Date.now().toString(36);
      const uniqueId = randomString + timestamp;
      this.documentData.id = uniqueId;
    }
    return this.documentData.id;
  },

  loadDocumentData: async function () {
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
        this.documentData = {};
      } else {
        this.documentData = JSON.parse(meta[0].fileInfo.caption);
      }
    } catch (e) {
      console.error(e);
    }
  },

  saveDocumentData: async function (obj) {
    await this.getOrCreateDocumentId();
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

  /**
   * Allows safely accessing nested keys in pluginData. It returns null if fails to find key at any depth level.
   * @param {*} address - ex "some.nested.keys"
   * @returns 
   */
  getPluginData: function (address) {
    let keys = address.split(".");
    let data = this.pluginData;
    let addrString = "";

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let sep = i == 0 ? "" : ".";
      data = data[key];
      addrString += sep + key;
      if (typeof data == "undefined") {
        console.warn(`No plugin data found for key ${addrString}`);
        return null;
      }
    }
    return data;
  },

  /**
   * Sets plugin data safely, and creates necessary structure if required.
   * Automatically saves data to file.
   * @param {*} address 
   * @param {*} data 
   */
  setPluginData: async function (address, data) {
    let keys = address.split(".");
    let pluginData = this.pluginData;

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (i === keys.length - 1) {
        pluginData[key] = data;
      } else {
        if (typeof pluginData[key] === "undefined") {
          pluginData[key] = {};
        }
        pluginData = pluginData[key];
      }
    }

    await this.savePluginData();
  },

  /**
   * Tries to get plugin data, and if not found, returns default value;
   * @param {*} address 
   * @param {*} fallbackValue 
   * @returns 
   */
  getPluginDataSafe: function (address, fallbackValue) {
    let data = this.getPluginData(address);
    if (data == null)
      return fallbackValue;
    return data;
  }
}

module.exports = storage;