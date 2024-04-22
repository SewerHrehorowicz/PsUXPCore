const fs = require('uxp').storage.localFileSystem;

const storage = {
  pluginDataFile: "pluginData.json",

  pluginData: {},

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
  }
}

module.exports = storage;