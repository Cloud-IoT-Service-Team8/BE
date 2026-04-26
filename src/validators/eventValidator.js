const VALID_EVENT_TYPES = ["DELIRIUM_SUSPECTED", "ABNORMAL_EXIT", "DELIRIUM_EXIT_RISK"];

const VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

function validateEventPayload(payload) {
    const errors = [];

    if (!payload || typeof payload !== "object") {
        return {
            valid: false,
            errors: ["Payload must be an object"],
        };
    }

    if (!payload.eventId || typeof payload.eventId !== "string") {
        errors.push("eventId is required and must be a string");
    }

    if (!payload.deviceId || typeof payload.deviceId !== "string") {
        errors.push("deviceId is required and must be a string");
    }

    if (!payload.userId || typeof payload.userId !== "string") {
        errors.push("userId is required and must be a string");
    }

    if (!VALID_EVENT_TYPES.includes(payload.eventType)) {
        errors.push(`eventType must be one of: ${VALID_EVENT_TYPES.join(", ")}`);
    }

    if (!VALID_SEVERITIES.includes(payload.severity)) {
        errors.push(`severity must be one of: ${VALID_SEVERITIES.join(", ")}`);
    }

    if (!payload.timestamp || typeof payload.timestamp !== "string") {
        errors.push("timestamp is required and must be a string");
    }

    if (typeof payload.deliriumSuspected !== "boolean") {
        errors.push("deliriumSuspected must be a boolean");
    }

    if (typeof payload.abnormalExit !== "boolean") {
        errors.push("abnormalExit must be a boolean");
    }

    if (typeof payload.doorOpen !== "boolean") {
        errors.push("doorOpen must be a boolean");
    }

    if (typeof payload.rfidDetected !== "boolean") {
        errors.push("rfidDetected must be a boolean");
    }

    if (typeof payload.buzzerActivated !== "boolean") {
        errors.push("buzzerActivated must be a boolean");
    }

    if (!payload.processedSensorData || typeof payload.processedSensorData !== "object") {
        errors.push("processedSensorData is required and must be an object");
    } else {
        const data = payload.processedSensorData;

        if (data.heartRate !== undefined && typeof data.heartRate !== "number") {
            errors.push("processedSensorData.heartRate must be a number");
        }

        if (data.sleepState !== undefined && typeof data.sleepState !== "string") {
            errors.push("processedSensorData.sleepState must be a string");
        }

        if (data.activityLevel !== undefined && typeof data.activityLevel !== "number") {
            errors.push("processedSensorData.activityLevel must be a number");
        }

        if (data.doorDistanceCm !== undefined && typeof data.doorDistanceCm !== "number") {
            errors.push("processedSensorData.doorDistanceCm must be a number");
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

module.exports = {
    validateEventPayload,
};
