import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client. It will automatically use the API key
// from the GEMINI_API_KEY environment variable set by dotenv.
const ai = new GoogleGenAI({});

// The streaming function
export default async function engine(prompt) {
  try {
    // 1. Use generateContentStream instead of generateContent
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      // OPTIONAL: Add configuration to limit max output tokens for speed
      config: {
        maxOutputTokens: 200, // Keep this low to ensure fast Time to Last Token (TTLT)
      },
    });

    // We will build the full response string here
    let fullResponse = "";

    // 2. Iterate through the stream as chunks arrive
    for await (const chunk of responseStream) {
      // Print each token to the console immediately
      process.stdout.write(chunk.text);

      // Concatenate the tokens to return the full text later (optional)
      fullResponse += chunk.text;
    }

    // Print a newline character once streaming is complete for clean output
    console.log();

    // Return the full concatenated response
    return fullResponse;
  } catch (error) {
    console.error("An error occurred during API call:", error);
    // Return an error message
    return "Error generating content.";
  }
}

// To properly await the result, use an async IIFE
(async () => {
  console.log("--- Generating Streamed Response ---");
  // The 'engine' function will print the response chunks as they arrive,
  // and 'result' will capture the final concatenated string.
  const result = await engine(
    "Write a very short, friendly greeting and ask about my day."
  );
  console.log("--- Stream Complete ---");
  // console.log("Final Full Response:", result); // Uncomment to see the captured result
})();
