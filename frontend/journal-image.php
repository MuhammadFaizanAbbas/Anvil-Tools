<?php
declare(strict_types=1);

require __DIR__ . '/site-origin.php';
require __DIR__ . '/backend-proxy.php';

$id = (string) ($_GET['id'] ?? '');
if (!preg_match('/^[a-f0-9-]{36}$/i', $id)) {
    http_response_code(404);
    exit;
}

$origin = public_site_origin();
$url = 'https://anvil-tools-backend.vercel.app/api/public/post-images/' . rawurlencode($id);
$response = fetch_public_backend($url, 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml,image/*', $origin);
$contentType = strtolower(trim(explode(';', $response['contentType'])[0]));
$allowedTypes = ['image/avif', 'image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/x-icon'];

if ($response['body'] === false) {
    http_response_code(502);
    header('Cache-Control: no-store');
    exit;
}
if ($response['status'] !== 200 || !in_array($contentType, $allowedTypes, true)) {
    http_response_code($response['status'] === 404 ? 404 : 502);
    header('Cache-Control: no-store');
    exit;
}

header('Content-Type: ' . $contentType);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=3600');
if ($contentType === 'image/svg+xml') {
    header("Content-Security-Policy: sandbox; default-src 'none'; style-src 'unsafe-inline'");
}
echo $response['body'];
