import React, { useEffect } from 'react';
import { useCookies } from 'react-cookie';
import './math-article.css'; // Assuming you will create this CSS file based on the SCSS styles

const MathArticle = () => {
  const [cookies, setCookie, removeCookie] = useCookies(['newGameId']);

  useEffect(() => {
    // Simulate cookie deletion
    removeCookie('this.newGameId');
  }, [removeCookie]);

  return (
    <div className="container">
      <div className="text1 txt-p">
        <h5 style={{ fontWeight: 'bold' }}>The Benefits of Math Tutoring</h5>
      </div>

      <div className="picture1">
        <img className="pic1" src="/assets/images/mathArticle/computer.png" alt="Math Tutoring" />
      </div>

      <div className="text2 txt-p">
        <p>Students practicing their chess skills in a classroom</p>
      </div>

      <div className="text3 txt-p">
        <p>
          For many students, math is one of the trickiest subjects to learn. Not only do many students find it
          difficult, they also find it boring, and teachers struggle with engaging them and getting them to have
          fun in class. Math tutoring gives struggling students personalized attention, which is invaluable
          especially for students in underserved communities, who often don’t get as much support in math.
        </p>
      </div>

      <div className="text4 txt-p">
        <p>
          Students frequently lack confidence in their abilities in math. Tutors can walk students through
          problems, breaking them down step by step, and check with them to be sure they understand the
          material. This help gives students confidence in their own abilities, and it can relieve their stress
          about tests and homework. Through personalized attention, tutors can guide students through their most
          challenging material and lessons and help them become confident to participate and even enjoy math
          class.
        </p>
      </div>

      <div className="text5 txt-p">
        <p>
          While math is a challenging subject, it provides the foundation for many potential careers and is
          essential for pursuing STEM-related fields. Even outside of STEM, fields such as economics demand
          an understanding of math. It also helps students learn to keep track of personal finances, as being
          good with numbers is a valuable skill for balancing checkbooks and making investments. Thus, it is
          worthwhile to ensure your student has good foundational skills in mathematics.
        </p>
      </div>

      <div className="rectdiv2">
        <p className="recttext">
          "This help gives students confidence in their own abilities, and it can relieve their stress about tests and homework"
        </p>
      </div>

      <div className="container">
        <div className="text6 txt-p">
          <p>
            Math also builds up useful skills such as problem-solving, logical thinking, and visualization.
            Students can learn visualization and spatial memory from mathematical topics like geometry, where
            understanding the size and location of shapes is important in problems. Other skills math improves include logical thinking and problem-solving, as students learn how to think a problem through and find solutions.
          </p>
        </div>

        <div className="text10 txt-p">
          <p>
            Math tutoring also benefits students by preparing them for standardized testing. Though many colleges no longer require them, a good score on the SAT or ACT can still help a student’s college application, and math holds a prominent place on both tests. Math tutoring helps prepare students for college admissions and their future.
          </p>
        </div>

        <div className="picture2">
          <img className="pic2" src="/assets/images/mathArticle/Junechamp 2.png" alt="Student with mentor" />
        </div>

        <div className="text8 txt-p">
          <p>A student with their mentor after winning an award.</p>
        </div>

        <div className="text9 txt-p">
          <p>
            Tutoring and education can help break the cycle of poverty for underserved students who are
            often neglected in schools. Y STEM and Chess is dedicated to ensuring that these students can get
            the help they need to reach a college degree and a way out of poverty. Y STEM and Chess offers math
            tutoring for K-12 for a variety of difficulty levels and topics. If students cannot afford tutoring, it is provided free to those students that are most in need. We provide classes in person in Boise and remotely across the
            country and the world. Washington, California, Texas, Florida, New York, and Oregon. Anywhere we are
            needed. We can help. If you would like to learn how you can help, find out more at our website.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MathArticle;
