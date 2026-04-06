import express from "express";
import googleTTS from "google-tts-api";

const app = express();

// 🔥 QUAN TRỌNG: cho phép load HTML, CSS, JS
app.use(express.static("."));

// ===== ROUTE TRANG CHỦ =====
app.get("/", (req, res) => {
    res.sendFile(new URL("./index.html", import.meta.url).pathname);
});

// ===== TTS =====
app.get("/tts", async (req, res) => {
    const text = req.query.text;

    if (!text) {
        return res.status(400).send("Missing text");
    }

    try {
        const url = googleTTS.getAudioUrl(text, {
            lang: "zh",
            slow: false,
            host: "https://translate.google.com"
        });

        const response = await fetch(url);
        const buffer = await response.arrayBuffer();

        res.set("Content-Type", "audio/mpeg");
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error(err);
        res.status(500).send("TTS error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});