import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useCookies } from 'react-cookie';
import ChatWidget from './ChatWidget';

const mockCookieToken = 'mock-jwt-test-token';

jest.mock('react-cookie', () => ({
  __esModule: true,
  useCookies: jest.fn(),
}));

jest.mock('../../environments', () => ({
  environment: {
    urls: {
      middlewareURL: 'http://localhost:8000',
    },
  },
}));

describe('ChatWidget API Auth Headers', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    (useCookies as jest.Mock).mockReturnValue([{ login: mockCookieToken }, jest.fn(), jest.fn()]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test('sends Authorization header when starting a session, sending messages, and ending a session', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string, options: any) => {
      if (url.includes('/chat/session') && options?.method === 'POST' && !url.includes('/end')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ session: { _id: 'session-123', topic: 'General Coach' } }),
        });
      }
      if (url.includes('/chat/message') && options?.method === 'POST') {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello learner!"}}]}\n\n'));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });
        return Promise.resolve({
          ok: true,
          body: stream,
        });
      }
      if (url.includes('/chat/session/session-123/end') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            session: {
              summary: 'Great session',
              actions: ['Action 1'],
            },
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    global.fetch = fetchMock as any;

    render(<ChatWidget />);

    // 1. Open the chat widget
    const openBtn = screen.getByLabelText(/Talk to AI Tutor/i);
    fireEvent.click(openBtn);

    // Verify /chat/session was called with Authorization header
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/chat/session',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockCookieToken}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    // 2. Type and send a message
    const input = await screen.findByPlaceholderText(/Reflect and reply here.../i);
    fireEvent.change(input, { target: { value: 'How can I improve my endgame?' } });
    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    // Verify /chat/message was called with Authorization header
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/chat/message',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockCookieToken}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            sessionId: 'session-123',
            message: 'How can I improve my endgame?',
          }),
        })
      );
    });

    // 3. End session
    const endBtn = await screen.findByTitle(/End Session/i);
    fireEvent.click(endBtn);

    // Verify /chat/session/session-123/end was called with Authorization header
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/chat/session/session-123/end',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockCookieToken}`,
          }),
        })
      );
    });
  });

  test('sends Authorization header when changing topic during an active session', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string, options: any) => {
      if (url.includes('/chat/session/session-old/end') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ session: { summary: 'Done', actions: [] } }),
        });
      }
      if (url.includes('/chat/session') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ session: { _id: 'session-new', topic: 'Math Problem' } }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    global.fetch = fetchMock as any;

    render(<ChatWidget />);

    // Open chat
    const openBtn = screen.getByLabelText(/Talk to AI Tutor/i);
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/chat/session',
        expect.anything()
      );
    });

    // Select new topic
    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'math tutoring' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/chat/session',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockCookieToken}`,
          }),
          body: JSON.stringify({ topic: 'math tutoring' }),
        })
      );
    });
  });
});
