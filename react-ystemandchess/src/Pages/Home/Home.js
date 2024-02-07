import "./Home.css";
import LogoLineBr from "../../images/LogoLineBreak.png";
import TreesGroup from "../../images/Trees-Group.png";

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content1">
        <div className="info">
          <h1>
            Helping your child develop <br />
            critical thinking skills!
          </h1>

          <p>
            We are a nonprofit organization empowering <br></br>children to find
            their own success in STEM through <br></br>Chess, Math and Computer
            Science.
          </p>

          <button className="donate-button">
            <strong>Donate</strong>
          </button>
        </div>
        <div className="pic">
          <img src={TreesGroup} id="tree-group-img"></img>
        </div>
      </div>
      <img src={LogoLineBr} className="logo-break"></img>
      <h1 id="floating-h1">Everyone is included.</h1>
      <h1 id="floating-h1">Everyone is welcomed.</h1>
      <div className="home-content2">
        <div className="card1">
            
        </div>
        <div className="card2">

        </div>
      </div>
    </div>
  );
};

export default Home;
