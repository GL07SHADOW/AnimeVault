<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

$userId = get_session_user_id($pdo);

if (!$userId) {
    json_out(["success" => false, "message" => "Not authenticated"], 401);
}

$stmt = $pdo->prepare(
    "SELECT id, username, email, avatar
       FROM users
      WHERE id = ?
      LIMIT 1"
);
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    json_out(["success" => false, "message" => "User not found"], 401);
}

json_out([
    "success" => true,
    "user" => [
        "id"       => (int) $user["id"],
        "username" => $user["username"],
        "email"    => $user["email"],
        "avatar"   => $user["avatar"] ?? ""
    ]
]);