import React from "react";
import kidsCoding from "../../images/kidsCoding.png";
import "./Programs.scss";

const Programs = () => {
  return (
    <main className="programs-container">
      <section className="hero-wrapper">
        <section className="hero-section" role="region">
          <img src={kidsCoding} alt="Kids coding in a classroom" />
          <div className="programs-text">
            <h2>Our Programs</h2>
            <h4>Benefit your child and empower young minds through STEM and Chess.</h4>
            <p>
              Become a member today to help your child — and other children — access a safe, supportive learning environment!
            </p>
            <p>
              Y STEM and Chess Inc. (YSC) opens the hearts and minds of kids (K–12) to the world of STEM through chess and mastery learning. 
              We empower underserved and at-risk children with mentoring and STEM skill development, enabling them to pursue meaningful careers and change their life trajectories.
            </p>
            <p>
              Students receive personal guidance and growth in a secure environment through our background-checked mentors. Specific instruction includes:
            </p>
            <ul>
              <li>In-depth programs from K–12</li>
              <li>Chess strategy instruction</li>
              <li>Math at different skill levels</li>
              <li>Core computer language concepts</li>
              <li>One-on-one mentoring</li>
              <li>Personal skills development</li>
              <li>Preparation for advanced learning and career paths</li>
            </ul>
            <a
              href="https://forms.gle/cvdJxrSRCg1kpWXP8"
              target="_blank"
              rel="noreferrer"
            >
              <button>Register Now</button>
            </a>
          </div>
        </section>
      </section>

      <section className="sub-terms" role="region">
        <div className="sub-terms-left">
          <h3>
            First Month is Free
            <br />
            Cancel anytime
          </h3>
          <h5>The cost is just $25 a week after the first month.</h5>
          <p>
            After an initial sign-up, students can retain access to the program and all sessions for a fixed cost.
            Students receive personal guidance and development in a safe environment through our background-checked mentors.
            If you don’t need tutoring but want to help our mission, donate through our Cause link.
          </p>
        </div>
        <div className="sub-terms-right">
          <h3>Can't afford to pay monthly? We’d still love to have your student join!</h3>
          <p>
            Our program was designed to help the most vulnerable students succeed in STEM. 
            We believe that if students can graduate with a STEM degree, they can break the cycle of poverty in a single generation.
          </p>
          <p>
            That’s why our program is FREE for students from at-risk backgrounds, schools, or organizations that help disadvantaged communities — 
            specifically those that qualify for free and reduced lunch.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Programs;
