<?php
declare(strict_types=1);

require __DIR__ . '/site-origin.php';

$documents = [
    'sitemap' => ['file' => 'sitemap.xml', 'type' => 'application/xml; charset=UTF-8'],
    'index' => ['file' => 'sitemap-index.xml', 'type' => 'application/xml; charset=UTF-8'],
    'robots' => ['file' => 'robots.txt', 'type' => 'text/plain; charset=UTF-8'],
];
$name = (string) ($_GET['document'] ?? '');
if (!isset($documents[$name])) {
    http_response_code(404);
    exit('Document not found.');
}

$template = file_get_contents(__DIR__ . '/' . $documents[$name]['file']);
if ($template === false) {
    http_response_code(500);
    exit('Metadata template unavailable.');
}

$origin = public_site_origin();
$content = str_replace('https://anviltools.vercel.app', $origin, $template);
header('Content-Type: ' . $documents[$name]['type']);
header('Cache-Control: public, max-age=300');
echo $content;
