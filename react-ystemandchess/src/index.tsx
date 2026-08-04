/**
 * Application Entry Point
 * 
 * This is the main entry file for the React application.
 * It bootstraps the React app by mounting the root App component
 * to the HTML DOM element with id 'root'.
 */

import ReactDOM from "react-dom/client";
import "./i18n"; // initialize i18next + browser language detection before any component renders
import App from "./App";
import "./index.css";

// Create a root React element and mount it to the DOM
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Render the main App component
root.render(<App />);
