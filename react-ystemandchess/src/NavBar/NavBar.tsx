import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FullLogo from "../images/full_logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import "./NavBar.scss";
import { SetPermissionLevel } from "../globals";
import { useCookies } from "react-cookie";

// animation variants from framer-motion
const navbarVariants = {
  parentInitial: {
    opacity: 0,
    translateY: -25,
  },
  parentAnimate: {
    opacity: 1,
    translateY: -10,
    transition: {
      duration: 0.3,
    },
  },

  childInitial: {
    opacity: 0,
    translateY: -25,
  },
  childAnimate: {
    opacity: 1,
    translateY: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.125,
    },
  },
};

const NavBar = () => {
  const [cookies, setCookie, removeCookie] = useCookies(["login", "eventId", "timerStatus"]);
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef<any>(null);
  const [link, setLink] = useState("");
  const [logged, setLogged] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [profileDropdown, setProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<any>(null);

  // toggles dropdown menu
  const toggleDropdown = () => {
    setDropdown((prevDropdown) => !prevDropdown);
  };

  const profileToggleDropdown = () => {
    setProfileDropdown((prevDropdown) => !prevDropdown);
  };

  // close dropdown menu when user clicks outside of dropdown
  useEffect(() => {
    const closeDropdown = (event: { target: any; }) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdown(false);
      }
    };

    const closeProfileDropdown = (event: { target: any; }) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdown(false);
      }
    };

    checkSessionInfo();

    document.addEventListener("mousedown", closeDropdown);
    document.addEventListener("mousedown", closeProfileDropdown);

    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("mousedown", closeProfileDropdown);
    };
  }, []);

  const redirectToURL = () => {
    window.location.href = "/login";
  };

  const init = () => {
    setLink("/");
  };

  async function checkSessionInfo() {
    let pLevel = "nLogged";
    let uInfo = await SetPermissionLevel(cookies, removeCookie);
    if (uInfo["error"] === undefined) {
      setLogged(true);
      pLevel = uInfo["role"];
      setUsername(uInfo["username"]);
      setRole(uInfo["role"]);

      // const eventId = cookies.eventId
      // const timerStatus = cookies.timerStatus
    }
  }

  const logout = () => {
    removeCookie("login");
    removeCookie("eventId");
    removeCookie("timerStatus");
    window.location.pathname = "/login"; // Redirect to login page
  };

  return (
    <header role="navigation" aria-label="Main navbar" className="nav-bar">
      <Link to="/">
        <img src={FullLogo} alt="YSTEM Logo" />
      </Link>
      <nav>
      <ul className="nav-links">
        <li>
          <Link to="/programs" className="links">Programs</Link>
        </li>
        <li className="dropdown" ref={dropdownRef}>
          <button 
            onClick={toggleDropdown} 
            className="links"
            aria-haspopup="true"
            aria-expanded={dropdown}
            aria-controls="aboutus-menu"
          >
            About Us
            {dropdown ? (
              <FontAwesomeIcon icon={faCaretUp} className="dropdown-icon" />
            ) : (
              <FontAwesomeIcon icon={faCaretDown} className="dropdown-icon" />
            )}
          </button>
          {dropdown && (
            <motion.div
              id="aboutus-menu"
              className="dropdown-menu"
              initial="parentInitial"
              animate="parentAnimate"
              variants={navbarVariants}
              role="menu"
            >
              <motion.div
                className="education"
                initial="childInitial"
                animate="childAnimate"
                variants={navbarVariants}
              >
                <h3><strong>Education</strong></h3>
                <Link to="/benefit-of-computer-science" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Benefit of Computer Science
                  </motion.h4>
                </Link>
                <Link to="/benefit-of-chess" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Benefit of Chess
                  </motion.h4>
                </Link>
                <Link to="/benefit-of-math-tutoring" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Benefit of Math Tutoring
                  </motion.h4>
                </Link>
                <Link to="/benefit-of-mentoring" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Benefit of Mentoring
                  </motion.h4>
                </Link>
              </motion.div>
              <motion.div
                className="what-we-do"
                initial="childInitial"
                animate="childAnimate"
                variants={navbarVariants}
              >
                <h3><strong>What We Do</strong></h3>
                <Link to="/online-expansion" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Online Expansion
                  </motion.h4>
                </Link>
                <Link to="about-us" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    About Us
                  </motion.h4>
                </Link>
                <Link to="/mission" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Mission
                  </motion.h4>
                </Link>
                <Link to="/financial" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Financial
                  </motion.h4>
                </Link>
                <Link to="/board" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Board
                  </motion.h4>
                </Link>
                <Link to="/sponsors&partners" role="menuitem">
                  <motion.h4 variants={navbarVariants} onClick={toggleDropdown}>
                    Sponsors & Partners
                  </motion.h4>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
        <Link to="/mentor" className="links">
          Mentor
        </Link>
        <Link to="/lessons" className="links">
          Lessons/Play
        </Link>
        <Link to="/puzzles" className="links">
          Puzzles
        </Link>
        {!username && (
          <Link to="/login" className="links">
            Login
          </Link>
        </li>
        <li>
          <Link to="/learnings" className="links">
            Learn
          </Link>
        </li>
        <li>
          <Link to="/lessons-selection" className="links">
            Lessons
          </Link>
        </li>
        {!username && (
          <li>
            <Link to="/login" className="links">
              Login
            </Link>
          </li>
        )}
        {username && (
          <li className="dropdown" ref={profileDropdownRef}>
            <button 
              onClick={profileToggleDropdown} 
              className="links"
              aria-haspopup="true"
              aria-expanded={username ? "true" : "false"}
              aria-controls="login-menu"
            >
              {username}
              {profileDropdown ? (
                <FontAwesomeIcon icon={faCaretUp} className="dropdown-icon" />
              ) : (
                <FontAwesomeIcon icon={faCaretDown} className="dropdown-icon" />
              )}
            </button>
            {profileDropdown && (
              <motion.div
                id="login-menu"
                role="menu"
                className="profile-dropdown-menu"
                initial="parentInitial"
                animate="parentAnimate"
                variants={navbarVariants}
              >
                <motion.div
                  className="education"
                  initial="childInitial"
                  animate="childAnimate"
                  variants={navbarVariants}
                >
                  <Link to={"/" + role + "-profile"} role="menuitem">
                    <motion.h4
                      variants={navbarVariants}
                      onClick={profileToggleDropdown}
                    >
                      Profile
                    </motion.h4>
                  </Link>
                  {role === "parent" && (
                    <Link to="/parent-add-student"role="menuitem">
                      <motion.h4
                        variants={navbarVariants}
                        onClick={profileToggleDropdown}
                      >
                        Add Student
                      </motion.h4>
                    </Link>
                  )}

                  <Link to="/" role="menuitem">
                    <motion.h4 variants={navbarVariants} onClick={logout}>
                      Log Out
                    </motion.h4>
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </li>
        )}
      </ul>
      </nav>
    </header>
  );
};

export default NavBar;