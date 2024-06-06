import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import NavBar from "./NavBar/NavBar";
import Home from "./Pages/Home/Home";
import Programs from "./Pages/Programs/Programs";
import CSBenefitPage from "./Pages/About-Us/Benefit-of-CS/CSBenefitPage";
import ChessBenefitPage from "./Pages/About-Us/Benefit-of-Chess/ChessBenefitPage";
import MathTutBenefitPage from "./Pages/About-Us/Benefit-of-Math-tut/MathTutBenefitPage";
import MentoringBenefitPage from "./Pages/About-Us/Benefit-of-Mentoring/MentoringBenefitPage";
import StudentProfile from "./Pages/Student-Profile/Student-Profile";
import MentorProfile from "./Pages/Mentor-Profile/Mentor-Profile";
import Login from "./Pages/Login/Login";
import SignUp from "./Pages/SignUp/SignUp";
import Footer from "./Footer/Footer";
import Mission from "./Pages/About-Us/Mission/Mission";

function App() {
  return (
    // All components need to be wrapped with the '<Router>' tag
    <Router>
      <div className="App">
        <NavBar></NavBar>
        <Routes>
          <Route path="/" element={<Home></Home>}></Route>
          <Route path="/programs" element={<Programs></Programs>}>
            <Route></Route>
          </Route>
          <Route
            path="/benefit-of-computer-science"
            element={<CSBenefitPage></CSBenefitPage>}
          ></Route>
          <Route
            path="/benefit-of-chess"
            element={<ChessBenefitPage></ChessBenefitPage>}
          ></Route>
          <Route
            path="/benefit-of-math-tutoring"
            element={<MathTutBenefitPage></MathTutBenefitPage>}
          ></Route>
          <Route
            path="/benefit-of-mentoring"
            element={<MentoringBenefitPage></MentoringBenefitPage>}
          ></Route>
          <Route path="/login" element={<Login></Login>}></Route>
          <Route path="/signup" element={<SignUp />}></Route>
          <Route path="/mission" element={<Mission></Mission>}></Route>
          <Route path="/student-profile" element={<StudentProfile />}></Route>
          <Route path="/mentor-profile" element={<MentorProfile />}></Route>
        </Routes>
      </div>

      <Footer></Footer>
    </Router>
  );
}

export default App;
