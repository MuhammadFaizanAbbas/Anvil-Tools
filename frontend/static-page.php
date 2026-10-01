<?php
declare(strict_types=1);

require __DIR__ . '/site-origin.php';

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

$html = str_replace('https://anviltools.vercel.app', public_site_origin(), $template);
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=300');
header('Vary: Host');
header('X-Content-Type-Options: nosniff');
echo $html;
