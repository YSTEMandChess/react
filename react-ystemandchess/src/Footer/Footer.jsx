import './Footer.css'
import TwitterIcon from '../images/twitterIcon.svg'
import InstagramIcon from '../images/instagramIcon.svg'
import FacebookIcon from '../images/facebookIcon.svg'
import GoogleIcon from '../images/googleIcon.svg'
import Ventive from '../images/sponsors/ventive.png'
import Kount from '../images/sponsors/kount.png'
import IdahoCentral from '../images/sponsors/idahoCentral.png'
import PH from '../images/sponsors/PH.svg'
import BoiseDistrict from '../images/partners/boiseDistrict.png'
import BoiseRescue from '../images/partners/boiseRescue.png'
import BoysAndGirls from '../images/partners/boysAndGirls.png'
import Possible from '../images/partners/possible.png'
import Rotary from '../images/partners/Rotary.png'

const Footer = () => {
    return ( 
        <footer>
            <div className="footer-container">

                <div className='footer-info'>
                    <h2 className='footer-email'>Info@ystemandchess.com</h2>
                    <h2 className='footer-phone'>+1 208.996.5071</h2>
                    <div className='footer-icons'>
                        <a href='/'><img src={TwitterIcon} alt="twitter-icon" id='twitter-icon'/></a>
                        <a href='/'><img src={InstagramIcon} alt="instagram-icon" id='instagram-icon'/></a>
                        <a href='/'><img src={FacebookIcon} alt="facebook-icon" id='facebook-icon'/></a>
                        <a href='/'><img src={GoogleIcon} alt="google-icon" id='google-icon'/></a>

                    </div>
                    <p className='footer-copyright'>Copyright © 2023 YSTEMAndChess. PR. All rights reserved.</p>
                </div>
                <div className='footer-sponsors'>
                    <h2 className='sponsors-title'><u>Sponsors</u></h2>
                    <ul className='sponsors-list'>
                        <li>
                            <img className='footer-ventive' src={Ventive} alt="ventive-logo"></img>
                        </li>
                        <li>
                            <img className='footer-kount' src={Kount} alt="kount-logo"></img>
                        </li>
                        <li>
                            <img className='footer-idahoCentral' src={IdahoCentral} alt="idahoCentral-logo"></img>
                        </li>
                        <li>
                            <img className='footer-PH' src={PH} alt="PH-logo"></img>
                        </li>
                    </ul>
                </div>
                <div className='footer-partners'>
                    <h2 className='partners-title'><u>Partners</u></h2>
                    <ul className='partners-list-1'>
                        <li> 
                            <img src={BoiseRescue} alt="boiseRescue-logo"/>
                        </li>
                        <li>
                            <img src={BoysAndGirls} alt="boysAndGirls-logo"/>
                        </li>
                        <li>
                            <img src={Possible} alt="possible-logo"></img>
                        </li>
                        <li>
                            <img src={BoiseDistrict} alt="boiseDistrict-logo"></img>
                        </li>
                        <li>
                            <img src={Rotary} alt="rotary-logo"></img>
                        </li>
                    </ul>
                    <ul>

                    </ul>
                </div>
            </div>

        </footer>
    );
}
 
export default Footer;