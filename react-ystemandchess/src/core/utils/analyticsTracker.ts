import axios from 'axios';
import { getUsernameFromCookie, getAuthTokenFromCookie } from './cookieUtils';

/**
 * AnalyticsTracker Utility
 * 
 * Static class with helper methods for common analytics tracking scenarios.
 * Use this for quick, one-off tracking without needing the useAnalytics hook.
 * Works with cookie-based authentication (JWT in 'login' cookie)
 * 
 * Usage:
 * AnalyticsTracker.setUser('john_doe');
 * AnalyticsTracker.trackLessonStart('lesson_001', 'Introduction to Chess');
 */
interface TrackingConfig {
    username: string | null;
    token: string | null;
    apiBaseUrl: string;
}

class AnalyticsTrackerClass {
    private config: TrackingConfig = {
        username: null,
        token: null,
        apiBaseUrl: '', //will use relative URLs by default
    };

    /**
     * Initialize tracker with user credentials
     * Call this after user logs in
     * 
     * @param username - user's username
     * @param token - JWT auth token (optional)
     */
    setUser(username: string, token?: string): void {
        this.config.username = username;
        if(token) {
            this.config.token = token;
        }
    }

    /**
     * Set JWT token seperately
     * 
     * @param token - JWT auth token
     */
    setToken(token: string): void {
        this.config.token = token;
    }

    /**
     * Get current username from cookie
     */
    private getUsername(): string | null {
        if(this.config.username) return this.config.username;

        const username = getUsernameFromCookie();
        if(username) {
            this.config.username = username;
        }

        return username;
    }

    /**
     * Get current auth token from cookie
     */
    private getToken(): string | null {
        if(this.config.token) return this.config.token;

        const token = getAuthTokenFromCookie();
        if(token) {
            this.config.token = token;
        }

        return token;
    }

