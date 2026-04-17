/**
 * auth.js
 * Handles Supabase authentication flow (Login, Signup, OAuth, Password Reset)
 * for the ZitBoard front-end, designed to share session with Dashboard Next.js app.
 */

// Read public Supabase configuration from meta tags or global config injected at runtime.
function readMetaConfig(name) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || '';
}

let SUPABASE_URL =
  readMetaConfig('supabase-url') ||
  window.ZITBOARD_SUPABASE_URL ||
  '';

let SUPABASE_ANON_KEY =
  readMetaConfig('supabase-anon-key') ||
  window.ZITBOARD_SUPABASE_ANON_KEY ||
  '';

// Redirect target for successful login (Dashboard App)
const DASHBOARD_URL = 'https://app.zitboard.dev'; // Adjust to local/staging/prod url
const DASHBOARD_API_BASE = `${DASHBOARD_URL}/api`; // Bridge calls go directly to dashboard domain for cookie alignment

function normalizeApiBase(rawBase) {
  const trimmed = String(rawBase || '').replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function resolveApiBase() {
  const isLocalFile = window.location.protocol === 'file:';
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalFile || isLocalHost) {
    return normalizeApiBase('https://api.jollyfield-1a95ff5f.centralindia.azurecontainerapps.io/api');
  }

  return normalizeApiBase('/api');
}

const API_BASE = resolveApiBase();
const PUBLIC_AUTH_CONFIG_ENDPOINT = `${API_BASE}/auth/public-config`;
const DEFAULT_TENANT_ID = 'app';
const DEFAULT_ROLE = 'admin';
const SIGNUP_TENANT_MAP_STORAGE_KEY = 'zitboard_signup_tenant_map';
const PENDING_SIGNUP_TENANT_KEY = 'zitboard_pending_signup_tenant';

