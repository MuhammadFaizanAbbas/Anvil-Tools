// Add these lines to the end of server.js to start the server and cleanup task:

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Anvil Tools server started on http://localhost:${PORT}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin/login`);
  console.log(`💾 Storage mode: ${isSupabaseEnabled && supabaseAdmin ? 'Supabase ✅' : 'In-memory ⚠️'}`);
  console.log(`\n📧 Temp-mail endpoints:`);
  console.log(`   POST   /api/temp-mail/create → New inbox`);
  console.log(`   GET    /api/temp-mail/messages → List messages`);
  console.log(`   GET    /api/temp-mail/messages/:id → Fetch message`);
  console.log(`   POST   /api/temp-mail/delete → Delete inbox`);
  console.log(`   GET    /api/temp-mail/stats (admin only) → Session stats`);
  console.log();
  
  // Start cleanup task
  startCleanupTask();
  console.log(`⏰ Session cleanup task started (every 10 minutes)`);
  console.log();
});
