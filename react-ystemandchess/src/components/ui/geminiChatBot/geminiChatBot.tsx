import React, { useState, FormEvent } from "react";
import { environment } from "../../../environments/environment";
export default function GeminiChat() {
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setResponse("");
    if (prompt.length > 200) {
      return setError("Prompt is too long!");
    }

    try {
      let url = `${
        environment.urls.middlewareURL
      }/geminiApi?prompt=${prompt.toString()}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        response?: string;
        error?: string;
      };

      if (data.error) {
        setError(data.error);
      } else {
        setResponse(data.response ?? "No response from API");
      }
    } catch (err) {
      setError("Failed to fetch response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="text-[var(--color-deep-green)] min-h-screen flex flex-col items-center justify-center p-6 font-['Sora']"
      style={{ backgroundColor: "var(--color-bg-main)" }}
    >
      <h1 className="text-4xl font-bold mb-8">Gemini Chat</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-4"
      >
        <textarea
          className="bg-[var(--color-bg-lightbox)] text-[var(--color-black-solid)] resize-none p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2"
          rows={4}
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--color-green)] text-white px-6 py-3 cursor-pointer transition-all duration-300 ease-in-out hover:bg-[var(--color-green-hover)] m-0 hover:shadow-[4px_4px_0px_var(--color-deep-green)]"
        >
          {loading ? "Generating..." : "Generate Response"}
        </button>

        {error && (
          <p className="text-red-600 font-semibold" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="bg-[var(--color-bg-accent)] text-[var(--color-black-solid)] min-h-[150px] w-full max-w-lg mt-8 p-6 rounded-md shadow-md whitespace-pre-wrap">
        {response || "Your response will appear here..."}
      </div>
    </div>
  );
}
