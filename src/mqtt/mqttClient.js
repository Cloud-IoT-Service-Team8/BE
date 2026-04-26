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

    const client = mqtt.connect(brokerUrl, {
        reconnectPeriod: 3000,
        connectTimeout: 5000,
    });

    client.on("connect", () => {
        console.log(`[MQTT] Connected to broker: ${brokerUrl}`);

        client.subscribe(subscribeTopic, (error) => {
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

            await saveEvent(payload);
            await sendAlertIfNeeded(payload);

            console.log(`[MQTT] Event processed: ${payload.eventId}`);
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

module.exports = {
    connectMqtt,
};
