import React from "react";
import LogoLineBr from "../../../assets/images/LogoLineBreak.png";

const Financial = () => {
  return (
    <main role="main" className="px-5 py-8 font-sans text-dark">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-10 text-[30px] font-bold text-left lg:ml-[10%]">Financials</h1>
        <img src={LogoLineBr} alt="" role="presentation" className="mx-auto mb-10 block w-4/5 max-w-5xl" />
        <div className="mx-auto grid max-w-6xl justify-center gap-8 sm:grid-cols-2 xl:gap-x-[275px] xl:gap-y-[50px]">
          <section className="w-full max-w-[200px] rounded-[10px] border-2 border-primary bg-light p-[30px_20px] text-center shadow-[8px_8px_0px_0px_#83ce31] transition-transform hover:scale-[1.02]" aria-label="2018 Financials" tabIndex={0}>
            <h3 className="mb-[15px] text-xl">2018 Financials</h3>
            <button className="rounded-[5px] bg-accent px-5 py-2 font-bold transition hover:bg-[#fdd835] active:bg-[#fbc02d]" aria-label="View 2018 Finnancials">View Here</button>
          </section>
          <section className="w-full max-w-[200px] rounded-[10px] border-2 border-primary bg-light p-[30px_20px] text-center shadow-[8px_8px_0px_0px_#83ce31] transition-transform hover:scale-[1.02]" aria-label="Form 990" tabIndex={0}>
            <h3 className="mb-[15px] text-xl">Form 990</h3>
            <button className="rounded-[5px] bg-accent px-5 py-2 font-bold transition hover:bg-[#fdd835] active:bg-[#fbc02d]" aria-label="View Form 990">View Here</button>
          </section>
          <section className="w-full max-w-[200px] rounded-[10px] border-2 border-primary bg-light p-[30px_20px] text-center shadow-[8px_8px_0px_0px_#83ce31] transition-transform hover:scale-[1.02]" aria-label="2019 Financials" tabIndex={0}>
            <h3 className="mb-[15px] text-xl">2019 Financials</h3>
            <button className="rounded-[5px] bg-accent px-5 py-2 font-bold transition hover:bg-[#fdd835] active:bg-[#fbc02d]" aria-label="View 2019 Finnancials">View Here</button>
          </section>
          <section className="w-full max-w-[200px] rounded-[10px] border-2 border-primary bg-light p-[30px_20px] text-center shadow-[8px_8px_0px_0px_#83ce31] transition-transform hover:scale-[1.02]" aria-label="2020 Financials" tabIndex={0}>
            <h3 className="mb-[15px] text-xl">2020 Financials</h3>
            <button className="rounded-[5px] bg-accent px-5 py-2 font-bold transition hover:bg-[#fdd835] active:bg-[#fbc02d]" aria-label="View 2020 Finnancials">View Here</button>
          </section>
          <section className="w-full max-w-[200px] rounded-[10px] border-2 border-primary bg-light p-[30px_20px] text-center shadow-[8px_8px_0px_0px_#83ce31] transition-transform hover:scale-[1.02]" aria-label="2021 Financials" tabIndex={0}>
            <h3 className="mb-[15px] text-xl">2021 Financials</h3>
            <button className="rounded-[5px] bg-accent px-5 py-2 font-bold transition hover:bg-[#fdd835] active:bg-[#fbc02d]" aria-label="View 2021 Finnancials">View Here</button>
          </section>
          <section className="w-full max-w-[200px] rounded-[10px] border-2 border-primary bg-light p-[30px_20px] text-center shadow-[8px_8px_0px_0px_#83ce31] transition-transform hover:scale-[1.02]" aria-label="2022 Financials" tabIndex={0}>
            <h3 className="mb-[15px] text-xl">2022 Financials</h3>
            <button className="rounded-[5px] bg-accent px-5 py-2 font-bold transition hover:bg-[#fdd835] active:bg-[#fbc02d]" aria-label="View 2022 Finnancials">View Here</button>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Financial;
