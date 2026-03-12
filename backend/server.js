import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

app.post("/generate", upload.array("screenshots"), async (req, res) => {

  try {

    const prompt = req.body?.prompt;
    const apiKey = req.body?.apiKey;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!apiKey) {
      return res.status(400).json({ error: "API key missing" });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({ error: "Prompt too long" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const parts = [{ text: prompt }];

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        parts.push({
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: file.mimetype
          }
        });
      });
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts
        }
      ]
    });

    const text = result?.response?.text?.() || "";

    res.json({
      text: text || "AI couldn't generate a response."
    });

  } catch (err) {

    console.error("AI ERROR:", err);

    res.status(500).json({
      error: err.message
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});