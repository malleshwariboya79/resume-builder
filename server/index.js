/* eslint-env node */
/* global process */
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;

app.use(express.json());
// Allow requests from the Vite dev server (and other local origins)
app.use(cors());

app.post("/api/generate", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing GEMINI_API_KEY" });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Try to extract a reasonable text result
    let textResult = "";
    if (data?.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate?.content && candidate.content.length > 0) {
        const contentItem = candidate.content.find((c) => c?.text);
        textResult = contentItem?.text || "";
      }
      textResult = textResult || candidate.output || candidate.text || "";
    }

    if (!textResult) {
      textResult = data?.output?.[0]?.content?.[0]?.text || null;
    }

    return res.json({ text: textResult, raw: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error calling Gemini", details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
