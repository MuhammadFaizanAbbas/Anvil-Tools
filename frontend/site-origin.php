<?php
declare(strict_types=1);

function public_site_origin(): string
{
    $host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? '')));
    $host = preg_replace('/:\d+$/', '', $host) ?? '';
    if ($host === '' || strlen($host) > 253 || !preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/', $host)) {
        http_response_code(400);
        exit('Invalid site host.');
    }

    $forwarded = strtolower(trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
    $https = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') || $forwarded === 'https';
    return ($https ? 'https' : 'http') . '://' . $host;
}
