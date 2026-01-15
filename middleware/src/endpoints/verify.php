<?php 
/**
 * JWT Token Verification Endpoint
 * 
 * This script validates JWT tokens for authenticated requests.
 * It extracts the token from the request and verifies its validity.
 * 
 * @deprecated Part of the old PHP middleware being replaced by Node.js.
 */

// Allow Cross Origin Requests
header("Access-Control-Allow-Origin: *");

// Extract JWT token from request parameter
$jwt = htmlspecialchars_decode($_GET["jwt"]);

// Verify token and return credentials
$credentials = include "verifyNoEcho.php";
echo $credentials;
?>

