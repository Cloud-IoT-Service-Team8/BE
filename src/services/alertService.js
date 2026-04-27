const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
});

async function sendAlertIfNeeded(event) {
    console.log("[AlertService] sendAlertIfNeeded called");
    console.log("[AlertService] eventType:", event.eventType);
    console.log("[AlertService] severity:", event.severity);
    console.log("[AlertService] ALERT_CHANNEL:", process.env.ALERT_CHANNEL);
    console.log("[AlertService] AWS_REGION:", process.env.AWS_REGION);
    console.log("[AlertService] SMS_TO:", process.env.SMS_TO);

    const shouldSendAlert = event.eventType === "DELIRIUM_EXIT_RISK" && event.severity === "HIGH";

    if (!shouldSendAlert) {
        console.log("[AlertService] Alert not required");
        return;
    }

    const alertChannel = process.env.ALERT_CHANNEL || "console";

    if (alertChannel !== "aws-sns") {
        console.log("[AlertService] Alert channel is not aws-sns:", alertChannel);
        console.log(createSmsMessage(event));
        return;
    }

    await sendSmsByAwsSns(event);
}

async function sendSmsByAwsSns(event) {
    const phoneNumber = process.env.SMS_TO;

    if (!phoneNumber) {
        console.error("[AlertService] SMS_TO is missing in .env");
        return;
    }

    const message = createSmsMessage(event);

    console.log("[AlertService] Sending SMS by AWS SNS...");
    console.log("[AlertService] PhoneNumber:", phoneNumber);
    console.log("[AlertService] Message:");
    console.log(message);

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
    } catch (error) {
        console.error("[AlertService] AWS SNS SMS send failed");
        console.error("[AlertService] error name:", error.name);
        console.error("[AlertService] error message:", error.message);
        console.error("[AlertService] error:", error);
    }
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
