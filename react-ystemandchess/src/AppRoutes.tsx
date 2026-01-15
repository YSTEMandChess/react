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
import Home from "./features/home/Home";
import Programs from "./features/programs/Programs";

// About Us section pages
import CSBenefitPage from "./features/about-us/benefit-of-cs/CSBenefitPage";
import ChessBenefitPage from "./features/about-us/benefit-of-chess/ChessBenefitPage";
import MathTutBenefitPage from "./features/about-us/benefit-of-math-tut/MathTutBenefitPage";
import MentoringBenefitPage from "./features/about-us/benefit-of-mentoring/MentoringBenefitPage";
import Mission from "./features/about-us/mission/Mission";
import SponsorsPartners from "./features/about-us/sponsors-partners/SponsorsPartners";
import Board from "./features/about-us/board/Board";
import Financial from "./features/about-us/financial/Financial";
import AboutUs from "./features/about-us/aboutus/AboutUs";

// Educational content pages
import PlayComputer from "./features/engine/PlayComputer";
import Lessons from "./features/lessons/lessons-main/Lessons";
import Puzzles from './features/puzzles/puzzles-page/Puzzles';
import LessonSelection from "./features/lessons/lessons-selection/LessonsSelection";
import LessonOverlay from "./features/lessons/piece-lessons/lesson-overlay/Lesson-overlay";

// Authentication and user management pages
import Login from "./features/auth/login/Login";
import SignUp from "./features/auth/signup/SignUp";
import ResetPassword from "./features/auth/reset-password/Reset-Password/reset-password";
import SetPassword from "./features/auth/set-password/Set-Password/set-password";

// User profile and dashboard pages
import Student from "./features/student/student-page/Student";
import Mentor from "./features/mentor/mentor-page/Mentor";
import StudentInventory from "./features/student/student-inventory/StudentInventory";
import NewMentorProfile from "./features/mentor/mentor-profile/NewMentorProfile";
import NewStudentProfile from "./features/student/student-profile/NewStudentProfile";

// Static assets and default data
import userPortraitImg from "./assets/images/user-portrait-placeholder.svg";

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
      <Route path="/play" element={<PlayComputer/>}/>
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