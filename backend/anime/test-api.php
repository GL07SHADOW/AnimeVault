<?php

header("Content-Type: application/json; charset=UTF-8");

$result = [
    "php_version" => PHP_VERSION,
    "curl_enabled" => function_exists("curl_init"),
    "openssl_enabled" => extension_loaded("openssl"),
    "internet_test" => false,
    "http_code" => null,
    "curl_error" => null,
    "response_preview" => null
];

if (!function_exists("curl_init")) {
    $result["curl_error"] = "cURL is NOT enabled in PHP";
    echo json_encode($result, JSON_PRETTY_PRINT);
    exit;
}

$url = "https://api.jikan.moe/v4/anime?q=naruto&limit=1";

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 15,

    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,

    CURLOPT_USERAGENT => "Mozilla/5.0 AnimeVault",
    CURLOPT_HTTPHEADER => [
        "Accept: application/json"
    ]
]);

$response = curl_exec($ch);

$result["http_code"] = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$result["curl_error"] = curl_error($ch);

if ($response !== false) {

    $result["internet_test"] = true;

    $result["response_preview"] =
        substr($response, 0, 500);
}

curl_close($ch);

echo json_encode(
    $result,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
);