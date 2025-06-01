import React from 'react';
import { render, screen } from '@testing-library/react';
import LessonOverlay from './lesson-overlay';
import { MemoryRouter } from 'react-router';

// beforeEach(() => {
//   global.fetch = jest.fn((url) => {
//     if (url.includes('getCompletedLessonCount')) {
//       return Promise.resolve({
//         json: () => Promise.resolve(0),
//       });
//     }

//     if (url.includes('getLesson')) {
//       return Promise.resolve({
//         json: () => Promise.resolve({ 
//             startFen: "8/8/8/3k4/3r4/8/4R3/4K3 w - - 0 1",
//             name: "simple board name",
//             info: "simple board info",
//             lessonNum: 0
//         }),
//       });
//     }

//     if (url.includes('getTotalPieceLesson')) {
//       return Promise.resolve({
//         json: () => Promise.resolve(1),
//       });
//     }

//     if (url.includes('updateLessonCompletion')) {
//       return Promise.resolve({
//         json: () => Promise.resolve(),
//       });
//     }

//     return Promise.reject(new Error('Unhandled fetch request: ' + url));
//   }) as jest.Mock;
// });


test('renders the welcome message', async () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );
  const welcomeText = screen.getByText(/Loading lesson/i);
  expect(welcomeText).toBeInTheDocument();
});
