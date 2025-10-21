import { renderHook, act } from "@testing-library/react";
import { useLessonManager } from "./useLessonManager";

const mockCookies = { login: "mockToken" };

beforeEach(() => {
  	global.fetch = jest.fn((url) => {
		if (url.includes("getLesson")) {
	  		return Promise.resolve({
				json: () => Promise.resolve({
		  		startFen: "mockFen",
		  		endFen: "mockEndFen",
		  		name: "Test Lesson",
		  		info: "Test Info",
		  		lessonNum: 1
				}),
	  		});
		}
		if (url.includes("getCompletedLessonCount")) {
	  		return Promise.resolve({ json: () => Promise.resolve(1) });
		}
		if (url.includes("getTotalPieceLesson")) {
	  		return Promise.resolve({ json: () => Promise.resolve(3) });
		}
		return Promise.reject("Unhandled fetch " + url);
  	}) as jest.Mock;
});

it("fetches and sets lesson data", async () => {
  	const { result } = renderHook(() =>
		useLessonManager("queen", mockCookies)
  	);

  	await act(async () => {
		await result.current.goToLesson(0);
  	});

  	expect(result.current.lessonData.name).toBe("Test Lesson");
});
