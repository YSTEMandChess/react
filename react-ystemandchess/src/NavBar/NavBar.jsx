import './NavBar.scss'
import { Link } from 'react-router-dom';
import FullLogo from '../images/full_logo.png'
import { useState } from 'react';

const NavBar = () => {
  const [dropdown, setDropdown] = useState(false)

  const handleDropdown = () => {
    setDropdown(prevDropdown => !prevDropdown)
  }
  return ( 
      <header className="nav-bar">

      <Link to='/'>
          <img src={FullLogo}></img>
      </Link>

      <div className="nav-links">
          <Link to='/programs' className='links'>Programs</Link>
          <div className="dropdown">
            <p onClick={handleDropdown}>About Us</p>
            {dropdown && 
            <div className='dropdown-menu'>
              <div className='education'>
                <h3>Education</h3>
                <Link to="/benefit-of-computer-science">Benefit of Computer Science</Link>
                <Link to="/benefit-of-chess">Benefit of Chess</Link>
                <Link to="/benefit-of-math-tutoring">Benefit of Math Tutoring</Link>
                <Link to="/benefit-of-mentoring">Benefit of Mentoring</Link>
              </div>
              <div className="what-we-do">
                <h3>What We Do</h3>
                <Link>Online Expansion</Link>
                <Link>About Us</Link>
                <Link>Mission</Link>
                <Link>Financial</Link>
                <Link>Board</Link>
              </div>
            </div>}
          </div>
          <Link to='#' className='links'>Lessons/Play</Link>
          <Link to='/login' className='links'>Login</Link>
      </div>
      </header>
    );
}
 
export default NavBar;