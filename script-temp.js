// ----------------------------------------------------
// Liquid Button initialization
// ----------------------------------------------------
document.querySelectorAll('.btn-liquid').forEach(btn => {
  if (btn.querySelector('.wave-container')) return;

  const text = btn.textContent.trim();
  btn.textContent = '';
  
  const textContainer = document.createElement('span');
  textContainer.className = 'btn-text-container';
  textContainer.style.position = 'relative';
  textContainer.style.zIndex = '2';
  
  Array.from(text).forEach((char, i) => {
    const span = document.createElement('span');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.className = 'char';
    span.style.setProperty('--char-index', i);
    const middle = text.length / 2;
    const offset = (i - middle) / middle; 
    span.style.setProperty('--char-offset', offset);
    textContainer.appendChild(span);
  });
  
  btn.appendChild(textContainer);
  
  const waveContainer = document.createElement('div');
  waveContainer.className = 'wave-container';
  const wave1 = document.createElement('div');
  wave1.className = 'wave';
  const wave2 = document.createElement('div');
  wave2.className = 'wave';
  
  waveContainer.appendChild(wave1);
  waveContainer.appendChild(wave2);
  btn.appendChild(waveContainer);

  // Handle reverse animation on mouse leave
  btn.addEventListener('mouseenter', () => {
    btn.classList.remove('is-leaving');
    btn.classList.add('is-hovering');
  });

  btn.addEventListener('mouseleave', () => {
    btn.classList.remove('is-hovering');
    btn.classList.add('is-leaving');
    // Remove leaving class after animation completes (approx 600ms)
    setTimeout(() => {
      btn.classList.remove('is-leaving');
    }, 600);
  });
});
