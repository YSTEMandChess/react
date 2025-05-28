import React from "react";
import "./MathTutBenefitPage.scss";
import ImageOne from "../../../images/mathArticle/computer.png";
import ImageTwo from "../../../images/mathArticle/Junechamp 2.png";

const MathTutBenefitPage = () => {
  return (
    <main id="main-content-math">
      <section className="container-math">
        <div className="text-title-md-math txt-p">
          <h1 style={{ fontWeight: "bold" }}>The Benefits of Math Tutoring</h1>
        </div>

        <figure>
          <img
            className="picture-math"
            src={ImageOne}
            alt="students practicing chess on computers"
          />
          <figcaption className="text-caption-math txt-p">
            Students practicing their chess skills in the classroom
          </figcaption>
        </figure>

        <div className="text-normal-math txt-p">
          <p>
            For many students, math is one of the trickiest subjects to learn.
            Not only do many students find it difficult, they also find it
            boring, and teachers struggle with engaging them and getting them to
            have fun in class. Math tutoring gives struggling students
            personalized attention, which is invaluable especially for students
            in underserved communities, who often don't get as much support in
            math.
          </p>
        </div>

        <div className="text-normal-math txt-p ">
          <p>
            Students frequently lack confidence in their abilities in math.
            Tutors can walk students through problems, breaking them down step
            by step, and check with them to be sure they understand the
            material. This help gives students confidence in their own
            abilities, and it can relieve their stress about tests and homework.
            Through personalized attention, tutors can guide students through
            their most challenging material and lessons and help them become
            confident to participate and even enjoy math class.
          </p>
        </div>

        <div className="text-normal-math txt-p ">
          <p>
            While math is a challenging subject, it provides the foundation for
            many potential careers and is essential for pursuing STEM related
            fields. Even outside of STEM, fields such as economics demand an
            understanding of math. It also helps students learn to keep track of
            personal finances, as being good with numbers is a valuable skill
            for balancing checkbooks and making investments. Thus, it is
            worthwhile to ensure your student has good foundational skills in
            mathematics.
          </p>
        </div>
      </section>
      <section className="container rectdiv2-math">
        <div className="rectdiv2-wrapper">
          <p className="recttext-math">
            "This help give students confidence in their own abilities, and it
            can relieve their stress about tests and homework"
          </p>
        </div>
      </section>
      <section className="container">
        <div className="text-normal-math txt-p">
          <p>
            Math also builds up useful skills such as problem solving, logical
            thinking, and visualization. Students can learn visualization and
            spatial memory from mathematical topics like geometry, where
            understanding the size and location of shapes is important in
            problems. This article points out the connection between many
            cognitive abilities and success in mathematics, with math being one
            way to practice these skills. Other skills math improves include
            logical thinking and problem solving, as students learn how to think
            a problem through and find solutions. Math proves essential to
            honing these abilities, which are useful in any field.
          </p>
        </div>

        <div className="text-normal-math txt-p">
          <p>
            Math tutoring also benefits students by preparing them for
            standardized testing. Though there are many colleges that no longer
            require them, a good score on the SAT or ACT can still help a
            student's college application, and math holds a prominent place on
            both tests. Math tutors can help with preparing students for these
            exams, specifically targeting areas that the student struggles with,
            and those students receive higher scores as a result. Math tutoring
            helps prepare students for college admissions and their future.
          </p>
        </div>

        <figure>
          <img
            className="pictureMath"
            src={ImageTwo}
            alt="A student standing and holding a trophy alongside their mentor."
          />
          <figcaption className="text-caption-math txt-p">
            A student with their mentor after winning an award.
          </figcaption>
        </figure>

        <div className="text-normal-math txt-p">
          <p>
            Tutoring and education can help break the cycle of poverty for
            underserved students who are often neglected in schools. Y STEM and
            Chess is dedicated to ensuring that these students can get the help
            they need to reach a college degree and a way out of poverty. Y STEM
            and Chess offers math tutoring for K-12 for a variety of difficulty
            levels and topics. Students get one-on-one sessions with their
            mentors and personal guidance.
          </p>
        </div>
        <div className="text-normal-math txt-p">
          <p>
            If students cannot afford tutoring, it is provided free to those
            students that are most in need. We provide classes in person in
            Boise and remotely across the country and the world. Washington,
            California, Texas, Florida, New York, and Oregon. Anywhere we are
            needed. We can help. If you would like to learn how you can help,
            find out more at our website.
          </p>
        </div>
      </section>
    </main>
  );
};
export default MathTutBenefitPage;
