import { describe } from "node:test";
import { io as ioClient } from "socket.io-client";

describe("Chess Server", () => {
  let server: any;
  let io: any;
  let port: number;

  beforeAll(async () => {
    const index = await import("../index");

    server = index.server;
    io = index.io;

    await new Promise<void>((resolve) => {
      if (server.listening) {
        resolve();
      } else {
        server.listen(0, resolve);
      }
    });

    const address = server.address();

    if (typeof address === "object" && address !== null) {
      port = address.port;
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server?.listening) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });

    io?.close();
  });

  test("starts the server successfully", () => {
    expect(server).toBeDefined();
    expect(server.listening).toBe(true);
  });

  test("accepts a Socket.IO client connection", async () => {
    const client = ioClient(`http://localhost:${port}`, {
      transports: ["websocket"],
    });

    await new Promise<void>((resolve, reject) => {
      client.on("connect", () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        resolve();
      });

      client.on("connect_error", reject);
    });
  });

  test("registers Socket.IO connection handlers", async () => {
    const client = ioClient(`http://localhost:${port}`, {
      transports: ["websocket"],
    });

    await new Promise<void>((resolve, reject) => {
      client.on("connect", () => {
        expect(client.id).toBeDefined();
        client.disconnect();
        resolve();
      });

      client.on("connect_error", reject);
    });
  });
});
