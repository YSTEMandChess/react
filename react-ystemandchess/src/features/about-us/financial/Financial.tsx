import React from "react";
import "./Financial.scss";
import LogoLineBr from "../../../assets/images/LogoLineBreak.png";

const Financial = () => {
  return (
    <main role="main" className="financial-content">
      <h1>Financials</h1>
      <div className="line-break">
        <img src={LogoLineBr} alt="" role="presentation"/>
      </div>
      <div className="financial-grid">
        <section className="financial-item" aria-label="2018 Financials" tabIndex={0}>
          <h3>2018 Financials</h3>
          <button className="view-button" aria-label="View 2018 Finnancials">View Here</button>
        </section>
        <section className="financial-item" aria-label="Form 990" tabIndex={0}>
          <h3>Form 990</h3>
          <button className="view-button" aria-label="View Form 990">View Here</button>
        </section>
        <section className="financial-item" aria-label="2019 Financials" tabIndex={0}>
          <h3>2019 Financials</h3>
          <button className="view-button" aria-label="View 2019 Finnancials">View Here</button>
        </section>
        <section className="financial-item" aria-label="2020 Financials" tabIndex={0}>
          <h3>2020 Financials</h3>
          <button className="view-button" aria-label="View 2020 Finnancials">View Here</button>
        </section>
        <section className="financial-item" aria-label="2021 Financials" tabIndex={0}>
          <h3>2021 Financials</h3>
          <button className="view-button" aria-label="View 2021 Finnancials">View Here</button>
        </section>
        <section className="financial-item" aria-label="2022 Financials" tabIndex={0}>
          <h3>2022 Financials</h3>
          <button className="view-button" aria-label="View 2022 Finnancials">View Here</button>
        </section>
      </div>
    </main>
  );
};

export default Financial;
