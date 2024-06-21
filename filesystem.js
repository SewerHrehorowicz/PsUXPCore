const app = require('photoshop').app;
const storage = require('./storage.js'); // cross-reference!
const fs = require("uxp").storage.localFileSystem;

const filesystem = {
  pathToUrl(path) {
    let newPath = path.replace(/\\/g, "/");
    return newPath.replace(/^([A-Z]):/i, (match, driveLetter) => `file:/${driveLetter.toLowerCase()}:`);
  },

  async entryFromPath(nativePath) {
    try {
      const url = this.pathToUrl(nativePath);
      return await fs.getEntryWithUrl(url);;
    } catch (e) {
      console.error($`error getting entry from ${nativePath}: ${e}`);
    }
  },

  async createSessionToken(nativePath) {
    try {
      const url = this.pathToUrl(nativePath);
      const entry = await fs.getEntryWithUrl(url);
      return fs.createSessionToken(entry);
    } catch (e) {
      console.error("error creating token " + e);
    }
  },

  /**
   * Creates picker for folder and returns Url of picked foler.
   * @param {string} address 
   * @returns folder Url
   */
  async pickFolder(address) {
    const folder = await fs.getFolder();
    const folderUrl = this.pathToUrl(folder.nativePath); // why the fuck it works here but not in 
    console.log("picked filder url? " + folderUrl);
    await storage.setPluginData(`${address}.${await storage.getDocumentId()}`, folderUrl);
    return folderUrl;
  },

  /**
   * Opens document from provided path
   * @param {string} nativePath 
   * @returns document
   */
  async openImage({nativePath, callback = null, args = null}) {
    try {
      const entry = await this.entryFromPath(nativePath);
      async function doOpen() {
        await app.open(entry);
        if (callback)
          await callback(args);
      }
      await require("photoshop").core.executeAsModal(doOpen, { "commandName": "Open File" });      
    } catch (e) {
      console.error("Error opening image: " + e);
    }
  },

  async placeImage(nativePath, layerId = 0) {
    try {
      const token = await this.createSessionToken(nativePath);

      async function openSmartObject() {
        let result;
        let psAction = require("photoshop").action;
        let command = [{
          "ID": 15250,
          "_obj": "placeEvent",
          "freeTransformCenterState": {
            "_enum": "quadCenterState",
            "_value": "QCSAverage"
          },
          "linked": true,
          "null": { "_kind": "local", "_path": token },
          "offset": {
            "_obj": "offset",
            "horizontal": { "_unit": "pixelsUnit", "_value": 0.0 },
            "vertical": { "_unit": "pixelsUnit", "_value": 0.0 }
          },
          "replaceLayer": {
            "_obj": "placeEvent",
            "from": { "_id": layerId, "_ref": "layer" },
            "to": { "_id": layerId, "_ref": "layer" }
            //"from": { "_id": 12811, "_ref": "layer" },
            //"to": { "_id": 15250, "_ref": "layer" }
          }
        }];
        result = await psAction.batchPlay(command, {});
      }

      async function runModalFunction() {
        await require("photoshop").core.executeAsModal(openSmartObject, { "commandName": "Action Commands" });
      }

      await runModalFunction();
    } catch (e) {
      console.error("error placing file " + e);
    }
  },
}

module.exports = filesystem;