import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LessonSelection from "./LessonsSelection.jsx";
import { MemoryRouter } from "react-router";

test("renders lesson selection page", () => {
  render(
    <MemoryRouter>
      <LessonSelection />
    </MemoryRouter>
  );
  
  // Check if the lesson selection title is present
  const lessonTitle = screen.getByTestId("title");
  expect(lessonTitle).toBeInTheDocument();

  // Check if the scenario and lesson selectors are present
  const scenarioSelector = screen.getByTestId("scenario-selector");
  const lessonSelector = screen.getByTestId("lesson-selector");
  expect(scenarioSelector).toBeInTheDocument();
  expect(lessonSelector).toBeInTheDocument();

  // Check if the start lesson button is present
  const goButton = screen.getByTestId("enterInfo");
  expect(goButton).toBeInTheDocument();
});