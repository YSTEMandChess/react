import React from "react";
import "./Home.css";
import Images from "../../images/imageImporter";
import { ButtonsCard } from "../../components/ui/tailwindcss-buttons";
import { useNavigate } from "react-router";
import GeminiChat from "../../components/ui/geminiChatBot/geminiChatBot";

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
  const navigate = useNavigate();
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
      window.open(
        "https://www.amazon.com/How-Start-Tech-based-Nonprofit-Opportunity/dp/B0C4MML5WG",
        "_blank"
      );
    }

    if (title === "The Zero Dollar Workforce") {
      window.open(
        "https://www.amazon.com/Zero-Dollar-Workforce-Company-Spend/dp/B09NGVLQSS",
        "_blank"
      );
    }
  };
  return (
    <div className="home-container">
      <div className="py-12 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between font-['Sora']">
        {/* Left Side */}
        <div className="md:w-1/2 mb-10 md:mb-0 text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-deep-green)] leading-snug mb-4">
            Helping your child develop <br />
            critical thinking skills!
          </h1>
          <p className="text-base md:text-lg text-[var(--color-dark-text)] mb-6">
            We are a nonprofit organization empowering <br />
            children to find their own success in STEM through <br />
            Chess, Math and Computer Science.
          </p>
          <button className="bg-[var(--color-green)] m-0 text-white px-6 py-3 cursor-pointer transition-all duration-300 ease-in-out hover:bg-[var(--color-green-hover)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-deep-green)]">
            Donate
          </button>
        </div>

        {/* Right Side */}
        <div className="md:w-1/2 relative flex justify-center">
          <div className="w-[200px] h-[200px] bg-[var(--color-bg-accent)] border-4 border-[var(--color-deep-green)] rotate-45 absolute top-2 right-[50%] z-0"></div>
          <img
            src={Images.TreesGroup}
            alt="ystemandchess mascot"
            className="relative z-10 w-[340px] h-auto object-contain"
          />
        </div>
      </div>

      <img src={Images.LogoLineBr} className="logo-break" alt="line break" />

      {/* Pricing Section */}
      <div className="bg-[var(--color-bg-main)] py-16 px-8 md:px-16 font-['Sora'] text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-deep-green)] mb-12">
          Everyone is included. Everyone is welcome.
        </h1>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Card */}
          <div className="bg-[var(--color-bg-accent)] border-4 border-black rounded-xl p-6 shadow-[6px_6px_0_var(--color-deep-green)] transition-all hover:bg-[#d8efbb]">
            <img src={Images.Heart} alt="heart" className="w-12 h-12 mb-4" />
            <h1 className="text-2xl font-extrabold text-[var(--color-black-solid)] mb-2 uppercase tracking-wide">
              Free
            </h1>
            <p className="text-[var(--color-black-hover)] text-md mb-6 font-medium leading-relaxed">
              For students who qualify for <br />
              free and reduced lunch. <br />
              <span className="font-bold">Our lessons are free.</span>
            </p>
            <button className="bg-[var(--color-green)] text-white px-6 py-3 cursor-pointer transition-all duration-300 ease-in-out hover:bg-[var(--color-green-hover)] m-0 hover:shadow-[4px_4px_0px_var(--color-deep-green)]">
              Join Now !
            </button>
          </div>

          {/* Premium Card */}
          <div className="bg-[var(--color-bg-accent)] border-4 border-black rounded-xl p-6 shadow-[6px_6px_0_var(--color-deep-green)] transition-all hover:bg-[#d8efbb]">
            <img src={Images.Gem} alt="gem" className="w-12 h-12 mb-4" />
            <h1 className="text-2xl font-extrabold text-[var(--color-black-solid)] mb-2 uppercase tracking-wide">
              Premium
            </h1>
            <p className="text-[var(--color-black-hover)] text-md mb-6 font-medium leading-relaxed">
              For students who don't qualify <br />
              for free and reduced lunch. <br />
              <span className="font-bold">$25 / Week</span> <br />
              First lesson is <span className="font-bold">FREE</span>. <br />
              Cancel anytime.
            </p>
            <button className="bg-[var(--color-green)] text-white px-6 py-3 cursor-pointer transition-all duration-300 ease-in-out hover:bg-[var(--color-green-hover)] m-0 hover:shadow-[4px_4px_0px_var(--color-deep-green)]">
              Join Now !
            </button>
          </div>
        </div>
      </div>

      {/* Three Action Cards */}
      <div className="bg-[var(--color-bg-main)] py-16 px-6 md:px-16 font-['Sora']">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* Play */}
          <div className="flex items-start bg-[var(--color-bg-lightbox)] border-l-8 border-[var(--color-deep-green)] px-6 py-4 cursor-pointer transition-all duration-300 hover:border-l-12 hover:text-[var(--color-green)]">
            <div className="w-16 h-16 flex items-center justify-center bg-[var(--color-green)] text-white rounded-md mr-6 text-3xl font-bold select-none">
              🎮
            </div>
            <div>
              <h2 className="text-2xl font-extrabold mb-2 uppercase">Play</h2>
              <p className="text-[var(--color-dark-text)] leading-relaxed max-w-xs">
                We strive to empower underserved and at-risk children through
                mentoring and STEM skills-development to enable them to pursue
                STEM careers and change their life trajectory.
              </p>
            </div>
          </div>

          {/* Learn */}
          <div className="flex items-start bg-[var(--color-bg-lightbox)] border-l-8 border-[var(--color-deep-green)] px-6 py-4 cursor-pointer transition-all duration-300 hover:border-l-12 hover:text-[var(--color-green)]">
            <div className="w-16 h-16 flex items-center justify-center bg-[var(--color-green)] text-white rounded-md mr-6 text-3xl font-bold select-none">
              📘
            </div>
            <div>
              <h2 className="text-2xl font-extrabold mb-2 uppercase">Learn</h2>
              <p className="text-[var(--color-dark-text)] leading-relaxed max-w-xs">
                We strive to empower underserved and at-risk children through
                mentoring and STEM skills-development to enable them to pursue
                STEM careers and change their life trajectory.
              </p>
            </div>
          </div>

          {/* Donate */}
          <div className="flex items-start bg-[var(--color-bg-lightbox)] border-l-8 border-[var(--color-deep-green)] px-6 py-4 cursor-pointer transition-all duration-300 hover:border-l-12 hover:text-[var(--color-green)]">
            <div className="w-16 h-16 flex items-center justify-center bg-[var(--color-green)] text-white rounded-md mr-6 text-3xl font-bold select-none">
              💰
            </div>
            <div>
              <h2 className="text-2xl font-extrabold mb-2 uppercase">Donate</h2>
              <p className="text-[var(--color-dark-text)] leading-relaxed max-w-xs">
                The tax deductible donation will be used to scale our program to
                underserved communities and students. Y STEM and Chess Inc. is a
                registered tax organization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube + Box Section */}
      <div className="bg-[var(--color-bg-main)] py-20 px-6 md:px-20 font-['Sora']">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* YouTube */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="border-4 border-[var(--color-deep-green)] p-3 bg-white">
              <iframe
                title="home-video"
                className="w-[420px] h-[235px] md:w-[440px] md:h-[250px]"
                src="https://www.youtube.com/embed/SBr0bGgddIc"
                allowFullScreen
                style={{ border: "0" }}
              ></iframe>
            </div>
          </div>

          {/* Box Content */}
          <div className="w-full md:w-1/2 bg-[var(--color-bg-lightbox)] border-4 border-[var(--color-deep-green)] p-8 rounded-md flex flex-col items-center text-center">
            <img
              src={Images.ChessGroup}
              alt="ChessGroup"
              className="w-28 h-auto mb-6"
            />
            <div className="text-2xl font-semibold text-[var(--color-deep-green)] mb-6">
              Start now and sign up later!
            </div>

            <button
              className="relative inline-flex overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-main)] focus:ring-[var(--color-green)]"
              onClick={() => navigate("./lessons")}
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,var(--color-glow-purple-1)_0%,var(--color-glow-purple-2)_50%,var(--color-glow-purple-1)_100%)]" />
              <span className="inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-2.5 text-lg font-semibold text-white backdrop-blur-3xl relative z-10">
                Get Started!
              </span>
            </button>
          </div>
        </div>
      </div>
      <GeminiChat />
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
              <button
                className="buy-now"
                onClick={() => handleBuyNow(book.title)}
              >
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
