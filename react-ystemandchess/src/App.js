import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import NavBar from "./NavBar/NavBar";
import Home from "./Pages/Home/Home";
import Programs from "./Pages/Programs/Programs";
import Login from "./Pages/Login/Login";

function App() {
  return (
    // All components need to be wrapped with the '<Router>' tag
    <Router>
      <div className="App">
        <NavBar>

        </NavBar>
        <Routes>

          <Route path="/" element={<Home></Home>}></Route>
          <Route path="/programs" element={<Programs></Programs>}>
            <Route></Route>
          </Route>
          <Route path="/login" element={<Login></Login>}></Route>
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;
