import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonOverlay from './lesson-overlay';
import { MemoryRouter } from 'react-router';
import { environment } from '../../../environments/environment';

// Required props for LessonOverlay
const defaultProps = {
  propPieceName: "queen",
  propLessonNumber: 2,
  navigateFunc: jest.fn(),
  styleType: "default"
};

// mock lesson fetching from database
beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (url.includes('getCompletedLessonCount')) {
      return Promise.resolve({
        json: () => Promise.resolve(1),
      });
    }

    if (url.includes('getLesson') && url.includes('lessonNum=1')) {
      return Promise.resolve({
        json: () => Promise.resolve({ 
            startFen: "8/8/3k4/8/8/4K3/8/Q6R w - - 0 1",
            name: "simple board name",
            info: "simple board info",
            lessonNum: 1
        }),
      });
    }

    if (url.includes('getLesson') && url.includes('lessonNum=2')) {
      return Promise.resolve({
        json: () => Promise.resolve({ 
            startFen: "8/8/3k4/8/8/4K3/8/Q6R w - - 0 1",
            name: "simple 2 board name",
            info: "simple 2 board info",
            lessonNum: 2
        }),
      });
    }

    if (url.includes('getLesson') && url.includes('lessonNum=3')) {
      return Promise.resolve({
        json: () => Promise.resolve({ 
            startFen: "8/8/3k4/8/8/4K3/8/Q6R w - - 0 1",
            name: "simple 3 board name",
            info: "simple 3 board info",
            lessonNum: 3
        }),
      });
    }

    if (url.includes('getTotalPieceLesson')) {
      return Promise.resolve({
        json: () => Promise.resolve(3),
      });
    }

    if (url.includes('updateLessonCompletion')) {
      return Promise.resolve({
        json: () => Promise.resolve(),
      });
    }

    return Promise.reject(new Error('Unhandled fetch request: ' + url));
  }) as jest.Mock;
});

// mock calls to stockfish server
beforeEach(() => {
  const mockXHR = {
    open: jest.fn(),
    send: jest.fn(),
    readyState: 4,
    status: 200,
    responseText: JSON.stringify({
      fen: "8/4k3/8/8/4K3/8/8/Q6R w - - 2 2",
    }),
    onreadystatechange: null as (() => void) | null,
  };

  mockXHR.send.mockImplementation(() => {
    if (mockXHR.onreadystatechange) mockXHR.onreadystatechange();
  });

  // @ts-ignore: override global constructor
  global.XMLHttpRequest = jest.fn(() => mockXHR);
});

jest.mock('../../../environments/environment', () => ({
  environment: {
    urls: {
      chessClientURL: 'http://localhost:3000',
      middlewareURL: 'http://localhost:8000',
    }
  }
}));

const startLesson = async () => {
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: 'ReadyToRecieve',
      })
    );
  });

  const finishedBtn = screen.getByText(/Finished reading!/i);
  fireEvent.click(finishedBtn);
};

test('renders loading state', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay {...defaultProps} />
    </MemoryRouter>
  );
  expect(screen.getByText(/Loading lesson/i)).toBeInTheDocument();
});

test('renders lesson and handles ReadyToRecieve message', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay {...defaultProps} />
    </MemoryRouter>
  );

  await startLesson();

  expect(screen.getByText(/simple 2 board name/i)).toBeInTheDocument();
  expect(screen.getByText(/Finished reading!/i)).toBeInTheDocument();
});

test('handles stockfish & chessClient move', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay {...defaultProps} />
    </MemoryRouter>
  );

  await startLesson();

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: environment.urls.chessClientURL,
        data: "8/8/3k4/8/4K3/8/8/Q6R b - - 1 1",
      })
    );
  });

  expect(screen.getByText(/Ke4/i)).toBeInTheDocument();
  expect(screen.getByText(/Ke7/i)).toBeInTheDocument();
});

test('handles lesson failure and restart', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay {...defaultProps} />
    </MemoryRouter>
  );

  await startLesson();

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: environment.urls.chessClientURL,
        data: "restart",
      })
    );
  });

  expect(screen.getByText(/Lesson failed/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/OK/i));
  expect(screen.getByText(/Make a move to see it here!/i)).toBeInTheDocument();
});

test('handles lesson success and completion flow', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay {...defaultProps} />
    </MemoryRouter>
  );

  await startLesson();

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: environment.urls.chessClientURL,
        data: "won:white",
      })
    );
  });

  expect(screen.getByText(/Lesson completed/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/OK/i));
  fireEvent.click(screen.getByText("Finished reading!"));
  expect(screen.getByText("simple 3 board info")).toBeInTheDocument();
});

test('resets lesson via reset button', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay {...defaultProps} />
    </MemoryRouter>
  );

  await startLesson();

  const resetBtn = document.getElementsByClassName("reset-lesson")[0];
  fireEvent.click(resetBtn);
  expect(screen.getByText(/Make a move to see it here!/i)).toBeInTheDocument();
});

test('navigates next & previous lessons correctly', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay {...defaultProps} />
    </MemoryRouter>
  );

  await startLesson();

  fireEvent.click(screen.getByText(/Back/i));
  fireEvent.click(screen.getByText("Finished reading!"));
  expect(screen.getByText("simple board info")).toBeInTheDocument();

  fireEvent.click(screen.getByText(/Next/i));
  fireEvent.click(screen.getByText("Finished reading!"));
  expect(screen.getByText("simple 2 board info")).toBeInTheDocument();
});
