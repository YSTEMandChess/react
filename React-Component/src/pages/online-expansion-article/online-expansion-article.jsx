import React, { useEffect } from 'react';
import { useCookies } from 'react-cookie';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
import './online-expansion-article.css';

const OnlineArticle = () => {
  const [cookies, setCookie, removeCookie] = useCookies(['newGameId']);

  useEffect(() => {
    removeCookie('newGameId');
  }, [removeCookie]);

  return (
    <>
      <Header />
      <div className="container">
        <div className="text1 txt-p">
          <h5 style={{ fontWeight: 'bold' }}>The Importance of Online Expansion of Y Stem and Chess Inc.</h5>
        </div>

        <div className="picture1">
          <img className="pic1" src="/assets/images/mathArticle/computer.png" alt="Students practicing chess" />
        </div>

        <div className="text2 txt-p">
          <p>Students practicing their chess skills in a classroom</p>
        </div>

        <div className="text3 txt-p">
          <p>
            The Importance of Online Expansion of Y STEM and Chess Inc. focuses on using
            technology to scale. Yes, we are nonprofit but more fundamentally we are a technology company.
            Technology will help individualize lessons in chess, math, and computer science. Individualized lessons
            will be conducted online via our website to help rural and urban
            communities that lack access to resources in High School or pay for courses at other institutions.
          </p>
        </div>

        <div className="text4 txt-p">
          <p>
            Deployment of our learning program online will also provide us with a reliable form of
            donation generation. For those who are not qualified under specific government subsidy
            programs, a membership donation schedule will be available to utilize the program. This allows
            us to deliver our program to middle-class families and above without losing focus on our primary
            mission.
          </p>
        </div>
      </div>

      <div className="rectdiv2">
        <p className="recttext">"Our goal is to have all our students feel that they belong because they do."</p>
      </div>

      <div className="container">
        <div className="text6 txt-p">
          <p>
            The development of our curriculum online will accelerate the expansion of our program
            by lowering the cost and the logistical concerns for mentors. Most mentors come from STEM
            backgrounds and are located in cities. By moving the program online, they can easily mentor
            from work, school, or home and reach students in rural communities here in Idaho.
          </p>
        </div>

        <div className="text10 txt-p">
          <p>
            Once we refine our curriculum and approach, YSC will roll out our program in other
            geographic and demographic regions across the country. This will provide critical feedback that
            will help ease the challenges of expansion.
          </p>
        </div>

        <div className="text9 txt-p">
          <p>
            Online access by students and mentors will allow us to quickly scale our program and
            curriculum. It eliminates geographical supply issues regarding mentors that can play chess, tutor
            math, or teach computer science. Our goal is to have all our students feel that they belong
            because they do. Think of our mentors as the Big Brothers and Big Sisters of STEM.
          </p>
        </div>

        <div className="picture2">
          <img className="pic2" src="/assets/images/mathArticle/Junechamp 2.png" alt="Student with mentor" />
        </div>

        <div className="text8 txt-p">
          <p>A student with their mentor after winning an award.</p>
        </div>

        <div className="text9 txt-p">
          <p>
            The greater access we have to schools and school districts, the greater access we will have to
            middle-class families and above. We offer our platform for free to our community partners like
            schools but we charge the families that can afford our service.
          </p>
        </div>

        <div className="text9 txt-p">
          <p>
            Students love having control of their learning because they feel empowered. Most of the
            students we focus on come from challenging backgrounds and will benefit greatly from the
            positive attention.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OnlineArticle;
