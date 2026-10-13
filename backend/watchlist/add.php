<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

$userId = get_session_user_id($pdo);

if (!$userId) {
    json_out(["success" => false, "message" => "Authentication required"], 401);
}

$body = json_decode(file_get_contents("php://input"), true);

if (!is_array($body)) {
    json_out(["success" => false, "message" => "Invalid JSON body"], 400);
}

/* Accept {anime:{...}} or a flat anime object */
$anime = $body["anime"] ?? $body;

$anilistId = intval($anime["id"] ?? 0);

if ($anilistId <= 0) {
    json_out(["success" => false, "message" => "Valid anilist_id is required"], 400);
}

$title         = trim($anime["title"]         ?? "Untitled");
$titleEnglish  = trim($anime["titleEnglish"]  ?? "");
$titleJapanese = trim($anime["titleJapanese"] ?? "");
$poster        = trim($anime["poster"]        ?? "");
$banner        = trim($anime["banner"]        ?? "");
$synopsis      = trim($anime["synopsis"]      ?? "");
$score         = isset($anime["score"]) && is_numeric($anime["score"]) ? floatval($anime["score"]) : null;
$episodes      = intval($anime["episodes"]    ?? 0);
$status        = trim($anime["status"]        ?? "");
$format        = trim($anime["type"]          ?? "");
$seasonYear    = intval($anime["year"]        ?? 0);
$siteUrl       = trim($anime["url"]           ?? "");

/* --- Upsert anime into `anime` table --- */
$upsert = $pdo->prepare(
    "INSERT INTO anime
        (anilist_id, title, english_title, native_title,
         poster_url, banner_url, synopsis, score, episodes,
         status, format, season_year, site_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        title         = VALUES(title),
        english_title = VALUES(english_title),
        native_title  = VALUES(native_title),
        poster_url    = VALUES(poster_url),
        banner_url    = VALUES(banner_url),
        synopsis      = VALUES(synopsis),
        score         = VALUES(score),
        episodes      = VALUES(episodes),
        status        = VALUES(status),
        format        = VALUES(format),
        season_year   = VALUES(season_year),
        site_url      = VALUES(site_url)"
);

$upsert->execute([
    $anilistId,
    $title,
    $titleEnglish  ?: null,
    $titleJapanese ?: null,
    $poster        ?: null,
    $banner        ?: null,
    $synopsis      ?: null,
    $score,
    $episodes,
    $status  ?: null,
    $format  ?: null,
    $seasonYear ?: null,
    $siteUrl  ?: null
]);

/* --- Get internal anime id --- */
$stmt = $pdo->prepare("SELECT id FROM anime WHERE anilist_id = ? LIMIT 1");
$stmt->execute([$anilistId]);
$animeRow = $stmt->fetch();

if (!$animeRow) {
    json_out(["success" => false, "message" => "Could not save anime row"], 500);
}

$animeId = (int) $animeRow["id"];

/* --- Insert into watchlist (ignore duplicates) --- */
$insert = $pdo->prepare(
    "INSERT IGNORE INTO watchlist (user_id, anime_id)
     VALUES (?, ?)"
);
$insert->execute([$userId, $animeId]);

json_out([
    "success"  => true,
    "message"  => "Added to watchlist",
    "anime_id" => $animeId
]);