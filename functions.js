const core = require('photoshop').core;

/**
 * Utility functions to use across various modules.
 */
const functions = {
    generateUniqueId: function () {
        const randomString = Math.random().toString(36).substring(2, 10);
        const timestamp = Date.now().toString(36);
        return randomString + timestamp;
    }

    /*
    async idFromLayer(layer) {
        try {
            return layer.name.split("--id=")[1].split(";")[0];
        } catch (e) {
            console.log("could not retrieve id from layer name, creating one");
            const id = fn.generateUniqueId();
            await core.executeAsModal(() => {
                layer.name = `${layer.name} --id=${id};`;
            }, { commandName: "setLayerId", descriptor: null });
            return this.idFromLayer(layer);
        }
    }
    */
}

module.exports = functions;