const { getDb } = require("../db/sqlite");

async function getUserIdByDeviceId(deviceId) {
    const db = await getDb();

    const row = await db.get(
        `SELECT user_id FROM devices WHERE device_id = ?`,
        [deviceId],
    );

    return row?.user_id ?? null;
}

module.exports = {
    getUserIdByDeviceId,
};
