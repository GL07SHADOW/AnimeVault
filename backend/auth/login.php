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

$email    = trim($body["email"] ?? "");
$password = $body["password"]   ?? "";

if ($email === "" || $password === "") {
    json_out(["success" => false, "message" => "Email and password are required"], 400);
}

/* --- Find user --- */
$stmt = $pdo->prepare(
    "SELECT id, username, email, password_hash, avatar
       FROM users
      WHERE email = ?
      LIMIT 1"
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user["password_hash"])) {
    json_out(["success" => false, "message" => "Invalid email or password"], 401);
}

/* --- Create session token --- */
$token = bin2hex(random_bytes(32));
$expiresAt = date("Y-m-d H:i:s", time() + 60 * 60 * 24 * 30); // 30 days

$insert = $pdo->prepare(
    "INSERT INTO sessions (user_id, token, expires_at)
     VALUES (?, ?, ?)"
);
$insert->execute([$user["id"], $token, $expiresAt]);

/* --- Cleanup: remove old expired tokens for this user --- */
$cleanup = $pdo->prepare(
    "DELETE FROM sessions
      WHERE user_id = ?
        AND expires_at < NOW()"
);
$cleanup->execute([$user["id"]]);

json_out([
    "success" => true,
    "message" => "Login successful",
    "token"   => $token,
    "user"    => [
        "id"       => (int) $user["id"],
        "username" => $user["username"],
        "email"    => $user["email"],
        "avatar"   => $user["avatar"] ?? ""
    ]
]);