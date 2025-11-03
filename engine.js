import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export default async function engine(prompt) {
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
    console.error("An error occurred during API call:", error);
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
