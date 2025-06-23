import React from "react";
import "./SponsorsPartners.scss";
import LogoLineBreak from "../../../images/LogoLineBreak.png";
import sponsor1 from "../../../images/sponsors/ventive.png";
import sponsor2 from "../../../images/sponsors/kount.png";
import sponsor3 from "../../../images/sponsors/idahoCentral.png";
import sponsor4 from "../../../images/sponsors/PH.svg";
import partner1 from "../../../images/partners/boiseRescue.png";
import partner2 from "../../../images/partners/boiseDistrict.png";
import partner3 from "../../../images/partners/boysAndGirls.png";
import partner4 from "../../../images/partners/possible.png";
import partner5 from "../../../images/partners/Rotary.png";

const SponsorsPartners = () => {

  return (
    <div className="sponsors-partners">
      <h1>Sponsors & Partners</h1>
      <p>
        We are grateful for the support of our sponsors and partners who help
        make our mission possible. Their contributions enable us to provide
        resources, training, and opportunities for the youth in our community.
        Thank you for your generosity and commitment to making a difference!
      </p>
      <figure className="logo-break">
        <img src={LogoLineBreak} alt="" role="presentaion"/> 
      </figure>  

      <div className="sponsors-partners-section">
        <h2>Sponsors</h2>
        <div className="logos">
          <img src={sponsor1} alt="Sponsor 1" />
          <img src={sponsor2} alt="Sponsor 2" />
          <img src={sponsor3} alt="Sponsor 3" />
          <img src={sponsor4} alt="Sponsor 4" />
        </div>
      </div>

      <div className="sponsors-partners-section">
        <h2>Partners</h2>
        <div className="logos">
          <img src={partner1} alt="Partner 1" />
          <img src={partner2} alt="Partner 2" />
          <img src={partner3} alt="Partner 3" />
          <img src={partner4} alt="Partner 4" />
          <img src={partner5} alt="Partner 5" />
        </div>
      </div>
    </div>
  );
};

export default SponsorsPartners;
