const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const EVENT_FILE_PATH = path.join(DATA_DIR, "events.json");

async function saveEvent(event) {
    await ensureEventFile();

    const fileContent = await fs.readFile(EVENT_FILE_PATH, "utf-8");
    const events = JSON.parse(fileContent);

    events.push({
        ...event,
        receivedAt: new Date().toISOString(),
    });

    await fs.writeFile(EVENT_FILE_PATH, JSON.stringify(events, null, 2));

    console.log(`[EventService] Event saved: ${event.eventId}`);
}

async function getEvents() {
    await ensureEventFile();

    const fileContent = await fs.readFile(EVENT_FILE_PATH, "utf-8");
    return JSON.parse(fileContent);
}

async function ensureEventFile() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.access(EVENT_FILE_PATH);
    } catch (error) {
        await fs.writeFile(EVENT_FILE_PATH, JSON.stringify([], null, 2));
    }
}

module.exports = {
    saveEvent,
    getEvents,
};
