<?php
declare(strict_types=1);

/**
 * Fetch a public backend resource without forwarding browser cookies or secrets.
 *
 * @return array{body:string|false,status:int,contentType:string,location:string}
 */
function fetch_public_backend_once(string $url, string $accept, string $origin, int $timeoutSeconds): array
{
    $body = false;
    $status = 502;
    $contentType = '';
    $location = '';

    if (function_exists('curl_init')) {
        $request = curl_init($url);
        curl_setopt_array($request, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => min(5, $timeoutSeconds),
            CURLOPT_TIMEOUT => $timeoutSeconds,
            CURLOPT_HEADERFUNCTION => static function ($request, string $header) use (&$location): int {
                if (stripos($header, 'Location:') === 0) {
                    $location = trim(substr($header, 9));
                }
                return strlen($header);
            },
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
            'timeout' => $timeoutSeconds,
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
            } elseif (stripos($header, 'Location:') === 0) {
                $location = trim(substr($header, 9));
            }
        }
    }

    return ['body' => $body, 'status' => $status, 'contentType' => $contentType, 'location' => $location];
}

/** Retry one transient public GET failure within a single bounded deadline. */
function fetch_public_backend(string $url, string $accept, string $origin, int $timeoutSeconds = 20): array
{
    $started = microtime(true);
    $response = fetch_public_backend_once($url, $accept, $origin, min(10, $timeoutSeconds));
    if ($response['body'] !== false && !in_array($response['status'], [0, 502, 503, 504], true)) {
        return $response;
    }
    $remaining = (int) floor($timeoutSeconds - (microtime(true) - $started));
    return $remaining > 0 ? fetch_public_backend_once($url, $accept, $origin, $remaining) : $response;
}
