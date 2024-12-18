const http = require("http");
const https = require("https");

// Helper function to make HTTP POST requests
async function testPost(host, port, endpoint, data, expected, description) {
    try {
        const postData = JSON.stringify(data);
        console.log(postData);
        const options = {
            hostname: host,
            port: port,
            path: endpoint,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData),
            },
        };

        const req = http.request(options, (res) => {
            let responseData = "";
            console.log(responseData);
            res.on("data", (chunk) => {
                responseData += chunk;
            });

            res.on("end", () => {
      
                const result = JSON.parse(responseData);

                const passed = JSON.stringify(result) === JSON.stringify(expected);
                console.log(`${description}: ${passed ? "PASSED" : "FAILED"}`);

                if (!passed) {
                    console.log("Expected:", expected);
                    console.log("Received:", result);
                }
            });
        });

        req.on("error", (err) => {
            console.error(`${description}: ERROR`, err.message);
        });

        req.write(postData);
        req.end();
    } catch (error) {
        console.error(`${description}: ERROR`, error.message);
    }
}

// Examples of tests
async function runTests() {
    const host = "localhost"; // Change as needed
    /*
    // Test /login endpoint with invalid data
    await testPost(
        host,
        3000,
        "/login",
        { email: "", pass: "" },
        { error: "Name and email are required" },
        "Test /login with missing data"
    );

    // Test /login with valid data (update with correct expected values)
    await testPost(
        host,
        3000,
        "/login",
        { email: "student@example.com", pass: "password123" },
        { passed: true, token: "some-generated-token" }, // Adjust as needed
        "Test /login with valid data"
    );

    // Test /get-user-info with valid token
    await testPost(
        host,
        3000,
        "/get-user-info",
        { token: "some-valid-token" },
        { passed: true, user: { email: "student@example.com", id: 123, name: "Student Name" } },
        "Test /get-user-info with valid token"
    );

    // Test /get-user-info with invalid token
    await testPost(
        host,
        3000,
        "/get-user-info",
        { token: "invalid-token" },
        { passed: false },
        "Test /get-user-info with invalid token"
    );*/

    /*ADD STUDENT TESTS*/
    //Test /add-student with valid data
    await testPost(
      host,
      3000,
      "/add-student",
      {name: "StudentName", email: "student@example.com", pass: "password123"},
      {passed: true},
      "Test /add-student with valid data"
    );

    //Test /add-student with invalid data (currently unsure on how to make data invalid)
    await testPost(
      host,
      3000,
      "/add-student",
      {name: "StudentName", email: "student@example.com", pass: "stupassword123"},
      {passed: false},
      "Test /add-student with invalid data"
    );

    //Test /add-student with missing data
    await testPost(
      host,
      3000,
      "/add-student",
      {name: "StudentName"},
      {error: "Name, pass, and email are required"},
      "Test /add-student with missing data"
    );
  

    /*TEST USER PASS TESTS*/
    //Test /test-user-pass with valid data (user unknown, currently unsure how to get)
    await testPost(
      host,
      3000,
      "/test-user-pass",
      {email: "student@example.com", pass: "password123"},
      {passed: true},
      "Test /test-user-pass with valid data"
    );

    //Test if /test-user-pass with invalid data
    await testPost(
      host,
      3000,
      "/test-user-pass",
      {email: "student@example.com", pass: "stupassword123"},
      {passed: false, user: null},
      "Test if /test-user-pass with invalid data"
    );

    //Test /test-user-pass with missing data
    await testPost(
      host,
      3000,
      "/test-user-pass",
      {error: 'Name and email are required'},
      {passed: false, user: null},
      "Test /test-user-pass with missing data"
    );


    /*ADD MENTOR TESTS*/
    //Test /add-mentor with valid data
    await testPost(
      host,
      3000,
      "/add-mentor",
      {name: "MentorName", email: "mentor@example.com", pass: "password123"},
      {passed: true},
      "Test /add-mentor with valid data"
    );

    //Test /add-mentor with invalid data (currently unsure on how to make data invalid)
    await testPost(
      host,
      3000,
      "/add-mentor",
      {name: "MentorName", email: "mentor@example.com", pass: "menpassword123"},
      {passed: false},
      "Test /add-mentor with invalid data"
    );

    //Test /add-mentor with missing data
    await testPost(
      host,
      3000,
      "/add-mentor",
      {name: "MentorName"},
      {error: "Name, pass, and email are required"},
      "Test /add-mentor with missing data"
    );


    /*ADD MEETING TESTS*/
    //Test /add-meeting with valid data
    await testPost(
      host,
      3000,
      "/add-meeting",
      {hour: 9, minute: 30, day: "Monday", student_email: "student@example.com", mentor_email: "mentor@example.com"},
      {passed: true},
      "Test /add-meeting with valid data"
    );

    //Test /add-meeting with invalid data (currently unsure on how to make data invalid)
    await testPost(
      host,
      3000,
      "/add-meeting",
      {hour: 9, minute: 30, day: "Monday", student_email: "astudent@example.com", mentor_email: "bmentor@example.com"},
      {passed: false},
      "Test /add-meeting with invalid data"
    );

    //Test /add-meeting with missing data
    await testPost(
      host,
      3000,
      "/add-meeting",
      {hour: 9},
      {error: "Name, pass, and email are required"},
      "Test /add-meeting with missing data"
    );


    /*ADD TEACHES TESTS*/
    //Test /add-teaches with valid data
    await testPost(
      host,
      3000,
      "/add-teaches",
      {student_email: "student@example.com", mentor_email: "mentor@example.com"},
      {passed: true},
      "Test /add-teaches with valid data"
    );

    //Test /add-teaches with invalid data (currently unsure on how to make data invalid)
    await testPost(
      host,
      3000,
      "/add-teaches",
      {student_email: "astudent@example.com", mentor_email: "bmentor@example.com"},
      {passed: false},
      "Test /add-teaches with invalid data"
    );

    //Test /add-teaches with missing data
    await testPost(
      host,
      3000,
      "/add-teaches",
      {student_email: "student@example.com"},
      {error: "Name, pass, and email are required"},
      "Test /add-teaches with missing data"
    );

    
    /*ADD TEACHER TESTS*/
    //Test /add-teacher with valid data
    await testPost(
      host,
      3000,
      "/add-teacher",
      {name: "TeacherName", email: "teacher@example.com", pass: "password123"},
      {passed: true},
      "Test /add-teacher with valid data"
    );

    //Test /add-teacher with invalid data (currently unsure on how to make data invalid)
    await testPost(
      host,
      3000,
      "/add-teacher",
      {name: "TeacherName", email: "teacher@example.com", pass: "password123"},
      {passed: false},
      "Test /add-teacher with invalid data"
    );

    //Test /add-teacher with missing data
    await testPost(
      host,
      3000,
      "/add-teacher",
      {name: "TeacherName"},
      {error: "Name, pass, and email are required"},
      "Test /add-teacher with missing data"
    );


    /*MODIFY USER TESTS*/
    //Test /modify-user with valid data
    await testPost(
      host,
      3000,
      "/modify-user",
      {newName: "TeacherName", email: "teacher@example.com", newPass: "password123"},
      {passed: true},
      "Test /modify-user with valid data"
    );

    //Test /modify-user with invalid data (currently unsure on how to make data invalid)
    await testPost(
      host,
      3000,
      "/modify-user",
      {newName: "TeacherName", email: "teacher@example.com", newPass: "password123"},
      {passed: false},
      "Test /modify-user with invalid data"
    );

    //Test /modify-user with missing data
    await testPost(
      host,
      3000,
      "/modify-user",
      {newName: "TeacherName"},
      {error: "Name, pass, and email are required"},
      "Test /modify-user with missing data"
    );

}

// Run the tests
runTests();