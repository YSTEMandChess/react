import React, { useState } from 'react';
import './Admin.css';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('#dashboard');

    const handleTabClick = (target) => {
        setActiveTab(target);
    };

    return (
        <div>
            <div className="board-container">
                <div className="box">
                    <div className="tab-nav">
                        <button 
                            className={`tab-btn ${activeTab === '#dashboard' ? 'active' : ''}`} 
                            onClick={() => handleTabClick('#dashboard')}
                        >
                            <b>Dashboard</b>
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === '#search' ? 'active' : ''}`} 
                            onClick={() => handleTabClick('#search')}
                        >
                            <b>Search</b>
                        </button>
                    </div>
                    <div className={`tab-content ${activeTab === '#dashboard' ? 'active' : ''}`} id="dashboard">
                        <p>Dashboard</p>
                    </div>
                    <div className={`tab-content ${activeTab === '#search' ? 'active' : ''}`} id="search">
                        <p>Search</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
