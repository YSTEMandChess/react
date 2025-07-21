import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonOverlay from './lesson-overlay';
import { MemoryRouter } from 'react-router';
import { environment } from '../../../environments/environment';

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
  // Create a mock XMLHttpRequest object
  const mockXHR = {
    open: jest.fn(),
    send: jest.fn(),
    readyState: 4,
    status: 200,
    responseText: JSON.stringify({
      fen: "8/4k3/8/8/4K3/8/8/Q6R w - - 2 2", // mock Stockfish response FEN
    }),
    onreadystatechange: null as (() => void) | null,
  };

  // When send is called, trigger onreadystatechange
  mockXHR.send.mockImplementation(() => {
    if (mockXHR.onreadystatechange) mockXHR.onreadystatechange();
  });

  // @ts-ignore: override global constructor
  global.XMLHttpRequest = jest.fn(() => mockXHR);
});

// mock the environment urls
jest.mock('../../../environments/environment', () => ({
  environment: {
    urls: {
      chessClientURL: 'http://localhost:3000',
      middlewareURL: 'http://localhost:8000',
    }
  }
}));

const startLesson = async () => {
  // Simulate the chess client sending a 'ReadyToRecieve' message
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: 'ReadyToRecieve',
      })
    );
  });

  // simulate user reading instructions
  const finishedBtn = screen.getByText(/Finished reading!/i);
  fireEvent.click(finishedBtn);
}

// unit test on content loading popup
test('renders the loading message', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay/>
    </MemoryRouter>
  );
  const loadingText = screen.getByText(/Loading lesson/i);
  expect(loadingText).toBeInTheDocument();
});

// unit test on fetching & rendering first lesson
test('triggers ReadyToRecieve message and fetches lessons', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );

  // Simulate the chess client sending a 'ReadyToRecieve' message
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: 'ReadyToRecieve',
      })
    );
  });

  // test whether component is re-rendered upon ReadyToReceive
  const lessonName = screen.getByText(/simple 2 board name/i);
  expect(lessonName).toBeInTheDocument();
  const lessonInfo = screen.getByText(/simple 2 board name/i);
  expect(lessonInfo).toBeInTheDocument();

  // test existence of description button & click
  const finishedBtn = screen.getByText(/Finished reading!/i);
  expect(finishedBtn).toBeInTheDocument();
  fireEvent.click(finishedBtn);
});

// test whether front end responds correctly to stockfish & chessClient
test('interact with stockfish & chessClient', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );

  // chess client sends white move to front end
  await startLesson();
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: environment.urls.chessClientURL,
        data: "8/8/3k4/8/4K3/8/8/Q6R b - - 1 1",
      })
    );
  });
  // will wait for stockfish to predict black move

  // test move tracker
  // white move
  const step1 = screen.getByText(/Ke4/i);
  expect(step1).toBeInTheDocument();
  // black move by stockFish
  const step2 = screen.getByText(/Ke7/i);
  expect(step2).toBeInTheDocument();
})

// test replaying after failure
test('failed lesson', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );

  // start lesson first
  await startLesson();
  // chess client sends restart message
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: environment.urls.chessClientURL,
        data: "restart",
      })
    );
  });

  // test failure popup
  const failedPopup = screen.getByText(/Lesson failed/i);
  expect(failedPopup).toBeInTheDocument();
  const okBtn = screen.getByText(/OK/i);
  expect(okBtn).toBeInTheDocument();

  // consent to restart, check UI update
  fireEvent.click(okBtn);
  const updatedText = screen.getByText(/Make a move to see it here!/i);
  expect(updatedText).toBeInTheDocument();
})

// test lesson completion
test('completed lesson', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );

  // start lesson first
  await startLesson();
  // chess client sends successful message
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: environment.urls.chessClientURL,
        data: "won:white",
      })
    );
  });

  // test completed popup
  const completePopup = screen.getByText(/Lesson completed/i);
  expect(completePopup).toBeInTheDocument();
  const okBtn = screen.getByText(/OK/i);
  expect(okBtn).toBeInTheDocument();

  // consent to complete lesson, check UI update
  await act(async () => { 
    fireEvent.click(okBtn);
  })
  // read instruction
  const readBtn = screen.getByText("Finished reading!")
  expect(readBtn).toBeInTheDocument();
  fireEvent.click(readBtn)
  // check new lessonNum
  const lessonNum3 = screen.getByText("simple 3 board info");
  expect(lessonNum3).toBeInTheDocument();

  // finish lesson 3, the last lesson
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: environment.urls.chessClientURL,
        data: "won:white",
      })
    );
  });
  // confirm completion
  const completePopupAgain = screen.getByText(/Lesson completed/i);
  expect(completePopupAgain).toBeInTheDocument();
  const okBtnAgain = screen.getByText(/OK/i);
  expect(okBtnAgain).toBeInTheDocument();
  // will still be the last lesson, since no more lessons left
  const lessonNum3Again = screen.getByText("simple 3 board info");
  expect(lessonNum3Again).toBeInTheDocument();
})

// test reset button
test('reset lesson', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );

  // start lesson first
  await startLesson();
  
  // reset lesson
  const resetBtn = document.getElementsByClassName("reset-lesson")[0];
  fireEvent.click(resetBtn);
  // check if UI is updated
  const updatedText = screen.getByText(/Make a move to see it here!/i);
  expect(updatedText).toBeInTheDocument();
})

// test lesson navigation
test('next & previous lesson', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );

  // start lesson first
  await startLesson();
  // check current lesson number
  const lessonNum2 = screen.getByText("simple 2 board info")
  expect(lessonNum2).toBeInTheDocument();

  // go back one lesson
  const backBtn = screen.getByText(/Back/i).closest('button');
  expect(backBtn).toBeInTheDocument();
  await act(async () => {
      fireEvent.click(backBtn);
  });
  // read description
  const readBtn = screen.getByText("Finished reading!")
  expect(readBtn).toBeInTheDocument();
  fireEvent.click(readBtn)
  // check previous lesson number
  const lessonNum1 = screen.getByText("simple board info")
  expect(lessonNum1).toBeInTheDocument();

  // go to next lesson (initial lesson)
  const nextBtn = screen.getByText(/Next/i).closest('button');
  expect(nextBtn).toBeInTheDocument();
  await act(async () => {
      fireEvent.click(nextBtn);
  });
  // read description
  const readBtnAgain = screen.getByText("Finished reading!")
  fireEvent.click(readBtnAgain)
  // check lesson number to be the same as initial
  const lessonNum2again = screen.getByText("simple 2 board info");
  expect(lessonNum2again).toBeInTheDocument();

  // try to go to next lesson
  const nextBtnAgain = screen.getByText(/Next/i).closest('button');
  expect(nextBtnAgain).toBeInTheDocument();
  await act(async () => {
      fireEvent.click(nextBtnAgain);
  });
  // will stay in current lesson, since lesson 3 not activated 
  const lessonNum2still = screen.getByText("simple 2 board info");
  expect(lessonNum2still).toBeInTheDocument();
})


test("just testing", () => {
  console.log('LessonOverlay is:', LessonOverlay);
})