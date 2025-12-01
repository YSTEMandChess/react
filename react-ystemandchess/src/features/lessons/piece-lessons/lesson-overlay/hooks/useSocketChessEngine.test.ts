import { renderHook, act } from "@testing-library/react";
import { useSocketChessEngine } from "./useSocketChessEngine";
import io from "socket.io-client";

// mock socket.io-client
jest.mock("socket.io-client");

describe("useSocketChessEngine", () => {
	let mockSocket: any;
  	let onEvaluationComplete: jest.Mock;

  	beforeEach(() => {
		onEvaluationComplete = jest.fn();

		mockSocket = {
	  		on: jest.fn(),
	  		emit: jest.fn(),
	  		disconnect: jest.fn(),
		};

		(io as jest.Mock).mockReturnValue(mockSocket);
  	});

  	afterEach(() => {
		jest.clearAllMocks();
  	});

	it("connects to socket and emits start-session", () => {
		renderHook(() => useSocketChessEngine(onEvaluationComplete));

		// find the 'connect' handler registered
		const connectHandler = mockSocket.on.mock.calls.find(
	  		([event]) => event === "connect"
		)[1];

		act(() => {
	  		connectHandler();
		});

		expect(mockSocket.emit).toHaveBeenCalledWith("start-session", {
	  		sessionType: "lesson",
	  		fen: "",
	  		infoMode: false,
		});
	});

	it("calls onEvaluationComplete when evaluation-complete event is received", () => {
		renderHook(() => useSocketChessEngine(onEvaluationComplete));

		const evalHandler = mockSocket.on.mock.calls.find(
	  		([event]) => event === "evaluation-complete"
		)[1];

		const data = { move: "e4" };
		act(() => {
	  		evalHandler(data);
		});

		expect(onEvaluationComplete).toHaveBeenCalledWith(data);
	});

	it("disconnects socket on unmount", () => {
		const { unmount } = renderHook(() =>
	  		useSocketChessEngine(onEvaluationComplete)
		);

		unmount();

		expect(mockSocket.disconnect).toHaveBeenCalled();
	});

	it("logs evaluation-error messages", () => {
		console.error = jest.fn();

		renderHook(() => useSocketChessEngine(onEvaluationComplete));

		const errorHandler = mockSocket.on.mock.calls.find(
	  		([event]) => event === "evaluation-error"
		)[1];

		const errorMsg = { error: "Test error" };
		act(() => {
	  		errorHandler(errorMsg);
		});

		expect(console.error).toHaveBeenCalledWith("Error from socket:", errorMsg.error);
	});
});
