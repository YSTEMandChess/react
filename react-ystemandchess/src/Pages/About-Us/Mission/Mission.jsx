import React from 'react';
import "./Mission.scss";
import ImageOne from "../../../images/mission-image.png";
import ImageTwo from "../../../images/LogoLineBreak.png";
import ImageThree from "../../../images/founder-story.png";
import Heart from "../../../images/heart-regular.svg";
import Gem from "../../../images/gem-regular.svg";
//import ImageSix from "../../../images/premium.png";



const Mission = () => {

    const handleDonateButton = () => {
        window.location.href =
          "https://buy.stripe.com/8wMaF92c56FE7RKeUU";
      };
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
                
               
                <div className="video-container">
                    <iframe
                        width="600"
                        height="515"
                        src="https://www.youtube.com/embed/SBr0bGgddIc?start=1"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
                <div className="donate-button-container">
                <button className="donate-button" onClick={handleDonateButton}>
                <strong>Donate</strong>
                </button>
                </div>
                <div className="home-content2">
                <div className="card1">
                  <img src={Heart} alt="heart" />
                  <h1>Free</h1>
                    <p>
                     For students who qualify for <br></br> free and reduced lunch.
                    <br></br>
                     Our lessons are free.
                    </p>
                <button>
                    <strong>Join Now!</strong>
                </button>
                </div>
                <div className="card2">
                  <img src={Gem} alt="gem" />
                  <h1>Premium</h1>
                  <p>
                    For students who don't qualify <br></br> for free and reduced lunch.{" "}
                  <br></br>
                    $25 / Week <br></br> First lesson is FREE. <br></br> Cancel anytime.
                  </p>
                <button>
                  <strong>Join Now!</strong>
                </button>
                </div>
                </div>
                
                </section>
                </main>
                )
    


      
}
export default Mission;

