import './NavBar.css'
import { Link } from 'react-router-dom';
import FullLogo from '../images/full_logo.png'

const NavBar = () => {
    return ( 
       <header className="nav-bar">

        <Link to='/'>
            <img src={FullLogo}></img>
        </Link>

        <div className="nav-links">
            <Link to='/programs' className='links'>Programs</Link>
            <Link to='#' className='links'>About us </Link>
            <Link to='#' className='links'>Lessons/Play</Link>
            <Link to='/login' className='links'>Login</Link>
        </div>
       </header>
     );
}
 
export default NavBar;