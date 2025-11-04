<?php
/**
 * Get Lesson Endpoint
 * 
 * Retrieves a specific lesson for a chess piece based on lesson number.
 * Used by the frontend to load lesson content for students.
 * 
 * @deprecated This is the old PHP middleware. The project is migrating
 * to Node.js middleware (see middlewareNode directory).
 * 
 * Query Parameters:
 * - jwt: JSON Web Token for authentication
 * - piece: Chess piece name (e.g., 'pawn', 'rook')
 * - lessonNumber: Lesson index to retrieve
 * 
 * @returns JSON encoded lesson data
 */

    // Allow Cross Origin Requests (other ips can request data)
    header("Access-Control-Allow-Origin: *");
    // Load the JWT library
    require_once __DIR__ . '/vendor/autoload.php';
    use \Firebase\JWT\JWT;
    require_once 'environment.php';

    // Extract and sanitize query parameters
    $jwt = htmlspecialchars_decode($_GET["jwt"]);
    $piece = htmlspecialchars_decode($_GET["piece"]);
    $lessonNum = htmlspecialchars_decode($_GET["lessonNumber"]);
    
    // Verify user authentication
    $credentials = json_decode(include "verifyNoEcho.php");

    if($credentials == "Error: 405. This key has been tampered with or is out of date." || $credentials == "Error: 406. Please Provide a JSON Web Token.") {
        echo $credentials;
        return $credentials;
    }

    // Connect to MongoDB and access lessons collection
    $client = new MongoDB\Client($_ENV["mongoCredentials"]);
    $collection = $client->ystem->lessons;

    // Find the lesson document for the specified piece
    $userDoc = $collection->findOne(["piece" => $piece]);

    // Search for the specific lesson by number
    $currentLesson = [];
    foreach($userDoc["lessons"] as $lesson) {
        // Lesson numbering: completed lessons are 0-indexed,
        // so add 1 to get the current lesson
        if($lesson['lessonNumber'] == 1+$lessonNum) {
            $currentLesson = $lesson;
            break;
        }
    }

    // Return lesson data as JSON
    echo json_encode($currentLesson);
?>