import React, { useState } from 'react';
// import { Cookie } from 'react-router'; // 'react-router' does not export 'Cookie'. This line should probably be removed or corrected.
import './SignUp.scss'; // Imports the stylesheet for this component.
import { environment } from '../../environments/environment'; // Imports environment variables, likely containing API URLs.
// import StudentProfile from '../StudentProfile/Student-Profile'; // Only import if actively used in this component

console.log('Environment URL:', environment.urls.middlewareURL); // Logs the middleware URL from the environment.

// Define the interface for the props of the StudentTemplate component
interface StudentTemplateProps {
    studentUsername: string; // The student prop is a string (username)
    onClick: (username: string) => void; // onClick takes the username as an argument
}

// Renamed to start with a capital letter and typed its props
const StudentTemplate: React.FC<StudentTemplateProps> = ({ studentUsername, onClick }) => {
    return (
        <div className="item-template" onClick={() => onClick(studentUsername)}>
            <div>{studentUsername}</div>
        </div>
    );
};

const Signup = () => {
    // State to manage the form data for the user.
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        retypedPassword: '',
        accountType: 'mentor', // Default account type is set to 'mentor'.
    });

    // State flags to track the validity of individual input fields.
    const [firstNameFlag, setFirstNameFlag] = useState(false);
    const [lastNameFlag, setLastNameFlag] = useState(false);
    const [emailFlag, setEmailFlag] = useState(false);
    const [userNameFlag, setUserNameFlag] = useState(false);
    const [passwordFlag, setPasswordFlag] = useState(false);
    const [retypeFlag, setRetypeFlag] = useState(false);

    // States for the student search dropdown
    const [matchingStudents, setMatchingStudents] = useState<string[]>([]); // Array of strings (usernames)
    const [usernameToSearch, setUserToSearch] = useState(''); // Text in the "Find a student" input
    const [activeDropdown, setActiveDropdown] = useState(false); // Controls dropdown visibility
    const [dropdownLoading, setDropdownLoading] = useState(false); // Loading state for dropdown search

    // State to store any validation errors for the form fields.
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        retypePassword: '',
        general: '', // Added for general signup errors
    });

    // State to manage the parent account specific UI and data.
    const [parentAccountFlag, setParentAccountFlag] = useState(false); // Flag to indicate if the selected account type is 'parent'.
    const [showStudentForm, setShowStudentForm] = useState(false); // Flag to control the visibility of the student creation form.
    const [students, setStudents] = useState<any>([]); // State to store data for student accounts under a parent.
    const [assignedMenteeUsername, setAssignedMenteeUsername] = useState<string | null>(null); // To store the selected mentee's username

    // Handles changes to input fields in the main form.
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Updates the formData state with the new value for the changed field.
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Performs specific validation based on the input field that changed.
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

    // Verifies the format of the first name.
    const firstNameVerification = (firstName: string) => {
        const isValid = /^[A-Za-z ]{2,15}$/.test(firstName);
        setFirstNameFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            firstName: isValid ? '' : 'Invalid First Name',
        }));
        return isValid;
    };

    // Verifies the format of the last name.
    const lastNameVerification = (lastName: string) => {
        const isValid = /^[A-Za-z]{2,15}$/.test(lastName);
        setLastNameFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            lastName: isValid ? '' : 'Invalid Last Name',
        }));
        return isValid;
    };

    // Verifies the format of the email address.
    const emailVerification = (email: string) => {
        const isValid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/.test(email);
        setEmailFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            email: isValid ? '' : 'Invalid Email',
        }));
        return isValid;
    };

    // Verifies the format of the username.
    const usernameVerification = (username: string) => {
        const isValid = /^[a-zA-Z](\S){1,14}$/.test(username);
        setUserNameFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            username: isValid ? '' : 'Invalid Username',
        }));
        return isValid;
    };

    // Verifies the length of the password.
    const passwordVerification = (password: string) => {
        const isValid = password.length >= 8;
        setPasswordFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            password: isValid ? '' : 'Password must be at least 8 characters',
        }));
        return isValid;
    };

    // Verifies if the retyped password matches the original password.
    const retypePasswordVerification = (retypedPassword: string, password: string) => {
        const isValid = retypedPassword === password;
        setRetypeFlag(isValid);
        setErrors((prev) => ({
            ...prev,
            retypePassword: isValid ? '' : 'Passwords do not match',
        }));
        return isValid;
    };

    // Handles changes to the account type dropdown.
    const handleAccountTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const isParent = e.target.value === 'parent';
        setParentAccountFlag(isParent);
        // Updates the accountType in the form data.
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


    // Adds a new student form to the UI for parent accounts.
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
        setShowStudentForm(true); // Makes the student form visible.
    };

    // Handles changes to input fields within a student's form.
    const handleStudentInputChange = (studentId: any, field: string, value: string) => {
        // Updates the specific student's data in the students array.
        setStudents((prev: any) =>
            prev.map((student: any) =>
                student.id === studentId ? { ...student, [field]: value } : student
            )
        );
    };

    // Removes a student form from the UI.
    const handleRemoveStudent = (studentId: any) => {
        // Filters out the student with the given ID.
        setStudents((prev: any) => prev.filter((student: any) => student.id !== studentId));
        // Hides the student form if no students are present.
        if (students.length === 1) { // If only one student left, and it's removed, hide the form
            setShowStudentForm(false);
        }
    };

    // Handles changes in the "Find a student" input and triggers API call
    const handleMenteeSearchChange = async (searchText: string) => {
        setUserToSearch(searchText); // Update the controlled input's value
        setAssignedMenteeUsername(null); // Clear any previously assigned mentee

        if (searchText.trim() === "") {
            setActiveDropdown(false);
            setMatchingStudents([]);
            setDropdownLoading(false);
            return;
        }

        setActiveDropdown(true);
        setDropdownLoading(true);
        try {
            // Using query parameter for keyword
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

            // Slice the array to limit results to top 10
            const top10Usernames = usernames.slice(0, 10);
            setMatchingStudents(top10Usernames);

            setDropdownLoading(false);
        } catch (error) {
            console.error('Error fetching mentorless students:', error);
            setDropdownLoading(false);
            setMatchingStudents([]); // Clear matches on error
            setErrors((prev) => ({
                ...prev,
                general: 'Failed to fetch student list.',
            }));
        }
    };

    // Handles selecting a mentee from the dropdown
    const handleSelectMentee = (selectedUsername: string) => {
        setAssignedMenteeUsername(selectedUsername);
        setUserToSearch(selectedUsername); // Set the input field to the selected username
        setActiveDropdown(false); // Hide the dropdown
        setMatchingStudents([]); // Clear the matching students
    };


    // Handles the submission of the signup form.
    const handleSubmit = async () => {
        console.log('Submit clicked', formData);

        // Checks if all main form fields are valid based on their flags.
        const isValid =
            firstNameFlag &&
            lastNameFlag &&
            emailFlag &&
            userNameFlag &&
            passwordFlag &&
            retypeFlag;

        console.log('Validation status:', {
            firstNameFlag,
            lastNameFlag,
            emailFlag,
            userNameFlag,
            passwordFlag,
            retypeFlag,
        });

        // If the main form is not valid, prevents submission.
        if (!isValid) {
            console.log('Form validation failed');
            // Clear any general error message if it's no longer relevant
            setErrors((prev) => ({ ...prev, general: 'Please correct the form errors.' }));
            return;
        }

        let signupUrl = `${environment.urls.middlewareURL}/user/`;
        let signupRequestBody: any = {};

        if (parentAccountFlag) {
            // Maps student data into the required format for the API.
            const studentsData = students.map((student: any) => ({
                first: student.firstName,
                last: student.lastName,
                email: student.email,
                username: student.username,
                password: student.password,
            }));

            signupRequestBody = {
                first: formData.firstName,
                last: formData.lastName,
                email: formData.email,
                password: formData.password,
                username: formData.username,
                role: formData.accountType,
                students: studentsData, // Send as JSON array in body
            };
        } else {
            // Constructs the URL for non-parent accounts.
            signupRequestBody = {
                first: formData.firstName,
                last: formData.lastName,
                email: formData.email,
                password: formData.password,
                username: formData.username,
                role: formData.accountType,
            };
        }

        console.log('Signup Request URL:', signupUrl);
        console.log('Signup Request Body:', signupRequestBody);

        try {
            // --- STEP 1: Perform User Signup (POST request) ---
            const signupResponse = await fetch(signupUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(signupRequestBody),
          });

          console.log('Signup Response status:', signupResponse.status);

          if (!signupResponse.ok) {
              // Try parsing as JSON first, fallback to text if not valid JSON
              let errorContent: any;
              try {
                  errorContent = await signupResponse.json();
              } catch (jsonError) {
                  errorContent = await signupResponse.text();
              }
              
              // Handle specific username taken error
              // Ensure errorContent is not null/undefined and then check its value/properties
              if (typeof errorContent === 'string' && errorContent === 'This username has been taken. Please choose another.') {
                  setErrors((prev) => ({
                      ...prev,
                      username: 'Username already taken',
                      general: '',
                  }));
              } else {
                  // General signup error
                  // Safely extract message or use the raw content
                  const errorMessage = (typeof errorContent === 'object' && errorContent !== null && 'message' in errorContent && typeof errorContent.message === 'string')
                      ? errorContent.message
                      : (typeof errorContent === 'string' && errorContent.length > 0)
                          ? errorContent
                          : 'Unknown error during signup';
                  throw new Error(`HTTP error! status: ${signupResponse.status}, message: ${errorMessage}`);
              }
              return; // Stop execution if signup failed
          }

            // No need to parse signupData if we just need to proceed to login
            console.log('Signup successful, proceeding to login to get token...');

            let jwtToken: string | null = null;

            // --- STEP 2: Perform Login to get JWT Token (POST request) ---
            try {
                // FIX: Corrected login URL to match the actual backend login endpoint
                const loginUrl = `${environment.urls.middlewareURL}/auth/login?username=${encodeURIComponent(formData.username)}&password=${encodeURIComponent(formData.password)}`;
                console.log('Login URL for token acquisition (corrected):', loginUrl); // Log the full URL for debugging

                const loginResponse = await fetch(loginUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Keep Content-Type for consistency
                    },
                    // No body needed when sending credentials in query parameters
                });

                console.log('Login Response status:', loginResponse.status);

                if (!loginResponse.ok) {
                    const loginErrorData = await loginResponse.json(); // Assuming JSON error response for non-2xx codes
                    throw new Error(`Login failed after signup: ${loginErrorData.message || 'Unknown login error'}`);
                }

                const loginData = await loginResponse.json();
                jwtToken = loginData.token; // Assuming the token is in loginData.token
                console.log('Login successful, JWT token obtained.');

            } catch (loginError: any) {
                console.error('Error during login after signup:', loginError);
                setErrors((prev) => ({
                    ...prev,
                    general: `Signup successful, but failed to log in to assign mentee: ${loginError.message || 'Login network error'}`,
                }));
                // Even if login fails, the user is created. We might still redirect or show a specific message.
                window.location.href = '/'; // Redirect even if token acquisition fails
                return; // Stop execution here
            }


            // --- STEP 3: Conditionally Perform Mentee Assignment (PUT request for mentors) ---
            if (formData.accountType === 'mentor' && assignedMenteeUsername && jwtToken) {
                // FIX: Corrected URL to use query parameter 'mentorship' and removed double slash
                const updateMentorshipUrl = `${environment.urls.middlewareURL}/user/updateMentorship?mentorship=${encodeURIComponent(assignedMenteeUsername)}`;
                console.log('Update Mentorship URL:', updateMentorshipUrl);

                try {
                    const updateMentorshipResponse = await fetch(updateMentorshipUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json', // Keep Content-Type for consistency
                            'Authorization': `Bearer ${jwtToken}`, // AUTHENTICATE with the token
                        },
                        // No body needed as per your backend's current PUT route definition
                    });

                    console.log('Update Mentorship Response status:', updateMentorshipResponse.status);

                    if (!updateMentorshipResponse.ok) {
                        const updateErrorData = await updateMentorshipResponse.json();
                        console.error('Mentorship update failed:', updateErrorData);
                        // Decide how to handle this error. User is signed up, but assignment failed.
                        setErrors((prev) => ({
                            ...prev,
                            general: `Signup successful, but mentee assignment failed: ${updateErrorData.message || 'Unknown error'}`,
                        }));
                        // You might still proceed to redirect even if this fails,
                        // as the main user account was created.
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

            // --- Final Step: Redirect to homepage after all operations ---
            window.location.href = '/';

        } catch (error: any) {
            console.error('Signup error:', error);
            // Catch errors from the initial POST request or unexpected issues
            setErrors((prev) => ({
                ...prev,
                general: error.message || 'Signup failed. Please try again.',
            }));
        }
    };

    return (
        <form className='signupForm' onSubmit={(e) => e.preventDefault()}>
            <h2 className="sign-up-title">Sign up</h2>

            <div className={`errorMessages ${Object.values(errors).some(Boolean) ? 'visible' : ''}`}>
                {/* Maps through the errors object and displays any error messages. */}
                {Object.values(errors).map((error, index) =>
                    error ? <h3 key={index}>{error}</h3> : null
                )}
            </div>

            <div className='form-fields'>
                <input
                    type='text'
                    name='firstName'
                    placeholder='First name'
                    value={formData.firstName}
                    onChange={handleInputChange}
                />
                <input
                    type='text'
                    name='lastName'
                    placeholder='Last name'
                    value={formData.lastName}
                    onChange={handleInputChange}
                />
                <input
                    type='text'
                    name='email'
                    placeholder='Email'
                    value={formData.email}
                    onChange={handleInputChange}
                />
                <input
                    type='text'
                    name='username'
                    placeholder='Username'
                    value={formData.username}
                    onChange={handleInputChange}
                />
                <input
                    type='password'
                    name='password'
                    placeholder='Password'
                    value={formData.password}
                    onChange={handleInputChange}
                />
                <input
                    type='password'
                    name='retypedPassword'
                    placeholder='Re-type password'
                    value={formData.retypedPassword}
                    onChange={handleInputChange}
                />
            </div>

            <div className='account-type'>
                <p>Select Account Type</p>
                <select value={formData.accountType} onChange={handleAccountTypeChange}> {/* Corrected to handleAccountTypeChange */}
                    <option value='mentor'>Mentor</option>
                    <option value='parent'>Parent</option>
                </select>
            </div>

            {!parentAccountFlag && (
                <div className="mentee-search-container">
                    <input
                        type="text"
                        name="setMentee"
                        placeholder="Find a student"
                        value={usernameToSearch} // Controlled component
                        onChange={(e) => handleMenteeSearchChange(e.target.value)}
                    />
                    {activeDropdown && (
                        <div className="dropdown-users">
                            {dropdownLoading ? (
                                <div className="item-template">Loading...</div>
                            ) : (
                                matchingStudents.length > 0 ? (
                                    matchingStudents.map((username) => (
                                        <StudentTemplate
                                            key={username} // Username is unique, use as key
                                            studentUsername={username} // Corrected prop name
                                            onClick={handleSelectMentee} // Pass the handler
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

            {/* Conditional rendering of the student section for parent accounts. */}
            {parentAccountFlag && (
                <div className='student-section'>
                    {/* Button to add a new student form if the student form is not currently shown. */}
                    {!showStudentForm && (
                        <button
                            type='button'
                            className='add-student-btn'
                            onClick={handleAddStudent}
                        >
                            Create Student
                        </button>
                    )}

                    {/* Maps through the students array and renders a form for each student. */}
                    {students.map((student: any) => (
                        <div key={student.id} className='student-form'>
                            {/* Button to remove a student form. */}
                            <button
                                type='button'
                                className='remove-student'
                                onClick={() => handleRemoveStudent(student.id)}
                            >
                                Delete student
                            </button>

                            <input
                                type='text'
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
                                type='text'
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
                                type='text'
                                placeholder='Student username'
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
                                type='text'
                                placeholder="Student's email"
                                value={student.email}
                                onChange={(e) =>
                                    handleStudentInputChange(student.id, 'email', e.target.value)
                                }
                            />
                            <input
                                type='password'
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
                                type='password'
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

            <div className='terms'>
                <input type='checkbox' id='termsCheckbox' required />
                <label htmlFor='termsCheckbox'>I accept the terms and conditions</label>
            </div>

            {/* Submit button for the signup form. */}
            <button type='submit' className='submit-btn' onClick={handleSubmit}>
                Sign up
            </button>
        </form>
    );
};

export default Signup;
