const { getDb } = require("../db/sqlite");

async function saveEvent(event) {
    const db = await getDb();
    const sensor = event.processedSensorData || {};

    try {
        await db.run(
            `
            INSERT INTO events (
                event_id,
                device_id,
                user_id,
                event_type,
                severity,
                event_timestamp,

                delirium_suspected,
                abnormal_exit,
                door_open,
                rfid_detected,
                buzzer_activated,

                heart_rate,
                sleep_state,
                activity_level,
                door_distance_cm,

                raw_payload,
                received_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                event.eventId,
                event.deviceId,
                event.userId,
                event.eventType,
                event.severity,
                event.timestamp,

                event.deliriumSuspected ? 1 : 0,
                event.abnormalExit ? 1 : 0,
                event.doorOpen ? 1 : 0,
                event.rfidDetected ? 1 : 0,
                event.buzzerActivated ? 1 : 0,

                sensor.heartRate ?? null,
                sensor.sleepState ?? null,
                sensor.activityLevel ?? null,
                sensor.doorDistanceCm ?? null,

                JSON.stringify(event),
                new Date().toISOString(),
            ],
        );

        console.log(`[EventService] Event saved to SQLite: ${event.eventId}`);
    } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
            console.warn(`[EventService] Duplicate event ignored: ${event.eventId}`);
            return;
        }

        throw error;
    }
}

async function getEvents() {
    const db = await getDb();

    const rows = await db.all(`
        SELECT
            event_id,
            device_id,
            user_id,
            event_type,
            severity,
            event_timestamp,

            delirium_suspected,
            abnormal_exit,
            door_open,
            rfid_detected,
            buzzer_activated,

            heart_rate,
            sleep_state,
            activity_level,
            door_distance_cm,

            received_at
        FROM events
        ORDER BY received_at DESC
    `);

    return rows.map(toEventResponse);
}

function toEventResponse(row) {
    return {
        eventId: row.event_id,
        deviceId: row.device_id,
        userId: row.user_id,
        eventType: row.event_type,
        severity: row.severity,
        timestamp: row.event_timestamp,

        deliriumSuspected: Boolean(row.delirium_suspected),
        abnormalExit: Boolean(row.abnormal_exit),
        doorOpen: Boolean(row.door_open),
        rfidDetected: Boolean(row.rfid_detected),
        buzzerActivated: Boolean(row.buzzer_activated),

        processedSensorData: {
            heartRate: row.heart_rate,
            sleepState: row.sleep_state,
            activityLevel: row.activity_level,
            doorDistanceCm: row.door_distance_cm,
        },

        receivedAt: row.received_at,
    };
}

module.exports = {
    saveEvent,
    getEvents,
};
