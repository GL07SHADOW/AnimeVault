<?php
header("Content-Type: application/json");

require_once __DIR__ . "/../config/database.php";

$token = get_bearer_token();

$out = [
    "raw_http_authorization"    => $_SERVER["HTTP_AUTHORIZATION"] ?? "(empty)",
    "raw_redirect_auth"         => $_SERVER["REDIRECT_HTTP_AUTHORIZATION"] ?? "(empty)",
    "getallheaders_exists"      => function_exists("getallheaders"),
    "apache_request_headers"    => function_exists("apache_request_headers"),
    "extracted_token_length"    => strlen($token),
    "extracted_token_preview"   => $token === "" ? "(none)" : substr($token, 0, 8) . "..."
];

// If a token was extracted, check if it's in the sessions table
if ($token !== "") {
    $stmt = $pdo->prepare("SELECT user_id, expires_at FROM sessions WHERE token = ? LIMIT 1");
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    $out["session_found"]   = (bool) $row;
    $out["session_user_id"] = $row["user_id"] ?? null;
    $out["session_expires"] = $row["expires_at"] ?? null;
    $out["session_expired"] = $row ? (strtotime($row["expires_at"]) < time()) : null;
}

echo json_encode($out, JSON_PRETTY_PRINT);