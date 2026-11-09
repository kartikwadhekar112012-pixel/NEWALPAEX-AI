
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import "dotenv/config";

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN
}));

app.use(express.json({ limit: "20kb" }));

app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  limit: 15
}));

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/health", (req, res) => {
  res.json({
    status: "NEWALPAEX backend online"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages required"
      });
    }

    const valid = messages.slice(-12).every(m =>
      ["user", "assistant"].includes(m.role) &&
      typeof m.content === "string" &&
      m.content.length <= 4000
    );

    if (!valid) {
      return res.status(400).json({
        error: "Invalid messages"
      });
    }

    const response = await ai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        "You are NEWALPAEX-AI, an accurate and helpful AI assistant.",
      input: messages.slice(-12),
      max_output_tokens: 1200
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error("AI error:", error.message);

    res.status(500).json({
      error: "AI service unavailable"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("NEWALPAEX backend running on port " + PORT);
});
