const express = require("express");
const { getEvents } = require("../services/eventService");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const events = await getEvents();

        res.json({
            count: events.length,
            events,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to read events",
            error: error.message,
        });
    }
});

module.exports = router;
