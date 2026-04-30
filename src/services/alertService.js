const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { getDb } = require("../db/sqlite");

const snsClient = new SNSClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
});

async function getGuardian(userId) {
    const db = await getDb();
    return db.get(
        `SELECT phone_number, last_alerted_at FROM guardians WHERE user_id = ?`,
        [userId],
    );
}

async function updateLastAlertedAt(userId) {
    const db = await getDb();
    await db.run(
        `UPDATE guardians SET last_alerted_at = ? WHERE user_id = ?`,
        [new Date().toISOString(), userId],
    );
}

function isInCooldown(lastAlertedAt) {
    if (!lastAlertedAt) return false;
    const cooldownMinutes = parseInt(process.env.ALERT_COOLDOWN_MINUTES || "10", 10);
    const elapsedMinutes = (Date.now() - new Date(lastAlertedAt).getTime()) / 60000;
    return elapsedMinutes < cooldownMinutes;
}

async function sendAlertIfNeeded(event) {
    console.log("[AlertService] sendAlertIfNeeded called");
    console.log("[AlertService] eventType:", event.eventType);
    console.log("[AlertService] severity:", event.severity);
    console.log("[AlertService] ALERT_CHANNEL:", process.env.ALERT_CHANNEL);
    console.log("[AlertService] AWS_REGION:", process.env.AWS_REGION);

    const shouldSendAlert = event.eventType === "DELIRIUM_EXIT_RISK" && event.severity === "HIGH";

    if (!shouldSendAlert) {
        console.log("[AlertService] Alert not required");
        return;
    }

    const guardian = await getGuardian(event.userId);

    if (!guardian) {
        console.warn("[AlertService] No guardian found for userId:", event.userId);
        return;
    }

    // TODO: 테스트 후 쿨다운 복구
    // if (isInCooldown(guardian.last_alerted_at)) {
    //     console.log("[AlertService] Cooldown active, skipping alert for userId:", event.userId);
    //     return;
    // }

    const alertChannel = process.env.ALERT_CHANNEL || "console";

    if (alertChannel !== "aws-sns") {
        console.log("[AlertService] Alert channel is not aws-sns:", alertChannel);
        console.log(createSmsMessage(event));
        await updateLastAlertedAt(event.userId);
        return;
    }

    const sent = await sendSmsByAwsSns(event, guardian.phone_number);
    if (sent) {
        await updateLastAlertedAt(event.userId);
    }
}

async function sendSmsByAwsSns(event, phoneNumber) {
    const message = createSmsMessage(event);
    const maxRetries = parseInt(process.env.ALERT_MAX_RETRIES || "3", 10);

    console.log("[AlertService] Sending SMS via AWS SNS...");
    console.log("[AlertService] PhoneNumber:", phoneNumber);
    console.log("[AlertService] Message:");
    console.log(message);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const command = new PublishCommand({
                PhoneNumber: phoneNumber,
                Message: message,
                MessageAttributes: {
                    "AWS.SNS.SMS.SMSType": {
                        DataType: "String",
                        StringValue: "Transactional",
                    },
                },
            });

            const result = await snsClient.send(command);

            console.log("[AlertService] AWS SNS SMS sent successfully");
            console.log("[AlertService] eventId:", event.eventId);
            console.log("[AlertService] messageId:", result.MessageId);
            return true;
        } catch (error) {
            console.error(`[AlertService] SMS attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
            if (attempt < maxRetries - 1) {
                const delay = 1000 * Math.pow(2, attempt);
                console.log(`[AlertService] Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    console.error("[AlertService] All SMS attempts failed for eventId:", event.eventId);
    return false;
}

function createSmsMessage(event) {
    const sensor = event.processedSensorData || {};

    return [
        "[스마트 헬스케어 경고]",
        "섬망 위험 이벤트가 감지되었습니다.",
        `사용자: ${event.userId}`,
        `장치: ${event.deviceId}`,
        `위험도: ${event.severity}`,
        `시간: ${event.timestamp}`,
        `심박수: ${sensor.heartRate ?? "N/A"}`,
        `현관문 거리: ${sensor.doorDistanceCm ?? "N/A"}cm`,
        "즉시 확인이 필요합니다.",
    ].join("\n");
}

module.exports = {
    sendAlertIfNeeded,
};
