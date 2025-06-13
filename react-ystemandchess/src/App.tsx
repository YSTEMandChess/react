import "./App.css";
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { environment } from "./environments/environment";
import { useCookies } from "react-cookie";
import { SetPermissionLevel } from "./globals";
import NavBar from "./NavBar/NavBar";
import Footer from "./Footer/Footer";
import AppRoutes from "./AppRoutes";

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

    // start recording user's time spent browsing the website
    const response = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/start?username=${username}&eventType=website`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${cookies.login}` },
      }
    );
    if (response.status != 200) console.log(response); // error handling

    // if data is fetched, record for later updates
    const data = await response.json();
    eventID = data.eventId;
    startTime = data.startTime;
  }

  // handler called when user exist the website, complete recording time
  const handleUnload = async () => {
    try {
      const startDate = new Date(startTime);
      const endDate = new Date();
      const diffInMs = endDate.getTime() - startDate.getTime(); // time elapsed in milliseconds
      const diffInSeconds = Math.floor(diffInMs / 1000); // time elapsed in seconds

      // update the time users spent browsing website
      const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/update?username=${username}&eventType=website&eventId=${eventID}&totalTime=${diffInSeconds}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${cookies.login}` },
        }
      );
      if (response.status != 200) console.log(response); // error handling
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    try {
      startRecording(); // start recording
    } catch (err) {
      console.log(err);
    }

    window.addEventListener("beforeunload", handleUnload); // end recording when unloading
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

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
