const http = require('http');

const tests = [
  { name: 'Homepage', path: '/' },
  { name: 'Tools Index', path: '/tools/index.html' },
  { name: 'About', path: '/about.html' },
  { name: 'Privacy Policy', path: '/privacy-policy.html' },
  { name: 'Create Temp Mail', path: '/api/temp-mail/create', method: 'POST' },
];

function testEndpoint(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: test.method || 'GET',
      headers: {
        'User-Agent': 'Verify Script',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const pass = res.statusCode >= 200 && res.statusCode < 300;
        const cmpIncludes = body.includes('cmp.js');
        const adsIncludes = body.includes('ads.js');
        resolve({
          name: test.name,
          status: res.statusCode,
          pass,
          cmpIncludes,
          adsIncludes,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ name: test.name, status: 'ERROR', pass: false, error: err.message });
    });

    req.setTimeout(2000);
    req.end();
  });
}

async function runVerification() {
  console.log('🧪 Starting Anvil Tools Verification...\n');
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test);
    results.push(result);
    const icon = result.pass ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.cmpIncludes) console.log(`   ✓ CMP script included`);
    if (result.adsIncludes) console.log(`   ✓ Ads script included`);
  }

  console.log('\n📊 Summary:');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);

  const cmpCount = results.filter(r => r.cmpIncludes).length;
  const adsCount = results.filter(r => r.adsIncludes).length;
  console.log(`\n🎯 CMP Coverage: ${cmpCount}/${results.filter(r => r.name.includes('Html') || r.name.includes('Mail') || r.name.includes('About')).length}`);
  console.log(`🎯 Ads Coverage: ${adsCount}/${results.filter(r => r.name.includes('Html') || r.name.includes('Mail') || r.name.includes('About')).length}`);

  process.exit(passed === results.length ? 0 : 1);
}

runVerification().catch(console.error);
