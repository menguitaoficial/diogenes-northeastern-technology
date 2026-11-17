/* Configuração pública do Supabase. A chave publishable pode ficar no navegador. */
(function () {
  const SUPABASE_URL = "https://fhltyituqwhomfpndzdx.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DWREejQxBGhGdsUtYK0_eg_gq38bRbN";
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Biblioteca do Supabase não carregada.");
    return;
  }
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
})();
