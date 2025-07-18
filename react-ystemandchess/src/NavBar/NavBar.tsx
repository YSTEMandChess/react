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
  const [cookies, setCookie, removeCookie] = useCookies([
    "login",
    "eventId",
    "timerStatus",
  ]);
  const [mobileMenuDropDown, setMobileMenuDropDown] = useState(false); // hamburger
  const [aboutUsDropDown, setAboutUsDropDown] = useState(false); // about us
  const aboutUsRef = useRef<any>(null);
  const mobileMenuRef = useRef<any>(null);
  const [link, setLink] = useState("");
  const [logged, setLogged] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [profileDropdown, setProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<any>(null);

  // toggles dropdown menu
  const toggleMobileMenu = () => {
    setMobileMenuDropDown((prev) => !prev);
  };

  const toggleAboutUs = () => {
    setAboutUsDropDown((prev) => !prev);
  };

  const profileToggleDropdown = () => {
    setProfileDropdown((prevDropdown) => !prevDropdown);
  };

  // close dropdown menu when user clicks outside of dropdown
  useEffect(() => {
    const closeDropdown = (event: { target: any }) => {
      if (aboutUsRef.current && !aboutUsRef.current.contains(event.target)) {
        setAboutUsDropDown(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        aboutUsRef.current &&
        !aboutUsRef.current.contains(event.target)
      ) {
        setMobileMenuDropDown(false);
      }
    };

    const closeProfileDropdown = (event: { target: any }) => {
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

  const renderLinks = () => (
    <>
      <Link
        to="/programs"
        className="text-gray-700 hover:text-black text-lg px-3 py-1"
      >
        Programs
      </Link>

      <div ref={aboutUsRef} className="relative">
        {/* About Us is now a link-like div with flex for icon */}
        <div
          onClick={toggleAboutUs}
          className="flex items-center cursor-pointer justify-center text-gray-700 hover:text-black text-lg px-3 py-1 select-none"
          aria-haspopup="true"
          aria-expanded={aboutUsDropDown}
          aria-controls="aboutus-menu"
        >
          About Us
          <FontAwesomeIcon
            icon={aboutUsDropDown ? faCaretUp : faCaretDown}
            className="ml-1"
          />
        </div>
        {aboutUsDropDown && (
          <motion.div
            id="aboutus-menu"
            className="absolute bg-white shadow-md p-4 z-20 mt-2 w-64 rounded-md"
            initial="parentInitial"
            animate="parentAnimate"
            variants={navbarVariants}
          >
            <h3 className="font-bold mb-2 text-lg">Education</h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/benefit-of-computer-science"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Benefit of Computer Science
              </Link>
              <Link
                to="/benefit-of-chess"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Benefit of Chess
              </Link>
              <Link
                to="/benefit-of-math-tutoring"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Benefit of Math Tutoring
              </Link>
              <Link
                to="/benefit-of-mentoring"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Benefit of Mentoring
              </Link>
            </div>

            <h3 className="font-bold mt-4 mb-2 text-lg">What We Do</h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/online-expansion"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Online Expansion
              </Link>
              <Link
                to="/about-us"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                About Us
              </Link>
              <Link
                to="/mission"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Mission
              </Link>
              <Link
                to="/financial"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Financial
              </Link>
              <Link
                to="/board"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Board
              </Link>
              <Link
                to="/sponsors&partners"
                onClick={toggleAboutUs}
                className="text-gray-700 hover:text-black text-base"
              >
                Sponsors & Partners
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <Link
        to="/mentor"
        className="text-gray-700 hover:text-black text-lg px-3 py-1"
      >
        Mentor
      </Link>
      <Link
        to="/learnings"
        className="text-gray-700 hover:text-black text-lg px-3 py-1"
      >
        Learn
      </Link>
      <Link
        to="/lessons-selection"
        className="text-gray-700 hover:text-black text-lg px-3 py-1"
      >
        Lessons
      </Link>

      {!username && (
        <Link
          to="/login"
          className="text-gray-700 hover:text-black text-lg px-3 py-1"
        >
          Login
        </Link>
      )}

      {username && (
        <div ref={profileDropdownRef} className="relative">
          <button
            onClick={profileToggleDropdown}
            className="flex items-center text-gray-700 hover:text-black text-lg px-3 py-1"
            aria-haspopup="true"
            aria-expanded={profileDropdown}
            aria-controls="login-menu"
          >
            {username}
            <FontAwesomeIcon
              icon={profileDropdown ? faCaretUp : faCaretDown}
              className="ml-1"
            />
          </button>

          {profileDropdown && (
            <motion.div
              id="login-menu"
              className="absolute bg-white shadow-md mt-2 w-48 rounded-md p-3 z-20"
              initial="parentInitial"
              animate="parentAnimate"
              variants={navbarVariants}
            >
              <div className="flex flex-col gap-2">
                <Link
                  to={`/${role}-profile`}
                  onClick={profileToggleDropdown}
                  className="text-gray-700 hover:text-black text-base"
                >
                  Profile
                </Link>
                {role === "parent" && (
                  <Link
                    to="/parent-add-student"
                    onClick={profileToggleDropdown}
                    className="text-gray-700 hover:text-black text-base"
                  >
                    Add Student
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-left text-gray-700 hover:text-black text-base"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </>
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center h-24 lg:pr-8">
          {/* Logo */}
          <div className="">
            <Link to="/">
              <img src={FullLogo} alt="YSTEM Logo" className="h-24 w-auto" />
            </Link>
          </div>

          {/* Hamburger Menu (Mobile) */}
          <div ref={mobileMenuRef} className="flex md:hidden">
            <button
              type="button"
              className="text-gray-700 bg-transparent hover:text-black  focus:outline-none "
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuDropDown ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex md:items-center md:gap-6">
            {renderLinks()}
          </nav>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuDropDown && (
        <div ref={mobileMenuRef} className="md:hidden px-4 pb-4">
          <nav className="flex flex-col gap-4">{renderLinks()}</nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;
