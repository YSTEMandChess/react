import kidsCoding from "../../images/kidsCoding.png";
import "./Programs.scss";
const Programs = () => {
  return (
    <>
      <div className="hero-section">
        <img src={kidsCoding} alt="kids coding" />
        <div className="programs-text">
          <h2>Our Programs</h2>
          <h4>
            Become a member today to benefit your child and all other children
            participating in our program!
          </h4>
          <p>
            Y STEM and Chess Inc. (YSC) seeks to open the hearts and minds of
            kids (K-12) to the world of STEM through chess and the Mastery
            Learning approach to ensure learning and mastery of STEM-related
            principles. YSC strives to empower underserved and at-risk children
            through mentoring and STEM skills development to enable them to
            pursue STEM careers and change their life trajectories.
            <br />
            <br />
            Students will receive personal guidance and role development in a
            safe environment through our background-checked mentors. Specific
            instruction includes
          </p>
          <ul>
            <li>In-depth programs from K-12</li>
            <li>Chess strategy instruction</li>
            <li>Learn math at different skill levels</li>
            <li>Introduction to core computer language concepts</li>
            <li>One-on-one mentoring</li>
            <li>Personal skills development</li>
            <li>Preparation for Advanced Learning and Career Paths</li>
          </ul>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfVezPch0PtG29-3ePHVvpeQL5vMohL_Mqsu7p6zz2zoDKIWw/viewform?vc=0&c=0&w=1"
            target="_blank"
            rel="noreferrer"
          >
            <button>Register Now</button>
          </a>
        </div>
      </div>
      <div className="sub-terms">
        <div className="sub-terms-left">
          <h3>
            First Month is Free <br />
            Cancel anytime
          </h3>
          <h5>The cost is just $25 a week after the first month.</h5>
          <p>
            After an initial sign-up, students can retain access to the program,
            and all sessions, for a fixed cost. Students will recieve personal
            guidance and role-developement, in a safe environment, through our
            background-checked mentors. If you have no need for tutoring and
            just want to help our mission out, donate through our Cause link.
          </p>
        </div>
        <div className="sub-terms-right">
          <h3>
            Can't afford to pay monthly? We'd still love to have your student
            join!
          </h3>
          <p>
            Our program was designed to help the most vulnerable students find
            their own success in STEM. We figured that if we could get students
            to graduate with a STEM degree, we could break the cycle of poverty
            in one generation. The founders were tired of help being promised
            every year, every election, every generation. We are helping our
            students help themselves.
            <br />
          </p>
          <p>
            That is why our program is FREE to students from at-risk
            backgrounds, schools or organizations that help disadvantaged
            communities, specifically those that qualify for free and reduced
            lunch.
          </p>
        </div>
      </div>
    </>
  );
};

export default Programs;
