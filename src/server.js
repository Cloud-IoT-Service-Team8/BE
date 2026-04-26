require("dotenv").config();

const app = require("./app");
const { connectMqtt } = require("./mqtt/mqttClient");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[Express] Server running on port ${PORT}`);
});

connectMqtt();
