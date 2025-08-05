import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';

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
import NewMentorProfile from './Pages/NewMentorProfile/NewMentorProfile';
import NewStudentProfile from './Pages/NewStudentProfile/NewStudentProfile';
import AboutUs from './Pages/About-Us/AboutUs/AboutUs';
import LessonSelection from "./Pages/LessonsSelection/LessonsSelection";
import LessonOverlay from "./Pages/piece-lessons/lesson-overlay/lesson-overlay";

import userPortraitImg from './images/user-portrait-placeholder.svg';

const userName = 'Nimesh Patel';

const AppRoutes = () => {
  const [cookies] = useCookies(['login']);

  return (
    <Routes>
      <Route path='/' element={<NewStudentProfile userPortraitSrc={userPortraitImg} />} />
      <Route path='/programs' element={<Programs />} />
      <Route path='/benefit-of-computer-science' element={<CSBenefitPage />} />
      <Route path='/benefit-of-chess' element={<ChessBenefitPage />} />
      <Route path='/benefit-of-math-tutoring' element={<MathTutBenefitPage />} />
      <Route path='/benefit-of-mentoring' element={<MentoringBenefitPage />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/mission' element={<Mission />} />
      <Route path='/mentor' element={<Mentor />} />
      <Route path='/financial' element={<Financial />} />
      <Route path='/lessons-selection' element={<LessonSelection />} />

      {/* ✅ Updated: Add required props */}
      <Route
        path='/lessons'
        element={
          <LessonOverlay
            propPieceName="queen"
            propLessonNumber={2}
            navigateFunc={() => console.log('Navigating...')}
            styleType="default"
          />
        }
      />

      <Route path='/sponsors&partners' element={<SponsorsPartners />} />
      <Route path='/board' element={<Board />} />
      <Route path='/reset-password' element={<ResetPassword />} />
      <Route path='/set-password' element={<SetPassword />} />
      <Route path='/about-us' element={<AboutUs />} />
      <Route path='/learnings' element={<Lessons />} />
      <Route path='/student' element={<Student />} />

      <Route
        path='/student-profile'
        element={
           <NewStudentProfile userPortraitSrc={userPortraitImg} />
    }
    />


      <Route
        path='/mentor-profile'
        element={
          cookies.login ? (
            <NewMentorProfile userPortraitSrc={userPortraitImg} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path='/student-inventory'
        element={
          cookies.login ? (
            <StudentInventory userName={userName} userPortraitSrc={userPortraitImg} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
