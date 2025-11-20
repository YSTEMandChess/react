/**
 * Navigation Bar Component
 * 
 * This component provides the main navigation interface for the application.
 * It includes responsive design, dropdown menus, user authentication status,
 * and smooth animations. The navbar adapts its content based on user login
 * status and role permissions.
 * 
 * Features:
 * - Responsive design with mobile hamburger menu
 * - Animated dropdown menus for "About Us" section
 * - User authentication status display
 * - Role-based navigation options
 * - Smooth animations using Framer Motion
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FullLogo from "../../assets/images/full_logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import "./NavBar.scss";
import { SetPermissionLevel } from "../../globals";
import { useCookies } from "react-cookie";

/**
 * Animation variants configuration for Framer Motion
 * 
 * These variants define the animation states for dropdown menus and
 * other animated elements in the navigation bar. They provide smooth
 * transitions when menus appear and disappear.
 */
const navbarVariants = {
  // Initial state for parent containers (dropdown menus)
  parentInitial: {
    opacity: 0,        // Start invisible
    translateY: -25,   // Start 25px above final position
  },
  
  // Animated state for parent containers
  parentAnimate: {
    opacity: 1,        // Fade in to fully visible
    translateY: -10,   // Move to 10px above final position
    transition: {
      duration: 0.3,   // Animation duration in seconds
    },
  },

  // Initial state for child elements within dropdowns
  childInitial: {
    opacity: 0,        // Start invisible
    translateY: -25,   // Start 25px above final position
  },
  
  // Animated state for child elements
  childAnimate: {
    opacity: 1,        // Fade in to fully visible
    translateY: 0,     // Move to final position
    transition: {
      duration: 0.3,         // Animation duration in seconds
      staggerChildren: 0.125, // Delay between child animations
    },
  },
};

/**
 * Main NavBar component function
 * 
 * This component manages the entire navigation bar state and behavior,
 * including user authentication, dropdown menus, and responsive design.
 * 
 * @returns JSX element representing the navigation bar
 */
