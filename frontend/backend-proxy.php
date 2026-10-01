<?php
declare(strict_types=1);

/**
 * Fetch a public backend resource without forwarding browser cookies or secrets.
 *
 * @return array{body:string|false,status:int,contentType:string}
 */
function fetch_public_backend(string $url, string $accept, string $origin): array
{
    $body = false;
    $status = 502;
    $contentType = '';

    if (function_exists('curl_init')) {
        $request = curl_init($url);
        curl_setopt_array($request, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => [
                'Accept: ' . $accept,
                'X-Frontend-Origin: ' . $origin,
            ],
        ]);
        $body = curl_exec($request);
        $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE);
        $contentType = (string) curl_getinfo($request, CURLINFO_CONTENT_TYPE);
        curl_close($request);
    } elseif (filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
        $context = stream_context_create(['http' => [
            'method' => 'GET',
            'timeout' => 20,
            'ignore_errors' => true,
            'follow_location' => 0,
            'header' => "Accept: {$accept}\r\nX-Frontend-Origin: {$origin}\r\n",
        ]]);
        $body = @file_get_contents($url, false, $context);
        foreach (($http_response_header ?? []) as $header) {
            if (preg_match('/^HTTP\/\S+\s+(\d{3})\b/i', $header, $match)) {
                $status = (int) $match[1];
            } elseif (stripos($header, 'Content-Type:') === 0) {
                $contentType = trim(substr($header, 13));
            }
        }
    }

    return ['body' => $body, 'status' => $status, 'contentType' => $contentType];
}
