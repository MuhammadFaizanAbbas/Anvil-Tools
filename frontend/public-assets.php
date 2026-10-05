<?php
declare(strict_types=1);

// Keep this version in sync with backend/src/lib/public-assets.js.
function version_public_styles(string $html): string
{
    $html = preg_replace('~(href="[^"]*\bassets/css/(?:style|refinements|design|content)\.css)(?:\?[^"]*)?"~', '$1?v=20261005-review4"', $html);
    return preg_replace('~(src="[^"]*\bassets/js/(?:main|recommendations|site-catalog|tool-directory|tool-examples|tools/(?:word-counter|temp-mail|qr-code-generator))\.js)(?:\?[^"]*)?"~', '$1?v=20261005-review4"', $html);
}
