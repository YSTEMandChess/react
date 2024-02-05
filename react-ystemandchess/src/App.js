import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import NavBar from "./NavBar/NavBar";

function App() {
  return (
    // All components need to be wrapped with the '<Router>' tag
    <Router>
      <div className="App">
        <NavBar>

        </NavBar>
        <Routes>
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;
