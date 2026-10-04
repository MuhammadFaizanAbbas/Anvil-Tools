<?php
declare(strict_types=1);

require __DIR__ . '/site-origin.php';
require __DIR__ . '/backend-proxy.php';
require __DIR__ . '/public-assets.php';

$slug = (string) ($_GET['slug'] ?? '');
if (strlen($slug) > 150 || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=UTF-8');
    header('X-Robots-Tag: noindex, follow');
    readfile(__DIR__ . '/404.html');
    exit;
}

$origin = public_site_origin();
$url = 'https://anvil-tools-backend.vercel.app/api/public/articles/' . rawurlencode($slug);
$response = fetch_public_backend($url, 'text/html', $origin);

// Consolidated guides keep old incoming links through a same-site redirect.
// Only an article path is accepted; never forward an arbitrary upstream URL.
if (in_array($response['status'], [301, 308], true)) {
    $location = (string) ($response['location'] ?? '');
    $relative = str_starts_with($location, $origin . '/') ? substr($location, strlen($origin)) : $location;
    if (preg_match('~^/journal/[a-z0-9]+(?:-[a-z0-9]+)*(?:#[a-z0-9-]+)?$~D', $relative)) {
        http_response_code(301);
        header('Location: ' . $origin . $relative);
        header('Cache-Control: public, max-age=300');
        exit;
    }
}

if ($response['body'] === false || !in_array($response['status'], [200, 404, 410], true)) {
    http_response_code(502);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, follow');
    echo '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Article temporarily unavailable</title><h1>Article temporarily unavailable</h1><p>Please try again shortly.</p><p><a href="/blog/index.html">Return to blogs</a></p></html>';
    exit;
}

http_response_code($response['status']);
header('Content-Type: text/html; charset=UTF-8');
header($response['status'] === 200 ? 'Cache-Control: public, max-age=60' : 'Cache-Control: no-store');
if (in_array($response['status'], [404, 410], true)) {
    header('X-Robots-Tag: noindex, follow');
}
echo version_public_styles($response['body']);
