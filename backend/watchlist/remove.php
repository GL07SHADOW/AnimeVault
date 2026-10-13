<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

$userId = get_session_user_id($pdo);

if (!$userId) {
    json_out(["success" => false, "message" => "Authentication required"], 401);
}

$body = json_decode(file_get_contents("php://input"), true);
$anilistId = intval($body["anilist_id"] ?? 0);

if ($anilistId <= 0) {
    json_out(["success" => false, "message" => "Valid anilist_id is required"], 400);
}

$stmt = $pdo->prepare(
    "DELETE watchlist FROM watchlist
     INNER JOIN anime ON anime.id = watchlist.anime_id
     WHERE watchlist.user_id = ?
       AND anime.anilist_id = ?"
);
$stmt->execute([$userId, $anilistId]);

json_out([
    "success"      => true,
    "message"      => "Removed from watchlist",
    "rows_deleted" => $stmt->rowCount()
]);