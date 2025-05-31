import React from 'react';
import { render, screen } from '@testing-library/react';
import LessonOverlay from './lesson-overlay';
import { MemoryRouter } from 'react-router';

test('renders the welcome message', () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );
  const welcomeText = screen.getByText(/Loading lesson/i);
  expect(welcomeText).toBeInTheDocument();
});
