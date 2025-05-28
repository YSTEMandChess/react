import React from "react";
import "./Home.css";
import Images from "../../images/imageImporter";
import { ButtonsCard } from "../../components/ui/tailwindcss-buttons";

const books = [
  {
    image: Images.Book1,
    title: "How to Start a Tech-Based Nonprofit",
    subtitle:
      "Bridging the Opportunity Gap: Building a STEM Nonprofit to Change the Trajectory of Underserved Children's Lives",
    description:
      "How to start tech-based Nonprofit details the steps of Devin Nakano as he builds Y STEM and Chess (YSC) Inc. The first in its series covers the first 4 years of YSC. Each chapter brings unique perspective of an entrepreneur building a nonprofit that uses technology to fulfill the Company Mission.",
  },
  {
    image: Images.Book2,
    title: "The Zero Dollar Workforce",
    subtitle: "Hire a Team, Run Your Company, and Don't Spend Any Money",
    description:
      "It's easier to hire and manage 40 people than just 2... Someone can also hire and run this same team of 40 people completely for FREE... The above sounds like total nonsense. Like someone is crazy. Like it's some kind of miracle. But a lot of creations in our world don't make any sense until they're fully produced and studied...",
  },
];


const Home = () => {
  // Sends the user to donat
  // e page, when donate button is clicked
  const handleDonateButton = () => {
    window.location.href =
      "https://donorbox.org/y-stem-and-chess-inc-learning-platform";
  };

  const handleBuyNow = (title = "") => {
    // Handle the Buy Now button click event
    // alert("Buy Now button clicked!");
    if (title === "How to Start a Tech-Based Nonprofit") {
      window.open("https://www.amazon.com/How-Start-Tech-based-Nonprofit-Opportunity/dp/B0C4MML5WG", "_blank");
    }

    if (title === "The Zero Dollar Workforce") {
      window.open("https://www.amazon.com/Zero-Dollar-Workforce-Company-Spend/dp/B09NGVLQSS", "_blank");
    }


  };
  return (
    <div className="home-container">
      <div className="home-content1">
        <div className="info">
          <h1 id="h1-home">
            Helping your child develop <br />
            critical thinking skills!
          </h1>

          <p>
            We are a nonprofit organization empowering <br></br>children to find
            their own success in STEM through <br></br>Chess, Math and Computer
            Science.
          </p>

          {/* <button className="donate-button" onClick={handleDonateButton}> */}
          {/* <strong>Donate</strong> */}
          {/* </button> */}

          <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-lg font-medium text-white backdrop-blur-3xl">
              Donate
            </span>
          </button>
        </div>
        <div className="pic">
          <img
            src={Images.TreesGroup}
            id="tree-group-img"
            alt="ystemandchess mascot"
          ></img>
        </div>
      </div>

      <img
        src={Images.LogoLineBr}
        className="logo-break"
        alt="line break"
      ></img>

      <h1 id="floating-h1">Everyone is included.</h1>
      <h1 id="floating-h1">Everyone is welcomed.</h1>

      <div className="home-content2">
        <div className="card1">
          <img src={Images.Heart} alt="heart"></img>
          <h1 id="h1-home">Free</h1>
          <p>
            For students who qualify for <br></br> free and reduced lunch.
            <br></br>
            Our lessons are free.
          </p>
          <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-lg font-medium text-white backdrop-blur-3xl">
              Join Now !
            </span>
          </button>
        </div>
        <div className="card2">
          <img src={Images.Gem} alt="gem"></img>
          <h1 id="h1-home">Premium</h1>
          <p>
            For students who don't qualify <br></br> for free and reduced lunch.{" "}
            <br></br>
            $25 / Week <br></br> First lesson is FREE. <br></br> Cancel anytime.
          </p>
          <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-lg font-medium text-white backdrop-blur-3xl">
              Join Now !
            </span>
          </button>
        </div>
      </div>

      <div className="home-content3">
        <img src={Images.LargeInfo} alt="mission statement"></img>
      </div>

      <div className="home-video-container">
        <iframe
          title="home-video"
          className="home-video"
          width="560"
          height="315"
          src="https://www.youtube.com/embed/SBr0bGgddIc"
          style={{ "border": "0" }}
          allowFullScreen
        ></iframe>
      </div>

      <div className="home-content4">
        <div className="home-content4-box">
          <img src={Images.ChessGroup} alt="ChessGroup"></img>
          <p>
            Chess strategy / Math skills/ Computer language concepts /<br />
            Mentoring /Advanced Learning Skills / Career Paths Preperation{" "}
            <br></br>/ All sessions access
          </p>
          <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-lg font-medium text-white backdrop-blur-3xl">
              Join Now !
            </span>
          </button>
        </div>
      </div>

      <img
        src={Images.LogoLineBr}
        className="logo-break"
        alt="line break"
      ></img>

      <div className="home-content5">
        <h1 id="h1-home">Books by Devin Nakano</h1>
        {books.map((book, index) => (
          <div key={index} className="book">
            <div className="book-left">
              <img
                src={book.image}
                alt={`${book.title} cover`}
                className="book-image"
              />
              <button className="buy-now" onClick={() => handleBuyNow(book.title)}>
                <img src={Images.BuyNow} alt="Buy Now" />
              </button>
            </div>
            <div className="book-details">
              <h2>{book.title}</h2>
              <h3>{book.subtitle}</h3>
              <p>{book.description}</p>
            </div>
          </div>
        ))}
        <footer>
          <p>All proceeds will be donated to the organization</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;


