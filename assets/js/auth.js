/**
 * auth.js
 * Handles Supabase authentication flow (Login, Signup, OAuth, Password Reset)
 * for the ZitBoard front-end, designed to share session with Dashboard Next.js app.
 */

// We expect these configuration keys to be set either securely via environment replacement on build
// or injected here. For production, never expose sensitive admin keys, only the `ANON_KEY`.
const SUPABASE_URL = 'https://mwoixpkmqfqintiecsui.supabase.co'; // Replace with actual URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b2l4cGttcWZxaW50aWVjc3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjk4NDEsImV4cCI6MjA4OTUwNTg0MX0.SXYefSORzFwFR1f2_Qi1MU39Uxi_jlgdeVBH1Ht9b_4'; // Replace with actual Anon Key

// Initialize the Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Redirect target for successful login (Dashboard App)
const DASHBOARD_URL = 'https://app.zitboard.dev'; // Adjust to local/staging/prod url

async function handleAuthResponse(response) {
  const { data, error } = response;
  if (error) {
    alert(`Authentication Error: ${error.message}`);
    return;
  }
  
  if (data?.session) {
    // Cross-domain handoff
    const token = data.session.access_token;
    window.location.href = `${DASHBOARD_URL}/api/auth/callback?token=${token}`;
  } else if (data?.user) {
    // Some flows (like magic links or email confirm) might just return a user immediately
    alert('Please check your email to confirm your account!');
  }
}

// ---------------------------------------------
// 1. Setup Standard Email/Password Forms
// ---------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  
  // Login Form
  const loginForm = document.querySelector('form[action="login.html"], form'); // We'll infer it by page
  if (window.location.pathname.includes('login') && loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      
      if (!email || !password) return alert("Please enter both email and password.");
      
      const response = await supabaseClient.auth.signInWithPassword({ email, password });
      handleAuthResponse(response);
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

      const response = await supabaseClient.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim()
          }
        }
      });
      handleAuthResponse(response);
    });
  }

  // Forgot Password / Reset Form
  if (window.location.pathname.includes('forgot') && loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      
      if (!email) return alert("Please enter your email.");

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
      // Prevent multiple clicks
      if (btn.disabled) return;
      
      const originalHtml = btn.innerHTML;
      const btnText = btn.innerText.trim().toLowerCase();
      let provider = null;

      if (btnText.includes('google')) provider = 'google';
      else if (btnText.includes('microsoft')) provider = 'azure';
      else if (btnText.includes('twitter')) provider = 'twitter';

      if (provider) {
        try {
          // Premium UX: Loading state
          btn.disabled = true;
          btn.style.opacity = '0.7';
          btn.style.cursor = 'not-allowed';
          btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin" style="margin-right: 8px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Connecting...`;

          // Autonomous Architect: Secure API execution
          const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
              redirectTo: `${DASHBOARD_URL}/api/auth/callback`
            }
          });

          if (error) {
            console.error(`[Auth] ${provider} auth error:`, error.message);
            alert(`Could not connect to ${provider}: ${error.message}`);
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
