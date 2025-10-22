import { renderHook, act } from "@testing-library/react";
import { useLessonManager } from "./useLessonManager";

const mockCookies = { login: "mockToken" };

beforeEach(() => {
  global.fetch = jest.fn((url) => {
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
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(1),
      });
    }
    if (url.includes("getTotalPieceLesson")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(3),
      });
    }
    return Promise.reject("Unhandled fetch " + url);
  }) as jest.Mock;
});

it("fetches and sets lesson data correctly", async () => {
  const { result } = renderHook(() =>
    useLessonManager("queen", mockCookies)
  );

  // Use act to wait for async updates
  await act(async () => {
    await result.current.goToLesson(0);
  });

  // After act, state has been updated
  expect(result.current.lessonData).toBeDefined();
  expect(result.current.lessonData.name).toBe("Test Lesson");
  expect(result.current.lessonData.info).toBe("Test Info");
});
