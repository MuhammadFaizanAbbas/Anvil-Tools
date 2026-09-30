<?php
declare(strict_types=1);

require __DIR__ . '/site-origin.php';

$origin = public_site_origin();
$backend = 'https://anvil-tools-backend.vercel.app/api/public/sitemap.xml';
$body = false;
$status = 502;

if (function_exists('curl_init')) {
    $request = curl_init($backend);
    curl_setopt_array($request, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Accept: application/xml',
            'X-Frontend-Origin: ' . $origin,
        ],
    ]);
    $body = curl_exec($request);
    $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE);
    curl_close($request);
} elseif (filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
    $context = stream_context_create(['http' => [
        'method' => 'GET',
        'timeout' => 15,
        'ignore_errors' => true,
        'header' => "Accept: application/xml\r\nX-Frontend-Origin: {$origin}\r\n",
    ]]);
    $body = @file_get_contents($backend, false, $context);
    $statusLine = $http_response_header[0] ?? '';
    if (preg_match('/\s(\d{3})\s/', $statusLine, $match)) {
        $status = (int) $match[1];
    }
}

if ($body === false || $status !== 200 || !str_contains($body, '<urlset')) {
    http_response_code(502);
    header('Content-Type: application/xml; charset=UTF-8');
    header('Cache-Control: no-store');
    echo '<?xml version="1.0" encoding="UTF-8"?><error>Journal sitemap is temporarily unavailable.</error>';
    exit;
}

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=300');
echo $body;
