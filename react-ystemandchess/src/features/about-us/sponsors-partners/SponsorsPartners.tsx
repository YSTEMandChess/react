import React from "react";
import "./SponsorsPartners.scss";
import LogoLineBreak from "../../../assets/images/LogoLineBreak.png";
import ventive from "../../../assets/images/sponsors/ventive.png";
import kount from "../../../assets/images/sponsors/kount.png";
import idahoCentral from "../../../assets/images/sponsors/idahoCentral.png";
import PH from "../../../assets/images/sponsors/PH.svg";
import boiseRescue from "../../../assets/images/partners/boiseRescue.png";
import boiseDistrict from "../../../assets/images/partners/boiseDistrict.png";
import boysAndGirls from "../../../assets/images/partners/boysAndGirls.png";
import possible from "../../../assets/images/partners/possible.png";
import rotary from "../../../assets/images/partners/Rotary.png";

const SponsorsPartners = () => {

  return (
    <main role="main" className="sponsors-partners">
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

      <section className="sponsors-partners-section" role="region">
        <h2>Sponsors</h2>
        <div className="logos" aria-label="Sponsors logos">
          <img src={ventive} alt="Ventive" />
          <img src={kount} alt="Kount" />
          <img src={idahoCentral} alt="Idaho Central Credit Union" />
          <img src={PH} alt="Partner Hero (PH)" />
        </div>
      </section>

      <section className="sponsors-partners-section" role="region">
        <h2>Partners</h2>
        <div className="logos" aria-label="Partners logos">
          <img src={boiseRescue} alt="Boise Rescue Misison Ministries" />
          <img src={boiseDistrict} alt="Boise District Community Schools" />
          <img src={boysAndGirls} alt="Boys and Girls Clubs of Ada County" />
          <img src={possible} alt="Everything's Possible" />
          <img src={rotary} alt="Boise Sunrise Rotary Club" />
        </div>
      </section>
    </main>
  );
};

export default SponsorsPartners;
