'use strict';

(() => {
  const KEY = 'mochila-invisible-prototipo-v1';
  const defaults = () => ({ version: 1, profile: null, session: false, requests: [], volunteer: null, draft: {}, preferences: { contact: true, motion: false } });
  const memory = defaults();
  let persistent = true;
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    state = saved && saved.version === 1 && Array.isArray(saved.requests) ? { ...defaults(), ...saved } : defaults();
  } catch { state = memory; persistent = false; }
  let step = 0;
  let authTab = 'register';
  let submitting = false;
  let toastTimeout;
  const main = document.getElementById('main');
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const path = () => location.hash.slice(1) || 'inicio';
  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    menu: '<path d="M5 7h14M5 12h14M5 17h9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    exchange: '<path d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4"/>',
    heart: '<path d="m12 21-8-8a5.5 5.5 0 0 1 8-7.5A5.5 5.5 0 0 1 20 13Z"/>',
    hand: '<path d="M3 15h4l3 2h6l5-5M3 21h4l3-2h7l5-6a2 2 0 0 0-3-2l-3 3M8 13l3-5a2 2 0 0 1 3 0l3 5M10 8l2-4 2 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    back: '<path d="m14 6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2"/>',
    leaf: '<path d="M20 3c0 12-3 18-11 17C1 19 2 7 20 3Z"/><path d="M4 21 16 8"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    file: '<path d="M14 3H5v18h14V8Z"/><path d="M14 3v5h5M8 12h8M8 16h6"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'
  };
  const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.heart}</svg>`;
  const hydrateIcons = () => {
    document.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = icon(node.dataset.icon); });
    document.getElementById('menu-button').innerHTML = icon('menu');
  };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { persistent = false; toast('El navegador conserva esta prueba solo durante la sesión.'); }
  }
  function toast(message) {
    const node = document.getElementById('toast');
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { node.hidden = true; }, 5000);
  }
  function go(route) {
    if (path() === route) render();
    else location.hash = route;
  }
  function notice() {
    return `<div class="demo-notice">${icon('info')}<span>Estás probando el piloto. Los formularios se guardan en este dispositivo; puedes usar datos ficticios.</span></div>`;
  }
  function back(route = 'inicio', label = 'Volver al inicio') {
    return `<a class="back" href="#${route}">${icon('back')}${label}</a>`;
  }
  function intro(title, description, eyebrow = '') {
    return `<div class="page-intro">${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<h1>${title}</h1><p>${description}</p></div>`;
  }
  function aside() {
    return `<aside class="side-panel">${icon('leaf')}<h3>Un respiro también es cuidar.</h3><p>El piloto propone un turno de cuatro horas para que recuperes tiempo para ti.</p><ul><li>Revisión de tus necesidades.</li><li>Consentimiento de las personas involucradas.</li><li>Coordinación de un turno y de los apoyos necesarios.</li></ul><small>La disponibilidad se confirma después de la evaluación del equipo.</small></aside>`;
  }
  function field(name, label, options = {}) {
    const { type = 'text', value = '', required = true, placeholder = '', hint = '', autocomplete = '', max = 120 } = options;
    return `<div class="field"><label for="${name}">${label}${required ? ' <span class="required" aria-label="obligatorio">*</span>' : ''}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${type === 'text' || type === 'tel' || type === 'email' ? `maxlength="${max}"` : ''} ${type === 'date' ? `min="${today()}"` : ''} ${placeholder ? `placeholder="${esc(placeholder)}"` : ''} ${hint ? `aria-describedby="${name}-hint"` : ''}>${hint ? `<small id="${name}-hint">${hint}</small>` : ''}</div>`;
  }
  function select(name, label, choices, value = '', required = true) {
    return `<div class="field"><label for="${name}">${label}${required ? ' <span class="required" aria-label="obligatorio">*</span>' : ''}</label><select id="${name}" name="${name}" ${required ? 'required' : ''}><option value="">Selecciona una opción</option>${choices.map((choice) => `<option ${choice === value ? 'selected' : ''}>${esc(choice)}</option>`).join('')}</select></div>`;
  }
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function formatDate(value) {
    if (!value) return 'Por coordinar';
    return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
  }
  function home() {
    return `<div class="page home-page"><section class="hero"><div class="hero-copy"><div class="eyebrow">${icon('heart')} Un respiro para quienes cuidan</div><h1>Tú cuidas.<br><span>También mereces<br>apoyo.</span></h1><p>Cuidar a alguien que amas ocupa mucho de ti. Pedir un relevo puede devolverte tiempo para descansar, hacer tus cosas y volver a encontrarte.</p><div class="hero-actions"><a class="button" href="#solicitar">${icon('hand')}Solicitar un relevo</a><a class="link-button" href="#voluntariado">${icon('heart')}Quiero ser voluntario</a></div><p class="hero-note">Un turno de cuatro horas, previa evaluación y coordinación del equipo.</p></div><div class="hero-visual"><div class="hero-image"><img src="assets/cuidado.jpg" alt="Una mujer comparte un momento de descanso mientras otras personas la acompañan" width="1280" height="720" fetchpriority="high"></div><p class="hero-caption">Un poco de tiempo.<br>Un respiro para ti.</p><div class="hours-tag"><span>${icon('clock')}</span><span><strong>4 horas de relevo</strong><small>Tiempo para volver a ti.</small></span></div></div></section><section class="process"><div class="section-line"><h2>Pedir apoyo empieza aquí.</h2><a class="link-button" href="#como-funciona">Cómo funciona</a></div><div class="process-grid"><article class="process-item"><span class="step-number">1</span><div><h3>Cuéntanos qué necesitas</h3><p>Completa una solicitud con tus datos y las necesidades de apoyo de tu familiar.</p></div></article><article class="process-item"><span class="step-number">2</span><div><h3>Coordinamos contigo</h3><p>El equipo revisa la solicitud y conversa contigo para acordar el relevo.</p></div></article><article class="process-item"><span class="step-number">3</span><div><h3>Recupera tiempo para ti</h3><p>Una persona capacitada acompaña a tu familiar durante el turno acordado.</p></div></article></div></section><section class="help-strip">${icon('heart')}<div><h3>Compartir el cuidado también está en tus manos.</h3><p>Tu tiempo puede darle un respiro a alguien más.</p></div><a class="link-button" href="#voluntariado">Conoce el voluntariado</a></section></div>`;
  }

  function supportChoices() {
    const selected = state.draft.supports || [];
    return `<fieldset><legend>¿Qué apoyos necesita tu familiar? <span class="required">*</span></legend><div class="choice-grid">${['Acompañamiento', 'Movilidad', 'Alimentación', 'Comunicación', 'Rutinas y actividades', 'Por definir con el equipo'].map((s) => `<label class="choice"><input type="checkbox" name="supports" value="${s}" ${selected.includes(s) ? 'checked' : ''}>${s}</label>`).join('')}</div><p class="input-hint" style="margin-top:10px">Puedes elegir varias opciones. El equipo revisará contigo los apoyos necesarios.</p></fieldset>`;
  }
  function scheduleChoices(name, values, selected, radio = false) {
    return `<div class="choice-grid">${values.map((value) => `<label class="choice"><input type="${radio ? 'radio' : 'checkbox'}" name="${name}" value="${esc(value)}" ${[].concat(selected || []).includes(value) ? 'checked' : ''} ${radio ? 'required' : ''}>${esc(value)}</label>`).join('')}</div>`;
  }
  const hours = ['Mañana · 08:00–12:00', 'Tarde · 13:00–17:00', 'Horario flexible'];

  function requestForm() {
    const draft = { ...((state.profile && state.session) ? state.profile : {}), ...state.draft };
    const titles = ['Empecemos por ti.', 'Conozcamos el cuidado.', 'Elige tus preferencias.', 'Revisa tu solicitud.'];
    const descriptions = ['Estos datos permitirían al equipo contactarte y coordinar el siguiente paso.', 'Cada persona tiene necesidades distintas. Cuéntanos los apoyos que serían importantes durante el turno.', 'Comparte cuándo te vendría bien un respiro. El equipo debe confirmar la disponibilidad.', 'Comprueba los datos antes de guardar tu solicitud de prueba.'];
    let content;
    if (step === 0) content = `<div class="field-grid">${field('name', 'Tu nombre', { value: draft.name, autocomplete: 'name', placeholder: 'Nombre y apellido' })}${field('phone', 'Celular', { value: draft.phone, type: 'tel', autocomplete: 'tel', placeholder: '09 1234 5678', hint: 'Incluye el código de país si corresponde.', max: 24 })}</div><div class="field-grid">${field('email', 'Correo electrónico', { value: draft.email, type: 'email', autocomplete: 'email', placeholder: 'nombre@correo.com' })}${field('city', 'Ciudad o cantón', { value: draft.city, placeholder: 'Por ejemplo, Guayaquil', autocomplete: 'address-level2' })}</div>`;
    if (step === 1) content = `<div class="field-grid">${select('relationship', 'Tu relación con la persona', ['Madre o padre', 'Hija o hijo', 'Nieta o nieto', 'Pareja', 'Hermana o hermano', 'Otro familiar', 'Persona cercana'], draft.relationship)}${select('age', 'Edad de tu familiar', ['Menor de 18 años', 'De 18 a 64 años', '65 años o más'], draft.age)}</div><div style="height:24px"></div>${supportChoices()}<div class="field"><label for="notes">Algo más que el equipo deba conocer <span class="muted">(opcional)</span></label><textarea id="notes" name="notes" maxlength="600" placeholder="Por ejemplo, sus rutinas o cómo prefiere comunicarse.">${esc(draft.notes)}</textarea><small>Un resumen ayudará a orientar la conversación de evaluación.</small></div>`;
    if (step === 2) content = `${field('date', 'Fecha que te vendría bien', { type: 'date', value: draft.date, hint: 'Es una preferencia. La fecha se acuerda después de la evaluación.' })}<fieldset><legend>¿En qué momento del día? <span class="required">*</span></legend>${scheduleChoices('slot', hours, draft.slot, true)}</fieldset><label class="consent"><input type="checkbox" name="flexible" ${draft.flexible ? 'checked' : ''}><span>También puedo considerar otra fecha que proponga el equipo.</span></label><div class="summary-check">${icon('clock')} El piloto propone turnos de <strong>cuatro horas</strong>. La duración y los apoyos se revisan contigo.</div>`;
    if (step === 3) content = `${review(draft)}<label class="consent"><input type="checkbox" name="consent" required><span>Entiendo que el relevo requiere evaluación, coordinación y consentimiento de las personas involucradas. Autorizo el uso de estos datos para gestionar esta solicitud de prueba.</span></label><label class="consent"><input type="checkbox" name="localConsent" required><span>Entiendo que esta demostración guarda la solicitud en este dispositivo. <a href="#privacidad">Ver cómo se guardan los datos</a>.</span></label>`;
    return `<div class="page">${back()}${intro('Un relevo empieza<br>con una conversación.', 'Cuéntanos qué necesitas. Te acompañamos paso a paso.')}<div class="work-grid"><section class="panel">${notice()}<div class="progress-meta"><span>Paso ${step + 1} de 4</span><span>${['Tus datos', 'El cuidado', 'Disponibilidad', 'Revisión'][step]}</span></div><div class="progress-track" aria-label="Paso ${step + 1} de 4">${[0, 1, 2, 3].map((i) => `<span class="${i <= step ? 'done' : ''}"></span>`).join('')}</div><h2 class="form-heading">${titles[step]}</h2><p class="form-description">${descriptions[step]}</p><div class="validation" id="form-error" role="alert" hidden></div><form id="request-form">${content}<div class="form-actions">${step > 0 ? '<button class="button secondary" type="button" data-action="previous-step">Anterior</button>' : '<span class="input-hint">* Datos obligatorios</span>'}<button class="button" type="submit">${step === 3 ? 'Guardar solicitud de prueba' : 'Continuar'}</button></div></form></section>${aside()}</div></div>`;
  }
  function review(draft, editable = true) {
    const groups = [
      ['Contacto', 0, [['Nombre', draft.name], ['Celular', draft.phone], ['Correo', draft.email], ['Ciudad', draft.city]]],
      ['Necesidades de apoyo', 1, [['Relación', draft.relationship], ['Edad', draft.age], ['Apoyos', (draft.supports || []).join(', ')], ...(draft.notes ? [['Comentario', draft.notes]] : [])]],
      ['Preferencias de horario', 2, [['Fecha', formatDate(draft.date)], ['Horario', draft.slot], ['Otra fecha', draft.flexible ? 'Puede considerar otra fecha' : 'Prefiere la fecha indicada']]]
    ];
    return groups.map(([title, number, values]) => `<section class="review-group"><div class="review-heading"><h3>${title}</h3>${editable ? `<button class="text-button" type="button" data-action="edit-step" data-step="${number}">Editar</button>` : ''}</div><dl class="review-list">${values.map(([label, value]) => `<dt>${label}</dt><dd>${esc(value || 'Por completar')}</dd>`).join('')}</dl></section>`).join('');
  }
  function timeline() {
    return `<ol class="timeline"><li class="done"><span class="timeline-symbol">${icon('check')}</span><div><h3>Solicitud guardada</h3><p>Completaste el formulario de esta demostración.</p></div></li><li class="current"><span class="timeline-symbol">2</span><div><h3>Evaluación del equipo</h3><p>En el piloto, el equipo revisaría las necesidades y conversaría contigo.</p></div></li><li><span class="timeline-symbol">3</span><div><h3>Coordinación y consentimiento</h3><p>Se acuerdan la persona de apoyo, el horario y las condiciones del relevo.</p></div></li><li><span class="timeline-symbol">4</span><div><h3>Tu turno de relevo</h3><p>Una persona capacitada acompaña a tu familiar durante el tiempo acordado.</p></div></li></ol>`;
  }
  function requestDetail(id, success = false) {
    const entry = state.requests.find((r) => r.id === id);
    if (!entry) return missing();
    return `<div class="page">${back('mis-relevos', 'Mis relevos')}<div class="work-grid"><section class="panel">${success ? `<div class="success-top"><span class="success-icon">${icon('check')}</span><div><h2>Ya diste el primer paso.</h2><p class="muted" style="font-size:.875rem;margin-top:8px">Tu solicitud de prueba está guardada.</p></div></div>` : '<h2>Tu solicitud de relevo</h2>'}<div class="request-top"><span class="status-tag">Pendiente de evaluación</span><small class="muted">${esc(entry.id)}</small></div><p class="muted" style="font-size:.85rem">${formatDate(entry.createdAt)} · ${esc(entry.city)}</p>${timeline()}<details><summary>Ver los datos de mi solicitud</summary><div style="margin-top:20px">${review(entry, false)}</div></details><div class="demo-notice" style="margin-top:24px;margin-bottom:0">${icon('info')}<span>El estado es parte de la demostración. Al activar el piloto, la evaluación la realizará el equipo responsable.</span></div><div class="button-row"><button class="button secondary" data-action="download-request" data-id="${esc(id)}">${icon('file')}Descargar resumen</button><a class="button" href="#mis-relevos">Mis relevos</a></div></section>${aside()}</div></div>`;
  }
  function requests() {
    const cards = [...state.requests].reverse().map((r) => `<a class="request-card" href="#solicitud/${encodeURIComponent(r.id)}"><div class="request-top"><span class="status-tag">Pendiente de evaluación</span><span class="date">${formatDate(r.createdAt)}</span></div><h3>Un respiro para ${esc(r.name.split(' ')[0])}</h3><p>${icon('calendar')} ${formatDate(r.date)} · ${esc(r.slot)}</p><p>${icon('pin')} ${esc(r.city)} · Turno propuesto de 4 horas</p></a>`).join('');
    return `<div class="page">${intro('Tus relevos, paso a paso.', 'Aquí puedes consultar las solicitudes que guardaste en este dispositivo.')}<div class="work-grid"><section>${cards || `<div class="panel empty">${icon('exchange')}<h2>Tu primer respiro<br>puede empezar aquí.</h2><p>Cuando completes tu solicitud, podrás revisar sus datos y conocer los siguientes pasos.</p><a class="button" href="#solicitar">Solicitar un relevo</a></div>`}${state.requests.length ? '<a class="button secondary" href="#solicitar">Solicitar otro relevo</a>' : ''}${state.volunteer ? `<section class="panel" style="margin-top:22px"><span class="status-tag success">Postulación guardada</span><h3 style="margin-top:16px">Tu interés en el voluntariado</h3><p class="body-copy" style="margin-top:12px">El siguiente paso del piloto sería la revisión de tu disponibilidad y la capacitación.</p><a class="link-button" href="#voluntariado">Ver postulación</a></section>` : ''}</section>${aside()}</div></div>`;
  }

  function volunteer() {
    if (state.volunteer) {
      const v = state.volunteer;
      return `<div class="page">${back()}<section class="panel" style="max-width:700px;margin:auto"><div class="success-top"><span class="success-icon">${icon('heart')}</span><div><h2>Gracias por querer estar.</h2><p class="muted" style="margin-top:8px">Tu postulación de prueba está guardada.</p></div></div><p class="body-copy">En el piloto, el equipo se pondría en contacto para conocer tu experiencia, revisar tu disponibilidad y coordinar la capacitación.</p><dl class="review-list" style="margin-top:25px"><dt>Nombre</dt><dd>${esc(v.name)}</dd><dt>Ciudad</dt><dd>${esc(v.city)}</dd><dt>Disponibilidad</dt><dd>${esc(v.availability.join(', '))}</dd><dt>Horario</dt><dd>${esc(v.schedule)}</dd></dl><div class="summary-check">La participación requiere evaluación y capacitación previa.</div><div class="button-row"><a class="button" href="#inicio">Volver al inicio</a><button class="button secondary" data-action="edit-volunteer">Editar postulación</button></div></section></div>`;
    }
    const v = state.volunteerDraft || ((state.profile && state.session) ? state.profile : {});
    return `<div class="page">${back()}${intro('Tu tiempo puede<br>aligerar otra mochila.', 'Postúlate para acompañar a una familia durante un turno de relevo.', 'Voluntariado')}<div class="work-grid"><section class="panel">${notice()}<h2>Queremos conocerte.</h2><p class="form-description">La evaluación y la capacitación forman parte del proceso.</p><div id="form-error" class="validation" role="alert" hidden></div><form id="volunteer-form"><div class="field-grid">${field('name', 'Tu nombre', { value: v.name, autocomplete: 'name' })}${field('email', 'Correo electrónico', { value: v.email, type: 'email', autocomplete: 'email' })}</div><div class="field-grid">${field('phone', 'Celular', { value: v.phone, type: 'tel', autocomplete: 'tel', max: 24 })}${field('city', 'Ciudad o cantón', { value: v.city })}</div><div style="height:24px"></div>${select('experience', 'Tu experiencia acompañando a otras personas', ['He cuidado a un familiar', 'Tengo experiencia en voluntariado', 'Tengo formación relacionada con el cuidado', 'Quiero aprender y capacitarme'], v.experience)}<fieldset><legend>¿Qué días sueles tener tiempo? <span class="required">*</span></legend>${scheduleChoices('availability', ['Entre semana', 'Sábados', 'Domingos', 'Disponibilidad flexible'], v.availability)}</fieldset>${select('schedule', '¿Qué horario prefieres?', hours, v.schedule)}<label class="consent"><input type="checkbox" name="adult" required><span>Confirmo que tengo 18 años o más.</span></label><label class="consent"><input type="checkbox" name="training" required><span>Estoy de acuerdo con la evaluación y capacitación antes de participar en un relevo.</span></label><label class="consent"><input type="checkbox" name="consent" required><span>Autorizo guardar estos datos en este dispositivo como parte de la demostración del piloto.</span></label><div class="form-actions"><a class="link-button" href="#como-funciona">Cómo funciona</a><button class="button" type="submit">Guardar postulación</button></div></form></section>${aside()}</div></div>`;
  }
  function profile() {
    if (state.session && state.profile) {
      const p = state.profile;
      return `<div class="page">${intro('Un espacio para ti.', 'Tu perfil y tus preferencias para esta demostración.')}<div class="work-grid"><section class="panel"><div class="profile-intro"><span class="avatar">${esc(p.name.slice(0, 1).toUpperCase())}</span><div><h2>${esc(p.name)}</h2><p>${esc(p.email)}</p></div></div><form id="profile-form"><div class="field-grid">${field('name', 'Tu nombre', { value: p.name, autocomplete: 'name' })}${field('phone', 'Celular', { value: p.phone, type: 'tel', required: false, max: 24 })}</div><div class="field-grid">${field('email', 'Correo electrónico', { value: p.email, type: 'email', autocomplete: 'email' })}${field('city', 'Ciudad o cantón', { value: p.city, required: false })}</div><h3 style="margin:28px 0 15px">Preferencias</h3><div class="setting-row"><label for="contact">Contacto por correo<small>Preferencia para cuando el piloto esté activo.</small></label><input class="toggle" id="contact" name="contact" type="checkbox" ${state.preferences.contact ? 'checked' : ''}></div><div class="setting-row"><label for="motion">Reducir animaciones<small>Una navegación con menos movimiento.</small></label><input class="toggle" id="motion" name="motion" type="checkbox" ${state.preferences.motion ? 'checked' : ''}></div><div class="form-actions"><button class="button secondary" type="button" data-action="signout">Cerrar sesión de prueba</button><button class="button" type="submit">Guardar cambios</button></div></form><div style="margin-top:25px"><button class="text-button danger" data-action="clear-data">Borrar mis datos de este dispositivo</button></div></section><aside class="side-panel">${icon('shield')}<h3>Tu perfil, en este dispositivo.</h3><p>Esta versión permite ensayar el recorrido de la campaña. Tu perfil y las solicitudes se guardan en el navegador que estás usando.</p><a class="link-button" href="#privacidad">Sobre tus datos</a></aside></div></div>`;
    }
    return `<div class="page">${intro('Tu próximo respiro<br>también tiene un lugar.', 'Crea un perfil de prueba para completar tus datos con más facilidad.')}<div class="work-grid"><section class="panel">${notice()}<div class="tabs" role="tablist" aria-label="Acceso al perfil"><button type="button" role="tab" aria-selected="${authTab === 'register'}" class="${authTab === 'register' ? 'active' : ''}" data-action="auth-tab" data-tab="register">Crear perfil</button><button type="button" role="tab" aria-selected="${authTab === 'login'}" class="${authTab === 'login' ? 'active' : ''}" data-action="auth-tab" data-tab="login">Ya tengo perfil</button></div><div id="form-error" class="validation" role="alert" hidden></div><form id="auth-form">${authTab === 'register' ? `${field('name', 'Tu nombre', { autocomplete: 'name', value: state.profile?.name })}${field('email', 'Correo electrónico', { type: 'email', autocomplete: 'email', value: state.profile?.email })}${field('phone', 'Celular', { type: 'tel', autocomplete: 'tel', required: false, value: state.profile?.phone, max: 24 })}<label class="consent"><input type="checkbox" required name="consent"><span>Acepto guardar mi perfil de prueba en este navegador. <a href="#privacidad">Ver información sobre mis datos</a>.</span></label>` : `${field('email', 'Correo de tu perfil de prueba', { type: 'email', autocomplete: 'email', hint: 'Ingresa el correo del perfil guardado en este mismo dispositivo.' })}`}<button class="button" style="width:100%;margin-top:12px" type="submit">${authTab === 'register' ? 'Crear mi perfil de prueba' : 'Entrar a mi perfil de prueba'}</button></form><p class="input-hint" style="margin-top:20px">También puedes <a href="#solicitar">solicitar un relevo sin crear un perfil</a>.</p></section>${aside()}</div></div>`;
  }
  function how() {
    return `<div class="page">${back()}${intro('Compartir el cuidado.<br>Recuperar un respiro.', 'Así sería el recorrido del piloto de Mochila Invisible.')}<div class="work-grid"><section class="panel"><div class="intro-banner"><h2>Un turno de cuatro horas.</h2><p>Tiempo para descansar, estudiar, trabajar o atender algo importante para ti, mientras una persona capacitada acompaña a tu familiar.</p></div><ol class="timeline"><li class="done"><span class="timeline-symbol">1</span><div><h3>Nos cuentas lo que necesitas</h3><p>La solicitud reúne tus datos de contacto, las necesidades de apoyo y tus preferencias de horario.</p></div></li><li class="current"><span class="timeline-symbol">2</span><div><h3>El equipo evalúa y conversa contigo</h3><p>Se revisan los apoyos necesarios y la posibilidad de atenderlos en el piloto.</p></div></li><li><span class="timeline-symbol">3</span><div><h3>Acuerdan el relevo</h3><p>Con consentimiento de las personas involucradas, se coordinan la persona voluntaria, el horario y las condiciones.</p></div></li><li><span class="timeline-symbol">4</span><div><h3>Compartes el cuidado</h3><p>La persona capacitada acompaña a tu familiar durante el turno acordado, con el acompañamiento del equipo.</p></div></li></ol><a class="button" href="#solicitar">Solicitar un relevo</a><div class="faq" style="margin-top:30px"><h2>Lo que quizá te preguntas</h2><details><summary>¿A quién está dirigido?</summary><p>A familiares que cuidan a personas con discapacidad o con necesidades de apoyo, según la evaluación del equipo del piloto.</p></details><details><summary>¿Puedo elegir el horario?</summary><p>Puedes indicar una fecha y un horario preferidos. El equipo revisa la disponibilidad y los acuerda contigo después de la evaluación.</p></details><details><summary>¿Quién acompañaría a mi familiar?</summary><p>El piloto propone personas voluntarias evaluadas y capacitadas, con el acompañamiento de un equipo responsable.</p></details><details><summary>¿Cómo puedo ofrecer mi tiempo?</summary><p>Completa la <a href="#voluntariado">postulación de voluntariado</a>. La evaluación y la capacitación son los siguientes pasos propuestos.</p></details><details><summary>¿La campaña ya recibe solicitudes reales?</summary><p>Esta web es una demostración para presentar el piloto. Puedes recorrer los formularios y guardar solicitudes de prueba en tu dispositivo. La puesta en marcha requiere la coordinación de las organizaciones involucradas.</p></details></div></section>${aside()}</div></div>`;
  }
  function about() {
    return `<div class="page">${back()}${intro('Hagamos visible<br>el peso del cuidado.', 'Mochila Invisible · Cóndor Estudiantil 2026')}<section class="panel body-copy" style="max-width:780px"><h2>Recarga a quien carga.</h2><p>La campaña propone visibilizar el desgaste silencioso de las personas que cuidan a sus familiares y transformar la empatía en un relevo concreto.</p><p>Desde la cobertura propuesta en TC Televisión, un QR conduciría a esta web. Las familias podrían solicitar apoyo y la ciudadanía podría postular al voluntariado.</p><h2>El piloto propuesto</h2><p>La presentación plantea la participación de la Junta de Beneficencia para un programa con voluntarios capacitados, evaluación previa y consentimiento. La proyección inicial es de 12 turnos de cuatro horas, hasta 48 horas de relevo.</p><h2>Esta versión</h2><p>El sitio funciona como prototipo interactivo. Los datos se guardan en el navegador para ensayar la experiencia de solicitud y seguimiento durante la sustentación.</p><div class="button-row"><a class="button" href="#solicitar">Probar una solicitud</a><a class="button secondary" href="materiales.html">Ver pieza de televisión</a></div></section></div>`;
  }
  function privacy() {
    return `<div class="page">${back()}${intro('Tus datos, con claridad.', 'Cómo funciona el almacenamiento en esta demostración.')}<section class="panel body-copy" style="max-width:780px"><h2>Guardado en tu navegador</h2><p>El perfil, las preferencias, los borradores, las solicitudes y las postulaciones se guardan mediante el almacenamiento local del navegador de este dispositivo. Para probar el recorrido puedes utilizar datos ficticios.</p><h2>Acceso de prueba</h2><p>El acceso al perfil usa el correo que guardaste en este mismo navegador. Es una interacción de demostración. Una versión operativa necesitaría autenticación, un servicio de recepción de solicitudes y acceso para el equipo evaluador.</p><h2>Control de tus datos</h2><p>Puedes descargar el resumen de cada solicitud y eliminar los datos de esta demostración desde tu perfil. El navegador también permite borrarlos desde su configuración de almacenamiento.</p><h2>Al activar el piloto</h2><p>La organización responsable deberá definir las condiciones de tratamiento, conservación y acceso a los datos, los canales de atención y el consentimiento que corresponda antes de habilitar solicitudes reales.</p><button class="text-button danger" data-action="clear-data">Borrar datos de esta demostración</button></section></div>`;
  }
  function missing() { return `<div class="page"><div class="panel empty"><h1>Volvamos a encontrarnos.</h1><p>Esta página o solicitud no está disponible en este navegador.</p><a href="#inicio" class="button">Volver al inicio</a></div></div>`; }

  function formError(message) {
    const box = document.getElementById('form-error');
    if (!box) return;
    box.textContent = message;
    box.hidden = false;
    box.scrollIntoView({ behavior: state.preferences.motion ? 'instant' : 'smooth', block: 'center' });
  }
  function collectDraft(form) {
    const data = new FormData(form);
    if (step === 0) for (const key of ['name', 'phone', 'email', 'city']) state.draft[key] = String(data.get(key) || '').trim();
    if (step === 1) {
      for (const key of ['relationship', 'age', 'notes']) state.draft[key] = String(data.get(key) || '').trim();
      state.draft.supports = data.getAll('supports');
    }
    if (step === 2) {
      state.draft.date = data.get('date');
      state.draft.slot = data.get('slot');
      state.draft.flexible = data.has('flexible');
    }
    save();
  }
  function download(entry) {
    const text = ['MOCHILA INVISIBLE · Solicitud de prueba', '', `Referencia: ${entry.id}`, `Guardada: ${formatDate(entry.createdAt)}`, 'Estado: Pendiente de evaluación', '', `Nombre: ${entry.name}`, `Contacto: ${entry.email} / ${entry.phone}`, `Ciudad: ${entry.city}`, `Relación: ${entry.relationship}`, `Edad: ${entry.age}`, `Apoyos: ${entry.supports.join(', ')}`, `Fecha preferida: ${formatDate(entry.date)}`, `Horario preferido: ${entry.slot}`, '', 'Este resumen corresponde a una demostración guardada en este dispositivo. La evaluación y coordinación del relevo corresponden al equipo del piloto.'].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `${entry.id}.txt`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function confirmClear() {
    const dialog = document.getElementById('confirmation');
    document.getElementById('confirmation-title').textContent = '¿Borrar los datos de prueba?';
    document.getElementById('confirmation-copy').textContent = 'Se borrarán el perfil, los borradores y las solicitudes guardadas por esta web en este navegador.';
    document.getElementById('confirmation-accept').onclick = () => {
      state = defaults(); save(); dialog.close(); step = 0; go('inicio'); toast('Los datos de prueba se borraron.');
    };
    document.getElementById('confirmation-cancel').onclick = () => dialog.close();
    dialog.showModal();
  }
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (form.id === 'request-form') {
      collectDraft(form);
      if (step === 0 && state.draft.phone.replace(/\D/g, '').length < 7) return formError('Revisa el celular e incluye al menos siete dígitos.');
      if (step === 1 && !state.draft.supports.length) return formError('Selecciona al menos un apoyo para continuar.');
      if (step === 2 && state.draft.date < today()) return formError('Selecciona una fecha a partir de hoy.');
      if (step < 3) { step += 1; render(); return; }
      if (submitting) return;
      submitting = true;
      const id = `MI-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0, 6)}`;
      state.requests.push({ ...state.draft, id, createdAt: new Date().toISOString(), status: 'pending', consentAt: new Date().toISOString() });
      state.draft = {};
      save(); step = 0; submitting = false; go(`confirmacion/${id}`);
    }
    if (form.id === 'volunteer-form') {
      const availability = data.getAll('availability');
      if (!availability.length) return formError('Selecciona al menos una opción de disponibilidad.');
      if (String(data.get('phone')).replace(/\D/g, '').length < 7) return formError('Revisa tu número de celular.');
      state.volunteer = { name: data.get('name').trim(), email: data.get('email').trim(), phone: data.get('phone').trim(), city: data.get('city').trim(), experience: data.get('experience'), availability, schedule: data.get('schedule'), createdAt: new Date().toISOString() };
      delete state.volunteerDraft; save(); render();
    }
    if (form.id === 'auth-form') {
      if (authTab === 'login') {
        if (!state.profile || state.profile.email.toLowerCase() !== data.get('email').trim().toLowerCase()) return formError('Este navegador no tiene un perfil de prueba con ese correo. Puedes crear uno en la otra pestaña.');
        state.session = true;
      } else {
        state.profile = { name: data.get('name').trim(), email: data.get('email').trim(), phone: data.get('phone').trim(), city: state.profile?.city || '' };
        state.session = true;
      }
      save(); render(); toast('Tu perfil de prueba está listo.');
    }
    if (form.id === 'profile-form') {
      state.profile = { name: data.get('name').trim(), email: data.get('email').trim(), phone: data.get('phone').trim(), city: data.get('city').trim() };
      state.preferences = { contact: data.has('contact'), motion: data.has('motion') };
      save(); render(); toast('Guardamos tus preferencias.');
    }
  });
  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-action]');
    if (!control) return;
    const action = control.dataset.action;
    if (action === 'menu') {
      const menu = document.getElementById('site-menu'); menu.hidden = !menu.hidden;
      control.setAttribute('aria-expanded', String(!menu.hidden));
    }
    if (action === 'previous-step') { collectDraft(document.getElementById('request-form')); step = Math.max(0, step - 1); render(); }
    if (action === 'edit-step') { step = Number(control.dataset.step); render(); }
    if (action === 'auth-tab') { authTab = control.dataset.tab; render(); }
    if (action === 'signout') { state.session = false; save(); render(); toast('Cerraste la sesión de prueba.'); }
    if (action === 'clear-data') confirmClear();
    if (action === 'download-request') { const entry = state.requests.find((r) => r.id === control.dataset.id); if (entry) download(entry); }
    if (action === 'edit-volunteer') { state.volunteerDraft = state.volunteer; state.volunteer = null; save(); render(); }
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.header')) closeMenu(); });
  function closeMenu() {
    document.getElementById('site-menu').hidden = true;
    document.getElementById('menu-button').setAttribute('aria-expanded', 'false');
  }
  function render() {
    closeMenu();
    const route = path();
    const screens = { inicio: home, solicitar: requestForm, 'mis-relevos': requests, voluntariado: volunteer, perfil: profile, 'como-funciona': how, 'sobre-el-piloto': about, privacidad: privacy };
    const parts = route.split('/');
    main.innerHTML = parts[0] === 'solicitud' || parts[0] === 'confirmacion' ? requestDetail(decodeURIComponent(parts[1] || ''), parts[0] === 'confirmacion') : (screens[route] || missing)();
    document.querySelectorAll('[data-route]').forEach((a) => {
      const isRequest = ['solicitud', 'confirmacion', 'solicitar'].includes(parts[0]);
      const active = a.dataset.route === route || (a.dataset.route === 'mis-relevos' && isRequest);
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.body.classList.toggle('reduce-motion', !!state.preferences.motion);
    document.getElementById('motion-preference')?.remove();
    if (state.preferences.motion) { const style = document.createElement('style'); style.id = 'motion-preference'; style.textContent = '*{animation:none!important;transition:none!important}html{scroll-behavior:auto}'; document.head.append(style); }
    hydrateIcons();
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = `${({ inicio: 'Un respiro para quienes cuidan', solicitar: 'Solicitar un relevo', 'mis-relevos': 'Mis relevos', voluntariado: 'Voluntariado', perfil: 'Mi perfil', 'como-funciona': 'Cómo funciona' })[route] || 'Mochila Invisible'} · Mochila Invisible`;
    main.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', render);
  render();
  if (!persistent) toast('Esta prueba conserva los datos solo durante esta sesión.');
})();
