import React, { useState } from 'react';

const WhyChess = () => {
  const [activePanel, setActivePanel] = useState('collapseOne');

  const togglePanel = (panelId) => {
    setActivePanel(activePanel === panelId ? '' : panelId);
  };

  return (
    <div className="container">
      <br />
      <br />
      <div className="panel-group" id="accordion">
        <div style={{ textAlign: 'center' }}>
          <div className="faqHeader"><strong>Getting Started</strong></div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="panel-title">
              <a
                className="accordion-toggle"
                onClick={() => togglePanel('collapseOne')}
              >
                How do I sign up?
              </a>
            </h4>
          </div>
          <div id="collapseOne" className={`panel-collapse collapse ${activePanel === 'collapseOne' ? 'in' : ''}`}>
            <div className="panel-body">
              At the top of the website, you can click "play" and click "Sign Up" with YSTEM and Chess to start tutoring lessons today with a parent!
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="panel-title">
              <a
                className="accordion-toggle collapsed"
                onClick={() => togglePanel('collapseTen')}
              >
                What is the age requirement to join YSTEM & Chess?
              </a>
            </h4>
          </div>
          <div id="collapseTen" className={`panel-collapse collapse ${activePanel === 'collapseTen' ? 'in' : ''}`}>
            <div className="panel-body">
              At YSTEM & Chess, we focus on children ranging from the K-12 group who are passionate about learning STEM and chess.
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="panel-title">
              <a
                className="accordion-toggle collapsed"
                onClick={() => togglePanel('collapseEleven')}
              >
                Where can I learn to play chess?
              </a>
            </h4>
          </div>
          <div id="collapseEleven" className={`panel-collapse collapse ${activePanel === 'collapseEleven' ? 'in' : ''}`}>
            <div className="panel-body">
              Using our website, you can navigate the top section titled "Lessons" to learn and master the basics of chess. We also offer remote chess lessons through our program.
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="faqHeader"><strong>Programs and Communities</strong></div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="panel-title">
              <a
                className="accordion-toggle collapsed"
                onClick={() => togglePanel('collapseTwo')}
              >
                Why is STEM important?
              </a>
            </h4>
          </div>
          <div id="collapseTwo" className={`panel-collapse collapse ${activePanel === 'collapseTwo' ? 'in' : ''}`}>
            <div className="panel-body">
              Children that live in poverty benefit greatly from high-paying STEM jobs. Millions of open STEM jobs cost the US economy billions every year in lost growth opportunities.
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="panel-title">
              <a
                className="accordion-toggle collapsed"
                onClick={() => togglePanel('collapseThree')}
              >
                What does YSTEM & Chess provide?
              </a>
            </h4>
          </div>
          <div id="collapseThree" className={`panel-collapse collapse ${activePanel === 'collapseThree' ? 'in' : ''}`}>
            <div className="panel-body">
              Our program provides underserved children with a private tutor in chess, math, and engineering to prepare students in fields like computer science, mathematics, and IT.
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="faqHeader"><strong>Benefits and Importances</strong></div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="panel-title">
              <a
                className="accordion-toggle collapsed"
                onClick={() => togglePanel('collapseFour')}
              >
                How is chess essential to our youth?
              </a>
            </h4>
          </div>
          <div id="collapseFour" className={`panel-collapse collapse ${activePanel === 'collapseFour' ? 'in' : ''}`}>
            <div className="panel-body">
              Chess exercises the mind and enhances problem-solving skills, helping students apply these tactics in education and prepare them for future STEM careers.
            </div>
          </div>
        </div>

        {/* Additional panels follow the same structure */}

      </div>
    </div>
  );
};

export default WhyChess;
