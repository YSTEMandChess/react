<?php 
/**
 * Main User Authentication and Management Endpoint
 * 
 * This PHP script handles user creation, verification, and authentication
 * for the YStem and Chess platform. It interfaces with MongoDB for user
 * storage and uses JWT tokens for authentication.
 * 
 * Supported Operations:
 * - create: Register new users (students, mentors, parents)
 * - verify: Validate existing user credentials and issue JWT
 * - authenticate: Verify JWT tokens for protected routes
 * 
 * @deprecated This is the old PHP middleware. The project is migrating
 * to Node.js middleware (see middlewareNode directory).
 */

// Allow Cross Origin Requests (other ips can request data)
header("Access-Control-Allow-Origin: *");

// Load the JWT library for token generation and validation
require_once __DIR__ . '/vendor/autoload.php';
use \Firebase\JWT\JWT;
require_once 'environment.php';

// JWT signing key loaded from environment variables
$key = $_ENV["indexKey"];

// Extract and sanitize all request parameters
$username = htmlspecialchars_decode($_GET["username"]);
$password = htmlspecialchars_decode($_GET["password"]);
$firstName = htmlspecialchars_decode($_GET["first"]);
$lastName = htmlspecialchars_decode($_GET["last"]);
$reason = htmlspecialchars_decode($_GET["reason"]);        // Operation type: create/verify/authenticate
$email = htmlspecialchars_decode($_GET["email"]);
$students = htmlspecialchars_decode($_GET["students"]);    // JSON string for parent's students
$parentUsername = htmlspecialchars_decode($_GET["parentUsername"]);
$role = htmlspecialchars_decode($_GET["role"]);           // User role: student, mentor, parent

// Route to appropriate operation handler based on reason parameter

// Create - Register a new user account
if ($reason == "create") {
    if (!$username || !$password || !$firstName || !$lastName || !$role) {
        echo "Not all of the parameters were found. Please ensure that you pass: username, password, first, last, and role as well.";
        return;
    }
    createUser($username, $password, $firstName, $lastName, $email, $role, $students, $parentUsername);
// Verify. The user claims to be already in the system. Making sure that they are who they claim to be. Checking their username and password
} else if ($reason == "verify") {
    // Validate required parameters
    if (!$username || !$password) {
        echo "Not all of the parameters were found. Please ensure that you pass: username and password as well.";
        return;
    }
    verifyUser($username, $password);

// Authenticate - Verify JWT token validity (currently not fully implemented)
} else if ($reason == "authenticate") {
    if (!$jwt) {
        echo "Not all of the parameters were found. Please ensure that you pass: jwt as well.";
        return;
    }
    // JWT verification logic would go here
    
// Invalid operation requested
} else {
    echo "Invalid reason. Must be create, verify, authenticate.";
    return;
}


/**
 * Creates a new user account in MongoDB
 * 
 * Handles different user types (student, mentor, parent) and creates
 * appropriate database entries. For parents, also creates linked student accounts.
 * Returns a JWT token upon successful creation.
 * 
 * @param string $username Unique username for the account
 * @param string $password Plain text password (will be hashed)
 * @param string $firstName User's first name
 * @param string $lastName User's last name
 * @param string $email User's email address
 * @param string $role User type: student, mentor, or parent
 * @param string $students JSON string of student data (for parent accounts)
 * @param string $parentUsername Parent's username (for student accounts)
 */
