import React from 'react';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
import './financials.css';

const Financials = () => {
    return (
        <>
            <Header />
            <h1 className="board-heading">Finance</h1>
            <div className="chess-image">
                <img src="/assets/images/financials/divider.png" alt="Chess Image" className="divider-image" />
            </div>
            <table className="my-table">
                <tbody>
                    <tr>
                        <td className="my-table-cell">
                            <a href="2019.pdf">
                                <img src="/assets/images/financials/2019.png" width="90%" alt="2019 Financials" />
                            </a>
                        </td>
                        <td className="my-table-cell">
                            <a href="2020.pdf">
                                <img src="/assets/images/financials/2020.png" width="90%" alt="2020 Financials" />
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td className="my-table-cell">
                            <a href="2021.pdf">
                                <img src="/assets/images/financials/2021.png" width="90%" alt="2021 Financials" />
                            </a>
                        </td>
                        <td className="my-table-cell">
                            <a href="2022.pdf">
                                <img src="/assets/images/financials/2022.png" width="90%" alt="2022 Financials" />
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>
            <Footer style={{ paddingTop: '12rem' }} />
        </>
    );
};

export default Financials;
