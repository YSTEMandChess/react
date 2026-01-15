import { useNavigate } from "react-router";
import Images from "../../assets/images/imageImporter";
import Ventive from "../../assets/images/sponsors/ventive.png";
import Kount from "../../assets/images/sponsors/kount.png";
import IdahoCentral from "../../assets/images/sponsors/idahoCentral.jpg";
import PH from "../../assets/images/sponsors/PH.png";
import BoiseRescue from "../../assets/images/partners/boiseRescue.png";
import BoysAndGirls from "../../assets/images/partners/boysAndGirls.png";
import Possible from "../../assets/images/partners/possible.png";
import BoiseDistrict from "../../assets/images/partners/boiseDistrict.png";
import Rotary from "../../assets/images/partners/Rotary.png";

const sponsors = [
  {
    name: "Ventive",
    logo: Ventive,
    href: "https://www.getventive.com",
  },
  {
    name: "Kount",
    logo: Kount,
    href: "https://kount.com",
  },
  {
    name: "Idaho Central",
    logo: IdahoCentral,
    href: "https://iccu.com",
  },
  {
    name: "PH",
    logo: PH,
    href: "https://partnerhero.com",
  },
];

const partners = [
  {
    name: "Boise Rescue Mission",
    logo: BoiseRescue,
    href: "https://boiserm.org",
  },
  {
    name: "Boys and Girls Clubs of Ada County",
    logo: BoysAndGirls,
    href: "https://adaclubs.org",
  },
  {
    name: "Everything's Possible",
    logo: Possible,
    href: "https://www.boiseschools.org",
  },
  {
    name: "Boise District Community Schools",
    logo: BoiseDistrict,
    href: "https://community-schools.boiseschools.org",
  },
  {
    name: "Boise Sunrise Rotary Club",
    logo: Rotary,
    href: "https://portal.clubrunner.ca/3864",
  }
];

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

  const handleDonateButton = () => {
    window.location.href =
      "https://donorbox.org/y-stem-and-chess-inc-learning-platform";
  };

  const handleBuyNow = (title = "") => {
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
    <div role="main" className="w-full h-auto mt-2">
      {/* HERO SECTION */}
      <div role="region" className="w-full md:w-[85%] h-auto md:h-[460px] mx-auto flex flex-col md:flex-row gap-8 mb-12 px-6">
        <div className="w-full md:w-1/2 h-full flex justify-center items-center flex-col gap-6">
          <h1 className="pt-[5%] text-3xl md:text-4xl text-left w-full text-text-primary font-bold">
            Helping your child develop <br/> critical thinking skills!
          </h1>

          <p className="text-xl md:text-2xl/10 pt-4 text-left w-full text-text-secondary">
            We are a nonprofit organization empowering children <br/> to find
            their own success in STEM <br/> through Chess, Math and Computer
            Science.
          </p>

          <button
            className="mt-8 bg-text-primary border-2 border-background text-background rounded-2xl py-3 px-8 hover:bg-text-secondary transition-colors font-bold self-start"
            onClick={handleDonateButton}
            aria-label="Donate to Y STEM and Chess"
          >
            Donate
          </button>
        </div>
        
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <img
            src={Images.TreesGroup}
            alt="Group of Y STEM mascots playing chess"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* LOGO BREAK */}
      <img
        src={Images.LogoLineBr}
        className="w-full mx-auto"
        alt=""
        role="presentation"
      />

      {/* "EVERYONE IS INCLUDED" HEADING */}
      <h2 className="text-center text-3xl md:text-5xl md:my-8 font-bold text-text-primary">
        Everyone is included. Everyone is welcome.
      </h2>

      {/* FREE/PREMIUM CARDS */}
      <div role="region" className="w-full md:w-[85%] h-auto mx-auto mt-5 flex flex-col md:flex-row items-stretch gap-8 md:gap-16 lg:gap-40 justify-center px-6 md:px-0 mb-12">
        {/* Free Card */}
        <div className="flex flex-col justify-center items-center w-full md:w-[35%] min-h-[600px] md:h-[700px] bg-primary rounded-[1.25rem] shadow-[1.25rem_1.25rem_0.063rem_rgb(209,230,28)] p-8 gap-4">
          <img src={Images.Heart} alt="" className="w-16 h-16 md:w-20 md:h-20" />
          <h3 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Free</h3>
          <p className="text-lg md:text-xl text-center text-white leading-relaxed mt-[5%] mb-8">
            For students who qualify for <br />free and reduced lunch.<br />
            Our lessons are free.
          </p>
          <button 
            className="mt-auto bg-[#1a1a1a] text-white font-bold py-3 px-8 rounded-full hover:bg-[#2a2a2a] transition-colors border-2 border-white"
            aria-label="Join now for free"
          >
            Join Now!
          </button>
        </div>

        {/* Premium Card */}
        <div className="flex flex-col justify-center items-center w-full md:w-[35%] min-h-[600px] md:h-[700px] bg-white rounded-[1.25rem] shadow-[1.25rem_1.25rem_0.063rem_rgb(115,179,19)] p-8 gap-4">
          <img src={Images.Gem} alt="" className="w-16 h-16 md:w-20 md:h-20" />
          <h3 className="text-3xl md:text-4xl font-bold text-text-primary mt-4 mb-4">Premium</h3>
          <p className="text-lg md:text-xl text-center text-text-primary leading-relaxed mt-[5%] mb-8">
            For students who don't qualify <br />for free and reduced lunch.{" "}
            <br />$25 / Week <br />First lesson is FREE. <br />Cancel anytime.
          </p>
          <button 
            className="mt-auto bg-[#1a1a1a] text-white font-bold py-3 px-8 rounded-full hover:bg-[#2a2a2a] transition-colors border-2 border-white"
            aria-label="Join now premium"
          >
            Join Now!
          </button>
        </div>
      </div>

      {/* MISSION STATEMENT IMAGE */}
      <div role="region" className="flex w-full justify-center items-center">
        <img
          src={Images.LargeInfo}
          alt="Y STEM mission statement emphasising Play, Learn and Donate"
          className="w-full h-auto"
        />
      </div>

      {/* VIDEO SECTION */}
      <div className="flex w-full h-auto md:h-[90vh] justify-center items-center py-8 md:py-0">
        <iframe
          title="Y STEM and Chess Introduction Video"
          className="w-[90%] md:w-[85%] h-[300px] md:h-[90%]"
          src="https://www.youtube.com/embed/SBr0bGgddIc"
          style={{ border: "0" }}
          allowFullScreen
        />
      </div>

      {/* CTA SECTION - "START NOW" */}
      <div role="region" className="flex justify-center items-center w-full h-auto py-12 md:py-16 mt-8 mb-8">
        <div className="flex justify-center items-center flex-col w-[90%] md:w-[70%] h-full border-4 border-primary py-12 px-6 gap-6">
          <img
            src={Images.ChessGroup}
            alt="Chess pieces lined up next to each other"
            className="w-full max-w-md h-auto"
          />
          <div className="text-2xl md:text-4xl font-bold text-text-primary text-center">
            Start now and sign up later!
          </div>
          <button
            className="bg-[#1a1a1a] text-white font-bold py-3 px-8 rounded-full hover:bg-[#2a2a2a] transition-colors border-2 border-white"
            onClick={() => navigate("./play")}
            aria-label="Get started"
          >
            Get Started!
          </button>
        </div>
      </div>

      {/* LOGO BREAK */}
      <img
        src={Images.LogoLineBr}
        className="w-full md:w-[85%] mx-auto mt-10"
        alt=""
        role="presentation"
      />

      {/* BOOKS SECTION */}
      <div role="region" className="w-full h-auto my-12 px-6 md:px-12">
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-12">
          Books by Devin Nakano
        </h2>
        
        {books.map((book, index) => (
          <div key={index} className="flex flex-col md:flex-row items-start border border-border-light p-4 md:p-6 rounded-md mb-8">
            <div className="flex flex-col items-center mx-auto md:mx-8 mb-6 md:mb-0">
              <img
                src={book.image}
                alt={`${book.title} cover image`}
                className="w-[150px] h-auto mb-4"
              />
              <button
                className="bg-transparent border-none p-0 cursor-pointer hover:opacity-90 transition-opacity"
                aria-label={`Buy now ${book.title}`}
                onClick={() => handleBuyNow(book.title)}
              >
                <img src={Images.BuyNow} alt="Buy now" className="w-[150px] h-auto" />
              </button>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-text-primary text-left mb-2">
                {book.title}
              </h3>
              <h4 className="text-lg md:text-xl text-text-secondary text-left mb-4">
                {book.subtitle}
              </h4>
              <p className="text-base text-text-secondary text-left leading-relaxed">
                {book.description}
              </p>
            </div>
          </div>
        ))}
        
        <footer role="contentinfo" className="text-center mt-8">
          <p className="text-text-secondary">All proceeds will be donated to the organization</p>
        </footer>
      </div>

      {/* LOGO BREAK */}
      <img
        src={Images.LogoLineBr}
        className="w-full md:w-[85%] mx-auto mt-10"
        alt=""
        role="presentation"
      />

      {/* SPONSORS */}
      <div className="px-6 md:px-12 mb-16 mt-12">
        <h3 className="text-sm font-bold uppercase tracking-wide text-text-primary text-center mb-8">
          Sponsors
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-12">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.name}
              href={sponsor.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={sponsor.name}
              className="transition-opacity hover:opacity-80"
            >
              <img
                src={sponsor.logo}
                alt={`${sponsor.name} logo`}
                className="h-20 w-40 object-contain rounded-md"
              />
            </a>
          ))}
        </div>
      </div>

      {/* PARTNERS */}
      <div className="px-6 md:px-12 mb-16">
        <h3 className="text-sm font-bold uppercase tracking-wide text-text-primary text-center mb-8">
          Partners
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={partner.name}
              className="bg-white p-4 rounded-md transition-opacity hover:opacity-80"
            >
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="h-20 w-32 object-contain"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
