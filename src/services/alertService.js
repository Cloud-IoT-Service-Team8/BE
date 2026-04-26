async function sendAlertIfNeeded(event) {
    const shouldSendAlert = event.eventType === "DELIRIUM_EXIT_RISK" && event.severity === "HIGH";

    if (!shouldSendAlert) {
        console.log("[AlertService] Alert not required");
        return;
    }

    const alertMessage = createAlertMessage(event);

    // TODO: 실제 문자 API 연동 위치
    console.log("[AlertService] SMS alert should be sent");
    console.log(alertMessage);
}

function createAlertMessage(event) {
    return [
        "[스마트 헬스케어 경고]",
        `사용자 ID: ${event.userId}`,
        `이벤트 유형: ${event.eventType}`,
        `위험도: ${event.severity}`,
        `발생 시각: ${event.timestamp}`,
        "섬망 의심 상태에서 RFID 인증 없이 현관문 개방이 감지되었습니다.",
    ].join("\n");
}

module.exports = {
    sendAlertIfNeeded,
};
