import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LessonSelection from "./LessonsSelection.jsx";
import { MemoryRouter } from "react-router";
import { useNavigate } from 'react-router';

// mock navigating to lessons
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

// mock fetching from database
beforeEach(() => {
  global.fetch = jest.fn((url) => {
    // fetching number of lessons completed for each scenario
    if (url.includes('Piece Checkmate 1 Basic checkmates')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(1), // completed just one lesson
      });
    }
    return Promise.reject(new Error('Unhandled fetch request: ' + url));
  }) as jest.Mock;
});

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

test("choosing scenarios", async () => {
  render(
    <MemoryRouter>
      <LessonSelection />
    </MemoryRouter>
  );

  // mock clicking scenario selector
  const scenarioSelector = screen.getByTestId("scenario-selector");
  fireEvent.click(scenarioSelector);

  // check if a few of the scenarios are correctly displayed
  const basicScenario = await screen.findByText("Piece Checkmate 1 Basic checkmates");
  expect(basicScenario).toBeInTheDocument();
  const challengingScenario = await screen.findByText("Piece checkmates 2 Challenging checkmates");
  expect(challengingScenario).toBeInTheDocument();
  const zugzwangScenario = await screen.findByText("Zugzwang Being forced to move");
  expect(zugzwangScenario).toBeInTheDocument();
});

test("choosing lessons", async () => {
  render(
    <MemoryRouter>
      <LessonSelection />
    </MemoryRouter>
  );

  // mock clicking scenario selector
  const scenarioSelector = screen.getByTestId("scenario-selector");
  const lessonSelector = screen.getByTestId("lesson-selector");
  fireEvent.click(scenarioSelector);

  // mock selecting basic checkmates
  const basicScenario = await screen.findByText("Piece Checkmate 1 Basic checkmates");
  fireEvent.click(basicScenario);
  // try displaying lessons
  fireEvent.click(lessonSelector);
  // check if the first two lessons are displayed
  const qrMateText = await screen.findByText("Queen and rook mate");
  expect(qrMateText).toBeInTheDocument();
  const r2MateText = await screen.findByText("Two rook mate");
  expect(r2MateText).toBeInTheDocument();
  // unlocked lessons will not appear 
  await waitFor(() => {
    expect(screen.queryByText("Queen and bishop mate")).not.toBeInTheDocument();
  });
});

test("navigate to lessons", async () => {
  const navigate = jest.fn();
  (useNavigate as jest.Mock).mockReturnValue(navigate);
  render( // component rendering
    <MemoryRouter>
      <LessonSelection />
    </MemoryRouter>
  );

  // mock clicking scenario selector
  const scenarioSelector = screen.getByTestId("scenario-selector");
  fireEvent.click(scenarioSelector);
  // mock selecting basic checkmates
  const basicScenario = await screen.findByText("Piece Checkmate 1 Basic checkmates");
  fireEvent.click(basicScenario);

  // try displaying lessons
  const lessonSelector = screen.getByTestId("lesson-selector");
  fireEvent.click(lessonSelector);
  // choose the first lesson
  const qrMateText = await screen.findByText("Queen and rook mate");
  fireEvent.click(qrMateText);

  // try navigating to the lesson
  const goButton = screen.getByTestId("enterInfo");
  fireEvent.click(goButton);
  // check if the navigations has been called with correct url, piece, and lessonNum
  expect(navigate).toHaveBeenCalledWith('/lessons', {
    state: { piece: "Piece Checkmate 1 Basic checkmates", lessonNum: 0 },
  });
});