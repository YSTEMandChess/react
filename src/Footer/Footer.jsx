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
                        <a href='/'><img src={TwitterIcon} id='twitter-icon'/></a>
                        <a href='/'><img src={InstagramIcon} id='insta-icon'/></a>
                        <a href='/'><img src={FacebookIcon} id='fb-icon'/></a>
                        <a href='/'><img src={GoogleIcon} id='google-icon'/></a>

                    </div>
                    <p className='footer-copyright'>Copyright © 2023 YSTEMAndChess. PR. All rights reserved.</p>
                </div>
                <div className='footer-sponsors'>
                    <h2 className='sponsors-title'><u>Sponsors</u></h2>
                    <ul className='sponsors-list'>
                        <li>
                            <img className='footer-ventive' src={Ventive}></img>
                        </li>
                        <li>
                            <img className='footer-kount' src={Kount}></img>
                        </li>
                        <li>
                            <img className='footer-idahoCentral' src={IdahoCentral}></img>
                        </li>
                        <li>
                            <img className='footer-PH' src={PH}></img>
                        </li>
                    </ul>
                </div>
                <div className='footer-partners'>
                    <h2 className='partners-title'><u>Partners</u></h2>
                    <ul className='partners-list-1'>
                        <li> 
                            <img src={BoiseRescue}/>
                        </li>
                        <li>
                            <img src={BoysAndGirls}/>
                        </li>
                        <li>
                            <img src={Possible}></img>
                        </li>
                        <li>
                            <img src={BoiseDistrict}></img>
                        </li>
                        <li>
                            <img src={Rotary}></img>
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