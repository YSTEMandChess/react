import React, { useEffect } from 'react';
import { useCookies } from 'react-cookie';
import './MentoringBenefitArticle.css';

const MentoringBenefitArticle = () => {
    const [cookies, setCookie, removeCookie] = useCookies(['newGameId']);

    useEffect(() => {
        removeCookie('newGameId');
    }, [removeCookie]);

    return (
        <div>
            <header>
                {/* Insert your Header component here */}
            </header>
            <div className="container">
                <div className="text1 txt-p">
                    <h5 style={{ fontWeight: 'bold' }}>The Benefits of Mentoring</h5>
                </div>
                <div className="picture1">
                    <img className="pic1" src="/assets/images/mathArticle/computer.png" alt="logo" />
                </div>
                <div className="text2 txt-p">
                    <p>Students practicing their chess skills in a classroom</p>
                </div>
                <div className="text3 txt-p">
                    <p>Mentors serve an important role in a student’s growth, providing both encouragement and support...</p>
                </div>
                <div className="text4 txt-p">
                    <p>Underserved students are put at a disadvantage compared to those from more affluent neighborhoods...</p>
                </div>
            </div>

            <div className="rectdiv2">
                <p className="recttext">"Mentors give students the chance to explore what they can do and what they want to do..."</p>
            </div>

            <div className="container">
                <div className="text6 txt-p">
                    <p>STEM can seem like a challenging field to go into for minority students in particular...</p>
                </div>
                <div className="text10 txt-p">
                    <p>Mentors provide the encouragement and support that builds students’ confidence...</p>
                </div>
                <div className="picture2">
                    <img className="pic2" src="/assets/images/mathArticle/Junechamp 2.png" alt="logo" />
                </div>
                <div className="text8 txt-p">
                    <p>A student with their mentor after winning an award.</p>
                </div>
                <div className="text9 txt-p">
                    <p>Y STEM and Chess provides one-on-one mentoring sessions to help build students’ personal skills...</p>
                </div>
            </div>

            <footer style={{ paddingTop: '20rem' }}>
                {/* Insert your Footer component here */}
            </footer>
        </div>
    );
};

export default MentoringBenefitArticle;