const NavBar = () => {
  // Cookie management hooks for handling user authentication tokens
  const [cookies, setCookie, removeCookie] = useCookies([
    "login",      // Authentication JWT token
    "eventId",    // Current session/event identifier
    "timerStatus", // Timer state for user activity tracking
  ]);

  // State variables for managing dropdown menu visibility
  const [mobileMenuDropDown, setMobileMenuDropDown] = useState(false);  // Mobile hamburger menu state
  const [aboutUsDropDown, setAboutUsDropDown] = useState(false);        // "About Us" dropdown menu state
  const [profileDropdown, setProfileDropdown] = useState(false);        // User profile dropdown state

  // Navigation and user state variables
  const [link, setLink] = useState("");          // Current active link (unused in current implementation)
  const [logged, setLogged] = useState(false);   // Whether user is currently logged in
  const [username, setUsername] = useState("");  // Current user's username
  const [role, setRole] = useState("");          // Current user's role (student, mentor, etc.)

  // Ref objects for managing click-outside behavior for dropdowns
  // These refs allow us to detect clicks outside dropdown menus to close them
  const aboutUsRef = useRef<any>(null);          // Reference to "About Us" dropdown container
  const profileDropdownRef = useRef<any>(null);  // Reference to profile dropdown container
  const mobileMenuRef = useRef<any>(null);       // Reference to mobile menu container
  const hamburgerRef = useRef<any>(null);        // Reference to hamburger menu button

  /**
   * Toggles the mobile hamburger menu visibility
   * 
   * This function is called when the hamburger menu button is clicked
   * on mobile devices. It toggles the dropdown menu state.
   */
  const toggleMobileMenu = () => {
    setMobileMenuDropDown((prev) => !prev);
  };

  /**
   * Toggles the "About Us" dropdown menu visibility
   * 
   * This function controls the visibility of the "About Us" dropdown
   * menu that contains links to various informational pages.
   */
  const toggleAboutUs = () => {
    setAboutUsDropDown((prev) => !prev);
  };

  /**
   * Toggles the user profile dropdown menu visibility
   * 
   * This function controls the visibility of the user profile dropdown
   * that appears when a logged-in user clicks on their username.
   */
  const profileToggleDropdown = () => {
    setProfileDropdown((prevDropdown) => !prevDropdown);
  };

  /**
   * Effect hook for managing dropdown behavior and user session
   * 
   * This effect sets up event listeners for closing dropdowns when clicking
   * outside of them, and initializes the user session check on component mount.
   */
  useEffect(() => {
    /**
     * Handles closing dropdowns when user clicks outside of them
     * 
     * This function checks if the click target is outside of the dropdown
     * containers and closes the appropriate dropdowns if needed.
     * 
     * @param event - Mouse click event object
     */
    const closeDropdown = (event: { target: any }) => {
      // Close "About Us" dropdown if click is outside its container
      if (aboutUsRef.current && !aboutUsRef.current.contains(event.target)) {
        setAboutUsDropDown(false);
      }
      
      // Close mobile menu if click is outside both the menu and hamburger button
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target) &&
        aboutUsRef.current &&
        !aboutUsRef.current.contains(event.target)
      ) {
        setMobileMenuDropDown(false);
      }
    };

    /**
     * Handles closing the profile dropdown when user clicks outside
     * 
     * @param event - Mouse click event object
     */
    const closeProfileDropdown = (event: { target: any }) => {
      // Close profile dropdown if click is outside its container
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdown(false);
      }
    };

    // Check user authentication status on component mount
    checkSessionInfo();

    // Add event listeners for click-outside behavior
    document.addEventListener("mousedown", closeDropdown);
    document.addEventListener("mousedown", closeProfileDropdown);

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("mousedown", closeProfileDropdown);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Redirects user to the login page
   * 
   * This function performs a hard redirect to the login URL.
   * Used when authentication is required but user is not logged in.
   */
  const redirectToURL = () => {
    window.location.href = "/login";
  };

  /**
   * Initializes navigation state
   * 
   * Sets the active link to home page. This function appears to be
   * unused in the current implementation but may be for future use.
   */
  const init = () => {
    setLink("/");
  };

  /**
   * Checks and updates user session information
   * 
   * This async function validates the user's authentication status
   * using cookies and updates the component state with user information.
   * It determines if the user is logged in and what role they have.
   */
  async function checkSessionInfo() {
    // Default permission level for non-authenticated users
    let pLevel = "nLogged";
    
    // Validate user session using the global authentication function
    let uInfo = await SetPermissionLevel(cookies, removeCookie);
    
    // If no error in user info, user is authenticated
    if (uInfo["error"] === undefined) {
      setLogged(true);                    // Mark user as logged in
      pLevel = uInfo["role"];             // Store user's role
      setUsername(uInfo["username"]);     // Store username for display
      setRole(uInfo["role"]);             // Store role for conditional rendering

      // Note: Event ID and timer status handling could be added here
      // const eventId = cookies.eventId
      // const timerStatus = cookies.timerStatus
    }
  }

  /**
   * Logs out the current user
   * 
   * This function removes all authentication-related cookies and
   * redirects the user to the login page. It performs a complete
   * cleanup of the user session.
   */
  const logout = () => {
    // Remove all authentication and session cookies
    removeCookie("login");        // Remove JWT authentication token
    removeCookie("eventId");      // Remove current session event ID
    removeCookie("timerStatus");  // Remove timer status information
    
    // Redirect to login page using pathname (hard navigation)
    window.location.pathname = "/login";
  };

  /**
   * Renders the navigation links for both desktop and mobile views
   * 
   * This function generates all the navigation links including:
   * - Main navigation items (Programs, About Us, etc.)
   * - Conditional authentication links (Login/Profile dropdown)
   * - Role-based links for different user types
   * - Animated dropdown menus with proper accessibility attributes
   * 
   * @returns JSX elements representing all navigation links
   */
  const renderLinks = () => (
    <>
      {/* Programs page link */}
      <Link
        to="/programs"
        className="text-gray-700 hover:text-black text-lg px-3 py-1"
      >
        Programs
      </Link>

      {/* About Us dropdown menu container */}
      <div ref={aboutUsRef} className="relative">
        {/* About Us dropdown trigger button */}
        <div
          onClick={toggleAboutUs}
          className="flex items-center cursor-pointer justify-center text-gray-700 hover:text-black text-lg px-3 py-1 select-none"
          aria-haspopup="true"
          aria-expanded={aboutUsDropDown}
          aria-controls="aboutus-menu"
        >
          About Us
          {/* Dropdown indicator icon that changes based on menu state */}
          <FontAwesomeIcon
            icon={aboutUsDropDown ? faCaretUp : faCaretDown}
            className="ml-1"
          />
        </div>
        
        {/* About Us dropdown menu content (conditionally rendered) */}
        {aboutUsDropDown && (
          <motion.div
            id="aboutus-menu"
            className="absolute bg-white shadow-md p-4 z-20 mt-2 w-64 rounded-md"
            initial="parentInitial"
            animate="parentAnimate"
            variants={navbarVariants}
          >
            {/* Education section */}
            <h3 className="font-bold mb-2 text-lg">Education</h3>
            <div className="flex flex-col gap-2">
              {/* Educational benefit pages */}
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

            {/* What We Do section */}
            <h3 className="font-bold mt-4 mb-2 text-lg">What We Do</h3>
            <div className="flex flex-col gap-2">
              {/* Organizational information pages */}
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

      {/* Main navigation links */}
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
      <Link
        to="/puzzles"
        className="text-gray-700 hover:text-black text-lg px-3 py-1"
      >
        Puzzles
      </Link>

      {/* Conditional rendering: Show login link only when user is not authenticated */}
      {!username && (
        <Link
          to="/login"
          className="text-gray-700 hover:text-black text-lg px-3 py-1"
        >
          Login
        </Link>
      )}

      {/* Conditional rendering: Show user profile dropdown when user is authenticated */}
      {username && (
        <div className="w-full lg:w-fit flex justify-center">
          <div ref={profileDropdownRef} className="relative w-fit">
            {/* Profile dropdown trigger button showing username */}
            <button
              onClick={profileToggleDropdown}
              className="bg-transparent flex items-center text-gray-700 hover:text-black text-lg px-3 py-1"
              aria-haspopup="true"
              aria-expanded={profileDropdown}
              aria-controls="login-menu"
            >
              {username}
              {/* Dropdown indicator icon */}
              <FontAwesomeIcon
                icon={profileDropdown ? faCaretUp : faCaretDown}
                className="ml-1"
              />
            </button>

            {/* Profile dropdown menu (conditionally rendered) */}
            {profileDropdown && (
              <motion.div
                id="login-menu"
                className="absolute bg-white right-0 shadow-md mt-2 w-48 rounded-md p-3 z-20"
                initial="parentInitial"
                animate="parentAnimate"
                variants={navbarVariants}
              >
                <div className="flex flex-col gap-2">
                  {/* Dynamic profile link based on user role */}
                  <Link
                    to={`/${role}-profile`}
                    onClick={profileToggleDropdown}
                    className="text-gray-700 hover:text-black text-base"
                  >
                    Profile
                  </Link>
                  
                  {/* Conditional link for parent users only */}
                  {role === "parent" && (
                    <Link
                      to="/parent-add-student"
                      onClick={profileToggleDropdown}
                      className="text-gray-700 hover:text-black text-base"
                    >
                      Add Student
                    </Link>
                  )}
                  
                  {/* Logout button */}
                  <button
                    onClick={logout}
                    className="bg-transparent text-left text-gray-700 hover:text-black text-base"
                  >
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </>
  );

  /**
   * Main render method for the NavBar component
   * 
   * This renders the complete navigation bar structure including:
   * - Logo section with home page link
   * - Desktop navigation menu (hidden on mobile)
   * - Mobile hamburger menu button (hidden on desktop)
   * - Mobile dropdown menu (conditionally rendered)
   * 
   * The component uses responsive design classes to show/hide elements
   * based on screen size and provides a consistent navigation experience
   * across all device types.
   * 
   * @returns JSX element representing the complete navigation bar
   */
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center h-24 lg:pr-8">
          
          {/* Logo section - always visible, links to home page */}
          <div className="">
            <Link to="/">
              <img src={FullLogo} alt="YSTEM Logo" className="h-24 w-auto" />
            </Link>
          </div>

          {/* Mobile hamburger menu button - only visible on mobile devices */}
          <div className="flex md:hidden">
            <button
              ref={hamburgerRef}
              type="button"
              className="text-gray-700 bg-transparent hover:text-black focus:outline-none"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {/* SVG icon that changes between hamburger and X based on menu state */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {/* Conditional rendering of icon paths */}
                {mobileMenuDropDown ? (
                  // X icon when menu is open
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  // Hamburger icon when menu is closed
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

          {/* Desktop navigation links - hidden on mobile, visible on medium screens and up */}
          <nav className="hidden md:flex md:items-center md:gap-6">
            {renderLinks()}
          </nav>
        </div>
      </div>

      {/* Mobile dropdown menu - conditionally rendered based on mobileMenuDropDown state */}
      {mobileMenuDropDown && (
        <div ref={mobileMenuRef} className="md:hidden px-4 pb-4">
          {/* Mobile navigation using vertical layout */}
          <nav className="flex flex-col gap-4">{renderLinks()}</nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;
