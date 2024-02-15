import './Footer.css'
import TwitterIcon from '../images/twitterIcon.svg'
import InstagramIcon from '../images/instagramIcon.svg'
import FacebookIcon from '../images/facebookIcon.svg'
import GoogleIcon from '../images/googleIcon.svg'

const Footer = () => {
    return ( 
        <footer>
            <div className="footer-container">

                <div className='footer-info'>
                    <h2>Info@ystemandchess.com</h2>
                    <h2>+1 208.996.5071</h2>
                    <div className='footer-icons'>
                        <a href='/'><img src={TwitterIcon} id='twitter-icon'/></a>
                        <a href='/'><img src={InstagramIcon} id='insta-icon'/></a>
                        <a href='/'><img src={FacebookIcon} id='fb-icon'/></a>
                        <a href='/'><img src={GoogleIcon} id='google-icon'/></a>

                    </div>
                    <p>Copyright © 2023 YSTEMAndChess. PR. All rights reserved.</p>
                </div>
                <div className='footer-sponsors'>
                    <h2><u>Sponsors</u></h2>
                </div>
                <div className='footer-partners'>
                    <h2><u>Partners</u></h2>
                </div>
            </div>

        </footer>
     );
}
 
export default Footer;