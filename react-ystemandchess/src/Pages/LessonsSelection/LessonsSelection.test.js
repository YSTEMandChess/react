import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router';
import { useCookies } from 'react-cookie';
import LessonSelection from './LessonSelection';
import { getScenarioLength, getScenario } from '../Lessons/Scenarios'; // Mock this dependency
import { environment } from '../../environments/environment'; // Mock this dependency

// Mock the useNavigate hook
jest.mock('react-router', () => ({
  useNavigate: jest.fn(),
}));

// Mock the useCookies hook
jest.mock('react-cookie', () => ({
  useCookies: jest.fn(),
}));

// Mock the Scenarios functions
jest.mock('../Lessons/Scenarios', () => ({
  getScenarioLength: jest.fn(),
  getScenario: jest.fn(),
}));

// Mock the environment variable
jest.mock('../../environments/environment', () => ({
  environment: {
    urls: {
      middlewareURL: 'http://mock-middleware-url.com',
    },
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LessonSelection', () => {
  const mockNavigate = jest.fn();
  const mockSetCookie = jest.fn(); // Mock setCookie if needed in future tests
  const mockRemoveCookie = jest.fn(); // Mock removeCookie if needed in future tests

  beforeEach(() => {
    // Reset mocks before each test
    mockNavigate.mockClear();
    mockFetch.mockClear();
    mockSetCookie.mockClear();
    mockRemoveCookie.mockClear();

    useNavigate.mockReturnValue(mockNavigate);
    useCookies.mockReturnValue([
      { login: 'mock-token' }, // Provide a mock login cookie
      mockSetCookie,
      mockRemoveCookie,
    ]);

    // Set up mock scenarios
    getScenarioLength.mockReturnValue(8); // Total scenarios, including those before index 6
    getScenario.mockImplementation((index) => {
      const scenarios = [
        // Dummy scenarios for indices 0-5 (will be filtered out by for loop starting at 6)
        { name: 'Intro 1', subSections: [] },
        { name: 'Intro 2', subSections: [] },
        { name: 'Intro 3', subSections: [] },
        { name: 'Intro 4', subSections: [] },
        { name: 'Intro 5', subSections: [] },
        { name: 'Intro 6', subSections: [] },
        // Actual scenarios that will be rendered (indices 6 and 7)
        {
          name: 'Scenario A',
          subSections: [
            { name: 'Lesson A1' },
            { name: 'Lesson A2' },
            { name: 'Lesson A3' },
          ],
        },
        {
          name: 'Scenario B',
          subSections: [
            { name: 'Lesson B1' },
            { name: 'Lesson B2' },
          ],
        },
      ];
      return scenarios[index];
    });
  });

  // --- Test 1: Renders correctly with initial state ---
  test('renders correctly with initial state', () => {
    render(<LessonSelection />);

    // Check for the title
    expect(screen.getByText('Lesson Selection')).toBeInTheDocument();

    // Check for initial scenario and lesson placeholders
    expect(screen.getByText('Select a scenario.')).toBeInTheDocument();
    expect(screen.getByText('Select a lesson.')).toBeInTheDocument();

    // Check for the "Go!" button
    expect(screen.getByRole('button', { name: 'Go!' })).toBeInTheDocument();
  });

  // --- Test 2: Toggles scenario dropdown visibility ---
  test('toggles scenario dropdown visibility', async () => {
    render(<LessonSelection />);

    // Initially, scenarios should not be visible
    expect(screen.queryByText('Scenario A')).not.toBeInTheDocument();

    // Click the scenario selector to open it
    fireEvent.click(screen.getByText('Select a scenario.'));

    // Scenarios should now be visible
    await waitFor(() => {
      expect(screen.getByText('Scenario A')).toBeInTheDocument();
      expect(screen.getByText('Scenario B')).toBeInTheDocument();
    });

    // Click again to close
    fireEvent.click(screen.getByText('Scenario A').closest('.selector')); // Click on the selector itself

    // Scenarios should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('Scenario A')).not.toBeInTheDocument();
      expect(screen.queryByText('Scenario B')).not.toBeInTheDocument();
    });
  });

  // --- Test 3: Selects a scenario and shows loading state for lessons ---
  test('selects a scenario and shows loading state for lessons', async () => {
    render(<LessonSelection />);

    // Open scenario dropdown
    fireEvent.click(screen.getByText('Select a scenario.'));

    // Mock fetch response for unlocked lessons (simulating pending state)
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(1), { status: 200 }));

    // Click on 'Scenario A'
    fireEvent.click(screen.getByText('Scenario A'));

    // Verify 'Scenario A' is selected
    expect(screen.getByText('Scenario A')).toBeInTheDocument();
    expect(screen.getByText('Select a lesson.')).toBeInTheDocument(); // Lesson should still be 'Select a lesson.'

    // Open lesson dropdown
    fireEvent.click(screen.getByText('Select a lesson.'));

    // It should immediately show "Loading..."
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for the fetch to resolve and lessons to appear
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Lesson A1')).toBeInTheDocument();
    });

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      'http://mock-middleware-url.com/lessons/getCompletedLessonCount?piece=Scenario A',
      expect.any(Object)
    );
  });

  // --- Test 4: Selects a lesson and enables "Go!" button ---
  test('selects a lesson and enables "Go!" button', async () => {
    render(<LessonSelection />);

    // Mock fetch response for unlocked lessons
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(1), { status: 200 }));

    // Select Scenario A
    fireEvent.click(screen.getByText('Select a scenario.'));
    fireEvent.click(screen.getByText('Scenario A'));

    // Wait for lessons to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open lesson dropdown
    fireEvent.click(screen.getByText('Select a lesson.'));

    // Select Lesson A1
    fireEvent.click(screen.getByText('Lesson A1'));

    // Verify Lesson A1 is selected
    expect(screen.getByText('Lesson A1')).toBeInTheDocument();
    expect(screen.queryByText('Select a lesson.')).not.toBeInTheDocument();
  });

  // --- Test 5: Navigates to learnings page on "Go!" click ---
  test('navigates to learnings page on "Go!" click with selected lesson', async () => {
    render(<LessonSelection />);

    // Mock fetch response for unlocked lessons
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(1), { status: 200 }));

    // Select Scenario A
    fireEvent.click(screen.getByText('Select a scenario.'));
    fireEvent.click(screen.getByText('Scenario A'));

    // Wait for lessons to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open lesson dropdown
    fireEvent.click(screen.getByText('Select a lesson.'));

    // Select Lesson A1
    fireEvent.click(screen.getByText('Lesson A1'));

    // Click the "Go!" button
    fireEvent.click(screen.getByRole('button', { name: 'Go!' }));

    // Verify navigate was called with correct arguments
    expect(mockNavigate).toHaveBeenCalledWith('/learnings', {
      state: { piece: 'Scenario A', lessonNum: 0 },
    });
  });

  // --- Test 6: Shows error if "Go!" is clicked without selection ---
  test('shows error if "Go!" is clicked without selection', async () => {
    render(<LessonSelection />);

    // Click "Go!" without selecting anything
    fireEvent.click(screen.getByRole('button', { name: 'Go!' }));

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Select a scenario & lesson.')).toBeInTheDocument();
    });

    // Click OK on error
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => {
      expect(screen.queryByText('Select a scenario & lesson.')).not.toBeInTheDocument();
    });
  });

  // --- Test 7: Handles API error for fetching unlocked lesson count ---
  test('handles API error for fetching unlocked lesson count', async () => {
    render(<LessonSelection />);

    // Mock fetch to throw an error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Select Scenario A
    fireEvent.click(screen.getByText('Select a scenario.'));
    fireEvent.click(screen.getByText('Scenario A'));

    // Open lesson dropdown
    fireEvent.click(screen.getByText('Select a lesson.'));

    // Should still show "Loading..." initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for the fetch to (fail and) resolve, showing only the first lesson
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Lesson A1')).toBeInTheDocument(); // Only the first lesson should be available by default on error
      expect(screen.queryByText('Lesson A2')).not.toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalledWith('Error fetching unlocked lesson count:', expect.any(Error));
  });

  // --- Test 8: Displays multiple unlocked lessons based on API response ---
  test('displays multiple unlocked lessons based on API response', async () => {
    render(<LessonSelection />);

    // Mock fetch response for unlocked lessons (e.g., 2 lessons unlocked)
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(2), { status: 200 }));

    // Select Scenario A
    fireEvent.click(screen.getByText('Select a scenario.'));
    fireEvent.click(screen.getByText('Scenario A'));

    // Wait for lessons to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open lesson dropdown
    fireEvent.click(screen.getByText('Select a lesson.'));

    // Both Lesson A1 and A2 should be visible
    expect(screen.getByText('Lesson A1')).toBeInTheDocument();
    expect(screen.getByText('Lesson A2')).toBeInTheDocument();
    expect(screen.queryByText('Lesson A3')).not.toBeInTheDocument(); // A3 should not be visible as only 2 are unlocked
  });
});