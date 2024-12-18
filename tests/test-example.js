const http = require("http");
const https = require("https");

// Helper function to make HTTP POST requests
async function testPost(host, port, endpoint, data, expected, description) {
    try {
        const postData = JSON.stringify(data);

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
    );
}

// Run the tests
runTests();
