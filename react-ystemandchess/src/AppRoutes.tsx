/**
 * Application Routes Configuration
 * 
 * This component defines all the routes and their corresponding page components
 * for the React application. It uses React Router to handle client-side routing
 * and maps URL paths to specific page components.
 * 
 * The routing structure includes:
 * - Public pages (Home, About Us sections, Programs)
 * - Authentication pages (Login, SignUp, Password management)
 * - User-specific pages (Student/Mentor profiles and dashboards)
 * - Educational content (Lessons, Puzzles, Learning materials)
 */

// React and routing imports
import React from "react";
import { Route, Router, Routes } from "react-router-dom";

// Page component imports - organized by category
// Home and main pages
import Home from "./Pages/Home/Home";
import Programs from "./Pages/Programs/Programs";

// About Us section pages
import CSBenefitPage from "./Pages/About-Us/Benefit-of-CS/CSBenefitPage";
import ChessBenefitPage from "./Pages/About-Us/Benefit-of-Chess/ChessBenefitPage";
import MathTutBenefitPage from "./Pages/About-Us/Benefit-of-Math-tut/MathTutBenefitPage";
import MentoringBenefitPage from "./Pages/About-Us/Benefit-of-Mentoring/MentoringBenefitPage";
import Mission from "./Pages/About-Us/Mission/Mission";
import SponsorsPartners from "./Pages/About-Us/SponsorsPartners/SponsorsPartners";
import Board from "./Pages/About-Us/Board/Board";
import Financial from "./Pages/About-Us/Financial/Financial";
import AboutUs from "./Pages/About-Us/AboutUs/AboutUs";

// Educational content pages
import Lessons from "./Pages/Lessons/Lessons";
import Puzzles from './Pages/Puzzles/Puzzles';
import LessonSelection from "./Pages/LessonsSelection/LessonsSelection";
import LessonOverlay from "./Pages/piece-lessons/lesson-overlay/lesson-overlay";

// Authentication and user management pages
import Login from "./Pages/Login/Login";
import SignUp from "./Pages/SignUp/SignUp";
import ResetPassword from "./Pages/Reset-Password/reset-password";
import SetPassword from "./Pages/Set-Password/set-password";

// User profile and dashboard pages
import Student from "./Pages/Student/Student";
import Mentor from "./Pages/Mentor/Mentor";
import StudentInventory from "./Pages/Student-Inventory/StudentInventory";
import NewMentorProfile from "./Pages/NewMentorProfile/NewMentorProfile";
import NewStudentProfile from "./Pages/NewStudentProfile/NewStudentProfile";

// Static assets and default data
import userPortraitImg from "./images/user-portrait-placeholder.svg";

/**
 * Default username for components that require user data
 * TODO: This should be replaced with dynamic user data from authentication
 */
const userName = "Nimesh Patel";

/**
 * Main routing component that defines all application routes
 * 
 * This component uses React Router's Routes and Route components to define
 * the mapping between URL paths and their corresponding page components.
 * Each route represents a different page or section of the application.
 * 
 * Route Categories:
 * - "/" - Landing/Home page
 * - "/about-*" - Various About Us pages explaining benefits and mission
 * - "/auth-*" - Authentication-related pages (login, signup, password reset)
 * - "/profile-*" - User profile and dashboard pages
 * - "/learning-*" - Educational content and lesson pages
 * 
 * @returns JSX element containing all route definitions
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Home page - main landing page */}
      <Route path="/" element={<Home />} />
      
      {/* Program information page */}
      <Route path="/programs" element={<Programs />} />
      
      {/* About Us section - Educational benefit pages */}
      <Route path="/benefit-of-computer-science" element={<CSBenefitPage />} />
      <Route path="/benefit-of-chess" element={<ChessBenefitPage />} />
      <Route path="/benefit-of-math-tutoring" element={<MathTutBenefitPage />} />
      <Route path="/benefit-of-mentoring" element={<MentoringBenefitPage />} />
      
      {/* About Us section - Organizational pages */}
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/mission" element={<Mission />} />
      <Route path="/financial" element={<Financial />} />
      <Route path="/board" element={<Board />} />
      <Route path="/sponsors&partners" element={<SponsorsPartners />} />
      
      {/* Educational content and learning pages */}
      <Route path="/puzzles" element={<Puzzles />} />
      <Route path="/lessons-selection" element={<LessonSelection />} />
      <Route path="/lessons" element={<LessonOverlay />} />
      <Route path="/learnings" element={<Lessons />} />
      
      {/* User roles and mentoring */}
      <Route path="/mentor" element={<Mentor />} />
      <Route path="/student" element={<Student />} />
      
      {/* Authentication pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      
      {/* User profile pages with props */}
      <Route
        path="/mentor-profile"
        element={<NewMentorProfile userPortraitSrc={userPortraitImg} />}
      />
      <Route
        path="/student-profile"
        element={<NewStudentProfile userPortraitSrc={userPortraitImg} />}
      />
      
      {/* Student inventory/dashboard page with user data */}
      <Route
        path="/student-inventory"
        element={
          <StudentInventory
            userName={userName}
            userPortraitSrc={userPortraitImg}
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
