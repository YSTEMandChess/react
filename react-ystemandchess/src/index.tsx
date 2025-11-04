/**
 * Application Entry Point
 * 
 * This is the main entry file for the React application.
 * It bootstraps the React app by mounting the root App component
 * to the HTML DOM element with id 'root'.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Create a root React element and mount it to the DOM
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Render the main App component
root.render(<App />);