function createSupabaseClient(url, anonKey) {
  if (!url || !anonKey || !window.supabase) {
    return null;
  }

  try {
    return window.supabase.createClient(url, anonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client.', error);
    return null;
  }
}

let supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function hydrateSupabaseConfigFromBackend() {
  try {
    const response = await fetchWithTimeout(
      PUBLIC_AUTH_CONFIG_ENDPOINT,
      {
        method: 'GET',
        credentials: 'omit',
      },
      10000,
    );

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    const nextUrl = String(payload?.supabaseUrl || '').trim();
    const nextAnonKey = String(payload?.supabaseAnonKey || '').trim();

    if (!nextUrl || !nextAnonKey) {
      return false;
    }

    SUPABASE_URL = nextUrl;
    SUPABASE_ANON_KEY = nextAnonKey;
    return true;
  } catch (error) {
    console.error('Failed to hydrate Supabase runtime config.', error);
    return false;
  }
}

async function ensureSupabaseClientReady() {
  if (supabaseClient) {
    return true;
  }

  const hydrated = await hydrateSupabaseConfigFromBackend();
  if (!hydrated) {
    return false;
  }

  supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return !!supabaseClient;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashTenantSeed(seed) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function buildSignupTenantId(email) {
  const normalizedEmail = normalizeEmail(email);
  return `signup-${hashTenantSeed(normalizedEmail)}`;
}

function readSignupTenantMap() {
  try {
    return JSON.parse(window.localStorage.getItem(SIGNUP_TENANT_MAP_STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function rememberTenantForEmail(email, tenantId) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !tenantId) {
    return;
  }

  try {
    const nextMap = readSignupTenantMap();
    nextMap[normalizedEmail] = tenantId;
    window.localStorage.setItem(SIGNUP_TENANT_MAP_STORAGE_KEY, JSON.stringify(nextMap));
  } catch {
    // Ignore storage failures; auth should still continue.
  }
}

function lookupTenantForEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return '';
  }

  try {
    const tenantMap = readSignupTenantMap();
    return tenantMap[normalizedEmail] || '';
  } catch {
    return '';
  }
}

function getOrCreatePendingSignupTenantId() {
  try {
    const storedTenantId = window.sessionStorage.getItem(PENDING_SIGNUP_TENANT_KEY);
    if (storedTenantId) {
      return storedTenantId;
    }

    const generatedTenantId = `signup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(PENDING_SIGNUP_TENANT_KEY, generatedTenantId);
    return generatedTenantId;
  } catch {
    return `signup-${Date.now().toString(36)}`;
  }
}

function resolveLoginTenantId(email) {
  return lookupTenantForEmail(email) || DEFAULT_TENANT_ID;
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
}

function redirectToDashboard(returnTo) {
  const callback = new URL(`${DASHBOARD_URL}/auth/callback`);
  callback.searchParams.set('returnTo', returnTo || '/');
  window.location.replace(callback.toString());
}

function redirectToDashboardViaSupabase(session, returnTo, tenantId) {
  if (!session?.access_token) {
    window.location.replace(`${DASHBOARD_URL}/`);
    return;
  }

  window.name = JSON.stringify({
    supabaseAccessToken: session.access_token,
    tenantId: tenantId || DEFAULT_TENANT_ID,
    role: DEFAULT_ROLE,
    returnTo: returnTo || '/',
  });

  window.location.replace(`${DASHBOARD_URL}/auth/callback`);
}

async function bridgeSupabaseSession(session, returnTo, tenantId) {
  if (!session?.access_token) {
    return false;
  }

  try {
    const response = await fetchWithTimeout(`${DASHBOARD_API_BASE}/auth/supabase-login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: session.access_token,
        tenantId: tenantId || DEFAULT_TENANT_ID,
        role: DEFAULT_ROLE,
        supabaseUrl: SUPABASE_URL,
        supabaseAnonKey: SUPABASE_ANON_KEY,
      }),
    }, 10000);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Bridge failed (${response.status}) ${errorText}`);
    }

    const responseBody = await response.json().catch(() => null);
    if (responseBody?.email) {
      rememberTenantForEmail(responseBody.email, tenantId || DEFAULT_TENANT_ID);
    }

    redirectToDashboard(returnTo || '/');
    return true;
  } catch (err) {
    console.error('Backend bridge failed', err);
  }

  return false;
}

async function handleAuthResponse(response, context) {
  const { data, error } = response;
  const mode = context?.mode || 'login';
  const password = context?.password || '';
  const email = context?.email || '';
  const tenantId = context?.tenantId || DEFAULT_TENANT_ID;

  if (error) {
    const alreadyRegistered =
      mode === 'signup' &&
      password &&
      email &&
      String(error.message || '').toLowerCase().includes('already registered');

    if (alreadyRegistered) {
      const signInResponse = await supabaseClient.auth.signInWithPassword({ email, password });
      await handleAuthResponse(signInResponse, { mode: 'login', tenantId: resolveLoginTenantId(email) });
      return;
    }

    alert(`Authentication Error: ${error.message}`);
    return;
  }
  
  if (data?.session) {
    redirectToDashboardViaSupabase(data.session, '/', tenantId);
    return;
  }

  if (mode === 'signup' && data?.user && password) {
    const email = data.user.email;
    if (email) {
      const signInResponse = await supabaseClient.auth.signInWithPassword({ email, password });
      if (signInResponse.data?.session) {
        await handleAuthResponse(signInResponse, {
          mode: 'login',
          email,
          tenantId: resolveLoginTenantId(email),
        });
        return;
      }

      if (signInResponse.error) {
        alert('Account created. Please verify your email if required, then log in.');
        return;
      }
    }
  }

  if (data?.user) {
    alert('Please check your email to confirm your account!');
  }
}

// ---------------------------------------------
// 1. Setup Standard Email/Password Forms
// ---------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  const hasSupabaseClient = await ensureSupabaseClientReady();
  if (!hasSupabaseClient) {
    console.error('Missing Supabase runtime config. Set meta tags "supabase-url" and "supabase-anon-key".');
  }

  const requireEmailAuth = () => {
    if (supabaseClient) {
      return true;
    }

    alert('Email/password auth is temporarily unavailable. Please use Google, Microsoft, or Twitter login.');
    return false;
  };

  
  // Login Form
  const loginForm = document.querySelector('#loginForm, #signupForm, #forgotForm, form');
  if (window.location.pathname.includes('login') && loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      
      if (!email || !password) return alert("Please enter both email and password.");
      if (!requireEmailAuth()) return;
      
      const response = await supabaseClient.auth.signInWithPassword({ email, password });
      await handleAuthResponse(response, { mode: 'login', email, tenantId: resolveLoginTenantId(email) });
    });
  }

  // Signup Form
  if (window.location.pathname.includes('signup') && loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Adjust to grab the appropriate query selectors
      const firstName = loginForm.querySelector('input[placeholder="First name"]')?.value || '';
      const lastName = loginForm.querySelector('input[placeholder="Last name"]')?.value || '';
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      
      if (!email || !password) return alert("Please provide email and password.");
      if (!requireEmailAuth()) return;

      const tenantId = buildSignupTenantId(email);
      rememberTenantForEmail(email, tenantId);

      const response = await supabaseClient.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim()
          }
        }
      });
      await handleAuthResponse(response, { mode: 'signup', password, email, tenantId });
    });
  }

  // Forgot Password / Reset Form
  if (window.location.pathname.includes('forgot') && loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      
      if (!email) return alert("Please enter your email.");
      if (!requireEmailAuth()) return;

      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`,
      });

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Password reset link sent to your email!');
      }
    });
  }

  // ---------------------------------------------
  // 2. Setup OAuth (Google, Microsoft, Twitter) Providers
  // ---------------------------------------------
  document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      // Prevent multiple clicks
      if (btn.disabled) return;
      
      const originalHtml = btn.innerHTML;
      const btnText = btn.innerText.trim().toLowerCase();
      let provider = (btn.dataset.provider || '').toLowerCase() || null;

      if (!provider) {
        if (btnText.includes('google')) provider = 'google';
        else if (btnText.includes('microsoft')) provider = 'microsoft';
        else if (btnText.includes('twitter')) provider = 'twitter';
      }

      if (provider) {
        try {
          // Premium UX: Loading state
          btn.disabled = true;
          btn.style.opacity = '0.7';
          btn.style.cursor = 'not-allowed';
          btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin" style="margin-right: 8px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Connecting...`;

          if (provider === 'google' || provider === 'microsoft' || provider === 'twitter') {
            const tenantId = window.location.pathname.includes('signup') ? getOrCreatePendingSignupTenantId() : DEFAULT_TENANT_ID;
            const oauthStartUrl = `${API_BASE}/auth/oauth/${provider}/start?tenantId=${encodeURIComponent(tenantId)}&role=${encodeURIComponent(DEFAULT_ROLE)}&returnTo=${encodeURIComponent('/')}`;
            window.location.assign(oauthStartUrl);
            return;
          }

          if (!supabaseClient) {
            alert('This provider is temporarily unavailable. Please try again later.');
            return;
          }

          const { error } = await supabaseClient.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${DASHBOARD_URL}/auth/callback`,
            },
          });

          if (error) {
            if (String(error.message || '').toLowerCase().includes('unsupported provider')) {
              alert('This social provider is not enabled yet. Please use email login or another provider.');
            } else {
              console.error(`[Auth] ${provider} auth error:`, error.message);
              alert(`Could not connect to ${provider}: ${error.message}`);
            }
          }
        } catch (err) {
          console.error(`[Auth] System error during ${provider} routing:`, err);
          alert('A system error occurred. Please try again.');
        } finally {
          // Restore button if redirect failed or errored
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          btn.innerHTML = originalHtml;
        }
      }
    });
  });
});
