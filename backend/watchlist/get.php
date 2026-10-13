<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

$userId = get_session_user_id($pdo);

if (!$userId) {
    json_out(["success" => false, "message" => "Authentication required"], 401);
}

$stmt = $pdo->prepare(
    "SELECT
        anime.id,
        anime.anilist_id,
        anime.title,
        anime.english_title,
        anime.native_title,
        anime.poster_url,
        anime.banner_url,
        anime.synopsis,
        anime.score,
        anime.episodes,
        anime.status,
        anime.format,
        anime.season_year,
        anime.site_url,
        watchlist.added_at
     FROM watchlist
     INNER JOIN anime ON anime.id = watchlist.anime_id
     WHERE watchlist.user_id = ?
     ORDER BY watchlist.added_at DESC"
);

$stmt->execute([$userId]);

json_out([
    "success"   => true,
    "watchlist" => $stmt->fetchAll()
]);