import { renderHook, act } from "@testing-library/react";
import { useLessonManager } from "./useLessonManager";

// Mock fetch globally for this module
jest.mock("node-fetch", () => ({
  __esModule: true,
  default: jest.fn((url: string) => {
    if (url.includes("getLesson")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            startFen: "mockFen",
            endFen: "mockEndFen",
            name: "Test Lesson",
            info: "Test Info",
            lessonNum: 1,
          }),
      });
    }
    if (url.includes("getCompletedLessonCount")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(1) });
    }
    if (url.includes("getTotalPieceLesson")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(3) });
    }
    return Promise.reject(`Unhandled fetch URL: ${url}`);
  }),
}));

const mockCookies = { login: "mockToken" };

it("fetches and sets lesson data", async () => {
  const { result } = renderHook(() =>
    useLessonManager("queen", mockCookies)
  );

  await act(async () => {
    await result.current.goToLesson(0);
  });

  expect(result.current.lessonData?.name).toBe("Test Lesson");
});
