import React from 'react';
import './AboutUs.scss';
import aboutUsImage from "../../../assets/images/aboutUs/about-us.png"; // Replace with actual image path
import dividerIcon from "../../../assets/images/aboutUs/divide_icon.png"; // Replace with actual icon path
import statusIcon1 from "../../../assets/images/aboutUs/02.png"; // Replace with actual icon path
import statusIcon2 from "../../../assets/images/aboutUs/09.png"; // Replace with actual icon path
import statusIcon3 from "../../../assets/images/aboutUs/40.png"; // Replace with actual icon path
import studentsImage from "../../../assets/images/aboutUs/student.png"; // Replace with actual image path

const AboutUs = () => {
    return (
        <div className="about-us">
            {/* Intro Section */}
            <div className="intro">
                <h1>About Us</h1>
                <p>
                    Welcome to our platform! We are committed to delivering top-notch educational resources
                    and connecting learners with the best opportunities. Our mission is to foster growth,
                    creativity, and success in students from all backgrounds.
                </p>
                <img src={aboutUsImage} alt="About Us" className="about-us-image" />
            </div>

            {/* Offer Section */}
            <div className="offer">
                <img src={dividerIcon} alt="Divider Icon" className="divider-icon" />
                <h2>What We Offer</h2>
                <p>
                    We provide a variety of resources, including online courses, interactive workshops, and
                    personalized mentoring to help students excel in their educational and career journeys.
                </p>
            </div>

            {/* Status Section */}
            <div className="status">
                <div className="status-item">
                    <img src={statusIcon1} alt="Status Icon 1" />
                    <h3>200+</h3>
                    <p>Courses Offered</p>
                </div>
                <div className="status-item">
                    <img src={statusIcon2} alt="Status Icon 2" />
                    <h3>10,000+</h3>
                    <p>Students Enrolled</p>
                </div>
                <div className="status-item">
                    <img src={statusIcon3} alt="Status Icon 3" />
                    <h3>98%</h3>
                    <p>Satisfaction Rate</p>
                </div>
            </div>

            {/* Current Status Section */}
            <div className="current-status">
                <h2>Our Current Status</h2>
                <ul>
                    <li>Over 50 new courses in development.</li>
                    <li>Partnering with industry leaders to create specialized programs.</li>
                    <li>Expanding to more regions worldwide.</li>
                    <li>Launching mobile applications for easier access.</li>
                </ul>
            </div>

            {/* Description Section */}
            <div className="description">
                <p>
                    Our team of dedicated educators, developers, and industry professionals works tirelessly
                    to bring students the most relevant and impactful educational content. We believe in
                    empowering students to reach their full potential by providing them with the tools and
                    knowledge they need to succeed in an ever-changing world.
                </p>
                <img src={studentsImage} alt="Students Engaged in Learning" className="students-image" />
            </div>
        </div>
    );
};

export default AboutUs;
