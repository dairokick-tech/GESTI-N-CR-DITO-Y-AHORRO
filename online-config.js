/*
 * CREDICONTAFI - Configuración online de Supabase
 * Archivo: online-config.js
 */
window.CREDICONTAFI_ONLINE = {
  enabled: true,
  url: "https://nfnoturypwnnmzkrdgts.supabase.co",
  anonKey: "sb_publishable_s-rePzYn_kAV56YjN9Cprg_eZ8bETX9"
};
window.SUPABASE_CONFIG = {
  url: window.CREDICONTAFI_ONLINE.url,
  anonKey: window.CREDICONTAFI_ONLINE.anonKey
};
window.ONLINE_CONFIG = window.SUPABASE_CONFIG;
