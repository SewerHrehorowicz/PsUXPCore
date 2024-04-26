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
                console.log(`found ${id} ${name}`);
                return layer;
            } else if (layer.kind === "group") {
                let found = this.getLayerByIdAndName(id, name, layer.layers);
                if (found != null)
                    return found;
            }
        }
    }
}

module.exports = functions;