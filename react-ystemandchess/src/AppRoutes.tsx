// Imports for React Components/Pages
import React from 'react';
import { Route, Router, Routes } from 'react-router-dom';
import Home from './Pages/Home/Home';
import Programs from './Pages/Programs/Programs';
import CSBenefitPage from './Pages/About-Us/Benefit-of-CS/CSBenefitPage';
import ChessBenefitPage from './Pages/About-Us/Benefit-of-Chess/ChessBenefitPage';
import MathTutBenefitPage from './Pages/About-Us/Benefit-of-Math-tut/MathTutBenefitPage';
import MentoringBenefitPage from './Pages/About-Us/Benefit-of-Mentoring/MentoringBenefitPage';
import Lessons from './Pages/Lessons/Lessons';
import Login from './Pages/Login/Login';
import SignUp from './Pages/SignUp/SignUp';
import Mission from './Pages/About-Us/Mission/Mission';
import SponsorsPartners from './Pages/About-Us/SponsorsPartners/SponsorsPartners';
import Board from './Pages/About-Us/Board/Board';
import Mentor from './Pages/Mentor/Mentor';
import Financial from './Pages/About-Us/Financial/Financial';
import StudentInventory from './Pages/Student-Inventory/StudentInventory';
import ResetPassword from './Pages/Reset-Password/reset-password';
import SetPassword from './Pages/Set-Password/set-password';
import Student from './Pages/Student/Student';
import MentorProfile from './Pages/Mentor-Profile/MentorProfile';
import UserProfile from './Pages/Student-Profile/UserProfile';
import AboutUs from './Pages/About-Us/AboutUs/AboutUs';

// Variables and Mutable Data
import userPortraitImg from './images/user-portrait-placeholder.svg';
const userName = 'Nimesh Patel';

const AppRoutes = () => {
  // All components must be wrapped with the '<Route>' tag
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/programs' element={<Programs />} />
      <Route path='/benefit-of-computer-science' element={<CSBenefitPage />} />
      <Route path='/benefit-of-chess' element={<ChessBenefitPage />} />
      <Route
        path='/benefit-of-math-tutoring'
        element={<MathTutBenefitPage />}
      />
      <Route path='/benefit-of-mentoring' element={<MentoringBenefitPage />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/mission' element={<Mission />} />
      <Route path='/mentor' element={<Mentor />} />
      <Route path='/financial' element={<Financial />} />
      <Route path='/lessons' element={<Lessons />} />
      <Route path='/sponsors&partners' element={<SponsorsPartners />} />
      <Route path='/board' element={<Board />} />
      <Route path='/reset-password' element={<ResetPassword />} />
      <Route path='/set-password' element={<SetPassword />} />
      <Route
        path='/student-inventory'
        element={
          <StudentInventory
            userName={userName}
            userPortraitSrc={userPortraitImg}
          />
        }
      />

      <Route path='/student' element={<Student />} />
      <Route path='/mentor-profile' element={<MentorProfile />} />
      <Route path='/student-profile' element={<UserProfile />} />
      <Route path='/about-us' element={<AboutUs />} />

      {/* <Route path="/learnings" element={<LessonOverlay />} /> */}
    </Routes>
  );
};

export default AppRoutes;
