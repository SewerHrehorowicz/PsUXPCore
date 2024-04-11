const fs = require('uxp').storage.localFileSystem;

const persistentDataHandler = {
  datafile: "pluginData.json",

  data: {
    exportedFilesFolder: "location"
  },

  pathToUrl: function (path) {
    let newPath = path.replace(/\\/g, "/");
    return newPath.replace(/^([A-Z]):/i, (match, driveLetter) => `file:/${driveLetter.toLowerCase()}:`);
  },

  dataFolderUrl: async function () {
    const folder = await fs.getDataFolder();
    return this.pathToUrl(folder.nativePath);
  },

  load: function () {

  },

  save: async function () {
    try {
      const file = await fs.createEntryWithUrl(`${this.dataFolderUrl}/${this.datafile}`); // allow overwrite
      await file.write(JSON.stringify(this.data));
    } catch (e) {
      console.error(e);
    }

  }
}

module.exports = persistentDataHandler;