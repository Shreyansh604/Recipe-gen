import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:3001",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// In-memory store for recipe requests
const requests = new Map();

// Helper function to call OpenRouter with retries
const fetchWithRetry = async (body, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.ALLOWED_ORIGIN || "http://localhost:3001",
        "X-Title": "Recipe Gen",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    // console.log("OpenRouter raw response:", JSON.stringify(data, null, 2));

    if (data?.error) {
      const msg = data.error.message || JSON.stringify(data.error);
      console.warn(`OpenRouter error: ${msg}`);

      if (response.status === 401 || response.status === 400) {
        throw new Error(`OpenRouter error: ${msg}`);
      }

      const retryAfter = data.error?.metadata?.retry_after_seconds;
      const waitTime = retryAfter ? retryAfter * 1000 : (response.status === 429 ? 5000 : delay);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise((res) => setTimeout(res, waitTime));
      continue;
    }

    if (data?.choices?.[0]?.message?.content) {
      return data;
    }

    console.warn(`Attempt ${i + 1}: no content in response, retrying...`);
    await new Promise((res) => setTimeout(res, delay));
  }
  throw new Error("Failed to get a valid response after multiple attempts.");
};

// Test route — visit /test in browser to verify API key and model work
app.get("/test", async (req, res) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      models: [
        "mistralai/mistral-7b-instruct:free",       // fastest
        "meta-llama/llama-3.3-70b-instruct:free",   // fallback
        "openrouter/free",                          // last resort
      ],
      messages: [{ role: "user", content: "Say hello" }],
    }),
  });
  const data = await response.json();
  res.json(data);
});

app.options("/recipeStream/:id", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "http://localhost:3001");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

// POST route to receive recipe input, create ID and respond with it
app.post("/recipeRequest", (req, res) => {
  console.log("Request received at /recipeRequest:", req.body);
  const id = uuidv4();
  const { ingredients, mealType, cuisine, cookingTime, complexity } = req.body;
  requests.set(id, { ingredients, mealType, cuisine, cookingTime, complexity });
  res.json({ id });
});

// SSE Endpoint to stream the recipe by ID
app.get("/recipeStream/:id", async (req, res) => {
  // CORS headers must be set first before any early returns
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "http://localhost:3001");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const id = req.params.id;
  const recipeData = requests.get(id);

  if (!recipeData) {
    res.write(`data: ${JSON.stringify({ action: "error", message: "Recipe request not found" })}\n\n`);
    res.end();
    return;
  }

  const prompt = [
    "Generate a recipe that incorporates the following details:",
    `[Ingredients: ${recipeData.ingredients}]`,
    `[Meal Type: ${recipeData.mealType}]`,
    `[Cuisine Preference: ${recipeData.cuisine}]`,
    `[Cooking Time: ${recipeData.cookingTime}]`,
    `[Complexity: ${recipeData.complexity}]`,
    "Please provide a detailed recipe, including steps for preparation and cooking. Only use the ingredients provided.",
    "The recipe should highlight the fresh and vibrant flavors of the ingredients.",
    "Use clear and straightforward language.",
    "Also give the recipe a suitable name in its local language based on cuisine preference.",
  ];

  try {
    const data = await fetchWithRetry({
      models: [
        "meta-llama/llama-3.3-70b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "openrouter/free",
      ],
      messages: [
        { role: "system", content: "You are a helpful recipe generator." },
        { role: "user", content: prompt.join("\n") },
      ],
      stream: false,
    });

    const fullText = data.choices[0].message.content;
    res.write(`data: ${JSON.stringify({ action: "chunk", chunk: fullText })}\n\n`);
    res.write(`data: ${JSON.stringify({ action: "close" })}\n\n`);
  } catch (error) {
    console.error("Error fetching data from OpenRouter:", error);
    res.write(`data: ${JSON.stringify({ action: "error", message: error.message })}\n\n`);
  } finally {
    requests.delete(id);
    res.end();
  }

  req.on("close", () => res.end());
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("API key loaded:", !!process.env.OPENROUTER_API_KEY);
  console.log("Allowed origin:", process.env.ALLOWED_ORIGIN || "http://localhost:3001");
});