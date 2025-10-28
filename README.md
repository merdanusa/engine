# 🌐 AI Router Engine

An intelligent **multi-model AI router** that dynamically selects the best model (Gemini or OpenRouter) based on the prompt type — **Turkmen language**, **coding**, **science**, or **general** queries.

It automatically detects the content type and routes requests to the most suitable LLM, with built-in **retry logic**, **fallback handling**, and **dual responses** for scientific topics.

---

## 🚀 Features

✅ **Automatic model routing** based on content type
✅ **Supports multiple APIs:** Gemini & OpenRouter
✅ **Turkmen language detection**
✅ **Coding & science keyword detection**
✅ **Dual-response mode** for math/science queries
✅ **Error recovery and fallback model**
✅ Works on **client or server side** (with API key protection on backend)

---

## 🧠 Model Routing Logic

| Type               | Detection                                    | Model Used                                     | Notes                           |
| ------------------ | -------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| **Turkmen text**   | Turkmen letters or words                     | 🟢 `Gemini`                                    | Best for local language content |
| **Coding prompts** | Keywords like “app”, “function”, “API”       | 💻 `deepseek/deepseek-coder`                   | Optimized for code              |
| **Science/math**   | Keywords like “physics”, “equation”, “solve” | ⚛️ `meta-llama/llama-3.1-8b-instruct` + Gemini | Fetches **dual responses**      |
| **General**        | No match                                     | ✨ `Gemini`                                    | Default route                   |
| **Fallback**       | On all failure                               | 🧩 `mistralai/mistral-7b-instruct`             | Reliable backup model           |

---

## 📦 Installation

```bash
# Using npm
npm install dotenv

# or yarn
yarn add dotenv
```

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```bash
OPEN_ROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

If you're using this on **client-side (Vite)**, ensure your keys are prefixed properly:

```bash
VITE_OPEN_ROUTER_API_KEY=your_openrouter_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Then update:

```js
const OPEN_ROUTER_API_KEY = import.meta.env.VITE_OPEN_ROUTER_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

---

## 🧩 Usage Example

```js
import engine from "./engine.js";

(async () => {
  const result1 = await engine("Salam, nähili?"); // Turkmen → Gemini
  console.log(result1);

  const result2 = await engine("Create a todo app in React"); // Coding → DeepSeek
  console.log(result2);

  const result3 = await engine("Explain quantum physics"); // Science → Dual (Gemini + LLaMA)
  console.log(result3);
})();
```

---

## 🔁 Example Output

```js
{
  model: "openrouter-coding",
  response: "// Here's how to build a simple React todo app..."
}
```

For science/math queries:

```js
{
  model: "dual",
  responses: {
    openrouter: "Quantum physics is the study of matter at atomic scales...",
    gemini: "In quantum physics, particles behave both as waves and particles..."
  }
}
```

---

## 🧱 Project Structure

```
.
├── engine.js          # Core logic
├── package.json
├── .env               # API keys
└── README.md
```

---

## 🪄 API Models Used

| Provider       | Model                                   | Purpose                      |
| -------------- | --------------------------------------- | ---------------------------- |
| **Google**     | `gemini-pro`                            | General / Turkmen / fallback |
| **OpenRouter** | `deepseek/deepseek-coder`               | Coding                       |
| **OpenRouter** | `meta-llama/llama-3.1-8b-instruct:free` | Science                      |
| **OpenRouter** | `mistralai/mistral-7b-instruct:free`    | Fallback                     |

---

## ⚠️ Notes

- Avoid exposing your **API keys** in client-side code.
- To safely use on frontend, create a small backend proxy (Node.js or Cloudflare Worker).
- Built-in retries with exponential delay are already implemented.

---

## 🧑‍💻 Author

**Merdan** — Full-stack developer passionate about AI, React, and backend systems.
💬 Telegram: `@merdanusa`
🌐 Project type: _Client/Engine module_

---

Would you like me to make it **developer-doc style (like an NPM package readme)** or **GitHub open-source style (with badges, install section, and license)**?
