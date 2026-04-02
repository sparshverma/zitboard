const fs = require('fs');

let content = fs.readFileSync('script.js', 'utf8');

const regex = /\/\/\s*Dark Mode Toggle & Ripple Event \(View Transitions\)[\s\S]*?(?=\/\/\s*1\)\s*Intersection Observer|\Z)/;

const newLogic = \// Dark Mode Toggle & Ripple Event (View Transitions)
// ----------------------------------------------------
const themeBtns = document.querySelectorAll('.theme-toggle');
const iconSuns = document.querySelectorAll('.icon-sun');
const iconMoons = document.querySelectorAll('.icon-moon');

function applyTheme(isDark) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  iconSuns.forEach(sun => { sun.style.display = isDark ? 'none' : 'block'; });
  iconMoons.forEach(moon => { moon.style.display = isDark ? 'block' : 'none'; });
}

if (document.documentElement.dataset.theme === 'dark') {
  applyTheme(true);
} else {
  applyTheme(false);
}

if (themeBtns.length > 0) {
  themeBtns.forEach(themeBtn => {
    themeBtn.addEventListener('click', (e) => {
      const isDark = document.documentElement.dataset.theme !== 'dark';

      if (!document.startViewTransition) {
        applyTheme(isDark);
        return;
      }

      let x = e.clientX;
      let y = e.clientY;

      if(x === undefined || y === undefined || (x===0 && y===0)) {
         const rect = themeBtn.getBoundingClientRect();
         x = rect.left + rect.width / 2;
         y = rect.top + rect.height / 2;
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        applyTheme(isDark);
      });

      transition.ready.then(() => {
        const clipPath = [
          \circle(0px at \px \px)\,
          \circle(\px at \px \px)\
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

\;

if(content.includes('Dark Mode Toggle')) {
  content = content.replace(regex, newLogic);
  fs.writeFileSync('script.js', content, 'utf8');
}
