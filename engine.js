import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const MAX_PROMPT_LENGTH = parseInt(process.env.MAX_PROMPT_LENGTH) || 6000;

export default async function engine(prompt) {
  if (prompt.length >= MAX_PROMPT_LENGTH) {
    console.error(
      `Prompt length (${prompt.length}) exceeds the configured limit of ${MAX_PROMPT_LENGTH} characters.`
    );
    throw new Error(
      `Input prompt is too long. Limit: ${MAX_PROMPT_LENGTH} characters.`
    );
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 200,
      },
    });

    let fullResponse = "";

    for await (const chunk of responseStream) {
      process.stdout.write(chunk.text);
      fullResponse += chunk.text;
    }

    console.log();

    return fullResponse;
  } catch (error) {
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
})();
