const tools = [
  { id: 'temp-mail', name: 'Temporary Email Generator', category: 'Email tools', slug: 'temp-mail', description: 'Disposable inbox for one-time signups and testing flows.', status: 'active', views: 14230, conversions: 484 },
  { id: 'background-remover', name: 'Background Remover', category: 'Image tools', slug: 'background-remover', description: 'Remove image backgrounds locally in the browser.', status: 'active', views: 18900, conversions: 620 },
  { id: 'pdf-merge', name: 'PDF Merge', category: 'PDF tools', slug: 'pdf-merge', description: 'Merge PDF files without uploading any documents.', status: 'active', views: 11340, conversions: 402 },
  { id: 'image-to-pdf', name: 'Image to PDF Converter', category: 'PDF tools', slug: 'image-to-pdf', description: 'Turn images into a single PDF document quickly.', status: 'active', views: 9800, conversions: 308 },
  { id: 'qr-code-generator', name: 'QR Code Generator', category: 'Generators', slug: 'qr-code-generator', description: 'Create scannable QR codes for links and text.', status: 'active', views: 16020, conversions: 560 },
  { id: 'password-generator', name: 'Password Generator', category: 'Generators', slug: 'password-generator', description: 'Generate secure random passwords with the right complexity.', status: 'active', views: 20540, conversions: 774 },
  { id: 'word-counter', name: 'Word & Character Counter', category: 'Text tools', slug: 'word-counter', description: 'Get instant counts for words, characters, and reading time.', status: 'active', views: 12420, conversions: 410 },
  { id: 'json-formatter', name: 'JSON Formatter & Validator', category: 'Developer tools', slug: 'json-formatter', description: 'Format, validate, and minify JSON in the browser.', status: 'active', views: 17110, conversions: 642 },
  { id: 'base64-tool', name: 'Base64 Encoder & Decoder', category: 'Developer tools', slug: 'base64-tool', description: 'Encode and decode Base64 strings safely on-device.', status: 'active', views: 9680, conversions: 286 },
  { id: 'user-agent-generator', name: 'User Agent Generator', category: 'Developer tools', slug: 'user-agent-generator', description: 'Generate realistic user-agent strings for testing.', status: 'active', views: 7210, conversions: 214 },
  { id: 'color-palette-generator', name: 'Color Palette Generator', category: 'Generators', slug: 'color-palette-generator', description: 'Generate matching brand and UI color palettes.', status: 'active', views: 13890, conversions: 470 },
  { id: 'unit-converter', name: 'Unit Converter', category: 'Generators', slug: 'unit-converter', description: 'Convert across common measurement units instantly.', status: 'active', views: 14760, conversions: 531 }
];

const posts = [
  {
    id: 'safe-temporary-email-signups',
    title: 'How to Use a Temporary Email Address Without Losing Messages You Actually Need',
    slug: 'safe-temporary-email-signups',
    excerpt: 'Disposable inboxes are useful for one-time signups, but they are not a replacement for real email addresses.',
    status: 'published',
    updatedAt: '2026-09-27'
  },
  {
    id: 'removing-a-photo-background-guide',
    title: 'Removing a Photo Background in Under a Minute',
    slug: 'removing-a-photo-background-guide',
    excerpt: 'A quick guide to better background removal results using local browser tools.',
    status: 'published',
    updatedAt: '2026-09-27'
  }
];

const analytics = {
  totalVisitors: 185420,
  avgSessionTime: '3m 48s',
  topSource: 'Organic search',
  toolBreakdown: [
    { name: 'Password Generator', views: 20540 },
    { name: 'Background Remover', views: 18900 },
    { name: 'JSON Formatter', views: 17110 },
    { name: 'QR Code Generator', views: 16020 }
  ]
};

module.exports = {
  tools,
  posts,
  analytics,
};
