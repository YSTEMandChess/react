import { useCallback } from "react";
import axios from "axios";
import { getUsernameFromCookie, getAuthTokenFromCookie } from "../utils/cookieUtils";

/**
 * useAnalytics Hook
 * 
 * Provides easy-to-use functions for tracking user interactions
 * Handles API calls to backend analytics endpoints
 * Works with cookie-based authentication (JWT in 'login' cookie)
 * 
 * Usage: 
 * const {trackClick, trackTimeStart, trackTimeEnd} = useAnalytics();
 * 
 * trackClick({page: 'lessons', element: 'start_btn'})
 */

interface ClickEvent {
    page: string;
    element: string;
    elementId?: string;
    action?: 'click' | 'view' | 'submit' | 'navigation';
    metadata?: Record<string, any>;
    sessionId?: string;
}

interface TimeTrackingResponse {
    eventId: string;
    username: string;
    eventType: string;
    startTime: string;
}

export const useAnalytics = () => {
    /**
     * Get username from JWT token in cookie
     * Uses the same authentication approach as SetPermissionLevel in global.ts
     */
    const getUsername = useCallback((): string | null => {
        return getUsernameFromCookie();
    }, []);

    /**
     * Get JWT token from cookie for authenticated requests
     * Returns the raw JWT token from the 'login' cookie
     */
    const getAuthToken = useCallback((): string | null => {
        return getAuthTokenFromCookie();
    }, []);

    /**
     * Track a click or interaction event
     * 
     * @param event - Click event details
     * @returns Promise that resolves when tracking is complete
     */
    const trackClick = useCallback(async (event: ClickEvent): Promise<void> => {
        try {
            const username = getUsername();
            if(!username) {
                console.warn('Analytics: No username found, skipping click tracking');
                return;
            }

            const token = getAuthToken();
            if(!token){
                console.warn('Analytics: No auth token found, skipping click tracking');
                return;
            }

            await axios.post(
                'clickTracking/track',
                {
                    username,
                    ...event,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
        } catch (error) {
            //fail silently, don't break user experience if analytics fails
            console.error('Analytics tracking failed:', error);
        }
    }, [getUsername, getAuthToken]);

    /**
     * Track page view
     * Call this in useEffect when component mounts
     * 
     * @param page - page name
     */
    const trackPageView = useCallback(async(page: string): Promise<void> => {
        await trackClick({
            page,
            element: 'page_view',
            action: 'view',
        });
    }, [trackClick]);
    
    /**
     * Start time tracking for an activity
     * 
     * @param eventType - type of event (mentor/lesson/play/puzzle/website)
     * @param eventName - optional name for the event
     * @returns Promise with eventId for later use in trackTimeEnd
     */
    const trackTimeStart = useCallback(async (
        eventType: 'mentor' | 'lesson' | 'play' | 'puzzle' | 'website',
        eventName?: string
    ): Promise<string | null> => {
        try {
            const username = getUsername();
            if(!username) {
                console.warn('Analytics: No username found, skipping time tracking');
                return null;
            }

            const token = getAuthToken();
            if (!token) {
                console.warn('Analytics: No auth token found, skipping time tracking');
                return null;
            } 

            const response = await axios.post<TimeTrackingResponse>(
                '/timeTracking/start',
                null,
                {
                    params: {username, eventType, eventName},
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.eventId;
        } catch (error) {
            console.error('Time tracking start failed:', error);
            return null;
        }
    }, [getUsername, getAuthToken]);

    /**
     * End time tracking for an activity
     * 
     * @param eventType - type of event (must match trackTimeStart)
     * @param eventId - event ID returned from trackTimeStart
     * @param totalTime - total time in seconds
     * @param eventName - optional event name
     */
    const trackTimeEnd = useCallback(async (
        eventType: 'mentor' | 'lesson' | 'play' | 'puzzle' | 'website',
        eventId: string,
        totalTime: number,
        eventName?: string
    ): Promise<void> => {
        try {
            const username = getUsername();
            if(!username) {
                console.warn('Analytics: no username found, skipping time tracking');
                return;
            }

            const token = getAuthToken();
            if(!token) {
                console.warn('Analytics: No auth token found, skipping time tracking');
                return;
            }

            await axios.put(
                '/timeTracking/update',
                null,
                {
                    params: {username, eventType, eventId, totalTime, eventName},
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.error('Time tracking update failed:', error);
        }
    }, [getUsername, getAuthToken]);

    /**
     * Track multiple clicks at once (batch)
     * Useful for sending accumulated clicks
     * 
     * @param events - array of click events
     */
    const trackClickBatch = useCallback(async (events: ClickEvent[]): Promise<void> => {
        try {
            const username = getUsername();
            if(!username) return;

            const token = getAuthToken();
            if(!token) return;

            //add username to each event
            const eventsWithUsername = events.map(event => ({
                ...event,
                username,
            }));

            await axios.post(
                'cliclTracking/batch',
                { events: eventsWithUsername },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.error('Batch click tracking failed:', error);
        }
    }, [getUsername, getAuthToken]);

    return {
        trackClick,
        trackPageView,
        trackTimeStart,
        trackTimeEnd,
        trackClickBatch,
    };
};

export default useAnalytics;