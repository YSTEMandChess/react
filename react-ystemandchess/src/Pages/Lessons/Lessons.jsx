import "./Lessons.scss";

const Lessons = () => {
  return (
    <div className="lessons-page">
      <div className="grid-container">
        <h1 className="lesson-h1">
          First Month is Free. Cancel anytime. The cost is just $25 a week after
          the first month.
        </h1>
        <p className="lesson-p1">
          After an initial sign-up, students can retain access to the program,
          and all sessions, for a fixed cost. Students will receive personal
          guidance and role-development, in a safe environment, through our
          background-checked mentors.
        </p>
        <ul className="lesson-ul">
          <li>In depth program from K-12</li>
          <li>Tutoring in Chess strategy</li>
          <li>Learn Math at different skill levels</li>
          <li>Introduction to core computer language concepts</li>
          <li>One on one mentoring</li>
          <li>Personal skills development</li>
          <li>Preparation for Advanced Learning and Career Paths</li>
        </ul>
        <button className="register-button">
          <a
            href="https://forms.gle/cvdJxrSRCg1kpWXP8"
            target="_blank"
            rel="noreferrer"
          >
            <strong>Register Now!</strong>
          </a>
        </button>

        <h1 className="donate-h1">Donate now</h1>
        <p className="donate-p1">
          If you have no need for tutoring and just want to help our mission
          out, donate through our{" "}
          <a href="https://buy.stripe.com/8wMaF92c56FE7RKeUU">donation link</a>.
        </p>
        <p className="donate-p2">
          The tax deductible donation will be used to scale our program to
          underserved communities and students. Y STEM and Chess Inc. is a
          registered tax organization.
        </p>
        <p className="donate-p3">
          <a href="https://ystemandchess.com/assets/pdf/donate/YSC_EXSUM.pdf">
            Download our Funding proposal here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Lessons;
