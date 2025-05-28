import React from "react";
import "./MentoringBenefitPage.scss";
import ImageOne from "../../../images/mathArticle/computer.png";
import ImageTwo from "../../../images/mathArticle/Junechamp 2.png";

const MathTutBenefitPage = () => {
  return (
    <main id="main-content-mentor">
      <section className="container-mentor">
        <div className="text-title-md-mentor txt-p">
          <h1 style={{ fontWeight: "bold" }}>The Benefits of Mentoring</h1>
        </div>

        <figure>
          <img
            className="picture-mentor"
            src={ImageOne}
            alt="students practicing chess on computers"
          />
          <figcaption className="text-caption-mentor txt-p">
            Students practicing their chess skills in the classroom
          </figcaption>
        </figure>

        <div className="text-normal-mentor txt-p">
          <p>
            Mentors serve an important role in a student's growth, providing
            both encouragement and support. They are the examples that students
            follow to learn the kind of person they want to be when they step
            out into the world and become an adult. Oftentimes, mentors can be
            parents, teachers, or siblings, but tutors can also be important
            mentors for students. Because of the personal one-on-one sessions Y
            STEM and Chess provides, our tutors have a unique opportunity to
            become a valuable mentor to underserved students.
          </p>
        </div>

        <div className="text-normal-mentor txt-p ">
          <p>
            Underserved students are put at a disadvantage compared to those
            from more affluent neighborhoods when pursuing STEM careers. Poorer
            schools can lack laboratories, computers, or Internet access, most
            of which is invaluable in teaching STEM. Because of that, students
            can feel discouraged and like a career in STEM is permanently out of
            reach, especially for minority students. In this article from
            USNews, Captain Barrington recounts how his family, friends, and
            coaches disapproved of his decision to pursue aviation school rather
            than football, as football was seen as a way out of poverty. Many
            people who could find success are held back because they don't
            believe they can, and this is where a mentor and a role model can
            help shrink the gap between well-off students and underserved
            students.
          </p>
        </div>
      </section>
      <section className="container rectdiv2-mentor">
        <div className="rectdiv2-wrapper-mentor">
          <p className="recttext-mentor">
            "Mentors give students the chance to explore what they can do and
            what they want to do, and when it comes to mentoring, personalized
            attention is important"
          </p>
        </div>
      </section>
      <section className="container">
        <div className="text-normal-mentor txt-p">
          <p>
            STEM can seem like a challenging field to go into for minority
            students in particular. The same USNews article states that less
            than twenty percent of STEM students on college campuses are black
            and Latino, and in the workplace, it's less than five percent. Girls
            are also in need of mentoring, as STEM is also male-dominated. In
            2013, boys made up the majority of those taking AP Computer Science
            and AP Physics exams by a wide margin, as this article states. To
            close the racial and gender gap, efforts must be made to reach out
            to these students.
          </p>
        </div>

        <div className="text-normal-mentor txt-p">
          <p>
            Mentors provide the encouragement and support that builds students'
            confidence. Mentors give students the chance to explore what they
            can do and what they want to do, and when it comes to mentoring,
            personalized attention is important. Teachers cannot mentor all of
            their students, especially with increasing amounts of classes and
            schools going remote and cutting students off from support systems.
            Mentors need to step in to fill the gap, and mentors have a
            measurable impact on the students they help. Underserved students
            with mentors are 55% more likely to go to college according to this
            article. With the help of mentoring and tutoring programs, more
            underserved students can go into STEM fields, breaking the cycle of
            poverty.
          </p>
        </div>

        <figure>
          <img
            className="pictureMentor"
            src={ImageTwo}
            alt="A student standing and holding a trophy alongside their mentor."
          />
          <figcaption className="text-caption-mentor txt-p">
            A student with their mentor after winning an award.
          </figcaption>
        </figure>

        <div className="text-normal-mentor txt-p">
          <p>
            Y STEM and Chess provides one-on-one mentoring sessions to help
            build students' personal skills, in addition to tutoring in STEM and
            chess. Mentors with Y STEM and Chess are background-checked, and
            they give personal guidance to students and help them grow. We
            provide classes in person in Boise and remotely across the country
            and the world. Washington, California, Texas, Florida, New York, and
            Oregon. We are ready to serve. For more details, please check our
            website to look at our programs and see how you can help with our
            mission.
          </p>
        </div>
      </section>
    </main>
  );
};
export default MathTutBenefitPage;
