const express = require("express");
const app = express();

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.get("/tts", async (req, res) => {
    const text = req.query.text;

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(buffer));
});

app.listen(3000, () => {
    console.log("Server chạy tại http://localhost:3000");
});