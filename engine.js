import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client.
const ai = new GoogleGenAI({});

// IMPORTANT FIX: Environment variables are loaded as strings.
// We must parse it as an integer.
// Use a default value (e.g., 6000) if it's not set.
const MAX_PROMPT_LENGTH = parseInt(process.env.MAX_PROMPT_LENGTH) || 6000;

export default async function engine(prompt) {
  // Synchronous check is done before the API call for efficiency
  if (prompt.length >= MAX_PROMPT_LENGTH) {
    console.error(
      `Prompt length (${prompt.length}) exceeds the configured limit of ${MAX_PROMPT_LENGTH} characters.`
    );
    // Throw an error with a clear, concise message
    throw new Error(
      `Input prompt is too long. Limit: ${MAX_PROMPT_LENGTH} characters.`
    );
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // Keep the maxOutputTokens low for fastest Time to Last Token (TTLT)
        maxOutputTokens: 200,
      },
    });

    let fullResponse = "";

    // Stream the response tokens and print them instantly
    for await (const chunk of responseStream) {
      process.stdout.write(chunk.text);
      fullResponse += chunk.text;
    }

    console.log(); // Newline after the stream finishes

    return fullResponse;
  } catch (error) {
    // Log a clearer message for errors
    console.error("An API or processing error occurred:", error.message);
    return "Error generating content.";
  }
}

(async () => {
  console.log("--- Generating Streamed Response ---");
  const result = await engine(
    "Write a very short, friendly greeting and ask about my day."
  );
  console.log("--- Stream Complete ---");
  // You can optionally log the result here if needed
  // console.log("Final Result:", result);
})();
