<?php
declare(strict_types=1);

// Keep this version in sync with backend/src/lib/public-assets.js.
function version_public_styles(string $html): string
{
    return preg_replace('~(href="[^"]*\bassets/css/(?:style|refinements|design|content)\.css)(?:\?[^"]*)?"~', '$1?v=20261004-css"', $html);
}
