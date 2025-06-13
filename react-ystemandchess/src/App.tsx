/**
 * Main Application Component
 * 
 * This is the root component of the React application that sets up the overall
 * structure, routing, and global functionality like user time tracking.
 * It manages the application layout and handles user session monitoring.
 */

import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { environment } from "./environments/environment";
import { useCookies } from "react-cookie";
import { SetPermissionLevel } from "./globals";
import NavBar from "./components/navbar/NavBar";
import Footer from "./components/footer/Footer";
import { environment } from "./environments/environment";
import { useCookies } from "react-cookie";
import { SetPermissionLevel } from "./globals";
import NavBar from "./NavBar/NavBar";
import Footer from "./Footer/Footer";
import AppRoutes from "./AppRoutes";
import "./App.css";

/**
 * Main App component that serves as the root of the application
 * 
 * This component handles:
 * - Application routing setup
 * - User time tracking for analytics
 * - Global layout structure (NavBar, Content, Footer)
 * - User session management
 * 
 * @returns JSX element representing the entire application
 */
function App() {
  const [cookies] = useCookies(["login"]); // get login info from cookie
  let username = null;
  let eventID = null;
  let startTime = null;

  // start recording when users started browsing website
  async function startRecording() {
    const uInfo = await SetPermissionLevel(cookies); // get logged-in user info

    // do nothing if the user is not logged in
    if (uInfo.error) return;
    username = uInfo.username; // else record username

    // Make API call to start time tracking session
    const response = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/start?username=${username}&eventType=website`,
      `${environment.urls.middlewareURL}/timeTracking/start?username=${username}&eventType=website`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${cookies.login}` },
        method: "POST",
        headers: { Authorization: `Bearer ${cookies.login}` },
      }
    );
    if (response.status != 200) console.log(response); // error handling

    // if data is fetched, record for later updates
    const data = await response.json();
    eventID = data.eventId;      // Store event ID for later updates
    startTime = data.startTime;  // Store start time for duration calculation
  }

  /**
   * Handles cleanup when user exits the website
   * 
   * This function is called when the user navigates away from the site
   * or closes the browser tab. It calculates the total time spent and
   * updates the backend with the final session duration.
   * 
   * @returns Promise<void> - Resolves when cleanup is complete
   */
  const handleUnload = async () => {
    try {
      const startDate = new Date(startTime);
      const endDate = new Date();
      
      // Calculate time difference in milliseconds
      const diffInMs = endDate.getTime() - startDate.getTime();
      
      // Convert to seconds for backend storage
      const diffInSeconds = Math.floor(diffInMs / 1000);

      // Send the final time tracking update to the backend
      const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/update?username=${username}&eventType=website&eventId=${eventID}&totalTime=${diffInSeconds}`,
        `${environment.urls.middlewareURL}/timeTracking/update?username=${username}&eventType=website&eventId=${eventID}&totalTime=${diffInSeconds}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${cookies.login}` },
          method: "PUT",
          headers: { Authorization: `Bearer ${cookies.login}` },
        }
      );
      if (response.status != 200) console.log(response); // error handling
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Effect hook for component initialization and cleanup
   * 
   * This effect runs once when the component mounts and sets up:
   * - Initial time tracking for authenticated users
   * - Event listener for browser unload to handle cleanup
   * - Cleanup function to remove event listeners on unmount
   */
  useEffect(() => {
    try {
      // Initialize time tracking when component mounts
      startRecording();
    } catch (err) {
      console.log(err);
    }

    window.addEventListener("beforeunload", handleUnload); // end recording when unloading
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Render the main application structure
   * 
   * The application consists of:
   * - Router: Enables client-side routing
   * - NavBar: Top navigation component
   * - AppRoutes: Main content area with route-based components
   * - Footer: Bottom footer component
   */
  return (
    <Router>
      <div className="App">
        <NavBar />
        <AppRoutes />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
