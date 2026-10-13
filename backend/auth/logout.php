<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

$token = get_bearer_token();

if ($token === "") {
    json_out(["success" => false, "message" => "No token provided"], 400);
}

$stmt = $pdo->prepare("DELETE FROM sessions WHERE token = ?");
$stmt->execute([$token]);

json_out([
    "success" => true,
    "message" => "Logged out successfully"
]);