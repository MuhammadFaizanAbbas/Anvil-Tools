<?php
declare(strict_types=1);

// Keep this version in sync with backend/src/lib/public-assets.js.
function version_public_styles(string $html): string
{
    $html = preg_replace('~(href="[^"]*\bassets/css/[^"?]+\.css)(?:\?[^"]*)?"~', '$1?v=20261007-guides2"', $html);
    return preg_replace('~(src="[^"]*\bassets/js/(?!vendor/)[^"?]+\.js)(?:\?[^"]*)?"~', '$1?v=20261007-guides2"', $html);
}
