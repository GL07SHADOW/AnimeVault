<?php

/* =========================================================
   AnimeVault — Database + Auth Helpers
   Path: backend/config/database.php
   ========================================================= */

$host     = "localhost";
$dbname   = "animevault";
$username = "root";
$password = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}

/**
 * Extract the Bearer token reliably on XAMPP/Apache.
 * Apache strips HTTP_AUTHORIZATION by default, so we check
 * every possible location (including getallheaders fallback).
 */
function get_bearer_token(): string
{
    $header = $_SERVER["HTTP_AUTHORIZATION"]
           ?? $_SERVER["REDIRECT_HTTP_AUTHORIZATION"]
           ?? "";

    if ($header === "" && function_exists("getallheaders")) {
        foreach (getallheaders() as $key => $value) {
            if (strcasecmp($key, "Authorization") === 0) {
                $header = $value;
                break;
            }
        }
    }

    if ($header === "" && function_exists("apache_request_headers")) {
        foreach (apache_request_headers() as $key => $value) {
            if (strcasecmp($key, "Authorization") === 0) {
                $header = $value;
                break;
            }
        }
    }

    if (preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) {
        return trim($m[1]);
    }

    return "";
}

/**
 * Validate the session token and return the user_id, or null.
 */
function get_session_user_id(PDO $pdo): ?int
{
    $token = get_bearer_token();

    if ($token === "") {
        return null;
    }

    $stmt = $pdo->prepare(
        "SELECT user_id
           FROM sessions
          WHERE token = ?
            AND expires_at > NOW()
          LIMIT 1"
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    return $row ? (int) $row["user_id"] : null;
}

/**
 * Small helper: output JSON and exit.
 */
function json_out(array $payload, int $status = 200): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($payload);
    exit;
}