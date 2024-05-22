import React from 'react';
import './Financial.scss';
import LogoLineBr from '../../../images/LogoLineBreak.png';

const Financial = () => {
  return (
    <div className="financial-content">
      <h1>Financials</h1>
      <div className="line-break">
        <img src={LogoLineBr} alt="Line Break" />
      </div>
      <div className="financial-grid">
        <div className="financial-item">
          <h3>2018 Financials</h3>
          <button className="view-button">View Here</button>
        </div>
        <div className="financial-item">
          <h3>Form 990</h3>
          <button className="view-button">View Here</button>
        </div>
        <div className="financial-item">
          <h3>2019 Financials</h3>
          <button className="view-button">View Here</button>
        </div>
        <div className="financial-item">
          <h3>2020 Financials</h3>
          <button className="view-button">View Here</button>
        </div>
        <div className="financial-item">
          <h3>2021 Financials</h3>
          <button className="view-button">View Here</button>
        </div>
        <div className="financial-item">
          <h3>2022 Financials</h3>
          <button className="view-button">View Here</button>
        </div>
      </div>
    </div>
  );
};

export default Financial;
