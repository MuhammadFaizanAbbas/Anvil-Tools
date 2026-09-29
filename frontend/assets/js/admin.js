
    const notice = document.getElementById('dashboardMessage');
    function showNotice(message, error = false) {
      notice.hidden = !message;
      notice.textContent = message;
      notice.classList.toggle('error', error);
    }
    function selectPanel() {
      const selected = ['tools', 'posts', 'analytics', 'contacts', 'users', 'categories', 'audit', 'settings'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
      document.querySelectorAll('.nav-item').forEach(link => {
        const active = link.hash === `#${selected}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      });
      document.querySelectorAll('.content > section').forEach(section => {
        section.hidden = section.id !== selected;
      });
    }
    window.addEventListener('hashchange', selectPanel);
    selectPanel();
    const statsGrid = document.getElementById('statsGrid');
    const toolsTable = document.getElementById('toolsTable');
    const postsList = document.getElementById('postsList');
    const analyticsChart = document.getElementById('analyticsChart');
    const userEmail = document.getElementById('userEmail');
    const postsPrev = document.getElementById('postsPrev');
    const postsNext = document.getElementById('postsNext');
    const postsPage = document.getElementById('postsPage');

    async function loadSession() {
      const res = await AnvilAPI.fetch('/api/admin/me');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/admin-panel/login.html';
        return;
      }
      if (!res.ok) throw new Error('Backend unavailable. Check Supabase environment variables and FRONTEND_ORIGINS in Vercel.');
      const data = await res.json();
      userEmail.textContent = data.user?.email || 'Admin';
      document.getElementById('currentRole').textContent = data.user?.role || 'admin';
      return true;
    }

    async function fetchJson(url) {
      const response = await AnvilAPI.fetch(url);
      if (response.status === 401) window.location.href = '/admin-panel/login.html';
      if (!response.ok) throw new Error(`API returned ${response.status}. Check the backend configuration and try again.`);
      return response.json();
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }

    let catalog = [], postPage = 0;
    const postPageSize = 30;
    const number = value => Math.max(0, Number(value) || 0);
    function renderStats(data, tools) {
      const cards = [
        { label: 'Tracked tool views', value: number(data.totalVisitors).toLocaleString(), note: 'All-time recorded views', icon: '&#8599;' },
        { label: 'Active tools', value: tools.filter(t => t.status === 'active').length, note: `${tools.length} tools in your library`, icon: '&#9881;' },
        { label: 'Published posts', value: number(data.publishedPosts), note: 'Published catalog entries', icon: '&#9998;' },
        { label: 'Draft posts', value: number(data.draftPosts), note: 'Ready for your next edit', icon: '&#9633;' }
      ];
      statsGrid.innerHTML = cards.map((card, index) => `<div class="stat-card stat-${index}"><div class="stat-top"><span class="stat-label">${card.label}</span><span class="stat-icon" aria-hidden="true">${card.icon}</span></div><div class="stat-value">${card.value}</div><span class="muted small">${card.note}</span></div>`).join('');
    }

    function renderTools(tools) {
      if (!tools.length) { toolsTable.innerHTML = '<p class="empty-state">No tools found. Try another search, or seed your tool catalog.</p>'; return; }
      toolsTable.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Category</th>
              <th>Views</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tools.map((tool) => `
              <tr>
                <td>${escapeHtml(tool.name)}</td>
                <td>${escapeHtml(tool.category)}</td>
                <td>${number(tool.views).toLocaleString()}</td>
                <td><span class="pill ${tool.status === 'inactive' ? 'inactive' : ''}">${escapeHtml(tool.status || 'active')}</span></td>
                <td><button class="btn secondary small" data-tool="${escapeHtml(tool.slug)}">Edit</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      toolsTable.querySelectorAll('[data-tool]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const slug = btn.dataset.tool;
          const tool = tools.find((item) => item.slug === slug);
          const newName = prompt('Update tool name', tool.name);
          if (!newName) return;
          btn.disabled = true;
          try {
          const response = await AnvilAPI.fetch(`/api/tools/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...tool, name: newName })
          });
          if (!response.ok) throw new Error((await response.json()).error || 'Could not save tool.');
          await loadDashboard();
          showNotice('Tool updated.');
          } catch (error) { showNotice(error.message, true); }
          finally { btn.disabled = false; }
        });
      });
    }

    function renderPosts(data) {
      const posts = data.items;
      window.workspacePosts = posts;
      postsList.innerHTML = posts.length ? posts.map(post => `<button class="article-row" data-post="${escapeHtml(post.id)}"><span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.slug)}</small></span><span class="pill ${post.status === 'draft' ? 'inactive' : ''}">${escapeHtml(post.status)}</span><span aria-hidden="true">&#8599;</span></button>`).join('') : '<p class="empty-state">Your next article starts here. Create a draft above.</p>';
      const pages = Math.max(1, Math.ceil(data.total / data.limit));
      postsPage.textContent = `Page ${postPage + 1} of ${pages} · ${data.total} article${data.total === 1 ? '' : 's'}`;
      postsPrev.disabled = postPage === 0;
      postsNext.disabled = data.offset + posts.length >= data.total;
    }

    async function loadPosts() {
      postsList.setAttribute('aria-busy', 'true');
      postsList.innerHTML = '<div class="panel-loading"><span></span><p>Loading articles…</p></div>';
      postsPrev.disabled = true; postsNext.disabled = true;
      try {
        const data = await fetchJson(`/api/posts?limit=${postPageSize}&offset=${postPage * postPageSize}`);
        if (!data.items.length && postPage > 0 && data.total > 0) {
          postPage = Math.max(0, Math.ceil(data.total / postPageSize) - 1);
          return await loadPosts();
        }
        renderPosts(data);
        return data;
      } finally {
        postsList.removeAttribute('aria-busy');
      }
    }

    function renderAnalytics(tools) {
      const items = [...tools].sort((a, b) => number(b.views) - number(a.views)).slice(0, 6);
      const total = tools.reduce((sum, tool) => sum + number(tool.views), 0);
      const max = Math.max(...items.map(item => number(item.views)), 1);
      analyticsChart.innerHTML = total ? items.map((item, index) => `<div class="chart-row"><div class="chart-caption"><span><span class="rank">${index + 1}</span>${escapeHtml(item.name)}</span><strong>${number(item.views).toLocaleString()}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${number(item.views) / max * 100}%"></div></div></div>`).join('') : '<div class="empty-state"><span class="empty-symbol" aria-hidden="true">&#9636;</span><strong>No recorded views yet</strong><p>Usage will appear here once tool view events are recorded.</p></div>';
      const categories = new Map();
      tools.forEach(tool => { const name = tool.category || 'Uncategorized'; categories.set(name, (categories.get(name) || 0) + 1); });
      const colors = ['#4263eb', '#14b8a6', '#a78bfa', '#f5a524', '#f472b6', '#64748b'];
      let offset = 0;
      const segments = [...categories].map(([name, count], index) => {
        const start = offset; offset += count / tools.length * 100;
        return { name, count, color: colors[index % colors.length], stop: `${colors[index % colors.length]} ${start}% ${offset}%` };
      });
      document.getElementById('categoryChart').innerHTML = tools.length ? `<div class="donut" role="img" aria-label="${tools.length} tools across ${categories.size} categories" style="background:conic-gradient(${segments.map(s => s.stop).join(',')})"><div><strong>${tools.length}</strong><span>total tools</span></div></div><div class="chart-legend">${segments.map(s => `<div><span class="legend-dot" style="background:${s.color}"></span><span>${escapeHtml(s.name)}</span><strong>${s.count}</strong></div>`).join('')}</div>` : '<p class="empty-state">Add tools to see your category breakdown.</p>';
    }

    async function loadDashboard() {
      const [overview, tools] = await Promise.all([
        fetchJson('/api/site/overview'),
        fetchJson('/api/tools'),
      ]);
      await loadPosts();

      catalog = tools;
      renderStats(overview, tools);
      renderTools(tools.filter(tool => `${tool.name} ${tool.category}`.toLowerCase().includes(document.getElementById('toolSearch').value.toLowerCase())));
      renderAnalytics(tools);
      document.getElementById('connectionStatus').textContent = 'Connected to your workspace';
      document.getElementById('lastUpdated').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try { await AnvilAPI.fetch('/api/admin/logout', { method: 'POST' }); }
      finally {
        AnvilAPI.clearSession();
        window.location.href = '/admin-panel/login.html';
      }
    });

    document.getElementById('toolSearch').addEventListener('input', event => {
      const query = event.target.value.trim().toLowerCase();
      renderTools(catalog.filter(tool => `${tool.name} ${tool.category}`.toLowerCase().includes(query)));
    });
    async function refresh() {
      const button = document.getElementById('refreshBtn');
      button.disabled = true;
      showNotice('');
      try { if (await loadSession()) await loadDashboard(); }
      catch (error) {
        document.getElementById('connectionStatus').textContent = 'Connection needs attention';
        showNotice(error.message || 'Unable to load the dashboard. Check your API URL and connection.', true);
      } finally { button.disabled = false; }
    }
    document.getElementById('refreshBtn').addEventListener('click', refresh);
    async function movePostPage(change) {
      const previous = postPage;
      postPage = Math.max(0, postPage + change);
      try { await loadPosts(); }
      catch (error) { postPage = previous; showNotice(error.message || 'Unable to load articles.', true); }
    }
    postsPrev.addEventListener('click', () => { if (!postsPrev.disabled) movePostPage(-1); });
    postsNext.addEventListener('click', () => { if (!postsNext.disabled) movePostPage(1); });
    refresh();
