export { default as Header } from './Header/Header';
export { default as Footer } from './Footer/Footer';
export { default as Modal } from './Modal/Modal';
export { default as AboutUs } from './pages/AboutUs/AboutUs';
export { default as Admin } from './pages/Admin/Admin';
export { default as BeAMentor } from './pages/be-amentor/be-amentor';
export { default as Board } from './pages/board/board';
export { default as BoardAnalyzer } from './pages/board-analyzer/board-analyzer';
export { default as BoardEditor } from './pages/board-editor/board-editor';
export { default as ChessBenefitArticle } from './pages/ChessBenefitArticle/ChessBenefitArticle';
export { default as ComputerBenefitArticle } from './pages/ComputerBenefitArticle/ComputerBenefitArticle';
export { default as Contact } from './pages/contact/contact';
export { default as Donate } from './pages/donate/donate';
export { default as Financials } from './pages/financials/financials';
export { default as Home } from './pages/home/home';
export { default as LandingPage } from './pages/LandingPage/LandingPage';
export { default as Learnings } from './pages/Learnings/Learnings';
export { default as Lessons } from './pages/Lessons/Lessons';
export { default as Login } from './pages/Login/Login';
export { default as MathArticle } from './pages/math-article/math-article';
export { default as MentorDashboard } from './pages/mentor-dashboard/mentor-dashboard';
export { default as MentorProfile } from './pages/mentor-profile/mentor-profile';
export { default as MentoringBenefitArticle } from './pages/MentoringBenefitArticle/MentoringBenefitArticle';
export { default as MissionHifi } from './pages/MissionHifi/MissionHifi';
export { default as OnlineExpansionArticle } from './pages/online-expansion-article/online-expansion-article';
export { default as Parent } from './pages/parent/parent';
export { default as ParentAddStudent } from './pages/ParentAddStudent/ParentAddStudent';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
