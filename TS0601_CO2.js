const exposes = require('zigbee-herdsman-converters/lib/exposes');
const tuya = require('zigbee-herdsman-converters/lib/tuya');
const legacy = require('zigbee-herdsman-converters/lib/legacy');
const e = exposes.presets;

const STARTUP_DELAY = 1.0;  // Delay before first report in seconds
const PUBLISH_DELAY = 60.0; // Delay between each data publish in seconds

const legacy_tuya_with_delay = {
    cluster: 'manuSpecificTuya',
    type: ['commandDataReport', 'commandDataResponse'],
    convert: (model, msg, publish, options, meta) => {
        const now = Date.now();  
        
        if (!meta.device.private_cache) {
            meta.device.private_cache = {};
            meta.device.private_next_update = now + STARTUP_DELAY * 1000;
        }

        const changes = legacy.fromZigbee.tuya_air_quality.convert(model, msg, publish, options, meta);
        Object.assign(meta.device.private_cache, changes);

        if (now >= meta.device.private_next_update) {
            const result = { ...meta.device.private_cache };
            meta.device.private_next_update = now + PUBLISH_DELAY * 1000;  // Schedule next publish
            meta.device.private_cache = {};  // Clear cache after publishing
            return result;
        } else {
            return {};  // Do not publish if delay has not passed
        }
    }
};

const definition = {
    fingerprint: tuya.fingerprint('TS0601', ['_TZE200_3ejwxpmu']),
    model: 'TS0601_co2_sensor',
    vendor: 'Tuya',
    description: 'NDIR CO2 sensor with delayed reporting',
    fromZigbee: [legacy_tuya_with_delay],
    toZigbee: [],
    exposes: [e.temperature(), e.humidity(), e.co2()],
};

module.exports = definition;
