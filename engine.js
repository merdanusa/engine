import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!OPEN_ROUTER_API_KEY) console.error("OPEN_ROUTER_API_KEY is missing");
if (!GEMINI_API_KEY) console.error("GEMINI_API_KEY is missing");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
    "X-Title": process.env.SITE_NAME || "SAAI App",
  },
});

const turkmenChars = /[ÄäŇňÖöŞşÜüÝýŽž]/;
const turkmenWords =
  /\b(salam|sagbol|haýr|gowy|ýagşy|bolýar|näme|bilen|üçin|gerek)\b/i;
const codingKeywords =
  /\b(code|app|function|program|website|api|algorithm|debug|software|develop|create.*app|build.*app|make.*app)\b/i;
const scienceKeywords =
  /\b(chemistry|physics|math|science|equation|formula|theorem|atom|molecule|calculate|solve)\b/i;

const openRouterModels = {
  coding: "qwen/qwen2.5-vl-32b-instruct:free",
  general: "google/gemma-3-27b-it:free",
  science: "meta-llama/llama-4-maverick:free",
  fallback: "mistralai/mistral-7b-instruct:free",
};

async function callGemini(messages, retries = 3) {
  console.log("[GEMINI] Using model: gemini-1.5-flash");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[GEMINI] Attempt ${i + 1}/${retries}`);
      console.log(
        "[GEMINI] History:",
        messages.slice(0, -1).map((m) => m.role + ": " + m.content.slice(0, 50))
      );
      console.log(
        "[GEMINI] Prompt:",
        messages[messages.length - 1].content.slice(0, 100)
      );

      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(
        messages[messages.length - 1].content
      );
      const text = result.response.text();

      console.log("[GEMINI] SUCCESS:", text.slice(0, 200));
      return text;
    } catch (err) {
      console.error(`[GEMINI] Attempt ${i + 1} failed:`, err.message);
      if (err.status === 404)
        console.error("[GEMINI] Model not found. Check model name.");
      if (err.status === 401) console.error("[GEMINI] Invalid API key.");
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function callOpenRouter(messages, modelName, retries = 3) {
  console.log(`[OPENROUTER] Using model: ${modelName}`);
  console.log("[OPENROUTER] API Key exists:", !!OPEN_ROUTER_API_KEY);
  console.log(
    "[OPENROUTER] Referer:",
    process.env.SITE_URL || "http://localhost:3000"
  );

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[OPENROUTER] Attempt ${i + 1}/${retries}`);
      console.log(
        "[OPENROUTER] Messages:",
        messages.map((m) => ({ role: m.role, content: m.content.slice(0, 80) }))
      );

      const completion = await openai.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const content = completion.choices[0].message.content;
      console.log(
        `[OPENROUTER] SUCCESS (${modelName}):`,
        content.slice(0, 200)
      );
      return content;
    } catch (err) {
      console.error(`[OPENROUTER] Attempt ${i + 1} failed:`, err.message);
      if (err.status === 401) console.error("[OPENROUTER] Invalid API key");
      if (err.status === 404)
        console.error("[OPENROUTER] Model not found:", modelName);
      if (err.status === 429) console.error("[OPENROUTER] Rate limited");
      if (err.message.includes("Connection"))
        console.error("[OPENROUTER] Network/DNS issue");
      if (err.response?.data)
        console.error("[OPENROUTER] Response:", err.response.data);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export default async function engine(messages) {
  console.log("\nENGINE START");
  console.log("Messages count:", messages.length);
  console.log(
    "Last message:",
    messages[messages.length - 1]?.content?.slice(0, 150)
  );

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Invalid messages format");
  }

  const prompt = messages[messages.length - 1].content;

  try {
    if (turkmenChars.test(prompt) || turkmenWords.test(prompt)) {
      console.log("ROUTE: Turkmen → Gemini");
      const response = await callGemini(messages);
      return { model: "gemini", response };
    }

    if (codingKeywords.test(prompt)) {
      console.log("ROUTE: Coding → OpenRouter (coding model)");
      const response = await callOpenRouter(messages, openRouterModels.coding);
      return { model: "openrouter-coding", response };
    }

    if (scienceKeywords.test(prompt)) {
      console.log("ROUTE: Science → Dual (OpenRouter + Gemini)");
      const [orRes, gRes] = await Promise.allSettled([
        callOpenRouter(messages, openRouterModels.science),
        callGemini(messages),
      ]);

      const orText =
        orRes.status === "fulfilled"
          ? orRes.value
          : `Error: ${orRes.reason.message}`;
      const gText =
        gRes.status === "fulfilled"
          ? gRes.value
          : `Error: ${gRes.reason.message}`;

      return {
        model: "dual",
        response: `OpenRouter:\n${orText}\n\nGemini:\n${gText}`,
      };
    }

    console.log("ROUTE: General → Gemini");
    const response = await callGemini(messages);
    return { model: "gemini", response };
  } catch (error) {
    console.log("PRIMARY FAILED → Trying fallback");
    try {
      const response = await callOpenRouter(
        messages,
        openRouterModels.fallback
      );
      return { model: "openrouter-fallback", response };
    } catch (fallbackError) {
      console.log("ALL MODELS FAILED");
      return {
        model: "error",
        response: "All models failed. Please try again later.",
        error: fallbackError.message,
      };
    }
  }
}
