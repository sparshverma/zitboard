const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'script.js');
let scriptContent = fs.readFileSync(filePath, 'utf8');

const regex = /\/\/\s*Dark Mode Toggle\s*&\s*Ripple Event.*?(\/\/\s*Mobile Menu Toggle Logic)/s;

const replacement = \// Dark Mode Toggle & Ripple Event (View Transitions)
  // ----------------------------------------------------
  const themeBtns = document.querySelectorAll('.theme-toggle');
  const iconSuns = document.querySelectorAll('.icon-sun');
  const iconMoons = document.querySelectorAll('.icon-moon');

  function applyTheme(isDark) {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    iconSuns.forEach(sun => {
      sun.style.display = isDark ? 'none' : 'block';
    });
    iconMoons.forEach(moon => {
      moon.style.display = isDark ? 'block' : 'none';
    });
  }

  // Initialize icon state on load
  if (document.documentElement.dataset.theme === 'dark') {
    iconSuns.forEach(sun => { sun.style.display = 'none'; });
    iconMoons.forEach(moon => { moon.style.display = 'block'; });
  }

  if (themeBtns.length > 0) {
    themeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const isDark = document.documentElement.dataset.theme !== 'dark';

        // Fallback for browsers that don't support View Transitions
        if (!document.startViewTransition) {
          applyTheme(isDark);
          return;
        }

        // Get click coords for the "waterfall/ripple" center
        // Support touch events if e.clientX/Y are undefined
        let x = e.clientX;
        let y = e.clientY;
        if(x === undefined || y === undefined) {
           const rect = btn.getBoundingClientRect();
           x = rect.left + rect.width / 2;
           y = rect.top + rect.height / 2;
        }

        // Calculate the distance to the furthest corner to ensure full screen cover
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );
    
        const transition = document.startViewTransition(() => {
          applyTheme(isDark);
        });

        transition.ready.then(() => {
          const clipPath = [
            \\\circle(0px at \px \px)\\\,
            \\\circle(\px at \px \px)\\\
          ];

          document.documentElement.animate(
            {
              clipPath: isDark ? clipPath : [...clipPath].reverse(),
            },
            {
              duration: 600,
              easing: "ease-in",
              pseudoElement: isDark ? "::view-transition-new(root)" : "::view-transition-old(root)"
            }
          );
        });
      });
    });
  }

  // ----------------------------------------------------
  \;

if(regex.test(scriptContent)) {
  scriptContent = scriptContent.replace(regex, replacement);
  fs.writeFileSync(filePath, scriptContent, 'utf8');
  console.log('Successfully fixed Dark Mode logical mapping.');
} else {
  console.log('Regex did NOT match. Need manual fallback.');
}
