<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "POST request required"], 405);
}

$body = json_decode(file_get_contents("php://input"), true);

if (!is_array($body)) {
    json_out(["success" => false, "message" => "Invalid JSON body"], 400);
}

$username = trim($body["username"] ?? "");
$email    = trim($body["email"]    ?? "");
$password = $body["password"]      ?? "";

/* --- Validation --- */
if ($username === "" || $email === "" || $password === "") {
    json_out(["success" => false, "message" => "All fields are required"], 400);
}
if (strlen($username) < 2 || strlen($username) > 50) {
    json_out(["success" => false, "message" => "Username must be 2–50 characters"], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(["success" => false, "message" => "Invalid email address"], 400);
}
if (strlen($password) < 6) {
    json_out(["success" => false, "message" => "Password must be at least 6 characters"], 400);
}

/* --- Check for duplicates --- */
$stmt = $pdo->prepare(
    "SELECT id FROM users
      WHERE username = ? OR email = ?
      LIMIT 1"
);
$stmt->execute([$username, $email]);

if ($stmt->fetch()) {
    json_out(["success" => false, "message" => "Username or email already taken"], 409);
}

/* --- Insert user --- */
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$insert = $pdo->prepare(
    "INSERT INTO users (username, email, password_hash, avatar)
     VALUES (?, ?, ?, '')"
);
$insert->execute([$username, $email, $passwordHash]);

$userId = (int) $pdo->lastInsertId();

json_out([
    "success" => true,
    "message" => "Account created successfully",
    "user_id" => $userId
]);