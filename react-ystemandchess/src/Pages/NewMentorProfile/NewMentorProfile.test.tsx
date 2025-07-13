import React from 'react';
import { render, screen } from '@testing-library/react';
import NewMentorProfile from './NewMentorProfile';
import { MemoryRouter } from 'react-router';

// Mock being logged in
jest.mock('../../globals', () => ({
  SetPermissionLevel: jest.fn().mockResolvedValue({
    username: 'username',
    firstName: 'Mock',
    lastName: 'Name',
    error: null,
  }),
}));

beforeEach(() => {
  global.fetch = jest.fn((url) => {
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
          username: "joeyman43",
          firstName: "Joey",
          lastName: "Diaz",
        }),
      });
    }

    return Promise.reject(new Error('Unhandled fetch request: ' + url));
  }) as jest.Mock;
});


test('renders the profile page', async () => {
  render(
    <MemoryRouter>
      <NewMentorProfile userPortraitSrc={null} />
    </MemoryRouter>
  );

  const nameText = await screen.findByText(/Hello, Mock Name!/i);
  expect(nameText).toBeInTheDocument();

  const statsText = await screen.findByText(/Time Spent:/i);
  expect(statsText).toBeInTheDocument();

  const learningText = await screen.findByText(/Learning/i);
  expect(learningText).toBeInTheDocument();
  const gameText = await screen.findByText(/Games/i);
  expect(gameText).toBeInTheDocument();
  const backpackText = await screen.findByText(/Backpack/i);
  expect(backpackText).toBeInTheDocument();
});

test('renders time stats', async () => {
  render(
    <MemoryRouter>
      <NewMentorProfile userPortraitSrc={null} />
    </MemoryRouter>
  );

  await screen.findByText(/10 minutes/i);

  const web_li = await screen.findByText(/Website:/i);
  expect(web_li).toBeInTheDocument();
  expect(web_li.firstElementChild).toHaveTextContent("10 minutes");

  const play_li = await screen.findByText(/Playing:/i);
  expect(play_li).toBeInTheDocument();
  expect(play_li.firstElementChild).toHaveTextContent("15 minutes");
});


test('renders user activity', async () => {
  render(
    <MemoryRouter>
      <NewMentorProfile userPortraitSrc={null} />
    </MemoryRouter>
  );

  const activityText = await screen.findByText(/Working on another mock type:/i);
  expect(activityText).toBeInTheDocument();

  const activityText2 = await screen.findByText(/another mock event/i);
  expect(activityText2).toBeInTheDocument();
});
