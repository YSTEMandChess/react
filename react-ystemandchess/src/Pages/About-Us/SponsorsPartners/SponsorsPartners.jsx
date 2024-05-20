import React from 'react';
import './SponsorsPartners.scss';
import sponsor1 from '../../../images/sponsors/ventive.png';
import sponsor2 from '../../../images/sponsors/kount.png';
import sponsor3 from '../../../images/sponsors/idahoCentral.png';
import partner1 from '../../../images/partners/boiseRescue.png';
import partner2 from '../../../images/partners/boiseDistrict.png';
import partner3 from '../../../images/partners/boysAndGirls.png';
import partner4 from '../../../images/partners/possible.png';
import partner5 from '../../../images/partners/Rotary.png';

const SponsorsPartners = () => {
  return (
    <div className="sponsors-partners">
      <h1>Sponsors & Partners</h1>

      <div className="section">
        <h2>Sponsors</h2>
        <div className="logos">
          <img src={sponsor1} alt="Sponsor 1" />
          <img src={sponsor2} alt="Sponsor 2" />
          <img src={sponsor3} alt="Sponsor 3" />
        </div>
      </div>

      <div className="section">
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
  )
}

export default SponsorsPartners;
