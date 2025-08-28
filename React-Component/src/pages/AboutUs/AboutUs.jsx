import React, { useEffect } from 'react';
import './AboutUs.css';

const AboutUs = () => {
    useEffect(() => {
        document.cookie = "this.newGameId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }, []);

    return (
        <div>
            <div className="container">
                <div className="row mb-3 pt-3 mb-sm-0 align-items-center">
                    <div className="col-12 col-lg-6 order-2 text-xs-center">
                        <h1 className="first-head mb-5">Y Stem and Chess Inc. is a nonprofit</h1>
                        <p className="first-text mb-0 txt-p">
                            Your mission is to Empower underserved and at-risk communities with an
                            opportunity to pursue STEM careers and change their life trajectories. We are teaching underserved children and
                            adults chess, math, computer science, and cybersecurity to empower them to pursue STEM majors/professions with
                            the support of professionals.
                        </p>
                    </div>
                    <div className="col-12 col-lg-6 order-lg-2 text-center first-pic">
                        <img src={require('../../assets/images/aboutUs/about-us.png')} alt="About Us" />
                    </div>
                </div>
                <img className="divider" src={require('../../assets/images/aboutUs/divide_icon.png')} alt="Divider" />
            </div>

            <div className="container my-5">
                <div className="we-offer-div">
                    <h4 className="text-center font-weight-bold text-wrap">
                        We Offer
                    </h4>
                    <div className="row my-4">
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Math Tutoring</p>
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Chess</p>
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Python</p>
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Mentoring</p>
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Personal Development</p>
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Linux</p>
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Study Habits</p>
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Careers in Computer <br />Science and STEM</p>
                        <p className="col-md-4 text-center font-weight-bold text-wrap">Java</p>
                        <h5 className="col-md-12 text-center font-weight-bold text-wrap">
                            Budgeting, Finances, And More...
                        </h5>
                    </div>
                </div>
            </div>

            <div className="rectdiv2">
                <div className="container">
                    <h4 className="text-center">
                        Current Status
                    </h4>
                    <div className="row">
                        <div className="col-lg-7 col-12 order-2">
                            <ul className="pl-4">
                                <li className="recttext">We are teaching in-person and remote classes.</li>
                                <li className="recttext">As of Fall 2023, we have 20 classes running, seeing about 120 students weekly in 5 different states.</li>
                                <li className="recttext">Reached over 1200 students in seven states and two countries</li>
                                <li className="recttext">Massive increases in test scores from the bottom 20% to the top 1% in several states.</li>
                                <li className="recttext">Three students studying computer science (Ages 8-12)</li>
                                <li className="recttext">Developed a broad support base with local politicians, Department of Labor, local tech companies, the YMCA, Rescue mission, and other for-profit/nonprofit organizations.</li>
                                <li className="recttext">We support Boise Rescue Missions, Boys and Girls Club, Boise District Community schools, Neighborworks, and Ventive LLC.</li>
                            </ul>
                        </div>
                        <div className="col-lg-5 col-12 order-lg-2 current-chart">
                            <div className="d-flex align-items-center m-4 cs-right">
                                <img src={require('../../assets/images/aboutUs/40.png')} className="border-r" alt="State Qualifiers" />
                                <div className="ml-2">
                                    <h4 className="mb-0 font-weight-bold">State Qualifiers</h4>
                                    <p className="m-0">(60% girls)</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center m-4 cs-right">
                                <img src={require('../../assets/images/aboutUs/09.png')} className="border-y" alt="State Champions" />
                                <div className="ml-2">
                                    <h4 className="mb-0 font-weight-bold">State Champions</h4>
                                    <p className="m-0">(6 girls)</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center m-4 cs-right">
                                <img src={require('../../assets/images/aboutUs/02.png')} className="border-o" alt="National Qualifiers" />
                                <div className="ml-2">
                                    <h4 className="mb-0 font-weight-bold">National Qualifiers</h4>
                                    <p className="m-0">(Both girls)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="text6 txt-p">
                    <p>There are decades of research demonstrating that tutoring in math, chess, and computer science helps students succeed in the short and long term. For example, the University of Chicago Urban Education Lab conducted a study (SAGA Innovations) with 106 “underserved” students. It showed that providing rigorous individualized High-Intensity Math Tutoring closed the 3-year learning gap from 6 months to 1 year.</p>
                </div>

                <div className="text6 txt-p">
                    <p>Chess has been known for centuries to have many benefits and is a vital tool for (a) instilling creativity, (b) improving memory, (c) developing problem-solving skills, (d) increasing reading scores, (e) increasing the ability to concentrate, (f) improving reading scores, (g) stimulating dendrite growth, and (h) teaching planning and foresight. Finally, it helps raise math skills which will be beneficial in the second level of the curriculum, Math tutoring, and advanced courses of calculus and beyond.</p>
                </div>

                <div className="picture2 text-center">
                    <img className="pic2" src={require('../../assets/images/aboutUs/student.png')} alt="Nicolle and Anthony" />
                </div>

                <div className="text2 txt-p text-center">
                    <p>Nicolle, 8 and Anthony, 12, competing in their first chess tournament</p>
                </div>

                <div className="text6 txt-p">
                    <p>The final component of our program is Computer Science, which can be a career goal. Our approach to Computer Science follows the methodology of Code.org, a leading non-profit in this service sector, reaching over 10,000 teachers and 20 million students. Creating step-by-step Computer Science instructions helps students learn computational thinking (CT). The increased level of “abstraction” is needed for generalizing solutions to other situations.</p>
                </div>

                <div className="text6 txt-p">
                    <p>Combining the other elements of the YSC program with Code.org’s proven record provides high-level confidence regarding success, given support. AP Computer Science is the fastest-growing AP this decade, but only 59 students took the AP Computer Science Exam in Idaho last year. Only 24% of those who took the exam were female, 2 were Hispanic, and 2 were African American. That leaves a huge potential for future developers that YSC can help prepare for a STEM career. Idaho parents overwhelmingly want their children to learn to code, but only 40% of schools offer the subject in Idaho. More importantly, students want to code, and 54% love the class when it’s available.</p>
                </div>

                <div className="text6 txt-p">
                    <p>In conclusion, our goal is to help students realize their hidden STEM potential and provide them with the resources to accomplish their dreams. YSC is dedicated to providing schools with an after-school program that will act as a math-to-Computer Science class for free to any school wishing to allow students to participate. The goal is to graduate with critical thinking, a strong math foundation, the soft skills to succeed in the workplace, and technical skills in Computer Science like Python, Java, and Linux.</p>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
