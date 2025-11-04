<?php 
/**
 * New Game Endpoint
 * 
 * Adds authenticated users to the waiting queue for mentor-student pairing.
 * Students and mentors are placed in separate queues and later matched
 * by the pairUp.php script.
 * 
 * @deprecated This is the old PHP middleware. The project is migrating
 * to Node.js middleware (see middlewareNode directory).
 * 
 * Query Parameters:
 * - jwt: JSON Web Token for authentication
 * 
 * @returns Success message or error
 */

// Allow Cross Origin Requests (other ips can request data)
header("Access-Control-Allow-Origin: *");

// Load the JWT library
require_once __DIR__ . '/vendor/autoload.php';
use \Firebase\JWT\JWT;
require_once 'environment.php';

// Verify user authentication via JWT token
$jwt = htmlspecialchars_decode($_GET["jwt"]);
$credentials = json_decode(include "verifyNoEcho.php");
if($credentials == "Error: 405. This key has been tampered with or is out of date." || $credentials == "Error: 406. Please Provide a JSON Web Token.") {
    echo $credentials;
    return $credentials;
}

// Connect to MongoDB
$client = new MongoDB\Client($_ENV["mongoCredentials"]);

// Add user to appropriate waiting queue based on role
if($credentials->role == "mentor") {
    $collection = $client->ystem->waitingMentors;
} else if($credentials->role == "student") {
    $collection = $client->ystem->waitingStudents;
} else {
    echo "Please be either a student or a mentor.";
    return;
}

// Check if user is already in the waiting queue
if(!is_null($collection->findOne(['username'=>$credentials->username]))) {
    echo "Person already waiting for game.";
    return;
}

// Add user to waiting queue with timestamp
$collection->insertOne([
    'username' => $credentials->username,
    'firstName' => $credentials->firstName,
    'lastName' => $credentials->lastName,
    'requestedGameAt' => time()
]);

echo "Person Added Sucessfully.";
return "Person Added Sucessfully";

// Start the recording
?>