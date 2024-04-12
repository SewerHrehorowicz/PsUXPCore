const fs = require('uxp').storage.localFileSystem;

const storage = {
  datafile: "pluginData.json",

  data: {},

  pathToUrl: function (path) {
    let newPath = path.replace(/\\/g, "/");
    return newPath.replace(/^([A-Z]):/i, (match, driveLetter) => `file:/${driveLetter.toLowerCase()}:`);
  },

  load: function () {

  },

  save: async function (data) {
    try {
      const _data = data || this.data;
      const file = await fs.createEntryWithUrl(`plugin-data:/${this.datafile}`, { overwrite: true });
      await file.write(JSON.stringify(_data));
      console.log(`Data saved to: ${file.nativePath}`);
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = storage;