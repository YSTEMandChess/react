import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {
  Home,
  Play,
  Login,
  Signup,
  BeAMentor,
  Programs,
  Student,
  PlayMentor,
  Donate,
  Learnings,
  MentorDashboard,
  PlayNolog,
  Admin,
  StudentRecordings,
  Lessons,
  PieceLessons,
  PlayLesson,
  Contact,
  BoardEditor,
  LandingPage,
  BoardAnalyzer,
  WhyChess,
  MathArticle,
  MentoringBenefitArticle,
  OnlineArticle,
  ChessBenefitArticle,
  ComputerBenefitArticle,
  AboutUs,
  MissionHifi,
  FinancialsHifi,
  BoardHifi,
  Puzzles,
  MentorProfile
} from './pages';

import useLoginGuard from './services/LoginGuard';

const AppRouter = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/play" component={Play} />
        <Route path="/login" render={(props) => {
          useLoginGuard([], true);
          return <Login {...props} />;
        }} />
        <Route path="/signup" render={(props) => {
          useLoginGuard([], true);
          return <Signup {...props} />;
        }} />
        <Route path="/resetpassword" component={ResetPassword} />
        <Route path="/setpassword" render={(props) => {
          useLoginGuard([], true);
          return <SetPassword {...props} />;
        }} />
        <Route path="/be-amentor" component={BeAMentor} />
        <Route path="/programs" component={Programs} />
        <Route path="/donate" component={Donate} />
        <Route path="/student" render={(props) => {
          useLoginGuard(['student', 'admin'], false);
          return <Student {...props} />;
        }} />
        <Route path="/parent" render={(props) => {
          useLoginGuard(['parent', 'admin'], false);
          return <Parent {...props} />;
        }} />
        <Route path="/parent-add-student" render={(props) => {
          useLoginGuard(['parent', 'admin'], false);
          return <ParentAddStudent {...props} />;
        }} />
        <Route path="/user-profile" render={(props) => {
          useLoginGuard(['student'], false);
          return <UserProfile {...props} />;
        }} />
        <Route path="/play-mentor" render={(props) => {
          useLoginGuard(['mentor', 'admin'], false);
          return <PlayMentor {...props} />;
        }} />
        <Route path="/mentor-dashboard" render={(props) => {
          useLoginGuard(['mentor', 'admin'], false);
          return <MentorDashboard {...props} />;
        }} />
        <Route path="/play-nolog" component={PlayNolog} />
        <Route path="/admin" render={(props) => {
          useLoginGuard(['admin'], false);
          return <Admin {...props} />;
        }} />
        <Route path="/student-recording" render={(props) => {
          useLoginGuard(['student', 'parent', 'admin'], false);
          return <StudentRecordings {...props} />;
        }} />
        <Route path="/lessons" render={(props) => {
          useLoginGuard(['student', 'admin'], false);
          return <Lessons {...props} />;
        }} />
        <Route path="/learnings" component={Learnings} />
        <Route path="/piece-lessons" render={(props) => {
          useLoginGuard(['student', 'admin'], false);
          return <PieceLessons {...props} />;
        }} />
        <Route path="/play-lesson" component={PlayLesson} />
        <Route path="/contact" component={Contact} />
        <Route path="/board-editor" component={BoardEditor} />
        <Route path="/landing-page" component={LandingPage} />
        <Route path="/board-analyzer" component={BoardAnalyzer} />
        <Route path="/why-chess" component={WhyChess} />
        <Route path="/benefit-of-math-tutoring" component={MathArticle} />
        <Route path="/benefit-of-mentoring" component={MentoringBenefitArticle} />
        <Route path="/online-expansion" component={OnlineArticle} />
        <Route path="/benefit-of-chess" component={ChessBenefitArticle} />
        <Route path="/benefit-of-computer-science" component={ComputerBenefitArticle} />
        <Route path="/about-us" component={AboutUs} />
        <Route path="/mission" component={MissionHifi} />
        <Route path="/financial" component={FinancialsHifi} />
        <Route path="/board" component={BoardHifi} />
        <Route path="/puzzles" component={Puzzles} />
        <Route path="/mentor-profile" render={(props) => {
          useLoginGuard(['mentor'], false);
          return <MentorProfile {...props} />;
        }} />
      </Switch>
    </Router>
  );
};

export default AppRouter;
