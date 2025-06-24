import React, { useState, FormEvent, useRef, useEffect } from "react";
import { environment } from "../../../environments/environment";

interface ChatMessage {
  role: string;
  parts: { text: string }[];
}
export default function GeminiChat() {
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const data = localStorage.getItem("geminiChatHistory");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const saveChatHistory = (history: ChatMessage[]) => {
    localStorage.setItem("geminiChatHistory", JSON.stringify(history));
  };

  //max context: 6 message pairs (12 messages total)
  const MAX_HISTORY_LENGTH = 12;

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
      const userMessage: ChatMessage = {
        role: "user",
        parts: [{ text: prompt }],
      };

      const currHistory = [...chatHistory, userMessage];
      setChatHistory(currHistory);
      saveChatHistory(currHistory);

      // Trim history to the last MAX_HISTORY_LENGTH messages
      const trimmedHistory = currHistory.slice(
        Math.max(currHistory.length - MAX_HISTORY_LENGTH, 0)
      );

      let url = `${environment.urls.middlewareURL}/geminiApi`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          chatHistory: trimmedHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const modelResponse: ChatMessage = {
        role: "model",
        parts: [{ text: data.response }],
      };

      setChatHistory((prev) => {
        const newHistory = [...prev, modelResponse];
        saveChatHistory(newHistory);
        return newHistory;
      });

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
    // var(--color-bg-main)
    <div className="text-[var(--color-deep-green)] flex flex-col w- bg-[]  font-['Sora']">
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 ">
        <textarea
          className="bg-[var(--color-bg-lightbox)] w-full text-[var(--color-black-solid)] resize-none p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2"
          rows={4}
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--color-green)] text-white px-6 py-3 cursor-pointer transition-all rounded-xl duration-300 ease-in-out hover:bg-[var(--color-green-hover)] m-0 hover:shadow-[4px_4px_0px_var(--color-deep-green)]"
        >
          {loading ? "Generating..." : "Generate Response"}
        </button>

        {error && (
          <p className="text-red-600 font-semibold" role="alert">
            {error}
          </p>
        )}
      </form>

      <div
        className="w-full mt-8  space-y-0 overflow-auto h-[400px] min-h-[400px]"
        ref={chatContainerRef}
      >
        <div className="pointer-events-none h-0 text-[transparent] whitespace-pre-wrap">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro,
          temporibus. Facere esse inventore illo fuga, exercitationem voluptatem
          ea illum corrupti. Corrupti inventore fuga beatae omnis veritatis
          atque adipisci numquam aspernatur.
        </div>
        {chatHistory.length === 0 ? (
          <p className="text-[var(--color-green)] italic p-4">
            No messages yet. Start the conversation above!
          </p>
        ) : (
          chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className="border-b border-[var(--color-green)] text-[var(--color-black-solid)] p-4 whitespace-pre-wrap"
            >
              <strong>{msg.role === "user" ? "You" : "Gemini"}:</strong>{" "}
              {msg.parts[0].text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
