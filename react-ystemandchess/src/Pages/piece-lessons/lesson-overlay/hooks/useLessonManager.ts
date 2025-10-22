import { useState, useRef} from "react";
import { environment } from "../../../../environments/environment";

export function useLessonManager(piece: string, cookies: any, passedLessonNumber?: number) {
	const [lessonNum, setLessonNum] = useState(0);
  	const [completedNum, setCompletedNum] = useState(0);
 	const [totalLessons, setTotalLessons] = useState(0);
 	const [lessonData, setLessonData] = useState<any>(null);

	const getLessonsCompletedRef = useRef<() => Promise<void>>(async () => {});
  	const getCurrentLessonsRef = useRef<(num: number) => Promise<void>>(async () => {});
  	const updateCompletionRef = useRef<() => Promise<void>>(async () => {});
  	const getTotalLessonsRef = useRef<() => Promise<void>>(async () => {});


	// get # of completed lessons for this category
	getLessonsCompletedRef.current = async () => {
		// update # of completed lessons
		const response = await fetch(
			`${environment.urls.middlewareURL}/lessons/getCompletedLessonCount?piece=${piece}`, 
			{
				method: 'GET',
				headers: { 'Authorization': `Bearer ${cookies.login}` }
			}
		);
		const completedCount = await response.json();
		setCompletedNum(completedCount);

		console.log("LESSONS COMPLETED #:");
		console.log(completedCount);

		if (passedLessonNumber != null) {
			// if navigated from menu, with specified lesson number
			getCurrentLessonsRef.current(passedLessonNumber);
		} else {
			// if directly navigated, current lesson is the next not completed lesson
			setLessonNum(completedCount);
			getCurrentLessonsRef.current(completedCount);
		}
	};

	// get the lesson content for a specific number
	getCurrentLessonsRef.current = async (lessonNumber: number) => {
		const response = await fetch(
			`${environment.urls.middlewareURL}/lessons/getLesson?piece=${piece}&lessonNum=${lessonNumber + 1}`,
			{
				method: 'GET', 
				headers: { 'Authorization': `Bearer ${cookies.login}` }
			}
		);
		const lesson = await response.json();
		setLessonData(lesson);
	};

	// get total # of lessons for category
	getTotalLessonsRef.current = async () => {
		console.log("INSIDE TOTAL LESSON REF");
		const response = await fetch(
			`${environment.urls.middlewareURL}/lessons/getTotalPieceLesson?piece=${piece}`,
			{
				method: 'GET',
				headers: { 'Authorization': `Bearer ${cookies.login}` }
			}
		);
		const total = await response.json();
		setTotalLessons(total); // update in UI
		console.log("TOTAL LESSONS FETCHED");
		console.log(total);
	};

	// Update the user's lesson progress in this category
	updateCompletionRef.current = async () => {	
		if (lessonNum === completedNum) { // allow back end update only for the first unfinished lesson
			setCompletedNum(prevNum => prevNum + 1);
			await fetch(
				`${environment.urls.middlewareURL}/lessons/updateLessonCompletion?piece=${piece}&lessonNum=${lessonNum}`,
				{
					method: 'GET',
					headers: { 'Authorization': `Bearer ${cookies.login}` }
				}
			);
		}

		if (lessonNum < totalLessons - 1) {
			// Move to next lesson if there are any
			setLessonNum(prevNum => prevNum + 1);
			getCurrentLessonsRef.current(lessonNum + 1);
		}
	};

	return {
		lessonData,
		lessonNum,
		completedNum,
		totalLessons,
    	getLessonsCompletedRef,
    	getCurrentLessonsRef,
    	getTotalLessonsRef,
    	updateCompletionRef,
    	setLessonNum,
  	};
}
