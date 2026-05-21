import express from "express";
import cors from "cors";
// import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Par
// 
// /se JSON bodies

// In-memory store for recipe requests
const requests = new Map();

// POST route to receive recipe input, create ID and respond with it
app.post("/recipeRequest", (req, res) => {
  console.log("Request received at /recipeStream:", req.body);
  const id = uuidv4();
  const { ingredients, mealType, cuisine, cookingTime, complexity } = req.body;

  requests.set(id, { ingredients, mealType, cuisine, cookingTime, complexity });
  res.json({ id });
});

// SSE Endpoint to stream the recipe by ID
app.get("/recipeStream/:id", async (req, res) => {
  const id = req.params.id;
  const recipeData = requests.get(id);

  if (!recipeData) {
    res.status(404).send("Recipe request not found");
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const prompt = [];
  prompt.push("Generate a recipe that incorporates the following details:");
  prompt.push(`[Ingredients: ${recipeData.ingredients}]`);
  prompt.push(`[Meal Type: ${recipeData.mealType}]`);
  prompt.push(`[Cuisine Preference: ${recipeData.cuisine}]`);
  prompt.push(`[Cooking Time: ${recipeData.cookingTime}]`);
  prompt.push(`[Complexity: ${recipeData.complexity}]`);
  prompt.push(
    "Please provide a detailed recipe, including steps for preparation and cooking. Only use the ingredients provided."
  );
  prompt.push(
    "The recipe should highlight the fresh and vibrant flavors of the ingredients."
  );
  prompt.push(
  "Use clear and straightforward language."
  );
  prompt.push(
    "Also give the recipe a suitable name in its local language based on cuisine preference."
  );

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-4-26b-a4b-it:free",
        messages: [
          { role: "system", content: "You are a helpful recipe generator." },
          { role: "user", content: prompt.join("\n") }
        ],
        stream: false // Can be true if you later want to add streaming support
      }),
    });

    const data = await response.json();
    console.log("OpenRouter response:", JSON.stringify(data, null, 2));
    
    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Invalid response from OpenRouter");
    }

    const fullText = data.choices[0].message.content;
    res.write(`data: ${JSON.stringify({ action: "chunk", chunk: fullText })}\n\n`);
    res.write(`data: ${JSON.stringify({ action: "close" })}\n\n`);
    res.end();

  } catch (error) {
    console.error("Error fetching data from OpenRouter:", error);
    res.write(`data: ${JSON.stringify({ action: "error", message: error.message })}\n\n`);
    res.end();
  }

  // Remove request from memory after streaming
  requests.delete(id);

  req.on("close", () => {
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
