const { getDb } = require("../db/sqlite");

async function isDeviceRegistered(deviceId) {
    const db = await getDb();

    const row = await db.get(
        `SELECT device_id FROM devices WHERE device_id = ? AND revoked_at IS NULL`,
        [deviceId],
    );

    return row !== undefined;
}

module.exports = {
    isDeviceRegistered,
};
