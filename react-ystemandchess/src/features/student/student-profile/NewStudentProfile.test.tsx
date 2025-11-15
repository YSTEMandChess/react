import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useCookies } from 'react-cookie';
import { SetPermissionLevel } from '../../../globals';
import NewStudentProfile from './NewStudentProfile';

// ------------- MOCKS -------------
// mock react-cookie
jest.mock('react-cookie', () => ({
  __esModule: true,
  useCookies: jest.fn(),
}));

// mock globals (SetPermissionLevel)
jest.mock('../../globals', () => ({
  __esModule: true,
  SetPermissionLevel: jest.fn(),
}));

// mock the chart
jest.mock('react-chartjs-2', () => ({
  __esModule: true,
  Line: () => <div data-testid="mock-line-chart" />,
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
        <NewStudentProfile />
      </MemoryRouter>
    )
  );
};
// before each test, reset and configure mocks
beforeEach(() => {
  // mock cookies hook
  (useCookies as jest.Mock).mockReturnValue([
    { login: 'dummy.jwt.token' },
    jest.fn(), // setCookie
    jest.fn(), // removeCookie
  ]);

  // mock SetPermissionLevel return
  (SetPermissionLevel as jest.Mock).mockResolvedValue({
    username: 'username',
    firstName: 'Mock',
    lastName: 'Name',
    error: false,
  });

  // mock fetch for all API calls
  global.fetch = jest.fn((url) => {
    if (url.includes('statistics')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            username: 'username',
            mentor: 0,
            lesson: 5,
            play: 15,
            puzzle: 20,
            website: 10,
          }),
      });
    } else if (url.includes('latest')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve([
            {
              startTime: '2025-06-10T02:44:27.781Z',
              eventName: 'mock event one',
              eventType: 'mock type',
            },
            {
              startTime: '2025-06-10T02:54:27.781Z',
              eventName: 'mock event two',
              eventType: 'another mock type',
            },
          ]),
      });
    } else if (url.includes('graph-data')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            lesson: [{ monthText: 'Jan', timeSpent: 0 }],
            mentor: [{ monthText: 'Jan', timeSpent: 0 }],
            play: [{ monthText: 'Jan', timeSpent: 0 }],
            puzzle: [{ monthText: 'Jan', timeSpent: 0 }],
            website: [{ monthText: 'Jan', timeSpent: 0 }],
          }),
      });
    } else if (url.includes('getMentorship')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            username: 'username',
            firstName: 'Mock',
            lastName: 'lastName',
          }),
      });
    }

    return Promise.reject(new Error('Unhandled fetch request: ' + url));
  }) as jest.Mock;
});

// clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('NewStudentProfile', () => {
  test('renders the profile page', async () => {
    await renderProfile();

    // check if name is rendered correctly
    expect(await screen.findByText(/Hello, Mock Name!/i)).toBeInTheDocument();

    // check if time spent is rendered
    expect(await screen.findByText(/Time Spent:/i)).toBeInTheDocument();

    // check if some of the tabs (by aria-label) are rendered
    expect(await screen.findByRole('button', { name: /activity/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /games/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /mentor/i })).toBeInTheDocument();
  });

  test('renders time stats', async () => {
    await renderProfile();

    // wait for stats to load first
    await screen.findByText(/10 min/i);

    // check if stats for website browsing is rendered correctly
    const web_li = await screen.findByText(/Website:/i);
    expect(web_li).toBeInTheDocument();
    expect(web_li.firstElementChild).toHaveTextContent('10 min');

    // check if stats for playing is rendered correctly
    const play_li = await screen.findByText(/Playing:/i);
    expect(play_li).toBeInTheDocument();
    expect(play_li.firstElementChild).toHaveTextContent('15 min');
  });
    
  test('renders user activity', async () => {
    await renderProfile();
    
    const latestEvents = await global.fetch('latest').then(res => res.json());

    for (const event of latestEvents) {
      const { date, time } = formatEventDateTime(event.startTime);

      // check event name
      expect(await screen.findByText(new RegExp(event.eventName, 'i'))).toBeInTheDocument();

      // check formatted date and time
      const dates = await screen.findAllByText(date);
      expect(dates.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(time)).toBeInTheDocument();
    }
  });
});