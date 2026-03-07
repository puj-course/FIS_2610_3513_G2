  const input = document.getElementById('searchInput');
  const sugBox = document.getElementById('suggestions');

  input.addEventListener('input', async () => {
    const q = input.value.trim();

  if (q.length < 2) {
    sugBox.classList.remove('open');
    return;
  }


  const response = await fetch(
    `http://localhost:3000/ingredientes/autocomplete?q=${encodeURIComponent(q)}`
  );

  const ingredients = await response.json();

  if (!ingredients.length) {
    sugBox.classList.remove('open');
    return;
  }


  sugBox.innerHTML = ingredients.map(i => {
      const name = i.nombre; 
      const hi = name.replace(
      new RegExp(`(${q})`, 'gi'), 
      '<span class="sug-hi">$1</span>');

      return `<div class="sug-item" data-id="${i.idingrediente}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        ${hi}
      </div>`;
    }).join('');

    sugBox.classList.add('open');
  });

  // Keyboard nav
  input.addEventListener('keydown', e => {
    const items = sugBox.querySelectorAll('.sug-item');
    const active = sugBox.querySelector('.sug-item.active');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!active) items[0]?.classList.add('active');
      else { active.classList.remove('active'); (active.nextElementSibling || items[0])?.classList.add('active'); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!active) items[items.length-1]?.classList.add('active');
      else { active.classList.remove('active'); (active.previousElementSibling || items[items.length-1])?.classList.add('active'); }
    } else if (e.key === 'Enter' && active) {
      input.value = active.textContent.trim();
      sugBox.classList.remove('open');
    } else if (e.key === 'Escape') {
      sugBox.classList.remove('open');
    }
  });

  // Click suggestion
  sugBox.addEventListener('click', e => {
    const item = e.target.closest('.sug-item');
    if (item) { input.value = item.textContent.trim(); sugBox.classList.remove('open'); }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) sugBox.classList.remove('open');
  });
