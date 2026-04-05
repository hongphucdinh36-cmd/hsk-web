const express = require("express");
const gTTS = require("google-tts-api");
const path = require("path");
const app = express();

// Phục vụ static trực tiếp từ folder hiện tại
app.use(express.static(__dirname));

// Route TTS
app.get("/tts", (req, res) => {
    const text = req.query.text;
    if (!text) return res.send("Missing text");

    const url = gTTS.getAudioUrl(text, {
        lang: "zh",
        slow: false,
    });

    res.redirect(url);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server chạy tại port " + PORT);
});