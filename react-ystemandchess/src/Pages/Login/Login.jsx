import { Link } from "react-router-dom";
import "./Login.scss";
import { useState } from "react";
import { environment } from "../../environments/environment.js";
import { useCookies } from "react-cookie";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cookies, setCookie, removeCookie] = useCookies(["login"]);
  const [loginError, setLoginError] = useState("");
  const [usernameFlag, setUsernameFlag] = useState(true);
  const [passwordFlag, setPasswordFlag] = useState(true);

  const httpGetAsync = (theUrl, callback) => {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
        callback(xmlHttp.responseText);
    };
    xmlHttp.open("POST", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
  };

  const errorMessages = () => {
    usernameVerification();
    passwordVerification();
    if (passwordFlag === false || usernameFlag === false) {
      setLoginError("Invalid username or password");
    } else {
      setLoginError("");
    }
  };

  const usernameVerification = (e) => {
    if (username.length > 2) {
      setUsernameFlag(true);
    } else {
      setUsernameFlag(false);
    }
  };

  const passwordVerification = (e) => {
    if (password.length < 8) {
      setPasswordFlag(false);
    } else {
      setPasswordFlag(true);
    }
  };

  const submitLogin = (username, password, e) => {
    e.preventDefault();
    errorMessages();
    let url = `${environment.urls.middlewareURL}/auth/login?username=${username}&password=${password}`;
    httpGetAsync(url, (response) => {
      if (response === "The username or password is incorrect.") {
        setLoginError("The username or password is incorrect.");
      } else {
        const expires = new Date();
        expires.setDate(expires.getDate() + 1);
        setCookie("login", JSON.parse(response).token, { expires });
        console.log(cookies);
        let payload = JSON.parse(atob(response.split(".")[1]));
        console.log(payload, true);
        switch (payload["role"]) {
          case "student":
            window.location.pathname = "/student-profile";
            break;
          case "parent":
            window.location.pathname = "/parent";
            break;
          case "mentor":
            window.location.pathname = "/mentor-profile";
            break;
          case "admin":
            window.location.pathname = "/admin";
            break;
          default:
            window.location.pathname = "";
        }
      }
    });
  };

  return (
    <>
      <h1 id="login-h1">Login</h1>
      <h3 id="loginError-h3">{loginError}</h3>
      <p></p>
      <form
        className="login-input-container"
        onSubmit={(e) => submitLogin(username, password, e)}
      >
        <div className="login-input-field">
          <input
            type="text"
            name="username"
            id="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {/* <div className="underline"></div> */}
          {/* <label htmlFor="username">Username</label> */}
        </div>
        <div className="login-input-field">
          <input
            type="password"
            name="password"
            placeholder="Password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* <div className="underline"></div> */}
          {/* <label htmlFor="password">Password</label> */}
        </div>
        <button type="submit">Enter</button>
      </form>
      <div className="additional-options">
        <Link to="/signup" className="option">
          Create a new account
        </Link>
        <Link to="/reset-password" className="option">
          Forgot password?
        </Link>
      </div>
    </>
  );
};

export default Login;
