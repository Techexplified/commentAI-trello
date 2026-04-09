import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// FIXED: Added memoryStorage so file.buffer actually exists
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

// Adds a default route so your browser doesn't say "Cannot GET /"
app.get("/", (req, res) => {
  res.send("Comment AI Backend is running perfectly! 🚀");
});

/*
ENDPOINT
Generate AI response
*/
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

    const genAI = new GoogleGenerativeAI(apiKey);

    // FIXED: Using the correct, stable Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
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
          parts: parts
        }
      ]
    });

    const text = result.response.text();

    res.json({ text });

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