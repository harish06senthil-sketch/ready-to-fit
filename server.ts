import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "PulseTrak Fitness Engine is active" });
  });

  // API Route for AI Coach Chat proxy
  app.post("/api/coach/chat", async (req, res) => {
    try {
      const { message, history, context } = req.body;
      
      let ai;
      try {
        ai = getAiClient();
      } catch (keyErr: any) {
        return res.status(401).json({ 
          error: "API_KEY_MISSING", 
          message: "GEMINI_API_KEY is not configured in the developer's Settings > Secrets panel. Please configure it to enable the AI Coach." 
        });
      }

      // Construct system instructions to set the perfect tone for the AI coach
      const systemInstruction = `You are "PulseTrak AI Coach", an energetic, motivating, and highly supportive personal fitness coach.
Your tone is electric, professional, punchy, and deeply encouraging (think synthwave/cyberpunk fitness instructor - passionate but scientific).
Use short, inspiring, actionable advice. Refer to the user's specific context, history, and goals to provide personalized feedback.
Keep responses concise (1-3 small paragraphs), and use clean formatting like bolding, bullet points, or mono tags to make them scannable.
If asked to generate or modify a routine, suggest realistic exercises with names, sets, reps, and warm-ups.
Always remain in character. You are the digital spirit of high-energy fitness.`;

      // Construct contents for Gemini
      const contents: any[] = [];
      
      // Add context if available
      let contextPrompt = "";
      if (context) {
        contextPrompt = `[User Context for personalization]:
- Current Fitness Goals: ${JSON.stringify(context.goals || [])}
- Workout History (last few sessions): ${JSON.stringify(context.history || [])}
- Workout Routines Available: ${JSON.stringify(context.routines || [])}
\n`;
      }

      // Convert history format to Gemini parts
      if (history && history.length > 0) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }

      // Append current user message
      const currentPrompt = contextPrompt 
        ? `${contextPrompt}User: ${message}` 
        : message;

      contents.push({
        role: 'user',
        parts: [{ text: currentPrompt }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.85,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Coach Error:", error);
      res.status(500).json({ error: "API_ERROR", message: error?.message || "Failed to fetch response from AI Coach" });
    }
  });

  // Serve static assets / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
