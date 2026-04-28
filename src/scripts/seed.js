const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { getDb } = require("../db/sqlite");

const SALT_ROUNDS = 10;

async function seed() {
    const db = await getDb();

    await db.run(`INSERT OR IGNORE INTO users (user_id, name) VALUES (?, ?)`, ["user-001", "홍길동"]);

    const apiKey = crypto.randomBytes(32).toString("hex");
    const apiKeyHash = await bcrypt.hash(apiKey, SALT_ROUNDS);

    await db.run(`INSERT OR IGNORE INTO devices (device_id, user_id, api_key_hash) VALUES (?, ?, ?)`, ["rpi-001", "user-001", apiKeyHash]);

    await db.run(`INSERT INTO guardians (user_id, name, phone_number) VALUES (?, ?, ?)`, ["user-001", "홍보호자", "+821012345678"]);

    console.log("[Seed] 완료");
    console.log("[Seed] device_id : rpi-001");
    console.log("[Seed] API Key   : " + apiKey);
    console.log("[Seed] Pi의 .env에 API_KEY=" + apiKey + " 를 추가하세요.");

    process.exit(0);
}

seed().catch((err) => {
    console.error("[Seed] 오류:", err);
    process.exit(1);
});
