<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

$userId = get_session_user_id($pdo);

if (!$userId) {
    json_out(["success" => false, "message" => "Authentication required"], 401);
}

$stmt = $pdo->prepare("DELETE FROM watchlist WHERE user_id = ?");
$stmt->execute([$userId]);

json_out([
    "success"      => true,
    "message"      => "Watchlist cleared",
    "rows_deleted" => $stmt->rowCount()
]);