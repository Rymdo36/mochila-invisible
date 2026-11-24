'use strict';

(() => {
  const canvas = document.getElementById('tv-preview');
  const ctx = canvas.getContext('2d');
  const scene = new Image();
  const brand = new Image();
  let qrImage;
  let currentUrl = '';
  let qrSource = '';
  let ready = false;
  const status = document.getElementById('qr-status');
  function rounded(x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
  function render() {
    if (!ready) return;
    ctx.clearRect(0, 0, 1920, 1080);
    ctx.drawImage(scene, 0, 0, 1920, 1080);
    rounded(62, 42, 480, 64, 13, '#fff');
    ctx.fillStyle = '#2d1b43'; ctx.font = '600 25px Inter, Arial';
    ctx.fillText('MOCHILA INVISIBLE', 88, 83);
    rounded(1595, 500, 260, 312, 18, '#ffffff');
    ctx.fillStyle = '#7043a3'; ctx.font = '700 20px Inter, Arial'; ctx.textAlign = 'center';
    ctx.fillText('¿Necesitas un relevo?', 1725, 536);
    if (qrImage) ctx.drawImage(qrImage, 1630, 552, 190, 190);
    else {
      rounded(1630, 552, 190, 190, 10, '#f1e9f8');
      ctx.fillStyle = '#84639b'; ctx.font = '400 19px Inter, Arial';
      ctx.fillText('QR pendiente', 1725, 637); ctx.fillText('de publicación', 1725, 667);
    }
    ctx.font = '600 19px Inter, Arial'; ctx.fillStyle = '#2d1b43';
    ctx.fillText('Escanea y conoce el piloto.', 1725, 772);
    ctx.font = '400 16px Inter, Arial'; ctx.fillStyle = '#74627f';
    ctx.fillText('Solicita apoyo o sé voluntario.', 1725, 798);
    ctx.textAlign = 'left';
    document.getElementById('tv-print').src = canvas.toDataURL('image/png');
  }
  function setUrl(raw) {
    const error = document.getElementById('qr-error');
    error.hidden = true;
    let url;
    try {
      url = new URL(raw.trim());
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid');
      if (url.href.length > 700) throw new Error('long');
    } catch {
      error.textContent = 'Ingresa una dirección web completa, comenzando por https://.'; error.hidden = false; return;
    }
    if (typeof qrcode !== 'function') { error.textContent = 'No se pudo cargar el generador de QR. Revisa que la carpeta vendor esté junto a estos archivos.'; error.hidden = false; return; }
    currentUrl = url.href;
    const qr = qrcode(0, 'M'); qr.addData(currentUrl); qr.make();
    qrSource = qr.createSvgTag({ cellSize: 10, margin: 40, scalable: true });
    // The library emits the QR geometry; the input URL is kept out of the SVG markup.
    document.getElementById('qr-print').innerHTML = qrSource;
    document.getElementById('qr-url').textContent = currentUrl;
    status.textContent = 'QR actualizado. Escanéalo con tu celular para comprobar la dirección antes de imprimir.';
    qrImage = new Image();
    qrImage.onload = render;
    qrImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSource)}`;
    document.getElementById('download-qr').disabled = false;
    document.getElementById('download-tv').disabled = false;
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  document.getElementById('qr-form').addEventListener('submit', (event) => { event.preventDefault(); setUrl(document.getElementById('public-url').value); });
  document.getElementById('download-qr').addEventListener('click', () => { if (qrSource) download(new Blob([qrSource], { type: 'image/svg+xml' }), 'Mochila-Invisible-QR.svg'); });
  document.getElementById('download-tv').addEventListener('click', () => { if (qrImage) canvas.toBlob((blob) => download(blob, 'Mochila-Invisible-TC-con-QR.png')); });
  document.getElementById('print-sheet').addEventListener('click', () => window.print());
  document.getElementById('qr-print').innerHTML = '<span class="qr-pending">QR pendiente<br>de publicación</span>';
  scene.onload = async () => { await document.fonts.ready; ready = true; render(); };
  scene.src = window.MOCHILA_TV_IMAGE || 'assets/noticiero-tc.jpg';
  const configured = window.MOCHILA_CONFIG?.publicUrl || '';
  if (configured) { document.getElementById('public-url').value = configured; setUrl(configured); }
})();
