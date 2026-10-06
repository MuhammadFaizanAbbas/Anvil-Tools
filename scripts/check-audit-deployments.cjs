const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const sha = folder => execFileSync('git', ['-c', `safe.directory=${process.cwd().replaceAll('\\','/')}${folder ? '/' + folder : ''}`, ...(folder ? ['-C', folder] : []), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
(async () => {
  const report = { checkedAt: new Date().toISOString(), repositories: [] };
  for (const [repo, folder] of [['Anvil-Tools', ''], ['Anvil-Tools-Backend', 'deployment/backend-repo']]) {
    const revision = sha(folder);
    const response = await fetch(`https://api.github.com/repos/MuhammadFaizanAbbas/${repo}/commits/${revision}/status`, { headers: { 'User-Agent': 'Anvil-Tools-release-audit' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error(`GitHub status returned ${response.status}`);
    const data = await response.json();
    report.repositories.push({ repo, sha: revision, state: data.state, contexts: data.statuses.map(status => ({ context: status.context, state: status.state, description: status.description, targetUrl: status.target_url })) });
  }
  fs.writeFileSync('docs/audits/full-audit-deployments.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
