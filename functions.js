const core = require('photoshop').core;

/**
 * Utility functions to use across various modules.
 */
const functions = {
    generateUniqueId: function () {
        const randomString = Math.random().toString(36).substring(2, 10);
        const timestamp = Date.now().toString(36);
        return randomString + timestamp;
    },

    getLayerByIdAndName: function(id, name, layersGroup) {
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

    findChildLayer: function(rootLayer, childName) {
        for (let i = 0; i < rootLayer.layers.length; i++) {
            let found = rootLayer.layers[i];
            if (found.name == childName) {
                return found;
            }
        }
    },

    getLayerCenter: function(layer) {
        return {
            x: layer.bounds._right - layer.bounds.width / 2,
            y: layer.bounds._bottom - layer.bounds.height / 2
        }
    },

    /**
     * Creates picker for folder and returns Url of picked foler.
     * @param {string} address 
     * @returns folder Url
     */
    async pickFolder(address) {
      const folder = await fs.getFolder();
      const folderUrl =  storage.pathToUrl(folder.nativePath);
      await storage.setPluginData(`${address}.${await storage.getDocumentId()}`, folderUrl);
      return folderUrl;
    }
}

module.exports = functions;