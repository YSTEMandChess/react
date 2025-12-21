import React, { useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Move } from "chess.js";
import { environment } from "../../environments/environment";

type Square = `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8}`;

type ChatMessage = {
  role: "user" | "assistant" | "move";
  content: string;
};

const AITutor: React.FC = () => {
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [history, setHistory] = useState<Move[]>([]);
  const [moves, setMoves] = useState<String>("");
  const [message, setMessage] = useState<string>("");

  //chat UI
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  function historyToUci(moves: Move[]): string {
    return moves.map((m) => `${m.from}${m.to}${m.promotion ?? ""}`).join(" ");
  }

  async function sendMoveForAnalysis(
    fenBefore: string,
    fenAfter: string,
    moveUci: string,
    uciHistory: string
  ) {
    

    const response = await fetch(
      `${environment.urls.middlewareURL}/ai-tutor/analysis`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "move",
          fen_before: fenBefore,
          fen_after: fenAfter,
          move: moveUci,
          uciHistory,
          depth: 12,
          chatHistory: chatMessages,
        }),
      }
    );

    const data = await response.json();

    // append LLM explanation to chat
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply },
    ]);

    applyCpuMove(data.bestMove);
  }
  //helper function
  function formatMoveText(color: "w" | "b", from: string, to: string) {
    const side = color === "w" ? "White" : "Black";
    return `${side} moved from ${from} to ${to}`;
  }

  //send chat function
  async function sendChat() {
    if (!chatInput.trim()) return;

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: chatInput },
    ];

    setChatMessages(newMessages);

    const filteredChatHistory = newMessages.filter((m) => m.role !== "move");

    setChatInput("");

    const res = await fetch(
      `${environment.urls.middlewareURL}/ai-tutor/analysis`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "question",
          fen,
          question: chatInput,
          chatHistory: filteredChatHistory,
        }),
      }
    );

    const data = await res.json();

    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply },
    ]);
  }

  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    try {
      const game = chessRef.current;
      const fenBefore = game.fen();

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      // Add move to chat
      setChatMessages((prev) => [
        ...prev,
        {
          role: "move",
          content: formatMoveText(move.color, move.from, move.to),
        },
      ]);

      const fenAfter = game.fen();
      const currentMoveUci = `${move.from}${move.to}${move.promotion ?? ""}`;
      const newHistory = game.history({ verbose: true });
      const uciMoves = historyToUci(newHistory);

      setFen(game.fen());
      setHistory(newHistory);
      setMoves(uciMoves);

      sendMoveForAnalysis(fenBefore, fenAfter, currentMoveUci, uciMoves);

      return true;
    } catch {
      setMessage("Illegal move ❌");
      return false;
    }
  }

  function applyCpuMove(uci: string) {
    const game = chessRef.current;

    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] : undefined;

    const move = game.move({ from, to, promotion });
    // Add move to chat
    setChatMessages((prev) => [
    ...prev,
    {
        role: "move",
        content: formatMoveText(move.color, move.from, move.to),
    },
    ]);

    if (!move) {
        console.error("Invalid CPU move:", uci);
        return;
    }

    // Update UI state
    const newHistory = game.history({ verbose: true });
    const uciMoves = historyToUci(newHistory);

    setFen(game.fen());
    setHistory(newHistory);
    setMoves(uciMoves);
}


  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        flexWrap: "wrap",
        padding: "20px 28px",
      }}
    >
      <div
        style={{
          flex: "1 1 420px",
          minWidth: 280,
          padding: "12px",
        }}
      >
        <Chessboard position={fen} onPieceDrop={onDrop} />
      </div>

      <div
        style={{
          flex: "1 1 420px",
          minWidth: 280,
          border: "1px solid #e3e3e3",
          borderRadius: 12,
          background: "#fbfbfc",
          boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          height: 520,
          padding: "12px",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #e6e6e6",
            fontWeight: 600,
            color: "#222",
            background: "linear-gradient(90deg, #ffffff, #f4f5f7)",
          }}
        >
          AI Tutor
        </div>
        <div
          style={{
            padding: 14,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flex: 1,
          }}
        >
          {chatMessages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              {m.role === "move" ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    background: "#f1f3f5",
                    border: "1px dashed #d1d5db",
                    borderRadius: 8,
                    padding: "6px 10px",
                    alignSelf: "center",
                  }}
                >
                  ♟ MOVE: {m.content}
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: "88%",
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    background:
                      m.role === "user" ? "#1f2937" : "#ffffff",
                    color: m.role === "user" ? "#ffffff" : "#111827",
                    border:
                      m.role === "user"
                        ? "1px solid #1f2937"
                        : "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "10px 12px",
                    lineHeight: 1.35,
                    boxShadow:
                      m.role === "user"
                        ? "0 6px 16px rgba(31,41,55,0.2)"
                        : "0 6px 14px rgba(0,0,0,0.06)",
                  }}
                >
                  {m.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid #e6e6e6",
            padding: 12,
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "#ffffff",
          }}
        >
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Ask the tutor..."
            style={{
              flex: 1,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              outline: "none",
              background: "#f9fafb",
            }}
          />
          <button
            onClick={sendChat}
            style={{
              border: "1px solid #111827",
              background: "#111827",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
