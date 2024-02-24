import React, { useState, useEffect, useRef } from "react"; // Import useEffect and useRef
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FullLogo from "../images/full_logo.png";
import "./NavBar.scss";

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
      staggerChildren: 0.1,
    },
  },
};

const NavBar = () => {
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleDropdown = () => {
    setDropdown((prevDropdown) => !prevDropdown);
  };

  useEffect(() => {
    const closeDropdown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdown(false);
      }
    };

    document.addEventListener("mousedown", closeDropdown);

    return () => {
      document.removeEventListener("mousedown", closeDropdown);
    };
  }, []);

  return (
    <header className="nav-bar">
      <Link to="/">
        <img src={FullLogo} alt="Logo" />
      </Link>

      <div className="nav-links">
        <Link to="/programs" className="links">
          Programs
        </Link>
        <div className="dropdown" ref={dropdownRef}>
          {" "}
          <p onClick={handleDropdown} className="links">
            About Us
          </p>
          {dropdown && (
            <motion.div
              className="dropdown-menu"
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
                <h3>Education</h3>
                <Link to="/benefit-of-computer-science">
                  <motion.h4 variants={navbarVariants}>
                    Benefit of Computer Science
                  </motion.h4>
                </Link>
                <Link to="/benefit-of-chess">
                  {" "}
                  <motion.h4 variants={navbarVariants}>
                    Benefit of Chess
                  </motion.h4>
                </Link>
                <Link to="/benefit-of-math-tutoring">
                  <motion.h4 variants={navbarVariants}>
                    Benefit of Math Tutoring
                  </motion.h4>
                </Link>
                <Link to="/benefit-of-mentoring">
                  {" "}
                  <motion.h4 variants={navbarVariants}>
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
                <h3>What We Do</h3>
                <Link>
                  <motion.h4 variants={navbarVariants}>
                    Online Expansion
                  </motion.h4>
                </Link>
                <Link>
                  <motion.h4 variants={navbarVariants}>
                    Online Expansion
                  </motion.h4>
                </Link>
                <Link>
                  <motion.h4 variants={navbarVariants}>
                    Online Expansion
                  </motion.h4>
                </Link>
                <Link>
                  <motion.h4 variants={navbarVariants}>
                    Online Expansion
                  </motion.h4>
                </Link>
                <Link>
                  <motion.h4 variants={navbarVariants}>
                    Online Expansion
                  </motion.h4>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
        <Link to="#" className="links">
          Lessons/Play
        </Link>
        <Link to="/login" className="links">
          Login
        </Link>
      </div>
    </header>
  );
};

export default NavBar;
