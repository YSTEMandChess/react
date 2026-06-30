import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { environment } from "../../../environments/environment";

const inputClass = (invalid: boolean) =>
  `w-full rounded-lg border-2 px-4 py-3 text-sm text-dark bg-white caret-dark
   focus:outline-none focus:shadow-none transition-colors ${
     invalid ? "border-red" : "border-borderLight focus:border-primary"
   }`;

const MentorSignUp = () => {
  const [, setCookie] = useCookies(["login"]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    retypedPassword: "",
    zipcode: "",
    gender: "",
    education: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsFlag, setTermsFlag] = useState(false);

  const [matchingStudents, setMatchingStudents] = useState<string[]>([]);
  const [usernameToSearch, setUserToSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [assignedMenteeUsername, setAssignedMenteeUsername] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!/^[A-Za-z ]{2,15}$/.test(formData.firstName)) {
      next.firstName = "Invalid First Name";
    }
    if (!/^[A-Za-z]{2,15}$/.test(formData.lastName)) {
      next.lastName = "Invalid Last Name";
    }
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(formData.email)) {
      next.email = "Invalid Email";
    }
    if (!/^[a-zA-Z](\S){1,14}$/.test(formData.username)) {
      next.username = "Invalid Username";
    }
    if (formData.password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }
    if (formData.retypedPassword !== formData.password) {
      next.retypedPassword = "Passwords do not match";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleMenteeSearchChange = async (searchText: string) => {
    setUserToSearch(searchText);
    setAssignedMenteeUsername(null);

    if (searchText.trim() === "") {
      setActiveDropdown(false);
      setMatchingStudents([]);
      setDropdownLoading(false);
      return;
    }

    setActiveDropdown(true);
    setDropdownLoading(true);
    try {
      const response = await fetch(
        `${environment.urls.middlewareURL}/user/mentorless?keyword=${searchText}`,
        { method: "GET" }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const usernames = await response.json();
      setMatchingStudents(usernames.slice(0, 10));
    } catch (error) {
      setMatchingStudents([]);
      setErrors((prev) => ({ ...prev, general: "Failed to fetch student list." }));
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleSelectMentee = (selectedUsername: string) => {
    setAssignedMenteeUsername(selectedUsername);
    setUserToSearch(selectedUsername);
    setActiveDropdown(false);
    setMatchingStudents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsFlag) {
      setErrors((prev) => ({ ...prev, general: "Please accept the terms and conditions." }));
      return;
    }
    if (!validate()) {
      return;
    }
    if (!assignedMenteeUsername) {
      setErrors((prev) => ({ ...prev, general: "Please select your mentee" }));
      return;
    }

    const signupParams = new URLSearchParams({
      first: formData.firstName,
      last: formData.lastName,
      email: formData.email,
      password: formData.password,
      username: formData.username,
      role: "mentor",
      zipcode: formData.zipcode,
      gender: formData.gender,
      gradeLevel: formData.education,
    });

    try {
      const signupResponse = await fetch(
        `${environment.urls.middlewareURL}/user/?${signupParams.toString()}`,
        { method: "POST" }
      );

      if (!signupResponse.ok) {
        const content = await signupResponse.text();
        if (content.includes("username has been taken")) {
          setErrors((prev) => ({ ...prev, username: "Username already taken" }));
        } else {
          setErrors((prev) => ({ ...prev, general: "Sign up failed. Please try again." }));
        }
        return;
      }

      const loginResponse = await fetch(
        `${environment.urls.middlewareURL}/auth/login?username=${encodeURIComponent(
          formData.username
        )}&password=${encodeURIComponent(formData.password)}`,
        { method: "POST" }
      );

      if (!loginResponse.ok) {
        setErrors((prev) => ({ ...prev, general: "Account created. Please log in to continue." }));
        navigate("/login");
        return;
      }

      const loginData = await loginResponse.json();
      const jwtToken = loginData.token;
      const expires = new Date();
      expires.setDate(expires.getDate() + 1);
      setCookie("login", jwtToken, { expires, path: "/" });

      await fetch(
        `${environment.urls.middlewareURL}/user/updateMentorship?mentorship=${encodeURIComponent(
          assignedMenteeUsername
        )}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );

      navigate("/");
    } catch (error) {
      setErrors((prev) => ({ ...prev, general: "Sign up failed. Please try again." }));
    }
  };

  return (
    <div className="min-h-[71vh] flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-bold text-dark mb-6 text-center">Mentor Sign Up</h1>

      {errors.general && (
        <p className="text-red font-semibold mb-4 text-center" role="alert">
          {errors.general}
        </p>
      )}

      <form
        className="w-full max-w-sm bg-light rounded-2xl border-2 border-dark shadow-md p-8 flex flex-col gap-4"
        aria-label="Mentor Sign Up Form"
        onSubmit={handleSubmit}
      >
        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="firstName" className="text-sm font-bold text-dark">First Name</label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className={inputClass(!!errors.firstName)}
            />
            {errors.firstName && <span className="text-red text-xs">{errors.firstName}</span>}
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="lastName" className="text-sm font-bold text-dark">Last Name</label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className={inputClass(!!errors.lastName)}
            />
            {errors.lastName && <span className="text-red text-xs">{errors.lastName}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-bold text-dark">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleInputChange}
            required
            className={inputClass(!!errors.email)}
          />
          {errors.email && <span className="text-red text-xs">{errors.email}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-bold text-dark">Username</label>
          <input
            type="text"
            name="username"
            id="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className={inputClass(!!errors.username)}
          />
          {errors.username && <span className="text-red text-xs">{errors.username}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-bold text-dark">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className={inputClass(!!errors.password)}
          />
          {errors.password && <span className="text-red text-xs">{errors.password}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="retypedPassword" className="text-sm font-bold text-dark">Re-enter Password</label>
          <input
            type="password"
            name="retypedPassword"
            id="retypedPassword"
            placeholder="Re-enter your password"
            value={formData.retypedPassword}
            onChange={handleInputChange}
            required
            className={inputClass(!!errors.retypedPassword)}
          />
          {errors.retypedPassword && <span className="text-red text-xs">{errors.retypedPassword}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="zipcode" className="text-sm font-bold text-dark">Zip Code</label>
          <input
            type="text"
            name="zipcode"
            id="zipcode"
            placeholder="Zip Code"
            value={formData.zipcode}
            onChange={handleInputChange}
            className={inputClass(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gender" className="text-sm font-bold text-dark">Gender</label>
          <select
            name="gender"
            id="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className={inputClass(false)}
          >
            <option value="">Prefer not to say</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="education" className="text-sm font-bold text-dark">Current Occupation / Education</label>
          <input
            type="text"
            name="education"
            id="education"
            placeholder="Current Occupation / Education"
            value={formData.education}
            onChange={handleInputChange}
            className={inputClass(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5 relative">
          <label htmlFor="mentee-search-input" className="text-sm font-bold text-dark">Find a Student</label>
          <input
            ref={inputRef}
            type="text"
            id="mentee-search-input"
            placeholder="Find a student"
            value={usernameToSearch}
            onChange={(e) => handleMenteeSearchChange(e.target.value)}
            autoComplete="off"
            className={inputClass(false)}
          />
          {activeDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 z-20 mt-1 w-full rounded-lg border-2 border-borderLight bg-white shadow-lg"
            >
              {dropdownLoading ? (
                <div className="px-4 py-2 text-sm text-gray">Loading...</div>
              ) : matchingStudents.length > 0 ? (
                matchingStudents.map((name) => (
                  <div
                    key={name}
                    onClick={() => handleSelectMentee(name)}
                    className="px-4 py-2 text-sm text-dark cursor-pointer hover:bg-soft"
                  >
                    {name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray">No matching students found.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="terms"
            checked={termsFlag}
            onChange={(e) => setTermsFlag(e.target.checked)}
            required
          />
          <label htmlFor="terms" className="text-dark">I accept the terms and conditions</label>
        </div>

        <div className="flex justify-center pt-2">
          <button type="submit" className="btn-yellow px-10">Sign Up</button>
        </div>
      </form>
    </div>
  );
};

export default MentorSignUp;
