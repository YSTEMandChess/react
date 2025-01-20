import "./App.css";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import NavBar from "./NavBar/NavBar";
import Footer from "./Footer/Footer";
import AppRoutes from "./AppRoutes";

function App() {
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
