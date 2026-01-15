import React, { useState, useEffect, useRef } from 'react';
import './SignUp.scss';
import { environment } from '../../../environments/environment';

// Define the interface for the props of the StudentTemplate component
interface StudentTemplateProps {
    studentUsername: string;
    onClick: (username: string) => void;
}

// Component for displaying student search results
const StudentTemplate: React.FC<StudentTemplateProps> = ({ studentUsername, onClick }) => {
    return (
        <div className="item-template" onClick={() => onClick(studentUsername)}>
            <div>{studentUsername}</div>
        </div>
    );
};

const Signup = () => {
    // State to manage the form data for the user
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    retypedPassword: '',
    accountType: 'mentor',
  });

    // State flags to track the validity of individual input fields
    const [firstNameFlag, setFirstNameFlag] = useState(false);
    const [lastNameFlag, setLastNameFlag] = useState(false);
    const [emailFlag, setEmailFlag] = useState(false);
    const [userNameFlag, setUserNameFlag] = useState(false);
    const [passwordFlag, setPasswordFlag] = useState(false);
    const [retypeFlag, setRetypeFlag] = useState(false);
    const [termsFlag, setTermsFlag] = useState(false);

    // States for the student search dropdown
    const [matchingStudents, setMatchingStudents] = useState<string[]>([]);
    const [usernameToSearch, setUserToSearch] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(false);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    // State to store any validation errors for the form fields
  const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        retypePassword: '',
        terms: '',
    general: '',
  });

    // State to manage the parent account specific UI and data
    const [parentAccountFlag, setParentAccountFlag] = useState(false);
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [students, setStudents] = useState<any>([]);
    const [assignedMenteeUsername, setAssignedMenteeUsername] = useState<string | null>(null);

    // Handle click outside dropdown to close it
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

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handles changes to input fields in the main form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

        // Performs specific validation based on the input field that changed
        switch (name) {
            case 'firstName':
                firstNameVerification(value);
                break;
            case 'lastName':
                lastNameVerification(value);
                break;
            case 'email':
                emailVerification(value);
                break;
            case 'username':
                usernameVerification(value);
                break;
            case 'password':
                passwordVerification(value);
                break;
            case 'retypedPassword':
                retypePasswordVerification(value, formData.password);
                break;
            default:
                break;
        }
    };

    // Verifies the format of the first name
    const firstNameVerification = (firstName: string) => {
        const isValid = /^[A-Za-z ]{2,15}$/.test(firstName);
        setFirstNameFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            firstName: isValid ? '' : 'Invalid First Name',
        }));
        return isValid;
    };

    // Verifies the format of the last name
    const lastNameVerification = (lastName: string) => {
        const isValid = /^[A-Za-z]{2,15}$/.test(lastName);
        setLastNameFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            lastName: isValid ? '' : 'Invalid Last Name',
        }));
        return isValid;
    };

    // Verifies the format of the email address
    const emailVerification = (email: string) => {
        const isValid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(email);
        setEmailFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            email: isValid ? '' : 'Invalid Email',
        }));
        return isValid;
    };

    // Verifies the format of the username
    const usernameVerification = (username: string) => {
        const isValid = /^[a-zA-Z](\S){1,14}$/.test(username);
        setUserNameFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            username: isValid ? '' : 'Invalid Username',
        }));
        return isValid;
    };

    // Verifies the length of the password
    const passwordVerification = (password: string) => {
        const isValid = password.length >= 8;
        setPasswordFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            password: isValid ? '' : 'Password must be at least 8 characters',
        }));
        return isValid;
    };

    // Verifies if the retyped password matches the original password
    const retypePasswordVerification = (retypedPassword: string, password: string) => {
        const isValid = retypedPassword === password;
        setRetypeFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            retypePassword: isValid ? '' : 'Passwords do not match',
        }));
        return isValid;
    };

    // Handles terms checkbox change
    const termsCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTermsFlag(e.target.checked);
    };

    // Handles changes to the account type dropdown
    const handleAccountTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const isParent = e.target.value === 'parent';
        setParentAccountFlag(isParent);
        setFormData((prev) => ({
            ...prev,
            accountType: e.target.value,
        }));
        // Reset mentee search/selection when switching account type
        setUserToSearch('');
        setAssignedMenteeUsername(null);
        setActiveDropdown(false);
        setMatchingStudents([]);
    };

    // Adds a new student form to the UI for parent accounts
    const handleAddStudent = () => {
        const newStudent = {
            id: Date.now(),
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            retypedPassword: '',
            errors: {},
        };
        setStudents((prev: any) => [...prev, newStudent]);
        setShowStudentForm(true);
    };

    // Handles changes to input fields within a student's form
    const handleStudentInputChange = (studentId: any, field: string, value: string) => {
        switch (field) {
            case 'firstName':
                firstNameVerification(value);
                break;
            case 'lastName':
                lastNameVerification(value);
                break;
            case 'email':
                emailVerification(value);
                break;
            case 'username':
                usernameVerification(value);
                break;
            case 'password':
                passwordVerification(value);
                break;
            case 'retypedPassword':
                const student = students.find((s) => s.id === studentId);
                const password = student?.password;
                retypePasswordVerification(value, password);
                break;
            default:
                break;
        }

        setStudents((prev: any) =>
            prev.map((student: any) =>
                student.id === studentId ? { ...student, [field]: value } : student
            )
        );
    };

    // Removes a student form from the UI
    const handleRemoveStudent = (studentId: any) => {
        setStudents((prev: any) => prev.filter((student: any) => student.id !== studentId));
        if (students.length === 1) {
            setShowStudentForm(false);
        }
    };

    // Handles changes in the "Find a student" input and triggers API call
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
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const usernames = await response.json();
            const top10Usernames = usernames.slice(0, 10);
            setMatchingStudents(top10Usernames);
            setDropdownLoading(false);
        } catch (error) {
            console.error('Error fetching mentorless students:', error);
            setDropdownLoading(false);
            setMatchingStudents([]);
            setErrors((prev) => ({
                ...prev,
                general: 'Failed to fetch student list.',
            }));
        }
    };

    // Handles selecting a mentee from the dropdown
    const handleSelectMentee = (selectedUsername: string) => {
        setAssignedMenteeUsername(selectedUsername);
        setUserToSearch(selectedUsername);
        setActiveDropdown(false);
        setMatchingStudents([]);
    };

    // Handles the submission of the signup form
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
        console.log('Submit clicked', formData);

        // Check if the terms and conditions are checked
        if (!termsFlag) {
            setErrors((prev) => ({ ...prev, general: 'Please accept the terms and conditions.' }));
            return;
        }

        // Checks if all main form fields are valid based on their flags
        const isValid =
            firstNameFlag &&
            lastNameFlag &&
            emailFlag &&
            userNameFlag &&
            passwordFlag &&
            retypeFlag;

        // If the main form is not valid, prevents submission
        if (!isValid) {
            console.log('Form validation failed');
            setErrors((prev) => ({ ...prev, general: 'Please correct the form errors.' }));
            return;
        }

        // If user is a mentor but has not selected mentee
        if (formData.accountType === 'mentor' && !assignedMenteeUsername) {
            setErrors((prev) => ({ ...prev, general: 'Please select your mentee' }));
            return;
        }

        let signupUrl = `${environment.urls.middlewareURL}/user/`;
        let signupParams: URLSearchParams;

        if (parentAccountFlag) {
            // Maps student data into the required format for the API
            const studentsData = students.map((student: any) => ({
                first: student.firstName,
                last: student.lastName,
                email: student.email,
                username: student.username,
                password: student.password,
            }));

            // Prepare params for parent signup, stringifying the students array
            signupParams = new URLSearchParams({
                first: formData.firstName,
                last: formData.lastName,
                email: formData.email,
                password: formData.password,
                username: formData.username,
                role: formData.accountType,
                students: JSON.stringify(studentsData),
            });
        } else {
            // Prepare params for non-parent accounts
            signupParams = new URLSearchParams({
                first: formData.firstName,
                last: formData.lastName,
                email: formData.email,
                password: formData.password,
                username: formData.username,
                role: formData.accountType,
            });
        }

        // Append query parameters to the URL for the signup request
        signupUrl = `${signupUrl}?${signupParams.toString()}`;
        console.log('Signup Request URL:', signupUrl);

        try {
            // STEP 1: Perform User Signup
            const signupResponse = await fetch(signupUrl, {
                method: 'POST',
            });

            console.log('Signup Response status:', signupResponse.status);

            if (!signupResponse.ok) {
                let errorContent: any;
                try {
                    errorContent = await signupResponse.json();
                } catch (jsonError) {
                    errorContent = await signupResponse.text();
                }

                if (typeof errorContent === 'string' && errorContent === 'This username has been taken. Please choose another.') {
                    setErrors((prev) => ({
                        ...prev,
                        username: 'Username already taken',
                        general: '',
                    }));
                } else {
                    const errorMessage = (typeof errorContent === 'object' && errorContent !== null && 'message' in errorContent && typeof errorContent.message === 'string')
                        ? errorContent.message
                        : (typeof errorContent === 'string' && errorContent.length > 0)
                            ? errorContent
                            : 'Unknown error during signup';
                    throw new Error(`HTTP error! status: ${signupResponse.status}, message: ${errorMessage}`);
                }
                return;
            }

            console.log('Signup successful, proceeding to login to get token...');

            let jwtToken: string | null = null;

            // STEP 2: Perform Login to get JWT Token
            try {
                const loginUrl = `${environment.urls.middlewareURL}/auth/login?username=${encodeURIComponent(formData.username)}&password=${encodeURIComponent(formData.password)}`;
                console.log('Login URL for token acquisition:', loginUrl);

                const loginResponse = await fetch(loginUrl, {
                    method: 'POST',
                });

                console.log('Login Response status:', loginResponse.status);

                if (!loginResponse.ok) {
                    const loginErrorData = await loginResponse.json();
                    throw new Error(`Login failed after signup: ${loginErrorData.message || 'Unknown login error'}`);
                }

                const loginData = await loginResponse.json();
                jwtToken = loginData.token;
                console.log('Login successful, JWT token obtained.');
            } catch (loginError: any) {
                console.error('Error during login after signup:', loginError);
                setErrors((prev) => ({
                    ...prev,
                    general: `Signup successful, but failed to log in to assign mentee: ${loginError.message || 'Login network error'}`,
                }));
                window.location.href = '/';
      return;
    }

            // STEP 3: Conditionally Perform Mentee Assignment
            if (formData.accountType === 'mentor' && assignedMenteeUsername && jwtToken) {
                const updateMentorshipUrl = `${environment.urls.middlewareURL}/user/updateMentorship?mentorship=${encodeURIComponent(assignedMenteeUsername)}`;

                try {
                    const updateMentorshipResponse = await fetch(updateMentorshipUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${jwtToken}`,
                        },
                    });

                    console.log('Update Mentorship Response status:', updateMentorshipResponse.status);

                    if (!updateMentorshipResponse.ok) {
                        const updateErrorData = await updateMentorshipResponse.json();
                        console.error('Mentorship update failed:', updateErrorData);
                        setErrors((prev) => ({
                            ...prev,
                            general: `Signup successful, but mentee assignment failed: ${updateErrorData.message || 'Unknown error'}`,
                        }));
                    } else {
                        const updateSuccessData = await updateMentorshipResponse.json();
                        console.log('Mentorship update successful:', updateSuccessData);
                    }
                } catch (updateError: any) {
                    console.error('Error during mentorship update:', updateError);
                    setErrors((prev) => ({
                        ...prev,
                        general: `Signup successful, but mentee assignment network error: ${updateError.message || 'Network error'}`,
                    }));
                }
            }

            // Final Step: Redirect to homepage after all operations
            window.location.href = '/';
        } catch (error: any) {
            console.error('Signup error:', error);
            setErrors((prev) => ({
                ...prev,
                general: error.message || 'Signup failed. Please try again.',
            }));
        }
  };

  return (
    <div className="signup-page">
      <h1 className="signup-title">Create Account</h1>
            
      {errors.general && <p className="signup-error">{errors.general}</p>}

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>

        <div className="input-wrapper">
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
        </div>

        <div className="input-wrapper">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
                    {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="input-wrapper">
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
                    {errors.username && <span className="error-text">{errors.username}</span>}
        </div>

        <div className="input-wrapper">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
                    {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="input-wrapper">
          <label>Re-type Password</label>
          <input
            type="password"
            name="retypedPassword"
            placeholder="Re-type your password"
            value={formData.retypedPassword}
            onChange={handleInputChange}
            required
          />
                    {errors.retypePassword && <span className="error-text">{errors.retypePassword}</span>}
        </div>

        <div className="input-wrapper">
          <label>Account Type</label>
                    <select name="accountType" value={formData.accountType} onChange={handleAccountTypeChange}>
            <option value="mentor">Mentor</option>
            <option value="parent">Parent</option>
          </select>
        </div>

                {!parentAccountFlag && (
                    <div className="input-wrapper">
                        <label>Find a Student (for Mentors)</label>
                        <input
                            ref={inputRef}
                            type="text"
                            name="setMentee"
                            id="mentee-search-input"
                            placeholder="Find a student"
                            value={usernameToSearch}
                            onChange={(e) => handleMenteeSearchChange(e.target.value)}
                            autoComplete="off"
                        />
                        {activeDropdown && (
                            <div className="dropdown-users" id="mentee-dropdown-container" ref={dropdownRef}>
                                {dropdownLoading ? (
                                    <div className="item-template">Loading...</div>
                                ) : (
                                    matchingStudents.length > 0 ? (
                                        matchingStudents.map((username) => (
                                            <StudentTemplate
                                                key={username}
                                                studentUsername={username}
                                                onClick={handleSelectMentee}
                                            />
                                        ))
                                    ) : (
                                        <div className="item-template">No matching students found.</div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}

                {parentAccountFlag && (
                    <div className="student-section">
                        {!showStudentForm && (
                            <button
                                type="button"
                                className="add-student-btn"
                                onClick={handleAddStudent}
                            >
                                Create Student
                            </button>
                        )}

                        {students.map((student: any) => (
                            <div key={student.id} className="student-form">
                                <button
                                    type="button"
                                    className="remove-student"
                                    onClick={() => handleRemoveStudent(student.id)}
                                >
                                    Delete student
                                </button>
                                <input
                                    type="text"
                                    placeholder="Student's first name"
                                    value={student.firstName}
                                    onChange={(e) =>
                                        handleStudentInputChange(
                                            student.id,
                                            'firstName',
                                            e.target.value
                                        )
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Student's last name"
                                    value={student.lastName}
                                    onChange={(e) =>
                                        handleStudentInputChange(
                                            student.id,
                                            'lastName',
                                            e.target.value
                                        )
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Student username"
                                    value={student.username}
                                    onChange={(e) =>
                                        handleStudentInputChange(
                                            student.id,
                                            'username',
                                            e.target.value
                                        )
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Student's email"
                                    value={student.email}
                                    onChange={(e) =>
                                        handleStudentInputChange(student.id, 'email', e.target.value)
                                    }
                                />
                                <input
                                    type="password"
                                    placeholder="Student's password"
                                    value={student.password}
                                    onChange={(e) =>
                                        handleStudentInputChange(
                                            student.id,
                                            'password',
                                            e.target.value
                                        )
                                    }
                                />
                                <input
                                    type="password"
                                    placeholder="Re-type student's password"
                                    value={student.retypedPassword}
                                    onChange={(e) =>
                                        handleStudentInputChange(
                                            student.id,
                                            'retypedPassword',
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>
                )}

        <div className="terms-wrapper">
                    <input type="checkbox" id="terms" onChange={termsCheckChange} required />
          <label htmlFor="terms">I accept the terms and conditions</label>
                    {errors.terms && <span className="error-text">{errors.terms}</span>}
        </div>

        <div className="button-wrapper">
          <button type="submit">Sign Up</button>
        </div>
      </form>

      <div className="signup-links">
        <a href="/login">Back to Login</a>
      </div>
    </div>
  );
};

export default Signup;
