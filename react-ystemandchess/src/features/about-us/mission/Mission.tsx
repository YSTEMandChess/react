import React from "react";
import ImageOne from "../../../assets/images/mission-image.png";
import LogoLineBreak from "../../../assets/images/LogoLineBreak.png";
import FounderStory from "../../../assets/images/founder-story.png";
import Images from "../../../assets/images/imageImporter";
import { cn } from "../../../core/utils/cn";

const sectionHeadingClassName = "text-[30px] font-bold";
const sectionTextClassName = "text-[18px] leading-[1.5]";
const cardClasses = "rounded-[10px] border-2 border-primary bg-light p-6 text-center shadow-[8px_8px_0px_0px_#83ce31]";
const buttonClasses =
  "relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50";
const buttonInnerClasses =
  "inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-5 py-1 text-lg font-medium text-white backdrop-blur-3xl";

const Mission = () => {
  return (
    <main role="main" className="px-5 py-8 font-sans text-dark">
      <section role="region" aria-label="Mission statement header section" className="mx-auto mb-10 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" tabIndex={0}>
        <div className="flex flex-col gap-5">
          <div>
            <h1 className={sectionHeadingClassName}>Our Mission</h1>
            <p className={sectionTextClassName}>
              Empower underserved and at-risk children with an opportunity to
              pursue STEM careers and change their life trajectory.
            </p>
          </div>
          <div>
            <h1 className={sectionHeadingClassName}>What We Do</h1>
            <p className={sectionTextClassName}>
              We teach children chess, math, and computer science to empower them
              to pursue STEM majors/professions with the support of professionals.
            </p>
          </div>
        </div>
        <figure className="mx-auto">
          <img className="mx-auto block w-full max-w-4xl" src={ImageOne} alt="" role="presentation" />
        </figure>
      </section>
      <figure className="my-8">
        <img src={LogoLineBreak} alt="" role="presentation" className="mx-auto block w-full max-w-5xl" />
      </figure>

      <figure className="my-8">
        <img src={FounderStory} alt="Story of the founding of YSTEM" className="mx-auto block w-full max-w-5xl" />
      </figure>

      <figure className="my-8">
        <img src={LogoLineBreak} alt="" role="presentation" className="mx-auto block w-full max-w-5xl" />
      </figure>

      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2" role="region">
        <div className={cardClasses}>
          <img src={Images.Heart} alt="Heart icon" className="mx-auto mb-4 block h-12 w-12" />
          <h1 className="mb-4 text-[28px] font-bold">Free</h1>
          <p className="mb-6 text-[18px] leading-[1.5]">
            For students who qualify for <br /> free and reduced lunch.
            <br />
            Our lessons are free.
          </p>
          <button className={cn(buttonClasses, "mx-auto")} aria-label="Join now for free button">
            <span className={buttonInnerClasses}>Join Now !</span>
          </button>
        </div>
        <div className={cardClasses}>
          <img src={Images.Gem} alt="Gem icon" className="mx-auto mb-4 block h-12 w-12" />
          <h1 className="mb-4 text-[28px] font-bold">Premium</h1>
          <p className="mb-6 text-[18px] leading-[1.5]">
            For students who don't qualify <br /> for free and reduced lunch.{" "}
            <br />
            $25 / Week <br /> First lesson is FREE. <br /> Cancel anytime.
          </p>
          <button className={cn(buttonClasses, "mx-auto")} aria-label="Join now premium button">
            <span className={buttonInnerClasses}>Join Now !</span>
          </button>
        </div>
      </div>
    </main>
  );
};
export default Mission;
