import { useEffect, useRef } from "react";
import io from "socket.io-client";

export function useSocketChessEngine(onEvaluationComplete: (data: any) => void) {
    const socketRef = useRef<any>(null);

    useEffect(() => {
        const socket = io("http://localhost:8080", { transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("connect", () => {
        socket.emit("start-session", { sessionType: "lesson", fen: "", infoMode: false });
        });

        socket.on("evaluation-complete", (data) => onEvaluationComplete(data));

        socket.on("evaluation-error", (msg) => {
            console.error("Error from socket:", msg.error);
        });

        return () => {
            socket.disconnect();
        };
    }, [onEvaluationComplete]);

    return socketRef;
}
