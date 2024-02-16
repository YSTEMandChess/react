import { Link } from "react-router-dom";
import "./Login.scss"
const Login = () => {
    return (
      <>
        <h1>Login</h1>
        <form className="input-container">
          <div className="input-field">
            <input type="text" name="username" id="username" required />
            <div className="underline"></div>
            <label htmlFor="username">Username</label>
          </div>
          <div className="input-field">
            <input type="password" name="password" id="password" required />
            <div className="underline"></div>
            <label htmlFor="password">Password</label>
          </div>
          <button>Enter</button>
        </form>
        <div className="additional-options">
          <Link to="/signup" className="option">
            Create a new account
          </Link>
          <Link to="/resetpassword" className="option">
            Forgot password?
          </Link>
        </div>
      </>
    );
}
 
export default Login;