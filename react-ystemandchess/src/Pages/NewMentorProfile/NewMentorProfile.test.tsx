import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NewMentorProfile from './NewMentorProfile';
import { MemoryRouter } from 'react-router';
import { SetPermissionLevel } from '../../globals';

// mock being logged in
jest.mock('../../globals', () => ({
  __esModule: true,
  SetPermissionLevel: jest.fn(),
}));

const formatEventDateTime = (iso: string) => {
  const dateObj = new Date(iso);
  const date = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const time = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} ${time}`;
};

// mock usage fetching from database
beforeEach(() => {
  (SetPermissionLevel as jest.Mock).mockResolvedValue({
    username: 'username',
    firstName: 'Mock',
    lastName: 'Name',
    error: null
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
    } else if (url.includes('getMentorship')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          username: "username",
          firstName: "Mock",
          lastName: "Name"
        }),
      });
    }

    return Promise.reject(new Error('Unhandled fetch request: ' + url));
  }) as jest.Mock;
});


// unit test on basic rendering
test('renders the profile page', async () => {
    render(
        <MemoryRouter>
            <NewMentorProfile 
            userPortraitSrc={null} 
            student={{username: 'joeyman43', 
                      firstName: 'Joey',
                      lastName: 'Diaz', 
            }} // mock student, can be replaced with dynamic data
            />
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
            <NewMentorProfile 
            userPortraitSrc={null} 
            student={{username: 'joeyman43', 
                      firstName: 'Joey',
                      lastName: 'Diaz', 
            }} // mock student, can be replaced with dynamic data
            />
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
            <NewMentorProfile 
            userPortraitSrc={null} 
            student={{username: 'joeyman43', 
                      firstName: 'Joey',
                      lastName: 'Diaz', 
            }} // mock student, can be replaced with dynamic data
            />
        </MemoryRouter>
    );

    // check if activity dates is rendered
    const eventTime1 = formatEventDateTime("2025-06-10T02:44:27.781Z");
    const timeText = await screen.findByText(new RegExp(eventTime1, 'i'));
    expect(timeText).toBeInTheDocument();
    
    const eventTime2 = formatEventDateTime("2025-06-10T02:54:27.781Z");
    const timeText2 = await screen.findByText(new RegExp(eventTime2, 'i'));
    expect(timeText2).toBeInTheDocument();

    // check if activity name is rendered
    const activityText = await screen.findByText(/Working on another mock type:/i);
    expect(activityText).toBeInTheDocument();
    const activityText2 = await screen.findByText(/another mock event/i);
    expect(activityText2).toBeInTheDocument();
});