function createUser($username, $password, $firstName, $lastName, $email, $role, $students, $parentUsername) {
    // Connect to MongoDB and select users collection
    $client = new MongoDB\Client($_ENV["mongoCredentials"]);
    $collection = $client->ystem->users;

    // Check if username is already taken
    if(isTakenUsername($username, $collection)) {
        echo "This username has been taken. Please choose another.";
        return;
    };

    // Hash password using SHA-384 for secure storage
    $hashPass = hash("sha384",$password);

    // Handle parent account creation (includes creating linked student accounts)
    if($role == 'parent') {
        // They are a parent, will need to create a different document
        try {
            $studentInfo = json_decode($students);
        } catch(Exception $e) {
            echo "Error decoding json.\n";
            return;
        }
        
        for($i=0; $i<count($studentInfo); $i++) {
            if(isTakenUsername($studentInfo[$i]->username, $collection)) {
                echo "Student ";
                echo $i;
                echo "username has been taken. Please choose another.";
                return;
            };
        }

        $sUsernames = [];
        for($i=0; $i<count($studentInfo); $i++) {
            $studentUsername = $studentInfo[$i]->username;
            $studentFirst = $studentInfo[$i]->first;
            $studentLast = $studentInfo[$i]->last;
            $studentPassword = hash("sha384",$studentInfo[$i]->password);
            $lessonsCompleted = createLessonObject();
            // insert all students into the collection
            $collection->insertOne([
                'username' => $studentUsername,
                'password' => $studentPassword,
                'firstName' => $studentFirst,
                'lastName' => $studentLast,
                'parentUsername' => $username,
                'role' => 'student',
                'timePlayed' => '0 hr: 0 min',
                'lessonsCompleted' => $lessonsCompleted,
                'accountCreatedAt' => time()
            ]);
        }
        // Create the parent account
        $collection->insertOne([
            'username' => $username,
            'password' => $hashPass,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'email' => $email,
            'role' => $role,
            'children' => $sUsernames,
            'accountCreatedAt' => time()
        ]);
        
    } else if($role == 'student') {
        // If they are a student, then we will need to add a link to the parent.
        $lessonsCompleted = createLessonObject();
        $collection->insertOne([
            'username' => $username,
            'password' => $hashPass,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'email' => $email,
            'role' => $role,
            'lessonsCompleted' => $lessonsCompleted,
            'timePlayed' => '0 hr: 0 min',
            'accountCreatedAt' => time()
        ]);
        // Now find the parent and update their children.
        $collection->updateOne(['username' => $parentUsername],[
            '$push' =>
                [
                    'children' => $username
                ]
            ]
        );
        
    } else {
        $collection->insertOne([
            'username' => $username,
            'password' => $hashPass,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'email' => $email,
            'role' => $role,
            'accountCreatedAt' => time()
        ]);
    }

    $payload = array(
        'username' => $username,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => $email,
        'role' => $role,
        'iat' => time(),
        'eat' => strtotime("+30 days")
    );

    $jwt = JWT::encode($payload, $_ENV["indexKey"], 'HS512');
    echo $jwt;
}

/**
 * Creates the initial lessons completed object for new student accounts
 * 
 * Initializes lesson progress tracking for all chess pieces.
 * Each piece starts at lesson number 0 (not started).
 * 
 * @return array Array of lesson objects for each chess piece
 */
function createLessonObject() {
    $lessons = [];
    $pawnLessonObject = (object)array('piece' => 'pawn', 'lessonNumber' => 0);
    $rookLessonObject = (object)array('piece' => 'rook', 'lessonNumber' => 0);
    $bishopLessonObject = (object)array('piece' => 'bishop', 'lessonNumber' => 0);
    $kingLessonObject = (object)array('piece' => 'king', 'lessonNumber' => 0);
    $queenLessonObject = (object)array('piece' => 'queen', 'lessonNumber' => 0);
    $horseLessonObject = (object)array('piece' => 'horse', 'lessonNumber' => 0);
    array_push($lessons, $horseLessonObject);
    array_push($lessons, $queenLessonObject);
    array_push($lessons, $kingLessonObject);
    array_push($lessons, $bishopLessonObject);
    array_push($lessons, $pawnLessonObject);
    array_push($lessons, $rookLessonObject);
    return $lessons;
}

/**
 * Verifies user credentials and issues JWT token
 * 
 * Checks username and password against MongoDB records.
 * If valid, generates and returns a JWT token for authentication.
 * 
 * @param string $username Username to verify
 * @param string $password Plain text password to verify
 */
function verifyUser($username, $password) {
    // Connect to MongoDB
    $client = new MongoDB\Client($_ENV["mongoCredentials"]);
    $collection = $client->ystem->users;

    // Hash the provided password for comparison
    $hashPass = hash("sha384",$password);

    // Find user document by username
    $document = $collection->findOne(['username' => $username]);
    
    // Verify password hash matches
    if($document['password'] == $hashPass) {
        if($document['role'] == 'student') {
            $payload = array(
                'username' => $username,
                'firstName' => $document['firstName'],
                'lastName' => $document['lastName'],
                'role' => $document['role'],
                'email' => $document['email'],
                'parentUsername' => $document['parentUsername'],
                'iat' => time(),
                'eat' => strtotime("+30 days")
            );
        } else {
            $payload = array(
                'username' => $username,
                'firstName' => $document['firstName'],
                'lastName' => $document['lastName'],
                'role' => $document['role'],
                'email' => $document['email'],
                'iat' => time(),
                'eat' => strtotime("+30 days")
            );
        }
        // Generate JWT token with user information
        $jwt = JWT::encode($payload, $_ENV["indexKey"], 'HS512');
        echo $jwt;
    } else {
        // Authentication failed
        echo "The username or password is incorrect.";
    }
}

/**
 * Checks if a username already exists in the database
 * 
 * @param string $username Username to check
 * @param MongoDB\Collection $collection MongoDB users collection
 * @return bool True if username is taken, false if available
 */
function isTakenUsername($username, $collection) {
    $document = $collection->findOne(['username' => $username]);
    if(is_null($document)) {
        return false;
    } else {
        return true;
    }
}

?>
