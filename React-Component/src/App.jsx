import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import AboutUs from './pages/AboutUs/AboutUs';
import Admin from './pages/Admin/Admin';
import Board from './pages/board/board';
import BoardAnalyzer from './pages/board-analyzer/board-analyzer';
import BoardEditor from './pages/board-editor/board-editor';
import BeAMentor from './pages/be-amentor/be-amentor';
import ChessBenefitArticle from './pages/ChessBenefitArticle/ChessBenefitArticle';
import ComputerBenefitArticle from './pages/ComputerBenefitArticle/ComputerBenefitArticle';
import Contact from './pages/contact/contact';
import Donate from './pages/donate/donate';
import Financials from './pages/financials/financials';
import Home from './pages/home/home';
import LandingPage from './pages/LandingPage/LandingPage';
import Learnings from './pages/Learnings/Learnings';
import Lessons from './pages/Lessons/Lessons';
import Login from './pages/Login/Login';
import MathArticle from './pages/math-article/math-article';
import MentorDashboard from './pages/mentor-dashboard/mentor-dashboard';
import MentorProfile from './pages/mentor-profile/mentor-profile';
import MentoringBenefitArticle from './pages/MentoringBenefitArticle/MentoringBenefitArticle';
import MissionHifi from './pages/MissionHifi/MissionHifi';
import OnlineExpansionArticle from './pages/online-expansion-article/online-expansion-article';
import Parent from './pages/parent/parent';
import ParentAddStudent from './pages/ParentAddStudent/ParentAddStudent';
import { setPermissionLevel } from './models/globals';

const App = () => {
  useEffect(() => {
    setPermissionLevel();
  }, []);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/board" element={<Board />} />
        <Route path="/board-analyzer" element={<BoardAnalyzer />} />
        <Route path="/board-editor" element={<BoardEditor />} />
        <Route path="/be-amentor" element={<BeAMentor />} />
        <Route path="/chess-benefit-article" element={<ChessBenefitArticle />} />
        <Route path="/computer-benefit-article" element={<ComputerBenefitArticle />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/learnings" element={<Learnings />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/login" element={<Login />} />
        <Route path="/math-article" element={<MathArticle />} />
        <Route path="/mentor-dashboard" element={<MentorDashboard />} />
        <Route path="/mentor-profile" element={<MentorProfile />} />
        <Route path="/mentoring-benefit-article" element={<MentoringBenefitArticle />} />
        <Route path="/mission-hifi" element={<MissionHifi />} />
        <Route path="/online-expansion-article" element={<OnlineExpansionArticle />} />
        <Route path="/parent" element={<Parent />} />
        <Route path="/parent-add-student" element={<ParentAddStudent />} />
      </Routes>
      <Footer />
    </>
  );
};

export default App;
