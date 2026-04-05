import express from "express";
import googleTTS from "google-tts-api";
import fetch from "node-fetch";

const app = express();

app.get("/tts", async (req, res) => {
  const text = req.query.text || "你好";

  const url = googleTTS.getAudioUrl(text, {
    lang: "zh",
    slow: false,
  });

  const response = await fetch(url);

  res.setHeader("Content-Type", "audio/mpeg");
  response.body.pipe(res);
});

app.listen(10000, () => {
  console.log("Server chạy tại port 10000");
});