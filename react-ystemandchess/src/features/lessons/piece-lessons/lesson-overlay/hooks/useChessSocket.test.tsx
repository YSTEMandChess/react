import { render } from "@testing-library/react";
import { useChessSocket } from "./useChessSocket";

// Mock socket.io-client for Jest
jest.mock("socket.io-client", () => ({
  io: () => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    id: "test-socket-id",
  }),
}));

// Dummy component to execute the hook
const HookExecutor = () => {
  useChessSocket({
    student: "test-student",
    onMove: () => {},
    serverUrl: "http://localhost", // <- required field
  });
  return null;
};

describe("useChessSocket Hook (CI Stub)", () => {
  it("initializes without crashing", () => {
    render(<HookExecutor />);
  });
});
