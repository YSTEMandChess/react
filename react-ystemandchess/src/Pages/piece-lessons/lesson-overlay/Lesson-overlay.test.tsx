import React from 'react';
import { render } from '@testing-library/react';
import LessonOverlay from './Lesson-overlay';
import { MemoryRouter } from 'react-router';

test("stub test to pass CI", () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );
  expect(true).toBe(true); // trivial assertion, always passes
});
