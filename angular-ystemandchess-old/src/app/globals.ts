/**
 * Global Authentication Utilities
 * 
 * This module provides authentication and authorization functions used throughout
 * the Angular application. It validates user sessions and determines access levels.
 * 
 * @deprecated This is the old Angular version. 
 * Similar functionality exists in the React version (react-ystemandchess/src/globals.ts).
 */

import { environment } from './../environments/environment';
import { CookieService } from 'ngx-cookie-service';

/**
 * Global variable to store decoded user information from JWT token
 */
var information;

/**
 * Validates user authentication and determines permission level
 * 
 * Checks if a user has a valid login cookie, validates it with the backend,
 * and returns either user information or an error object.
 * 
 * @param cookie - CookieService instance for accessing browser cookies
 * @returns Promise resolving to user information object or error object
 */
async function setPermissionLevel(cookie: CookieService) {
  let cookieName: string = 'login';
  
  // Check if login cookie exists
  if (cookie.check(cookieName)) {
    var rawData;
    let cookieContents: string = cookie.get(cookieName);
    
    // Validate the token with the authentication service
    let url = `${environment.urls.middlewareURL}/auth/validate`;
    var headers = new Headers();
    headers.append('Authorization', `Bearer ${cookieContents}`);
    
    await fetch(url, { method: 'POST', headers: headers })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        rawData = data;
      });
    
    // Check if token is invalid or expired
    if (
      rawData.includes('Unauthorized') ||
      rawData.includes('Error 405: User authentication is not valid or expired')
    ) {
      // Remove invalid cookie
      cookie.delete(cookieName);
      return {
        error: 'Error 405: User authentication is not valid or expired',
      };
    } else {
      // Decode JWT payload to extract user information
      information = JSON.parse(atob(cookieContents.split('.')[1]));
      return information;
    }
  } else {
    // No login cookie found
    console.log("errrrrrrrrrrr")
    return { error: 'User is not logged in' };
  }
}

// Export authentication utilities
export { setPermissionLevel, information };

// Test credentials (for development/testing only)
// testUsername
// 123456789
