import React, { useState, useEffect } from 'react';
//import { Modal } from '../Modal/Modal';
import Modal from '../Modal/Modal';
import './Header.css';

const Header = () => {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [logged, setLogged] = useState(false);
    const [inMatch, setInMatch] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [playLink, setPlayLink] = useState('play-nolog');
    const [buttonClicked, setButtonClicked] = useState(false);

    useEffect(() => {
        checkSessionInfo();
    }, []);

    const checkSessionInfo = async () => {
        // Implement the session check logic, and update state accordingly
        // Dummy data for example:
        setLogged(true);
        setUsername('JohnDoe');
        setRole('student');
        if (role === 'student') {
            setPlayLink('student');
        } else if (role === 'mentor') {
            setPlayLink('play-mentor');
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleFindGameClick = () => {
        // Combined actions when finding a game
        handleFindGame(); // Logic to find game
        deleteNewGameCookie(); // Logic to delete the new game cookie
        openModal(); // Open the modal
    };

    const handleFindGame = () => {
        setButtonClicked(true);
        // Logic to find a game
        console.log('Finding game...');
    };

    const deleteNewGameCookie = () => {
        // Logic to delete the new game cookie
        console.log('Deleted new game cookie');
    };

    const leaveMatch = () => {
        setInMatch(false);
        // Logic to leave match
        console.log('Leaving match...');
    };

    const logout = () => {
        setLogged(false);
        // Logic to log out
        console.log('Logged out');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light">
            <a className="navbar-brand" href="/">
                <img className="logo-img" src="/assets/images/Logo/YStemLogoWhite.png" alt="logo" width="260px" height="109px" />
            </a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav"
                aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul className="navbar-nav align-items-lg-center">
                    {(role === 'mentor' || role === 'student') && !inMatch && (
                        <li className="nav-item">
                            <a className="nav-link hvr-underline-from-left" onClick={handleFindGameClick}>
                                Find a Game
                            </a>
                            <Modal id="find-game" isOpen={isModalOpen} onClose={closeModal}>
                                <h1>Finding a game please wait</h1>
                                <br />
                                <h6 className="red-text">
                                    Note: Please don't use other video conferencing applications while playing the game for better performance
                                </h6>
                                <br /><br />
                                <div className="loader"></div>
                                <br />
                                <button onClick={closeModal}>
                                    X
                                </button>
                            </Modal>
                        </li>
                    )}
                    <li className="nav-item">
                        <a className="nav-link hvr-underline-from-left" href="/programs">Programs</a>
                    </li>
                    <li className="nav-item dropdown">
                        <a className="dropdown-toggle nav-link" data-toggle="dropdown" href="#">
                            About Us<span className="caret"></span>
                        </a>
                        <ul className="dropdown-menu">
                            <li className="menu-item-li"><a href="/online-expansion" className="menu-item-div">Online Expansion</a></li>
                            <li className="menu-item-li"><a href="/benefit-of-computer-science" className="menu-item-div">Benefit of Computer Science</a></li>
                            <li className="menu-item-li"><a href="/benefit-of-chess" className="menu-item-div">Benefit of Chess</a></li>
                            <li className="menu-item-li"><a href="/benefit-of-math-tutoring" className="menu-item-div">Benefit of Math Tutoring</a></li>
                            <li className="menu-item-li"><a href="/benefit-of-mentoring" className="menu-item-div">Benefit of Mentoring</a></li>
                            <li className="menu-item-li"><a href="/about-us" className="menu-item-div">About us</a></li>
                            <li className="menu-item-li"><a href="/mission" className="menu-item-div">Mission</a></li>
                            <li className="menu-item-li"><a href="/financial" className="menu-item-div">Financial</a></li>
                            <li className="menu-item-li"><a href="/board" className="menu-item-div">Board</a></li>
                        </ul>
                    </li>
                    {role !== 'mentor' && role !== 'student' && (
                        <li className="nav-item">
                            <a className="nav-link hvr-underline-from-left" href="/be-amentor">Mentor</a>
                        </li>
                    )}
                    <li className="nav-item">
                        <a className="nav-link hvr-underline-from-left" href="/learnings">Lessons/Play</a>
                    </li>
                    {!logged && (
                        <li className="nav-item">
                            <a href="/login" id="login" className="nav-link hvr-underline-from-left" tabindex="-1" role="button" aria-disabled="true">Login</a>
                        </li>
                    )}
                    {inMatch && role !== 'parent' && (
                        <li className="nav-item">
                            <a className="nav-link hvr-underline-from-left" onClick={leaveMatch}>Leave Meeting</a>
                        </li>
                    )}
                    {logged && (
                        <li className="nav-item">
                            <div className="btn-group">
                                <button className="btn btn-secondary btn-lg dropdown-toggle login hvr-fade-2" type="button" data-toggle="dropdown"
                                    aria-haspopup="true" aria-expanded="false">
                                    {username}
                                </button>
                                <div className="dropdown-menu dropdown-menu-right">
                                    {role === 'student' && (
                                        <a className="dropdown-item" href="/user-profile">Profile</a>
                                    )}
                                    {role === 'mentor' && (
                                        <a className="dropdown-item" href="/mentor-profile">Profile</a>
                                    )}
                                    {role === 'parent' && (
                                        <a className="dropdown-item" href="/parent-profile">Profile</a>
                                    )}
                                    <a className="dropdown-item" onClick={logout}>Logout</a>
                                    {role === 'parent' && (
                                        <a className="dropdown-item" href="/parent-add-student">Add Student</a>
                                    )}
                                </div>
                            </div>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Header;
