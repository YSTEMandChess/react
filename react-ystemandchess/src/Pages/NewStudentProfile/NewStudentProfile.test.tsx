import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NewStudentProfile from './NewStudentProfile';
import { MemoryRouter } from 'react-router';

// mock being logged in
jest.mock('../../globals', () => ({
  SetPermissionLevel: jest.fn().mockResolvedValue({
    username: 'username',
    firstName: 'Mock',
    lastName: 'Name',
    error: null
  }),
}));

// mock usage fetching from database
beforeEach(() => {
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
            eventName: "mock event", 
            eventType: "mock type"
          }, 
          { 
            startTime: "2025-06-10T02:54:27.781Z", 
            eventName: "another mock event", 
            eventType: "another mock type"
          }, 
        ]),
      });
    }

    return Promise.reject(new Error('Unhandled fetch request: ' + url));
  }) as jest.Mock;
});

// unit test on basic rendering
test('renders the profile page', async () => {
    render(
        <MemoryRouter>
            <NewStudentProfile/>
        </MemoryRouter>
    );

    // check if name is rendered correctly
    const nameText = await screen.findByText(/Hello, Mock Name!/i);
    expect(nameText).toBeInTheDocument();

    // check if time spent is rendered
    const statsText = await screen.findByText(/Time Spent:/i);
    expect(statsText).toBeInTheDocument();

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
    render(
        <MemoryRouter>
            <NewStudentProfile/>
        </MemoryRouter>
    );

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
    render(
        <MemoryRouter>
            <NewStudentProfile/>
        </MemoryRouter>
    );

    // check if activity dates is rendered
    const timeText = await screen.findByText(/Jun 10, 2025 10:44 AM/i);
    expect(timeText).toBeInTheDocument();
    const timeText2 = await screen.findByText(/Jun 10, 2025 10:54 AM/i);
    expect(timeText2).toBeInTheDocument();

    // check if activity name is rendered
    const activityText = await screen.findByText(/Working on another mock type:/i);
    expect(activityText).toBeInTheDocument();
    const activityText2 = await screen.findByText(/another mock event/i);
    expect(activityText2).toBeInTheDocument();
});