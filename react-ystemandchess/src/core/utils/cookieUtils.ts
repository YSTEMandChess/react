/**
 * Cookie Utilities for Analytics
 * 
 * Helper functions to work with cookie-based authentication
 * Used by analytcis system to extract username and JWT token
 */

/**
 * Parse all cookies into an object
 * @returns Object with cookie names as keys and values
 */
export const parseCookies = (): Record<string, string> => {
    return document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if(key && value) {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, string>);
};

/**
 * Get a specific cookie value
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export const getCookie = (name: string): string | null => {
    const cookies = parseCookies();
    return cookies[name] || null;
};

/**
 * Decode JWT token and extract payload
 * @param token - JWT token string
 * @returns Decoded payload object or null if invalid
 */
export const decodeJWT = (token: string): any | null => {
    try {
        //JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        //decode the payload (second part)
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (e) {
        console.error('Failed to decode JWT:', e);
        return null;
    }
};

/**
 * Get username from login cookie
 * @returns Username or null if not authenticated
 */
export const getUsernameFromCookie = (): string | null => {
    const loginCookie = getCookie('login');
    if(!loginCookie) 
        return null;

    const payload = decodeJWT(loginCookie);
    if(!payload)
        return null;

    return payload.username || payload.user || payload.email || null;
};

/**
 * Get JWT token from login cookie
 * @returns JWT token or null if not authenticated
 */
export const getAuthTokenFromCookie = (): string | null => {
    return getCookie('login');
};

/**
 * Check if user is authenticated (has valid login cookie)
 * @returns boolean indicating if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    const token = getAuthTokenFromCookie();
    if(!token) return false;

    const payload = decodeJWT(token);
    if(!payload) return false;

    //optionally check token expiration
    if(payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            return false; //token expired
        }
    }

    return true;
};

/**
 * Get use information from login cookie
 * @returns User info object or null if not authenticated
 */
export const getUserInfo = (): any | null => {
    const loginCookie = getCookie('login');
    if(!loginCookie) return null;

    return decodeJWT(loginCookie);
}