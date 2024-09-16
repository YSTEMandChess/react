import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer>
            <link
                href="https://fonts.googleapis.com/css?family=Roboto"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css?family=Lato"
                rel="stylesheet"
            />
            <link
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
                rel="stylesheet"
            />

            <div className="container-fluid py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-12 col-md-6 col-lg-6 col-xl-6">
                            <div id="left-side">
                                <p>Info@ystemandchess.com</p>
                                <p>+1 208.996.5071</p>
                            </div>
                            <div id="right-side">
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mr-5"
                                    href="https://twitter.com/ystemandchess"
                                >
                                    <i className="fa-brands fa-twitter"></i>
                                </a>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mr-5"
                                    href="https://www.facebook.com/YSTEMandChess/"
                                >
                                    <i className="fa-brands fa-facebook-f"></i>
                                </a>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mr-5"
                                    href="https://www.google.com/search?q=ystemandchess"
                                >
                                    <i className="fa-brands fa-google"></i>
                                </a>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://www.instagram.com/stemwithstemy/"
                                >
                                    <i className="fa-brands fa-instagram"></i>
                                </a>
                                <div id="copy-right" className="mt-3">
                                    Copyright © 2023 YSTEMAndChess. PR. All rights reserved.
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-3 col-lg-3 col-xl-3 d-grid mt-3 mt-md-0">
                            <h5 className="sponsor-title">
                                <b><u>Sponsors</u></b>
                            </h5>
                            <ul>
                                <li>
                                    <img className="mb-2" src="/assets/images/student/sponsor_1.png" alt="Sponsor 1" />
                                </li>
                                <li>
                                    <img className="mb-2" src="/assets/images/student/sponsor_2.png" alt="Sponsor 2" />
                                </li>
                                <li>
                                    <img className="mb-2" src="/assets/images/student/sponsor_3.png" alt="Sponsor 3" />
                                </li>
                            </ul>
                        </div>
                        <div className="col-12 col-md-3 col-lg-3 col-xl-3 d-grid mt-3 mt-md-0">
                            <h5 className="mb-0 sponsor-title">
                                <b><u>Partners</u></b>
                            </h5>
                            <div className="partner-ul d-flex justify-content-between">
                                <ul>
                                    <li>
                                        <img className="mb-md-3" src="/assets/images/student/sponsor_4.png" alt="Partner 1" />
                                    </li>
                                    <li>
                                        <img src="/assets/images/student/sponsor_5.png" alt="Partner 2" />
                                    </li>
                                    <li>
                                        <img className="mt-md-3" src="/assets/images/student/sponsor_6.png" alt="Partner 3" />
                                    </li>
                                </ul>
                                <ul>
                                    <li>
                                        <img className="mb-md-0" src="/assets/images/student/sponsor_7.png" alt="Partner 4" />
                                    </li>
                                    <li>
                                        <img className="mt-md-3" src="/assets/images/student/sunrise.png" alt="Partner 5" />
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
