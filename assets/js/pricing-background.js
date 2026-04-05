document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const bubbles = [];
  const numBubbles = window.innerWidth < 768 ? 56 : 100;
  let width = 0;
  let height = 0;
  let scrollY = window.scrollY || 0;
  let devicePixelRatio = window.devicePixelRatio || 1;

  function resize() {
    devicePixelRatio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * devicePixelRatio);
    canvas.height = Math.round(height * devicePixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY || 0;
  }, { passive: true });

  resize();

  for (let i = 0; i < numBubbles; i += 1) {
    bubbles.push({
      x: Math.random() * 2000 - 1000,
      y: Math.random() * 2000 - 1000,
      z: Math.random() * 800 + 200,
      layerType: Math.floor(Math.random() * 3),
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.dataset.theme === 'dark';
    const slate = isDark ? 'rgba(241, 245, 249, 0.42)' : 'rgba(31, 42, 51, 0.56)';
    const teal = isDark ? 'rgba(87, 207, 192, 0.54)' : 'rgba(45, 180, 165, 0.72)';
    const purple = isDark ? 'rgba(157, 142, 232, 0.5)' : 'rgba(125, 107, 219, 0.72)';
    const fov = 400;

    for (const bubble of bubbles) {
      let z = bubble.z - scrollY * 0.7;

      while (z < 10) z += 1000;
      while (z > 1010) z -= 1000;

      const scale = fov / z;
      const x2d = bubble.x * scale + width / 2;
      const y2d = bubble.y * scale + height / 2;
      const time = performance.now() / 1500;
      const floatX = x2d + Math.sin(time + bubble.x / 100) * 20 * scale;
      const floatY = y2d + Math.cos(time + bubble.y / 100) * 20 * scale;

      if (floatX < 0 || floatX > width || floatY < 0 || floatY > height) {
        continue;
      }

      const radius = Math.max(1.5, 4.5 * scale);
      ctx.beginPath();
      ctx.arc(floatX, floatY, radius, 0, Math.PI * 2);
      ctx.fillStyle = bubble.layerType === 1 ? teal : bubble.layerType === 2 ? purple : slate;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
});
