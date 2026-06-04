const STORAGE_KEY = 'tv-argentina-youtube-v2';

const canalesIniciales = [
  {
    id: 'telefe',
    nombre: 'Telefe',
    url: 'https://www.youtube.com/watch?v=XhAYcYpPzTc',
    categoria: 'TV abierta',
    descripcion: 'Señal en vivo de Telefe por YouTube.',
    color: 'red'
  },
  {
    id: 'eltrece',
    nombre: 'El Trece',
    url: 'https://www.youtube.com/watch?v=oEa_wbEc-bk',
    categoria: 'TV abierta',
    descripcion: 'Señal en vivo de eltrece por YouTube.',
    color: 'orange'
  },
  {
    id: 'a24',
    nombre: 'A24',
    url: 'https://www.youtube.com/watch?v=ArKbAx1K-2U',
    categoria: 'Noticias',
    descripcion: 'Noticias en vivo durante todo el día.',
    color: 'blue'
  },
  {
    id: 'c5n',
    nombre: 'C5N',
    url: 'https://www.youtube.com/watch?v=VWhQ6xspnSc',
    categoria: 'Noticias',
    descripcion: 'Señal informativa argentina en vivo.',
    color: 'red'
  },
  {
    id: 'tn',
    nombre: 'TN',
    url: 'https://www.youtube.com/watch?v=cb12KmMMDJA',
    categoria: 'Noticias',
    descripcion: 'Todo Noticias en vivo por YouTube.',
    color: 'blue'
  },
  {
    id: 'cronica',
    nombre: 'Crónica TV',
    url: 'https://www.youtube.com/watch?v=JC7f3EUDaqw',
    categoria: 'Noticias',
    descripcion: 'Crónica TV en vivo.',
    color: 'red'
  },
  {
    id: 'a26',
    nombre: 'Canal 26',
    url: 'https://www.youtube.com/watch?v=Td0rCxY0pRs',
    categoria: 'Noticias',
    descripcion: 'Canal 26 en vivo por YouTube.',
    color: 'purple'
  }
];

let canales = cargarCanales();
let canalActivo = canales[0] || null;

const grid = document.getElementById('gridCanales');
const contador = document.getElementById('contador');
const buscador = document.getElementById('buscador');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('modalCanal');
const form = document.getElementById('formCanal');
const modalTitulo = document.getElementById('modalTitulo');
const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');
const playerFrame = document.getElementById('playerFrame');
const btnAbrirYoutube = document.getElementById('btnAbrirYoutube');

const campos = {
  id: document.getElementById('canalId'),
  nombre: document.getElementById('nombre'),
  url: document.getElementById('url'),
  categoria: document.getElementById('categoria'),
  descripcion: document.getElementById('descripcion'),
  color: document.getElementById('color')
};

document.getElementById('btnAgregar').addEventListener('click', () => abrirModal());
document.getElementById('btnCerrar').addEventListener('click', cerrarModal);
document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
document.getElementById('btnReset').addEventListener('click', restaurarCanalesIniciales);
document.getElementById('btnExportar').addEventListener('click', exportarJSON);
document.getElementById('inputImportar').addEventListener('change', importarJSON);
buscador.addEventListener('input', renderizar);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    id: campos.id.value || crypto.randomUUID(),
    nombre: campos.nombre.value.trim(),
    url: normalizarUrl(campos.url.value.trim()),
    categoria: campos.categoria.value.trim() || 'Sin categoría',
    descripcion: campos.descripcion.value.trim(),
    color: campos.color.value
  };

  const existe = canales.some(c => c.id === data.id);
  canales = existe ? canales.map(c => c.id === data.id ? data : c) : [data, ...canales];
  guardarCanales();
  canalActivo = data;
  cerrarModal();
  renderizar();
  reproducirCanal(data.id);
});

function cargarCanales() {
  const guardados = localStorage.getItem(STORAGE_KEY);
  if (!guardados) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canalesIniciales));
    return canalesIniciales;
  }
  try {
    const parsed = JSON.parse(guardados);
    return Array.isArray(parsed) && parsed.length ? parsed : canalesIniciales;
  } catch {
    return canalesIniciales;
  }
}

function guardarCanales() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canales));
}