    /**
     * Generic click tracking
     */
    private async track(
        page: string,
        element: string,
        elementId?: string,
        action: 'click' | 'view' | 'submit' | 'navigation' = 'click',
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const username = this.getUsername();
            const token = this.getToken();

            if(!username || !token) {
                console.warn('Analytics: Missing username or token');
                return;
            }

            await axios.post(
                '/clickTracking/track',
                {
                    username,
                    page,
                    element,
                    elementId,
                    action,
                    metadata,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.error('Analytics tracking failed:', error);
        }
    }

    /**
     * Track page view
     * 
     * @param page - page name (eg: 'home', 'lessons')
     */
    async trackPageView(page: string): Promise<void> {
        await this.track(page, 'page_view', undefined, 'view');
    }

    /**
     * Track lesson start
     * 
     * @param lessonId - ID of the lesson
     * @param lessonName - Name/title of the lesson
     */
    async trackLessonStart(lessonId: string, lessonName: string): Promise<string | null> {
        try {
            //track the click
            await this.track('lessons', 'start_lesson', lessonId, 'click', {
                lessonName,
            });

            //start time tracking
            const username = this.getUsername();
            const token = this.getToken();

            if(!username || !token) return null;

            const response = await axios.post(
                '/timeTracking/start',
                null,
                {
                    params: {
                        username,
                        eventType: 'lesson',
                        eventName: lessonName,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.eventId;
        } catch (error) {
            console.error('Failed to track lesson start:', error);
            return null;
        }
    }

    /**
     * Track lesson completion
     * 
     * @param lessonId - ID of the lesson
     * @param lessonName - name/title of the lesson
     * @param eventId - event ID from trackLessonStart
     * @param timeSpent - time spent in seconds
     */
    async trackLessonComplete(
        lessonId: string,
        lessonName: string,
        eventId: string,
        timeSpent: number
    ): Promise<void> {
        try {
            //track the completion click
            await this.track('lessons', 'complete_lesson', lessonId, 'submit', {
                lessonName,
                timeSpent,
            });

            //end time tracking
            const username = this.getUsername();
            const token = this.getToken();

            if(!username || !token) return;

            await axios.put(
                '/timeTracking/update',
                null,
                {
                    params: {
                        username,
                        eventType: 'lesson',
                        eventId,
                        totalTime: timeSpent,
                        eventName: lessonName,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.error('Failed to track lesson completion:', error);
        }
    }

    /** 
     * Track puzzle attempt
     * 
     * @param puzzleId - ID of the puzzle
     * @param success - Whether puzzle was solved
     * @param attempts - Number of attempts (optional)
     */
    async trackPuzzleAttempt(
        puzzleId: string,
        success: boolean,
        attempts?: number
    ): Promise<void> {
        await this.track(
            'puzzles',
            success ? 'puzzle_solved' : 'puzzle_attempted',
            puzzleId,
            'submit',
            {
                success,
                attempts,
            }
        );
    }

    /**
     * Track game start
     * 
     * @param gameType - type of game
     * @param gameId - ID of the game
     */
    async trackGameStart(gameType: string, gameId: string): Promise<string | null> {
        try {
            await this.track('play', 'start_game', gameId, 'click', { gameType });

            //start time tracking
            const username = this.getUsername();
            const token = this.getToken();

            if(!username || !token) return null;

            const response = await axios.post(
                '/timeTracking/start',
                null,
                {
                    params: {
                        username,
                        eventType: 'play',
                        eventName: `${gameType} Game`,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.eventId;
        } catch (error) {
            console.error('Failed to track game start:', error);
            return null;
        }
    }

    /**
     * Track game completion
     * 
     * @param gameId - ID of the game
     * @param eventId - event ID from trackGameStart
     * @param timeSpent - time spent in seconds
     * @param result - game result(win/loss/draw)
     */
    async trackGameComplete(
        gameId: string,
        eventId: string,
        timeSpent: number,
        result: 'win' | 'loss' | 'draw'
    ): Promise<void> {
        try {
            await this.track('play', 'complete_game', gameId, 'submit', {
                result,
                timeSpent
            });

            //end time tracking
            const username = this.getUsername();
            const token = this.getToken();

            if(!username || !token) return;

            await axios.put(
                '/timeTracking/update',
                null,
                {
                    params: {
                        username,
                        eventType: 'play',
                        eventId,
                        totalTime: timeSpent,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.error('Failed to track game completion:', error);
        }
    }

    /**
     * Track navigation clicks
     * 
     * @param from - where user is navigating from
     * @param to - where user is navigating to
     */
    async trackNavigation(from: string, to: string): Promise<void> {
        await this.track('navigation', `${from}_to_${to}`, undefined, 'navigation', {
            from,
            to,
        });
    }

    /**
     * Track button click
     * 
     * @param page - current page
     * @param buttonName - name/ID of button
     * @param metadata - additional context
     */
    async trackButtonClick (
        page: string,
        buttonName: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.track(page, buttonName, undefined, 'click', metadata);
    }

    /**
     * Track mentor session start
     * 
     * @param mentorId - ID of the mentor
     * @param sessionId - ID of the session
     */
    async trackMentorSessionStart(mentorId: string, sessionId: string) : Promise<string | null> {
        try {
            await this.track('mentor', 'session_start', sessionId, 'click', {mentorId});

            const username = this.getUsername();
            const token = this.getToken();

            if(!username || !token) return null;

            const response = await axios.post(
                '/timetracking/start',
                null,
                {
                    params: {
                        username,
                        eventType: 'mentor',
                        eventName: `Mentor Session ${sessionId}`,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.eventId;
        } catch (error) {
            console.error('Failed to track mentor session start:', error);
            return null;
        }
    }

    /**
     * Track mentor session end
     * 
     * @param sessionId - ID of the session
     * @param eventId - event ID from trackMentorSessionStart
     * @param timeSpent - time spent in seconds
     */
    async trackMentorSessionEnd(
        sessionId: string,
        eventId: string,
        timeSpent: number
    ): Promise<void> {
        try {
            await this.track('mentor', 'session_end', sessionId, 'submit', {timeSpent});

            const username = this.getUsername();
            const token = this.getToken();

            if(!username || !token) return;

            await axios.put(
                '/timeTracking/update',
                null,
                {
                    params: {
                        username,
                        eventType: 'mentor',
                        eventId,
                        totalTime: timeSpent,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.error('Failed to track mentor session end:', error);
        }
    }

    /**
     * Clear user data (eg: on logout)
     */
    clearUser(): void {
        this.config.username = null;
        this.config.token = null;
    }
}

//export singleton instance
export const AnalyticsTracker = new AnalyticsTrackerClass();
export default AnalyticsTracker;