const mqtt = require("mqtt");
const { validateEventPayload } = require("../validators/eventValidator");
const { saveEvent } = require("../services/eventService");
const { sendAlertIfNeeded } = require("../services/alertService");

function connectMqtt() {
    const brokerUrl = process.env.MQTT_BROKER_URL;
    const subscribeTopic = process.env.MQTT_TOPIC || "healthcare/+/event";

    if (!brokerUrl) {
        console.error("[MQTT] MQTT_BROKER_URL is missing in .env");
        return;
    }

    const clientId = `healthcare-server-${process.pid}`;

    const client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
        keepalive: 60,
        username: process.env.MQTT_USERNAME || undefined,
        password: process.env.MQTT_PASSWORD || undefined,
        rejectUnauthorized: false,
    });

    client.on("connect", () => {
        console.log(`[MQTT] Connected to broker: ${brokerUrl}`);

        client.subscribe(subscribeTopic, { qos: 1 }, (error) => {
            if (error) {
                console.error("[MQTT] Subscribe failed:", error.message);
                return;
            }

            console.log(`[MQTT] Subscribed to topic: ${subscribeTopic}`);
        });
    });

    client.on("message", async (receivedTopic, messageBuffer) => {
        const payloadText = messageBuffer.toString("utf8");

        console.log("\n========== MQTT MESSAGE RECEIVED ==========");
        console.log("[MQTT] Topic:", receivedTopic);
        console.log("[MQTT] Payload length:", payloadText.length);
        console.log("[MQTT] Payload last 10 chars:", payloadText.slice(-10));
        console.log("[MQTT] Raw payload:");
        console.log(payloadText);
        console.log("==========================================\n");

        try {
            const payload = JSON.parse(payloadText);

            const validationResult = validateEventPayload(payload);

            if (!validationResult.valid) {
                console.error("[MQTT] Invalid event payload:", validationResult.errors);
                return;
            }

            const internalEvent = mapToInternalEvent(payload);

            await saveEvent(internalEvent);
            await sendAlertIfNeeded(internalEvent);

            console.log(`[MQTT] Event processed: ${internalEvent.eventId}`);
        } catch (error) {
            console.error("[MQTT] Failed to parse/process message:", error.message);
            console.error("[MQTT] This means the received payload is not valid JSON.");
        }
    });

    client.on("error", (error) => {
        console.error("[MQTT] Error:", error.message);
    });

    client.on("reconnect", () => {
        console.log("[MQTT] Reconnecting...");
    });

    client.on("close", () => {
        console.log("[MQTT] Connection closed");
    });
}

function mapToInternalEvent(payload) {
    const sensor = payload.processedSensorData || {};
    return {
        eventId: payload.eventId,
        deviceId: payload.deviceId,
        userId: payload.userId,
        eventType: payload.eventType,
        severity: payload.severity,
        timestamp: payload.timestamp,
        deliriumSuspected: payload.deliriumSuspected,
        abnormalExit: payload.abnormalExit,
        doorOpen: payload.doorOpen,
        rfidDetected: payload.rfidDetected,
        buzzerActivated: payload.buzzerActivated,
        processedSensorData: {
            heartRate: sensor.heartRate ?? null,
            sleepState: sensor.sleepState ?? null,
            activityLevel: sensor.activityLevel ?? null,
            doorDistanceCm: sensor.doorDistanceCm ?? null,
        },
    };
}

module.exports = {
    connectMqtt,
};
