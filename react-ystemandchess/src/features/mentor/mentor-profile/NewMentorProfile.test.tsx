import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SetPermissionLevel } from '../../../globals';
import NewMentorProfile from './NewMentorProfile';

// ------------- MOCKS -------------
// mock being logged in
jest.mock('../../../globals', () => ({
  __esModule: true,
  SetPermissionLevel: jest.fn(),
}));

// mock the chart
jest.mock('react-chartjs-2', () => ({
  __esModule: true,
  Line: () => <div data-testid="mock-line-chart" />,
}));

// mock SweetAlert2 to avoid CSS parsing errors in jsdom
jest.mock('sweetalert2', () => {
  const mockSwal = {
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false })),
    mixin: jest.fn(),
    bindClickHandler: jest.fn(),
    stopTimer: jest.fn(),
    resumeTimer: jest.fn(),
    toggleTimer: jest.fn(),
    isTimerRunning: jest.fn(),
    incrementTimer: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    clickConfirm: jest.fn(),
    clickCancel: jest.fn(),
    clickDeny: jest.fn(),
    close: jest.fn(),
    enableButtons: jest.fn(),
    disableButtons: jest.fn(),
    showValidationMessage: jest.fn(),
    resetValidationMessage: jest.fn(),
    getInput: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockSwal,
  };
});

// mock Puzzles component to avoid SweetAlert2 CSS parsing issues
jest.mock('../../puzzles/puzzles-page/Puzzles', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-puzzles" />,
}));

// ------------- HELPER FUNCTIONS -------------

// helper to for date formatting to match with component
const formatEventDateTime = (iso: string) => {
  const dateObj = new Date(iso);
  return {
    date: dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    time: dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
};

// render helper
const renderProfile = async () => {
  await act(async () => 
    render(
      <MemoryRouter>
        <NewMentorProfile 
          userPortraitSrc={null} 
          student={{
            username: 'joeyman43', 
            firstName: 'Joey',
            lastName: 'Diaz', 
          }} // mock student, can be replaced with dynamic data
        />
      </MemoryRouter>
    )
  );  
};

// mock usage fetching from database
beforeEach(() => {
  // mock SetPermissionLevel return
  (SetPermissionLevel as jest.Mock).mockResolvedValue({
    username: 'username',
    firstName: 'Mock',
    lastName: 'Name',
    error: false,
  });

  global.fetch = jest.fn((url) => {
    // mock stats fetching, or time usage for different events
    if (url.includes('statistics')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          username: "username",
          mentor: 0,
          lesson: 5,
          play: 15,
          puzzle: 20,
          website: 10,
        }),
      });
    } else if (url.includes('latest')) {
      // mocking fetching the latest activity
      return Promise.resolve({
        json: () => Promise.resolve([
          { 
            startTime: "2025-06-10T02:44:27.781Z", 
            eventName: "mock event one", 
            eventType: "mock type"
          }, 
          { 
            startTime: "2025-06-10T02:54:27.781Z", 
            eventName: "mock event two", 
            eventType: "another mock type"
          }, 
        ]),
      });
    } else if (url.includes('getMentorship')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            firstName: 'Mock',
            lastName: 'lastName',
            username: 'username',
          }),
      });
    } else if (url.includes('graph-data')) {
        const graphData: {[key: string]: {monthText: string; timeSpent: number}[]} = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        const events = ["website", "play", "lesson", "puzzle", "mentor"];
        events.forEach(event => {
          graphData[event] = months.map((m, i) => ({ monthText: m, timeSpent: i + 1 }));
        });

        return Promise.resolve({
          json: () => Promise.resolve(graphData),
        });
    }

    return Promise.reject(new Error('Unhandled fetch request: ' + url));
  }) as jest.Mock;
});

// clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('NewMentorProfile', () => {
  // unit test on basic rendering
  test('renders the profile page', async () => {
    await renderProfile();

    // check if name is rendered correctly
    expect(await screen.findByText(/Hello, Mock Name!/i)).toBeInTheDocument();

    // check if time spent is rendered
    expect(await screen.findByText(/Time Spent:/i)).toBeInTheDocument();

    // check if some of the tabs are rendered
    const learningText = await screen.findByText(/Learning/i);
    expect(learningText).toBeInTheDocument();
    const gameText = await screen.findByText(/Games/i);
    expect(gameText).toBeInTheDocument();
    const backpackText = await screen.findByText(/Backpack/i);
    expect(backpackText).toBeInTheDocument();
  });

  // test on rendering stats
  test('renders time stats', async () => {
    await renderProfile();

    // wait for stats to load first
    const _ = await screen.findByText(/10 minutes/i);

    // check if stats for website browsing is rendered correctly
    const web_li = await screen.findByText(/Website:/i);
    expect(web_li).toBeInTheDocument();
    expect(web_li.firstElementChild).toHaveTextContent("10 minutes");

    // check if stats for playing is rendered correctly
    const play_li = await screen.findByText(/Playing:/i);
    expect(play_li).toBeInTheDocument();
    expect(play_li.firstElementChild).toHaveTextContent("15 minutes");
  });

  // test if activity is rendered correctly
  test('renders user activity', async () => {
    await renderProfile();

    const latestEvents = await global.fetch('latest').then(res => res.json());

    for (const event of latestEvents) {
      const { date, time } = formatEventDateTime(event.startTime);

      // check event name
      expect(await screen.findByText(new RegExp(event.eventName, 'i'))).toBeInTheDocument();

      // check formatted date and time
      const dateMatches = await screen.findAllByText(new RegExp(date, 'i'), { exact: false });
      expect(dateMatches.length).toBeGreaterThan(0);

      // check formatted time
      const timeMatches = await screen.findAllByText(new RegExp(time, 'i'), { exact: false });
      expect(timeMatches.length).toBeGreaterThan(0);
    }
  });
});
