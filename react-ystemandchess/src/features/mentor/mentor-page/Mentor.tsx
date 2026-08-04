import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Mentor.scss";
import LogoLineBr from "../../../assets/images/LogoLineBreak.png";
import cabbageImg from "../../../assets/images/mission-image.png";
import volunteerImg from "../../../assets/images/volunteer.png";
import teacher from "../../../assets/images/teaching.png";
import makeADifference from "../../../assets/images/difference.png";

const Mentor = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("mentor");
  return (
    <main className="board-container" role="main">
      <section className="flex-container" role="region" aria-label="Application Section" tabIndex={0}>
        <div className="text-content">
          <h1>{t("title")}</h1>
          <p>
            {t("subtext")}
          </p>
          <button className="apply-button" aria-label="Apply Button" tabIndex={0} onClick={() => navigate("/signup/mentor")}>{t("applyNow")}</button>
        </div>
        <div className="image-content">
          <img src={cabbageImg} alt="Cabbage" />
        </div>
      </section>

      <div className="line-break">
        <img src={LogoLineBr} alt="" role="presentation" />
      </div>

      <section className="mentor-details" role="region">
        <img src={makeADifference} alt="Make a difference by working with schools and underprivileged students." />
      </section>

      <section className="mentor-roles" role="region">
        <img src={volunteerImg} alt="Volunteer" />
        <img src={teacher} alt="Teaching and Learning" />
      </section>

      <button className="apply-button" aria-label="Apply Button" onClick={() => navigate("/signup/mentor")}>{t("applyNow")}</button>
    </main>
  );
};

export default Mentor;
