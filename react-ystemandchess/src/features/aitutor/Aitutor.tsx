import React, { useMemo, useRef, useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Move } from "chess.js";
import { environment } from "../../environments/environment";
import avatarDefault from "../../assets/images/Devin_tutor_default.png";
import avatarThinking from "../../assets/images/Devin_tutor_thinking.png";
import avatarMistake from "../../assets/images/Devin_tutor_mistake.png";


// ------------------------------
//       TYPES DEFINITIONS
//------------------------------
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
  explanation?: {
    moveIndicator?: "Best" | "Good" | "Inaccuracy" | "Mistake" | "Blunder";
    Analysis?: string;
    nextStepHint?: string;
  };
  error?: {
    message: string;
    errorCode?: string;
    retryable?: boolean;
  };
};





const AITutor: React.FC = () => {
  const chessRef = useRef(new Chess());

  // ------------------------------
  //        STATE VARIABLES
  //------------------------------
  const [fen, setFen] = useState(chessRef.current.fen());          //current FEN of the board
  const [history, setHistory] = useState<Move[]>([]);              //history of moves(array of move Objects)
  const [moves, setMoves] = useState<string>("");                  //string of moves in UCI format
  const [message, setMessage] = useState<string>("");              //message to display to the user (error messages)
  //chat UI
  const [chatInput, setChatInput] = useState("");                 //the current text the user has typed in (not sent yet). shows text while typing
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);  //array of chat messages. Contains every message sent or received.
  // Avatar and analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);          //flag to indicate if the AI is analyzing a move or question. Shows loading dots while analyzing.
  // Retry state
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    type: "move" | "question";
    payload: any;
  } | null>(null);

  //------------------------------
  //       DATA FORMAT HELPERS
  //------------------------------
  function historyToUci(moves: Move[]): string {
    "converts the history of moves to a string of moves in UCI format"
    return moves.map((m) => `${m.from}${m.to}${m.promotion ?? ""}`).join(" ");
  }

  function formatMoveText(color: "w" | "b", from: string, to: string) {
    const side = color === "w" ? "White" : "Black";
    return `${side} moved from ${from} to ${to}`;
  }

  //--------------------------------
  //       RENDERING HELPERS
  //--------------------------------
  function getMoveIndicatorStyles(moveIndicator?: "Best" | "Good" | "Inaccuracy" | "Mistake" | "Blunder") {
    "returns the styles for the speech bubble based on the move indicator"
    if (moveIndicator === "Best") {
      return { background: "#ECFDF3", border: "#86EFAC", accent: "#166534" };
    }
    if (moveIndicator === "Good") {
      return { background: "#F0FDF4", border: "#BBF7D0", accent: "#15803D" };
    }
    if (moveIndicator === "Inaccuracy") {
      return { background: "#FFFBEB", border: "#FCD34D", accent: "#92400E" };
    }
    if (moveIndicator === "Mistake") {
      return { background: "#FFF7ED", border: "#FDBA74", accent: "#9A3412" };
    }
    if (moveIndicator === "Blunder") {
      return { background: "#FEF2F2", border: "#FCA5A5", accent: "#991B1B" };
    }
    return { background: "#EFF6FF", border: "#93C5FD", accent: "#1D4ED8" };   //default case: Best move
  }

  function getAvatarImage(moveIndicator?: "Best" | "Good" | "Inaccuracy" | "Mistake" | "Blunder",isAnalyzing: boolean = false): string {
    if (isAnalyzing) {
      return avatarThinking;
    }
    if (
      moveIndicator === "Inaccuracy" ||
      moveIndicator === "Mistake" ||
      moveIndicator === "Blunder"
    ) {
      return avatarMistake;
    }
    return avatarDefault;
  }

    // Loading dots component
    const LoadingDots: React.FC = () => {
      const [dots, setDots] = useState(".");
  
      useEffect(() => {
        const interval = setInterval(() => {
          setDots((prev) => {
            if (prev === ".") return "..";
            if (prev === "..") return "...";
            return ".";
          });
        }, 500);
  
        return () => clearInterval(interval);
      }, []);
  
      return <span>{dots}</span>;
    };


  //--------------------------------
  //       Chat-State HELPER
  //--------------------------------
  function replaceLatestAssistantPlaceholder(prev: ChatMessage[], replacement: ChatMessage) {
    // Find the most recent placeholder (assistant with empty content and no explanation)
    const idxFromEnd = [...prev]
      .reverse()
      .findIndex((m) => m.role === "assistant" && !m.explanation && m.content === "");
  
    if (idxFromEnd === -1) return prev; // nothing to replace
  
    const idx = prev.length - 1 - idxFromEnd
    const updated = [...prev];
    updated[idx] = replacement;
    return updated;
  }

  

  //--------------------------------
  //       ERROR HANDLING HELPERS
  //--------------------------------
  function getErrorMessage(errorCode?: string, fallbackMessage?: string): string {
    if (!errorCode) {
      return fallbackMessage || "An error occurred. Please try again.";
    }

    const errorMessages: Record<string, string> = {
      OPENAI_INVALID_RESPONSE: "Received an unexpected response. Trying again...",
      OPENAI_TIMEOUT: "The analysis is taking longer than expected. Please try again.",
      OPENAI_RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
      OPENAI_API_ERROR: "Unable to analyze the move. Please try again or make another move.",
      STOCKFISH_TIMEOUT: "The engine analysis timed out. Please try again.",
      STOCKFISH_NETWORK_ERROR: "Connection issue with the chess engine. Please check your internet and try again.",
      STOCKFISH_PARSE_ERROR: "Failed to parse engine response. Please try again.",
      VALIDATION_ERROR: "Invalid request. Please check your input and try again.",
      NETWORK_ERROR: "Connection issue. Please check your internet and try again.",
      TIMEOUT: "Request timed out. Please try again.",
      INTERNAL_ERROR: "Server error. Please try again later.",
    };

    return errorMessages[errorCode] || fallbackMessage || "An error occurred. Please try again.";
  }

  //--------------------------------
  //       APP BEHAVIOR HELPERS
  //--------------------------------  
  async function sendMoveForAnalysis(
    fenBefore: string,
    fenAfter: string,
    moveUci: string,
    uciHistory: string,
    chatHistory: ChatMessage[]
  ) {
    // Set analyzing state
    setIsAnalyzing(true);

    // Add placeholder message for loading state
    const nextChatHistory = [
      ...chatHistory,
      {
        role: "assistant" as const,
        content: "",
        explanation: undefined,
      },
    ];
    setChatMessages(nextChatHistory);

    // Helper to ensure exactly one slash in URL
    const baseUrl = environment.urls.chessServer.replace(/\/$/, "");
    const apiUrl = `${baseUrl}/api/analyze`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "move",
          fen_before: fenBefore,
          fen_after: fenAfter,
          move: moveUci,
          uciHistory,
          depth: 15,
          chatHistory: nextChatHistory,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        const errorMessage = getErrorMessage(data.errorCode, data.error);
        setIsAnalyzing(false);
        
        // Store the failed request for retry
        if (data.retryable) {
          setLastFailedRequest({
            type: "move",
            payload: {
              fen_before: fenBefore,
              fen_after: fenAfter,
              move: moveUci,
              uciHistory,
              depth: 15,
              chatHistory: nextChatHistory,
            },
          });
        }

        // Replace last message (placeholder) with error
        setChatMessages((prev) =>
          replaceLatestAssistantPlaceholder(prev, {
            role: "assistant",
            content: errorMessage,
            error: {
              message: errorMessage,
              errorCode: data.errorCode,
              retryable: data.retryable || false,
            },
          })
        );
        return;
      }

      let explanation: ChatMessage["explanation"] | undefined;
      try {
        if (typeof data.explanation === "string") {
          explanation = JSON.parse(
            data.explanation
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim()
          );
        } else if (data.explanation && typeof data.explanation === "object") {
          explanation = data.explanation;
        }
      } catch (error) {
        console.error("Failed to parse explanation:", error);
      }
      console.log(explanation);
      setIsAnalyzing(false);

      setChatMessages((prev) =>
        replaceLatestAssistantPlaceholder(prev, {
          role: "assistant",
          content: explanation?.Analysis ?? "Analysis ready.",
          explanation,
        })
      );

      if (data.bestMove) {
        applyCpuMove(data.bestMove);
      }


    } catch (error) {
      setIsAnalyzing(false);
      console.error("Network error:", error);
      
      const errorMessage = getErrorMessage("NETWORK_ERROR", "Network error: Failed to analyze move.");
      
      // Store the failed request for retry
      setLastFailedRequest({
        type: "move",
        payload: {
          fen_before: fenBefore,
          fen_after: fenAfter,
          move: moveUci,
          uciHistory,
          depth: 15,
          chatHistory: nextChatHistory,
        },
      });
    
      setChatMessages((prev) =>
        replaceLatestAssistantPlaceholder(prev, {
          role: "assistant",
          content: errorMessage,
          error: {
            message: errorMessage,
            errorCode: "NETWORK_ERROR",
            retryable: true,
          },
        })
      );
    }
  }
  


  //send chat function
  async function sendChat() {
    if (!chatInput.trim()) return;

    const questionText = chatInput;
    setChatInput("");

    // Build updated messages with user question
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user" as const, content: questionText },
    ];
    setChatMessages(newMessages);

    // Set analyzing state for question
    setIsAnalyzing(true);

    // Add placeholder message for loading state
    const nextChatHistory = [
      ...newMessages,
      {
        role: "assistant" as const,
        content: "",
        explanation: undefined,
      },
    ];
    setChatMessages(nextChatHistory);

    // Helper to ensure exactly one slash in URL
    const baseUrl = environment.urls.chessServer.replace(/\/$/, "");
    const apiUrl = `${baseUrl}/api/analyze`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "question",
          fen,
          question: questionText,
          chatHistory: nextChatHistory,
        }),
      });

      const data = await res.json();

      // Reset analyzing state
      setIsAnalyzing(false);

      if (!data.success) {
        const errorMessage = getErrorMessage(data.errorCode, data.error);
        
        // Store the failed request for retry
        if (data.retryable) {
          setLastFailedRequest({
            type: "question",
            payload: {
              fen,
              question: questionText,
              chatHistory: nextChatHistory,
            },
          });
        }

        // Replace placeholder message with error
        setChatMessages((prev) =>
          replaceLatestAssistantPlaceholder(prev, {
            role: "assistant",
            content: errorMessage,
            error: {
              message: errorMessage,
              errorCode: data.errorCode,
              retryable: data.retryable || false,
            },
          })
        );
        return;
      }

      // Replace placeholder message with actual answer
      setChatMessages((prev) =>
        replaceLatestAssistantPlaceholder(prev, {
          role: "assistant",
          content: data.answer ?? "No answer returned.",
        })
      );
      
    } catch (error) {
      setIsAnalyzing(false);
      console.error("Network error:", error);
      
      const errorMessage = getErrorMessage("NETWORK_ERROR", "Network error: Failed to get answer.");
      
      // Store the failed request for retry
      setLastFailedRequest({
        type: "question",
        payload: {
          fen,
          question: questionText,
          chatHistory: nextChatHistory,
        },
      });
      
      // Replace placeholder message with error
      setChatMessages((prev) =>
        replaceLatestAssistantPlaceholder(prev, {
          role: "assistant",
          content: errorMessage,
          error: {
            message: errorMessage,
            errorCode: "NETWORK_ERROR",
            retryable: true,
          },
        })
      );
    }
  }

  // Retry function
  async function retryLastFailedRequest() {
    if (!lastFailedRequest) return;

    setIsAnalyzing(true);

    // Add placeholder message for loading state
    const nextChatHistory = [
      ...chatMessages,
      {
        role: "assistant" as const,
        content: "",
        explanation: undefined,
      },
    ];
    setChatMessages(nextChatHistory);

    // Helper to ensure exactly one slash in URL
    const baseUrl = environment.urls.chessServer.replace(/\/$/, "");
    const apiUrl = `${baseUrl}/api/analyze`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: lastFailedRequest.type,
          ...lastFailedRequest.payload,
          chatHistory: nextChatHistory,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        const errorMessage = getErrorMessage(data.errorCode, data.error);
        setIsAnalyzing(false);
        
        // Keep the failed request for another retry attempt if retryable
        if (!data.retryable) {
          setLastFailedRequest(null);
        }

        setChatMessages((prev) =>
          replaceLatestAssistantPlaceholder(prev, {
            role: "assistant",
            content: errorMessage,
            error: {
              message: errorMessage,
              errorCode: data.errorCode,
              retryable: data.retryable || false,
            },
          })
        );
        return;
      }

      // Handle successful response
      if (lastFailedRequest.type === "move") {
        let explanation: ChatMessage["explanation"] | undefined;
        try {
          if (typeof data.explanation === "string") {
            explanation = JSON.parse(data.explanation);
          } else if (data.explanation && typeof data.explanation === "object") {
            explanation = data.explanation;
          }
        } catch (error) {
          console.error("Failed to parse explanation:", error);
        }

        setIsAnalyzing(false);
        setLastFailedRequest(null);

        setChatMessages((prev) =>
          replaceLatestAssistantPlaceholder(prev, {
            role: "assistant",
            content: explanation?.Analysis ?? "Analysis ready.",
            explanation,
          })
        );

        if (data.bestMove) {
          applyCpuMove(data.bestMove);
        }
      } else {
        setIsAnalyzing(false);
        setLastFailedRequest(null);

        setChatMessages((prev) =>
          replaceLatestAssistantPlaceholder(prev, {
            role: "assistant",
            content: data.answer ?? "No answer returned.",
          })
        );
      }
    } catch (error) {
      setIsAnalyzing(false);
      console.error("Network error:", error);
      
      const errorMessage = getErrorMessage("NETWORK_ERROR", "Network error: Please try again.");
      
      setChatMessages((prev) =>
        replaceLatestAssistantPlaceholder(prev, {
          role: "assistant",
          content: errorMessage,
          error: {
            message: errorMessage,
            errorCode: "NETWORK_ERROR",
            retryable: true,
          },
        })
      );
    }
  }



  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    if (isAnalyzing) return false; // Don't allow moves while thinking
    try {
      const game = chessRef.current;
      const fenBefore = game.fen();

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      const fenAfter = game.fen();
      const currentMoveUci = `${move.from}${move.to}${move.promotion ?? ""}`;
      const newHistory = game.history({ verbose: true });
      const uciMoves = historyToUci(newHistory);

      // Build the updated chat history with the move message (synchronously)
      const moveMsg: ChatMessage = {
        role: "move" as const,
        content: formatMoveText(move.color, move.from, move.to),
      };

      const nextChatHistory = [...chatMessages, moveMsg];

      // Update chat UI immediately
      setChatMessages(nextChatHistory);

      setFen(game.fen());
      setHistory(newHistory);
      setMoves(uciMoves);

      // Pass the updated chatHistory to sendMoveForAnalysis
      sendMoveForAnalysis(
        fenBefore,
        fenAfter,
        currentMoveUci,
        uciMoves,
        nextChatHistory
      );

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

    if (!move) {
      console.error("Invalid CPU move:", uci);
      return;
    }

    // Add move to chat
    setChatMessages((prev) => [
      ...prev,
      {
        role: "move",
        content: formatMoveText(move.color, move.from, move.to),
      },
    ]);

    // Update UI state
    const newHistory = game.history({ verbose: true });
    const uciMoves = historyToUci(newHistory);

    setFen(game.fen());
    setHistory(newHistory);
    setMoves(uciMoves);
  }

  
  // ------------------------------
  //       RENDER FUNCTION
  //------------------------------
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
              ) : m.role === "assistant" && m.error ? (
                // Error message with retry button - check this BEFORE regular assistant messages
                <div
                  style={{
                    maxWidth: "88%",
                    alignSelf: "flex-start",
                    background: "#FEF2F2",
                    color: "#991B1B",
                    border: "1px solid #FCA5A5",
                    borderRadius: 14,
                    padding: "12px 14px",
                    lineHeight: 1.5,
                    boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ marginBottom: m.error.retryable ? 8 : 0 }}>
                    {m.content}
                  </div>
                  {m.error.retryable && (
                    <button
                      onClick={retryLastFailedRequest}
                      disabled={isAnalyzing}
                      style={{
                        marginTop: 8,
                        padding: "6px 12px",
                        background: "#DC2626",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        cursor: isAnalyzing ? "not-allowed" : "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                        opacity: isAnalyzing ? 0.7 : 1,
                      }}
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : m.role === "assistant" && m.explanation ? (
                (() => {
                  const tone = getMoveIndicatorStyles(
                    m.explanation?.moveIndicator
                  );
                  const isLastMessage = i === chatMessages.length - 1;
                  const showLoading = isAnalyzing && isLastMessage;
                  const avatarForMessage = showLoading
                    ? getAvatarImage(undefined, true)
                    : getAvatarImage(m.explanation?.moveIndicator, false);

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        width: "100%",
                      }}
                    >
                      {/* Avatar */}
                      <img
                        src={avatarForMessage}
                        alt="AI Tutor"
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />

                      {/* Speech Bubble */}
                      <div
                        style={{
                          position: "relative",
                          background: tone.background,
                          color: "#1F2937",
                          border: `2px solid ${tone.border}`,
                          borderRadius: 18,
                          padding: "14px 16px",
                          lineHeight: 1.5,
                          boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                          fontSize: 15,
                          maxWidth: "calc(100% - 80px)",
                          // Speech bubble tail pointing left
                          marginLeft: 8,
                        }}
                      >
                        {/* Speech bubble tail */}
                        <div
                          style={{
                            position: "absolute",
                            left: -12,
                            top: 20,
                            width: 0,
                            height: 0,
                            borderTop: "12px solid transparent",
                            borderBottom: "12px solid transparent",
                            borderRight: `12px solid ${tone.border}`,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: -10,
                            top: 21,
                            width: 0,
                            height: 0,
                            borderTop: "11px solid transparent",
                            borderBottom: "11px solid transparent",
                            borderRight: `11px solid ${tone.background}`,
                          }}
                        />

                        {showLoading ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              minHeight: 20,
                            }}
                          >
                            <LoadingDots />
                          </div>
                        ) : (
                          <>
                            <div>{m.explanation.Analysis ?? m.content}</div>

                            {m.explanation.nextStepHint && (
                              <div
                                style={{
                                  marginTop: 8,
                                  fontSize: 12,
                                  color: tone.accent,
                                  opacity: 0.9,
                                }}
                              >
                                ⭐ {m.explanation.nextStepHint}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : m.role === "assistant" && !m.explanation ? (
                // Regular assistant message (from questions) - also show with avatar
                (() => {
                  const isLastMessage = i === chatMessages.length - 1;
                  const showLoading = isAnalyzing && isLastMessage;
                  const avatarForMessage = showLoading
                    ? getAvatarImage(undefined, true)
                    : getAvatarImage(undefined, false);

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        width: "100%",
                      }}
                    >
                      {/* Avatar */}
                      <img
                        src={avatarForMessage}
                        alt="AI Tutor"
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />

                      {/* Speech Bubble */}
                      <div
                        style={{
                          position: "relative",
                          background: "#ffffff",
                          color: "#1F2937",
                          border: "2px solid #e5e7eb",
                          borderRadius: 18,
                          padding: "14px 16px",
                          lineHeight: 1.5,
                          boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                          fontSize: 15,
                          maxWidth: "calc(100% - 80px)",
                          marginLeft: 8,
                        }}
                      >
                        {/* Speech bubble tail */}
                        <div
                          style={{
                            position: "absolute",
                            left: -12,
                            top: 20,
                            width: 0,
                            height: 0,
                            borderTop: "12px solid transparent",
                            borderBottom: "12px solid transparent",
                            borderRight: "12px solid #e5e7eb",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: -10,
                            top: 21,
                            width: 0,
                            height: 0,
                            borderTop: "11px solid transparent",
                            borderBottom: "11px solid transparent",
                            borderRight: "11px solid #ffffff",
                          }}
                        />

                        {showLoading ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              minHeight: 20,
                            }}
                          >
                            <LoadingDots />
                          </div>
                        ) : (
                          <div>{m.content}</div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div
                  style={{
                    maxWidth: "88%",
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    background: m.role === "user" ? "#1f2937" : "#ffffff",
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
            disabled={isAnalyzing}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isAnalyzing && sendChat()} // Prevent Enter key too
            placeholder={isAnalyzing ? "AI is thinking..." : "Ask the tutor..."} // Dynamic placeholder
            style={{
              flex: 1,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              outline: "none",
              background: isAnalyzing ? "#f3f4f6" : "#f9fafb", // Slight color change when disabled
              cursor: isAnalyzing ? "not-allowed" : "text",
            }}
          />
          <button
            onClick={sendChat}
            disabled={isAnalyzing} // Logic added here
            style={{
              border: "1px solid #111827",
              background: isAnalyzing ? "#9ca3af" : "#111827", // Grey out when analyzing
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: 10,
              cursor: isAnalyzing ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: isAnalyzing ? 0.7 : 1,
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
