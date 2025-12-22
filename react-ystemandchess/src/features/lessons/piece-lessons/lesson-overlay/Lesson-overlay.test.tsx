import { render } from "@testing-library/react";
import LessonOverlay from "./Lesson-overlay";
import { MemoryRouter } from "react-router";

test("stub: renders LessonOverlay without crashing", () => {
  render(
    <MemoryRouter>
      <LessonOverlay />
    </MemoryRouter>
  );
  expect(true).toBe(true); // Always passes
});
