<?php

header("Content-Type: application/json; charset=UTF-8");

$id = intval($_GET["id"] ?? 0);

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Anime ID is required"]);
    exit;
}

$query = <<<'GRAPHQL'
query ($id: Int) {
    Media(id: $id, type: ANIME) {
        id
        idMal
        title { romaji english native }
        synonyms
        coverImage { large medium extraLarge }
        bannerImage
        description(asHtml: false)
        averageScore
        meanScore
        popularity
        favourites
        episodes
        duration
        status
        format
        season
        seasonYear
        genres
        studios { nodes { id name } }
        startDate { year month day }
        endDate   { year month day }
        siteUrl
    }
}
GRAPHQL;

$payload = json_encode([
    "query"     => $query,
    "variables" => ["id" => $id]
]);

$ch = curl_init("https://graphql.anilist.co");

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_USERAGENT      => "AnimeVault/1.0",
    CURLOPT_HTTPHEADER     => [
        "Content-Type: application/json",
        "Accept: application/json"
    ]
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(["success" => false, "message" => "AniList unreachable", "error" => $curlError]);
    exit;
}

if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code(502);
    echo json_encode(["success" => false, "message" => "AniList error", "http_code" => $httpCode]);
    exit;
}

$data = json_decode($response, true);

if (!is_array($data) || isset($data["errors"])) {
    http_response_code(502);
    echo json_encode(["success" => false, "message" => "AniList response invalid"]);
    exit;
}

$anime = $data["data"]["Media"] ?? null;

if (!$anime) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Anime not found"]);
    exit;
}

echo json_encode(["success" => true, "data" => $anime]);