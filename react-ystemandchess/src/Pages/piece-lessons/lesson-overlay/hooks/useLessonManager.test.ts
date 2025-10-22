import { renderHook } from "@testing-library/react";
import { useLessonManager } from "./useLessonManager";

test("stub: initializes hook without crashing", () => {
  const mockCookies = { login: "mockToken" };
  const { result } = renderHook(() => useLessonManager("queen", mockCookies));
  expect(result.current).toBeDefined();
});