function renderizar() {
  const texto = buscador.value.toLowerCase().trim();
  const filtrados = canales.filter(c =>
    [c.nombre, c.categoria, c.descripcion, c.url].join(' ').toLowerCase().includes(texto)
  );

  contador.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'canal' : 'canales'}`;
  emptyState.classList.toggle('hidden', filtrados.length > 0);

  grid.innerHTML = filtrados.map(canal => `
    <article class="card ${canal.color || 'red'} ${canalActivo?.id === canal.id ? 'active' : ''}">
      <div class="cardMenu">
        <button class="iconBtn" title="Editar" onclick="editarCanal('${canal.id}')">✎</button>
        <button class="iconBtn" title="Eliminar" onclick="eliminarCanal('${canal.id}')">×</button>
      </div>
      <span class="badge">${escapeHTML(canal.categoria || 'Sin categoría')}</span>
      <h3>${escapeHTML(canal.nombre)}</h3>
      <p>${escapeHTML(canal.descripcion || 'Sin descripción.')}</p>
      <div class="cardActions">
        <button class="btn primary small" onclick="reproducirCanal('${canal.id}')">Ver en panel</button>
        <a class="btn secondary small" href="${escapeAttr(canal.url)}" target="_blank" rel="noopener">YouTube</a>
      </div>
    </article>
  `).join('');
}

window.reproducirCanal = (id) => {
  const canal = canales.find(c => c.id === id);
  if (!canal) return;
  canalActivo = canal;
  const embed = convertirAEmbed(canal.url);
  playerTitle.textContent = canal.nombre;
  playerMeta.textContent = `${canal.categoria || 'Sin categoría'} · ${canal.descripcion || 'Señal de YouTube'}`;
  playerFrame.src = embed;
  btnAbrirYoutube.href = canal.url;
  renderizar();
  document.getElementById('playerBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function convertirAEmbed(url) {
  const videoId = obtenerVideoId(url);
  if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  return url;
}

function obtenerVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/', '');
    if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
    const match = parsed.pathname.match(/\/embed\/([^/?]+)/);
    if (match) return match[1];
  } catch {}
  return null;
}

function abrirModal(canal = null) {
  modalTitulo.textContent = canal ? 'Editar canal' : 'Agregar canal';
  campos.id.value = canal?.id || '';
  campos.nombre.value = canal?.nombre || '';
  campos.url.value = canal?.url || '';
  campos.categoria.value = canal?.categoria || '';
  campos.descripcion.value = canal?.descripcion || '';
  campos.color.value = canal?.color || 'red';
  modal.showModal();
}

function cerrarModal() {
  form.reset();
  campos.id.value = '';
  modal.close();
}

window.editarCanal = (id) => {
  const canal = canales.find(c => c.id === id);
  if (canal) abrirModal(canal);
};

window.eliminarCanal = (id) => {
  const canal = canales.find(c => c.id === id);
  if (!canal) return;
  if (confirm(`¿Eliminar el canal "${canal.nombre}"?`)) {
    canales = canales.filter(c => c.id !== id);
    if (canalActivo?.id === id) canalActivo = canales[0] || null;
    guardarCanales();
    renderizar();
    if (canalActivo) window.reproducirCanal(canalActivo.id);
  }
};

function restaurarCanalesIniciales() {
  if (!confirm('Esto reemplazará tus canales actuales por los canales argentinos cargados. ¿Continuar?')) return;
  canales = canalesIniciales.map(c => ({ ...c }));
  canalActivo = canales[0];
  guardarCanales();
  renderizar();
  window.reproducirCanal(canalActivo.id);
}

function exportarJSON() {
  const blob = new Blob([JSON.stringify(canales, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'canales-tv-argentina-youtube.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error('Formato inválido');
      canales = data.map(c => ({
        id: c.id || crypto.randomUUID(),
        nombre: c.nombre || 'Sin nombre',
        url: normalizarUrl(c.url || '#'),
        categoria: c.categoria || 'Sin categoría',
        descripcion: c.descripcion || '',
        color: c.color || 'red'
      }));
      canalActivo = canales[0] || null;
      guardarCanales();
      renderizar();
      if (canalActivo) window.reproducirCanal(canalActivo.id);
    } catch {
      alert('No pude importar el archivo. Revisá que sea un JSON válido.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function normalizarUrl(url) {
  if (!url) return '#';
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

function escapeHTML(texto = '') {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(texto = '') {
  return escapeHTML(texto).replaceAll('`', '&#096;');
}

renderizar();
if (canalActivo) window.reproducirCanal(canalActivo.id);
