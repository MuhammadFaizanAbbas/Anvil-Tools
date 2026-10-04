<?php
declare(strict_types=1);
require_once __DIR__ . '/public-assets.php';

function render_blog_index(string $template, array $posts, string $origin, int $page, bool $hasNext, bool $unavailable = false): string
{
    $escape = static fn($value): string => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $html = str_replace('https://anviltools.vercel.app', $origin, $template);
    $cards = [];
    foreach ($posts as $post) {
        if (!is_array($post) || !isset($post['slug'], $post['title']) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', (string) $post['slug'])) {
            continue;
        }
        $link = '/journal/' . rawurlencode($post['slug']);
        $cover = empty($post['cover_image_id']) ? '' : '<img class="guide-cover" src="' . $escape($origin) . '/journal-images/' . rawurlencode($post['cover_image_id']) . '" alt="' . $escape($post['cover_alt'] ?? '') . '" loading="lazy">';
        $cards[] = '<article class="tool-card">' . $cover . '<h2><a href="' . $link . '">' . $escape($post['title']) . '</a></h2><p>' . $escape($post['excerpt'] ?? '') . '</p><a class="tool-link" href="' . $link . '">Read article &#8594;</a></article>';
    }
    $html = str_replace('<!-- published-cards -->', implode("\n", $cards), $html);
    if (!$unavailable && $cards) {
        $html = preg_replace('#<!-- editorial-library -->.*?<!-- /editorial-library -->#s', '', $html);
    }
    $html = str_replace('id="publishedGuideCards"', 'id="publishedGuideCards" data-server-rendered="' . ($unavailable ? 'false' : 'true') . '" data-page="' . $page . '" data-has-next="' . ($hasNext ? 'true' : 'false') . '"', $html);
    $html = str_replace('<!-- published-status -->', $unavailable ? 'Latest articles are temporarily unavailable. The practical guides below are still available.' : ($cards ? '' : 'No additional articles published yet. Explore the practical guides below.'), $html);
    $nav = '<a class="btn" id="blogsPrev" href="/blog/index.html?page=' . max(1, $page - 1) . '" rel="prev"' . ($page === 1 ? ' hidden' : '') . '>Previous</a>';
    $nav .= '<span id="blogsPage" aria-live="polite">Page ' . $page . '</span>';
    $nav .= '<a class="btn" id="blogsNext" href="/blog/index.html?page=' . ($page + 1) . '" rel="next"' . ($hasNext ? '' : ' hidden') . '>Next</a>';
    $html = preg_replace('#<!-- blog-pagination -->.*?<!-- /blog-pagination -->#s', '<nav class="blog-pagination" id="blogPagination" aria-label="Article pages"' . ($page === 1 && !$hasNext ? ' hidden' : '') . '>' . $nav . '</nav>', $html);
    if ($page > 1) {
        $canonical = $origin . '/blog/index.html';
        $html = str_replace('rel="canonical" href="' . $canonical . '"', 'rel="canonical" href="' . $canonical . '?page=' . $page . '"', $html);
        $html = str_replace('property="og:url" content="' . $canonical . '"', 'property="og:url" content="' . $canonical . '?page=' . $page . '"', $html);
    }
    return version_public_styles($html);
}
