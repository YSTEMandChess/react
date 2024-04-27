import React from 'react';
import "./Mission.scss";
import ImageOne from "../../../images/mission-image.png";
import ImageTwo from "../../../images/LogoLineBreak.png";
import ImageThree from "../../../images/founder-story.png";
import ImageFour from "../../../images/donate.png";
import ImageFive from "../../../images/free-lunch.png";
import ImageSix from "../../../images/premium.png";



const Mission = () => {
    return (
        <main id='main-content'>
            <section className="container">
                <div className="text-title-md txt-p">
                    <h1>Our Mission</h1>
                </div>
                <div className = "text-normal txt-p">
                    <p>Empower underserved and at-risk children with an opportunity to</p>
                </div>
                <div className = "text-normal txt-p">
                    <p>pursue STEM careers and change their life trajectory.</p>
                </div>
                <figure>
                    <img className="picture" src={ImageOne} alt="mission-page"/>
                </figure>
                <div className="text-title-md2 txt-p">
                    <h1>What We Do</h1>
                </div>
                <div className = "text-normal txt-p">
                    <p>We teach children chess, math, and computer science to empower</p>
                </div>
                <div className = "text-normal txt-p">
                    <p>them to pursue STEM majors/professions with the support of</p>
                </div>
                <div className = "text-normal txt-p">
                    <p>professionals.</p>
                </div>
                <figure>
                    <img className="picture2" src={ImageTwo} alt="mission-page"/>
                </figure>
                <figure>
                    <img className="picture3" src={ImageThree} alt="mission-page"/>
                </figure>
                <figure>
                    <img className="picture4" src={ImageFour} alt="mission-page"/>
                </figure>
                <figure>
                    <img className="picture5" src={ImageFive} alt="mission-page"/>
                </figure>
                <figure>
                    <img className="picture6" src={ImageSix} alt="mission-page"/>
                </figure>
                </section>
                </main>
                )
}
export default Mission;