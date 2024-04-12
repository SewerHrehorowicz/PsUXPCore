const fs = require('uxp').storage.localFileSystem;

const storage = {
  pluginDataFile: "pluginData.json",

  pluginData: {},

  getOrCreateFolder: async function(path) {
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
      const jsonFile = await fs.createEntryWithUrl(`plugin-data:/${this.pluginDataFile}`, {overwrite: true});
      console.log("is file? " + jsonFile.isFile);
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
  }
}

module.exports = storage;