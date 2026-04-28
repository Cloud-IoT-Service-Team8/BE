const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const fs = require("fs");

let db;

async function getDb() {
    if (db) {
        return db;
    }

    const dbPath = process.env.DB_PATH || "./data/healthcare.db";
    const resolvedDbPath = path.resolve(dbPath);
    const dbDir = path.dirname(resolvedDbPath);

    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    db = await open({
        filename: resolvedDbPath,
        driver: sqlite3.Database,
    });

    await db.exec("PRAGMA foreign_keys = ON");
    await initializeTables(db);

    return db;
}

async function initializeTables(db) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            api_key_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            revoked_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );

        CREATE TABLE IF NOT EXISTS guardians (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL UNIQUE,
            device_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            event_timestamp TEXT NOT NULL,

            delirium_suspected INTEGER NOT NULL,
            abnormal_exit INTEGER NOT NULL,
            door_open INTEGER NOT NULL,
            rfid_detected INTEGER NOT NULL,
            buzzer_activated INTEGER NOT NULL,

            heart_rate REAL,
            sleep_state TEXT,
            activity_level REAL,
            door_distance_cm REAL,

            raw_payload TEXT NOT NULL,
            received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

module.exports = {
    getDb,
};
