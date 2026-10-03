<?php
declare(strict_types=1);

require __DIR__ . '/site-origin.php';
require __DIR__ . '/backend-proxy.php';
require __DIR__ . '/blog-render.php';

header('Content-Type: text/html; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Vary: Host');
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) {
    header('Allow: GET, HEAD');
    http_response_code(405);
    exit('Method not allowed.');
}
$pageValue = $_GET['page'] ?? '1';
if (!is_string($pageValue) || !preg_match('/^[1-9]\d{0,4}$/', $pageValue) || (int) $pageValue > 33334) {
    http_response_code(400);
    header('X-Robots-Tag: noindex, follow');
    exit('Invalid article page.');
}
$page = (int) $pageValue;
$origin = public_site_origin();
$template = file_get_contents(__DIR__ . '/blog/index.html');
$offset = ($page - 1) * 30;
$response = fetch_public_backend('https://anvil-tools-backend.vercel.app/api/public/posts?limit=31&offset=' . $offset, 'application/json', $origin, 5);
$posts = $response['status'] === 200 && is_string($response['body']) ? json_decode($response['body'], true) : null;
if (!is_array($posts) || !array_is_list($posts)) {
    // Keep the static guides readable and let the browser retry the live listing.
    echo render_blog_index($template, [], $origin, $page, false, true);
    exit;
}
if ($page > 1 && !$posts) {
    http_response_code(404);
    header('X-Robots-Tag: noindex, follow');
    readfile(__DIR__ . '/404.html');
    exit;
}
echo render_blog_index($template, array_slice($posts, 0, 30), $origin, $page, count($posts) > 30);
