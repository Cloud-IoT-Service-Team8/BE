const express = require("express");
const cors = require("cors");
const eventRoutes = require("./routes/eventRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "On-Premise Healthcare Server is running",
    });
});

app.use("/api/events", eventRoutes);

module.exports = app;
