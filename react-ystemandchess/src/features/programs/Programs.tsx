import React from "react";
import img2096 from "../../assets/images/student/1000002096.png";
import img2094 from "../../assets/images/student/1000002094.png";
import img2097 from "../../assets/images/student/1000002097.png";
import logo from "../../assets/images/full_logo.png";
import TreesGroup from "../../assets/images/Trees-Group.png";
import "./Programs.scss";

export const Programs = () => {
  return (
    <main className="programs-page">
      {/* 2. Two-Column Hero Section */}
      <section className="programs-hero" aria-labelledby="programs-title">
        <div className="hero-content">
          <h1 id="programs-title" className="hero-title" data-testid="programs-title">
            Helping your child develop<br/>critical thinking skills
          </h1>
          <p className="hero-text">
            We are a nonprofit organization empowering children to find their own success in STEM through Chess, Math and Computer Science.
          </p>
          <p className="hero-text">
            Our mission is to Empower children with an opportunity to pursue STEM careers and change their life trajectories.
          </p>
          <p className="hero-text">
            We teach underserved children chess, math, and computer science to empower them to pursue STEM majors/professions with the support of professionals
          </p>
        </div>
        
        <div className="hero-collage">
          <img src={img2096} className="collage-img img-1" alt="Student playing chess" />
          <img src={img2094} className="collage-img img-2" alt="Group of students with trophy" />
          <img src={img2097} className="collage-img img-3" alt="Students playing chess" />
        </div>
      </section>

      {/* 3. Decorative Divider - Now just the image separator */}
      <div className="section-divider">
        <img className="w-full mx-auto" src="/static/media/LogoLineBreak.1a0b644082b75f3578e3.png" alt="" role="presentation" />
      </div>

      {/* 4. Inclusion Statement */}
      <div className="inclusion-statement">
        <h2>Everyone is included. Everyone is welcomed.</h2>
      </div>

      {/* 5. Membership Cards */}
      <section className="pricing-cards">
        <div className="card-wrapper free-card">
          <div className="card-background"></div>
          <div className="card-front">
            <svg
              className="card-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3>Free</h3>
            <p>
              For students who qualify for<br/>
              free and reduced lunch.<br/>
              Our lessons are free.
            </p>
            <button className="join-now-btn">Join Now!</button>
          </div>
        </div>

        <div className="card-wrapper premium-card">
          <div className="card-background"></div>
          <div className="card-front">
            <svg
              className="card-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 22 22 7 12 2"></polygon>
            </svg>
            <h3>Premium</h3>
            <p>
              For students who don't qualify<br/>
              for free and reduced lunch.<br/>
              $25 / week<br/>
              First lesson is FREE.<br/>
              Cancel anytime.
            </p>
            <button className="apply-now-btn">Apply Now!</button>
          </div>
        </div>
      </section>

      {/* 6. Community Section / Play, Learn, Donate -> Now an image */}
      <section className="community-section">
        <div className="flex w-full justify-center items-center py-12" role="region">
          <img className="w-full h-full object-cover"
               src="/static/media/large_info.6b7bfc30b92945f88d42.png"
               alt="Y STEM mission statement emphasizing Play, Learn and Donate" />
        </div>
      </section>

      {/* YouTube Video Section */}
      <section className="youtube-video-section">
        <div className="video-container">
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/SBr0bGgddIc?si=eTeDI8ByoDHHWKwA"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
        </div>
      </section>

      {/* 7. We Offer Section */}
      <section className="we-offer-section">
        <div className="offer-card">
          <img className="w-full max-w-md h-auto mb-8" 
               src="/static/media/chessGroup.5ae031cd3e8a7b2854c6.png" 
               alt="Chess pieces lined up next to each other" />
          
          <h2 className="offer-heading">We Offer</h2>
          
          <div className="offer-columns">
            <div className="offer-item">Math Tutoring</div>
            <div className="offer-item">Chess</div>
            <div className="offer-item">Python</div>

            <div className="offer-item">Mentoring</div>
            <div className="offer-item">Personal<br/>Development</div>
            <div className="offer-item">Linux</div>

            <div className="offer-item">Study Habits</div>
            <div className="offer-item">Careers in Computer<br/>Science and STEM</div>
            <div className="offer-item">Java</div>
          </div>
          
          <button className="offer-btn">
            Apply Now!
          </button>
        </div>
      </section>

      {/* 8. Current Status Section */}
      <section className="current-status-heading">
        <h2>Current Status</h2>
      </section>

      {/* 9. Status Stats Section */}
      <section className="status-stats-section">
        <div className="stats-background-pattern"></div>
        <div className="stats-container">
          
          {/* Row 1: State Qualifiers */}
          <div className="stat-item">
            <div className="stat-row">
              <div className="stat-left">
                <span className="stat-number">40</span>
                <div className="vertical-divider red"></div>
                <span className="stat-label">State Qualifiers</span>
              </div>
              <div className="stat-right">
                <svg viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" />
                  <rect x="2" y="2" width="10" height="10" fill="#222" stroke="none" />
                  <rect x="12" y="12" width="10" height="10" fill="#222" stroke="none" />
                </svg>
              </div>
            </div>
            <div className="horizontal-line red"></div>
          </div>

          {/* Row 2: State Champions */}
          <div className="stat-item">
            <div className="stat-row">
              <div className="stat-left">
                <span className="stat-number">9</span>
                <div className="vertical-divider yellow"></div>
                <span className="stat-label">State Champions</span>
              </div>
              <div className="stat-right">
                <svg viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 21h8M12 17v4M7 4h10M6 4v7c0 3.3 2.7 6 6 6s6-2.7 6-6V4H6z M2 4h4v7H2z M18 4h4v7h-4z" />
                </svg>
              </div>
            </div>
            <div className="horizontal-line yellow"></div>
          </div>

          {/* Row 3: National Qualifiers */}
          <div className="stat-item">
            <div className="stat-row">
              <div className="stat-left">
                <span className="stat-number">2</span>
                <div className="vertical-divider orange"></div>
                <span className="stat-label">National Qualifiers</span>
              </div>
              <div className="stat-right">
                <svg viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 21h12M8 21v-4l-2-2v-4l2-2V5M16 21v-4l2-2v-4l-2-2V5M10 5v4 M14 5v4 M6 5h12 M8 8h8 M8 15h8 M10 2v3 M14 2v3 M6 2v3 M18 2v3"/>
                </svg>
              </div>
            </div>
            <div className="horizontal-line orange"></div>
          </div>
        </div>
      </section>

      {/* 9. Books / Donate Section */}
      <div className="flex justify-center -mb-4 mt-8">
        <button className="donate-btn">Donate Now!</button>
      </div>

      <div className="section-divider">
        <img className="w-full mx-auto" src="/static/media/LogoLineBreak.1a0b644082b75f3578e3.png" alt="" role="presentation" />
      </div>
      
      <section className="books-donate-section">
        <h2 className="books-heading">Books by Devin Nakano</h2>

        <div className="book-item">
          <div className="book-cover flex flex-col items-center mx-auto md:mx-8 mb-6 md:mb-0">
            <img src="/static/media/book-howtostart.dd37637ae8e3d5b7d1d9.png" alt="How to Start a Tech-Based Nonprofit cover" className="w-[160px] h-auto mb-4" />
            <button className="w-[160px] text-center book-buy-btn btn-primary px-0 font-bold" aria-label="Buy now How to Start a Tech-Based Nonprofit">Buy Now!</button>
          </div>
          <div className="book-details">
            <h3>How to Start a Tech-Based Nonprofit</h3>
            <p className="book-subtitle">
              Bridging the Opportunity Gap: Building a STEM Nonprofit to Change the Trajectory of Underserved Children's Lives
            </p>
            <p className="book-description">
              How to start techbased Nonprofit details the steps of Devin Nakano as he build Y
              STEM and Chess (YSC) Inc. The first in its series covers the first 4 years of YSC.
              Each chapter brings unique perspective of an entrepreneur building a nonprofit that
              uses technology to fulfill the Company Mission.
            </p>
          </div>
        </div>

        <hr className="book-divider" />

        <div className="book-item">
          <div className="book-cover flex flex-col items-center mx-auto md:mx-8 mb-6 md:mb-0">
            <img className="w-[160px] h-auto mb-4" src="/static/media/book-thezerodollar.55de1a26d71d983cfbf9.png" alt="The Zero Dollar Workforce cover" />
            <button className="w-[160px] text-center book-buy-btn btn-primary px-0 font-bold" aria-label="Buy now The Zero Dollar Workforce">Buy Now!</button>
          </div>
          <div className="book-details">
            <h3>The Zero Dollar Workforce:<br/>Hire a Team, Run Your Company, and Don't Spend Any Money</h3>
            <p className="book-subtitle">
              It's easier to hire and manage 40 people than just 2...<br/>
              Someone can also hire and run this same team of 40 people completely for FREE...
            </p>
            <p className="book-description">
              The above sounds like total nonsense. Like someone is crazy. Like it's some kind
              of miracle. But a lot of creations in our world don't make any sense until after
              they're fully produced and studied. Imagine a mould that was found by accident
              that would become known as Penicillium and would have antibacterial properties
              that'd save the lives of billions of people throughout history. This idea also makes
              little to no sense until it's actually used in practice and studied. This book is the
              miracle that we have found with hiring and managing employees for startups, and
              we're here now to help you study and use it in practice.
            </p>
          </div>
        </div>
        
        <p className="donate-disclaimer">All proceeds will be donated to the organization</p>
      </section>
    </main>
  );
};