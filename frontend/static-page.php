<?php
declare(strict_types=1);

require __DIR__ . '/site-origin.php';
require __DIR__ . '/public-assets.php';

$requestMethod = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($requestMethod, ['GET', 'HEAD'], true)) {
    header('Allow: GET, HEAD');
    header('Cache-Control: no-store');
    header('Content-Type: text/plain; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    http_response_code(405);
    exit('This page requires JavaScript to submit forms.');
}

$requestedPath = $_GET['path'] ?? '';
if (!is_string($requestedPath) || !preg_match('#^(?:[a-z0-9-]+/)*[a-z0-9-]+\.html$#i', $requestedPath)) {
    http_response_code(404);
    exit('Page not found.');
}

$root = realpath(__DIR__);
$file = realpath(__DIR__ . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $requestedPath));
if ($root === false || $file === false || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== 'html') {
    http_response_code(404);
    exit('Page not found.');
}

$template = file_get_contents($file);
if ($template === false) {
    http_response_code(500);
    exit('Page temporarily unavailable.');
}

$html = version_public_styles(str_replace('https://anviltools.vercel.app', public_site_origin(), $template));
$errorStatus = (int) ($_SERVER['REDIRECT_STATUS'] ?? 0);
if (in_array($errorStatus, [404, 410], true)) {
    http_response_code($errorStatus);
    header('X-Robots-Tag: noindex, follow');
}
header('Content-Type: text/html; charset=UTF-8');
header(in_array($errorStatus, [404, 410], true) ? 'Cache-Control: no-store' : 'Cache-Control: public, max-age=300');
header('Vary: Host');
header('X-Content-Type-Options: nosniff');
echo $html;
