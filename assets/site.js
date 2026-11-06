/* Fons · menú en celular y formulario de contacto */
(function () {
  "use strict";

  // Dirección del Apps Script que recibe el formulario (se completa al configurar Google Workspace).
  // Mientras esté vacía, el formulario funciona en modo vista previa y no envía nada.
  var FONS_ENDPOINT = "https://script.google.com/macros/s/AKfycbx322vhZQkLqYQH44AheV5aopjGfseFN7mz_vLSVFItBtYkFe3BhpKUe_NKbex3sBmr/exec";
  var CORREO = "hola@fons.cl";
  var HORARIO = "lunes a viernes, de 9:00 a 17:00, salvo festivos";
  // Raíz del sitio, deducida de dónde se cargó este archivo (sirve igual en fons.cl y en la vista previa).
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/assets\/site\.js.*$/, "") : "/";
  })();

  /* ---------------- menú ---------------- */
  function setupMenu() {
    var burger = document.querySelector(".fons-burger");
    var links = document.querySelector(".fons-links");
    if (!burger || !links) return;
    var logo = document.querySelector('nav a[aria-label="Fons, inicio"]');
    var menu = document.createElement("div");
    menu.className = "fons-menu";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "Menú");
    var top = document.createElement("div");
    top.className = "fons-menu-top";
    if (logo) top.appendChild(logo.cloneNode(true));
    var close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Cerrar menú");
    close.textContent = "×";
    top.appendChild(close);
    menu.appendChild(top);
    Array.prototype.forEach.call(links.querySelectorAll("a"), function (a) {
      var c = document.createElement("a");
      c.href = a.getAttribute("href");
      c.textContent = a.textContent;
      if ((a.getAttribute("style") || "").indexOf("background") > -1) c.className = "cta";
      menu.appendChild(c);
    });
    if (location.pathname.indexOf("funcionarios/") === -1) {
      var urg = document.createElement("a");
      urg.href = BASE + "funcionarios/#cargos";
      urg.className = "cta-alt";
      urg.textContent = "Me notificaron cargos";
      menu.appendChild(urg);
    }
    document.body.appendChild(menu);
    function open() { menu.classList.add("open"); burger.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; close.focus(); }
    function shut() { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
    burger.addEventListener("click", open);
    close.addEventListener("click", shut);
    menu.addEventListener("click", function (e) { if (e.target.tagName === "A") shut(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") shut(); });
  }

  /* ---------------- formulario ---------------- */
  var IC = {
    grupo: '<circle cx="8" cy="8" r="3"/><circle cx="15" cy="9" r="2.5"/><path d="M2.5 18c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M13.5 13.7c2.4-.3 4.6.9 5.5 3.8"/>',
    persona: '<circle cx="11" cy="7.5" r="3.5"/><path d="M4 19c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    edificio: '<path d="M4 19V5l7-3 7 3v14M2 19h18M8 9h1M13 9h1M8 13h1M13 13h1"/>',
    alerta: '<path d="M11 3 2 19h18L11 3Z"/><path d="M11 9v4M11 16h.01"/>',
    reloj: '<circle cx="11" cy="11" r="8"/><path d="M11 6.5V11l3 2"/>',
    no: '<circle cx="11" cy="11" r="8"/><path d="M7.5 11h7"/>',
    duda: '<circle cx="11" cy="11" r="8"/><path d="M8.8 8.6a2.3 2.3 0 0 1 4.4 1c0 1.5-2.2 1.9-2.2 3.2M11 15.8h.01"/>'
  };
  function icon(name) {
    return '<span class="ic"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#8A5A34" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + IC[name] + "</svg></span>";
  }

  var QUIEN = [
    { v: "dirigente", t1: "Dirigente de una asociación", t2: "Para todo el directorio", ic: "grupo" },
    { v: "funcionario", t1: "Funcionario con un caso", t2: "Para ti o un socio", ic: "persona" },
    { v: "institucion", t1: "Jefatura o institución", t2: "Para tu equipo", ic: "edificio" }
  ];
  var TEMAS = {
    dirigente: ["Reorganización o planta", "Sumario", "Mesa con la autoridad", "Directorio nuevo", "Maltrato o Ley Karin", "Otra cosa"],
    funcionario: ["Sumario o investigación", "Calificaciones o concurso", "No renovación o desvinculación", "Maltrato o acoso", "Carrera o remuneraciones", "Otra cosa"],
    institucion: ["Gestión de personas", "Sumarios y procedimientos", "Relación con asociaciones", "Capacitación", "Modernización o cambio", "Otra cosa"]
  };
  var PLAZOS = [
    { v: "cargos", t1: "Sí, me notificaron cargos", t2: "Te llamamos dentro de 2 horas hábiles.", ic: "alerta", urgent: true },
    { v: "otro", t1: "Hay otro plazo corriendo", t2: "Una fecha para responder o presentar algo.", ic: "reloj" },
    { v: "no", t1: "No por ahora", ic: "no" },
    { v: "nose", t1: "No estoy seguro", ic: "duda" }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  function enHorario() {
    try {
      var parts = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
      var wd = "", h = 0;
      parts.forEach(function (p) { if (p.type === "weekday") wd = p.value.toLowerCase(); if (p.type === "hour") h = parseInt(p.value, 10); });
      var finde = wd.indexOf("sáb") === 0 || wd.indexOf("dom") === 0;
      return !finde && h >= 9 && h < 17;
    } catch (e) { return true; }
  }

  function Form(el) {
    this.el = el;
    this.s = { step: 1, quien: null, tema: null, plazo: null };
    var self = this;
    el.addEventListener("submit", function (e) { e.preventDefault(); self.send(); });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]");
      if (b) { self.pick(b.getAttribute("data-pick"), b.getAttribute("data-v")); return; }
      if (e.target.closest(".ff-back")) self.back();
    });
    el.addEventListener("input", function (e) {
      if (e.target.name === "mensaje") {
        var c = el.querySelector(".ff-count");
        if (c) c.textContent = e.target.value.length + " / 600";
      }
      e.target.classList.remove("bad");
    });
    this.render();
  }

  Form.prototype.urgent = function () { return this.s.plazo === "cargos"; };

  Form.prototype.pick = function (k, v) {
    this.s[k] = v;
    this.s.step += 1;
    this.render(true);
  };

  Form.prototype.back = function () {
    var s = this.s;
    if (s.step === 4 && s.direct) { s.direct = false; s.step = 1; s.quien = s.tema = s.plazo = null; }
    else if (s.step > 1) { s.step -= 1; if (s.step === 1) s.quien = null; if (s.step === 2) s.tema = null; if (s.step === 3) s.plazo = null; }
    this.render(true);
  };

  Form.prototype.goCargos = function () {
    this.s = { step: 4, quien: "funcionario", tema: "Sumario o investigación", plazo: "cargos", direct: true };
    this.render(true);
  };

  Form.prototype.focusFirst = function () {
    var f = this.el.querySelector(".ff-q");
    if (f) { f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); }
  };

  Form.prototype.render = function (focus) {
    var s = this.s, h = "";
    var urgent = this.urgent();
    var top = '<div class="ff-top">' + (s.step > 1 && s.step < 5 ? '<button type="button" class="ff-back">← Atrás</button>' : "<span></span>") +
      "<span>" + (s.step < 5 ? "Paso " + s.step + " de 4" : (urgent ? "Cargos notificados" : "Listo")) + "</span></div>";
    var bar = '<div class="ff-bar' + (urgent ? " urgent" : "") + '">';
    for (var i = 1; i <= 4; i++) bar += '<span class="' + (i <= Math.min(s.step, 4) ? "on" : "") + '"></span>';
    bar += "</div>";
    h += top + bar;

    var chosen = [];
    if (s.quien && s.step > 1 && s.step < 5) chosen.push(QUIEN.filter(function (q) { return q.v === s.quien; })[0].t1);
    if (s.tema && s.step > 2 && s.step < 5) chosen.push(s.tema);
    if (chosen.length) h += '<div class="ff-chosen">' + chosen.map(function (c) { return "<span>✓ " + esc(c) + "</span>"; }).join("") + "</div>";

    if (s.step === 1) {
      h += '<span class="ff-q">¿Para quién es la asesoría?</span><div class="ff-opts">';
      QUIEN.forEach(function (q) {
        h += '<button type="button" class="ff-opt" data-pick="quien" data-v="' + q.v + '">' + icon(q.ic) + '<span class="tx"><span class="t1">' + q.t1 + '</span><span class="t2">' + q.t2 + "</span></span></button>";
      });
      h += '</div><span class="ff-note">Toca una opción y pasa sola a la siguiente. Solo usamos tus datos para responderte. <a href="' + BASE + 'privacidad/">Privacidad</a></span>';
    } else if (s.step === 2) {
      h += '<span class="ff-q">¿Sobre qué?</span><div class="ff-opts grid">';
      TEMAS[s.quien].forEach(function (t) {
        h += '<button type="button" class="ff-opt" data-pick="tema" data-v="' + esc(t) + '"><span class="tx"><span class="t1">' + esc(t) + "</span></span></button>";
      });
      h += "</div>";
    } else if (s.step === 3) {
      h += '<span class="ff-q">¿Hay un plazo corriendo?</span><div class="ff-opts">';
      PLAZOS.forEach(function (p) {
        h += '<button type="button" class="ff-opt' + (p.urgent ? " urgent" : "") + '" data-pick="plazo" data-v="' + p.v + '">' + icon(p.ic) + '<span class="tx"><span class="t1">' + p.t1 + "</span>" + (p.t2 ? '<span class="t2">' + p.t2 + "</span>" : "") + "</span></button>";
      });
      h += '</div><span class="ff-note">Una citación a declarar no es lo mismo que una formulación de cargos. Si tienes dudas, elige "No estoy seguro".</span>';
    } else if (s.step === 4 && urgent) {
      h += '<span class="ff-q">Te llamamos dentro de 2 horas hábiles.</span><span class="ff-sub">En horario de atención: ' + HORARIO + '. Solo necesitamos estos datos; ten a mano la notificación.</span>' +
        '<div class="ff-fields">' +
        '<label>¿Qué día te notificaron?<input type="date" name="fecha_notificacion" required></label>' +
        '<label>¿A qué teléfono te llamamos?<input type="tel" name="telefono" autocomplete="tel" inputmode="tel" placeholder="+56 9 1234 5678" required></label>' +
        '<label>Tu nombre<input type="text" name="nombre" autocomplete="name" required></label>' +
        '<label>Institución donde trabajas <span class="opt">(para revisar que no tengamos conflicto de interés)</span><input type="text" name="institucion" autocomplete="organization" required></label>' +
        this.common() +
        "</div>" +
        '<button type="submit" class="ff-send urgent">Pedir llamada</button><div class="ff-err" role="alert"></div>' +
        '<span class="ff-note">Para cuidar tu información, no adjuntes el expediente. Te diremos cómo compartirlo si hace falta. Enviar este formulario no suspende tu plazo.</span>';
    } else if (s.step === 4) {
      h += '<span class="ff-q">Cuéntanos tu caso.</span><span class="ff-sub">Te respondemos en 48 horas hábiles.</span>' +
        '<div class="ff-fields">' +
        '<label>Tu nombre<input type="text" name="nombre" autocomplete="name" required></label>' +
        '<label>Correo<input type="email" name="correo" autocomplete="email" inputmode="email" required></label>' +
        '<label>Teléfono <span class="opt">(opcional)</span><input type="tel" name="telefono" autocomplete="tel" inputmode="tel"></label>' +
        '<label>' + (s.quien === "dirigente" ? "Asociación e institución" : "Institución") + ' <span class="opt">(para revisar que no tengamos conflicto de interés)</span><input type="text" name="institucion" autocomplete="organization" required></label>' +
        '<label>¿Qué está pasando? <span class="opt">En pocas líneas</span><textarea name="mensaje" maxlength="600" required></textarea><span class="ff-count">0 / 600</span></label>' +
        this.common() +
        "</div>" +
        '<button type="submit" class="ff-send">Enviar</button><div class="ff-err" role="alert"></div>' +
        '<span class="ff-note">Para cuidar tu información, cuéntanos inicialmente solo lo necesario para contactarte y comprender tu consulta. No adjuntes expedientes ni antecedentes sensibles. Si necesitamos profundizar, coordinaremos una entrevista y te indicaremos cómo compartir los documentos.</span>';
    } else if (s.step === 5) {
      if (urgent) {
        h += (enHorario()
            ? '<span class="ff-q">Recibido. Te llamamos dentro de 2 horas hábiles.</span>'
            : '<span class="ff-q">Recibido. Te llamamos a primera hora del próximo día hábil.</span><span class="ff-sub">Escribiste fuera del horario de atención (' + HORARIO + ').</span>') +
          '<span class="ff-eyebrow">MIENTRAS TANTO</span><ul class="ff-done-list">' +
          "<li>Ten a mano la notificación y anota la fecha y hora en que te la entregaron.</li>" +
          "<li>Si tienes una citación a declarar, no vayas sin preparación.</li>" +
          "<li>Enviar este formulario no suspende tu plazo.</li></ul>";
      } else {
        h += '<span class="ff-q">Recibido. Te respondemos en 48 horas hábiles.</span>' +
          '<span class="ff-sub">Revisamos lo que nos cuentas. Si podemos ayudarte, te enviamos un link para conversar hasta 15 minutos con Piera, sin costo. Si no es algo que podamos tomar, te lo decimos.</span>' +
          '<ul class="ff-done-list"><li>Si tienes un plazo en curso, enviar una consulta no lo suspende.</li><li>Si necesitas agregar algo, escríbenos a <a href="mailto:' + CORREO + '">' + CORREO + "</a>.</li></ul>";
      }
      if (this.preview) h += '<div class="ff-preview">Vista previa: el formulario todavía no está conectado, así que este mensaje no se envió.</div>';
    }
    this.el.innerHTML = h;
    if (focus) this.focusFirst();
  };

  Form.prototype.common = function () {
    return '<label class="ff-check"><input type="checkbox" name="acepta" required> <span>Leí la <a href="' + BASE + 'privacidad/" target="_blank" rel="noopener">política de privacidad</a> y acepto que usen estos datos para responder mi consulta.</span></label>' +
      '<label class="ff-hp" aria-hidden="true">No llenar<input type="text" name="sitio_web" tabindex="-1" autocomplete="off"></label>';
  };

  Form.prototype.send = function () {
    var el = this.el, s = this.s, self = this;
    var err = el.querySelector(".ff-err");
    var bad = [];
    Array.prototype.forEach.call(el.querySelectorAll("input[required], textarea[required]"), function (i) {
      var ok = i.type === "checkbox" ? i.checked : i.value.trim() !== "";
      if (ok && i.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value.trim());
      if (ok && i.type === "tel") ok = i.value.replace(/\D/g, "").length >= 8;
      if (!ok) { bad.push(i); i.classList.add("bad"); }
    });
    if (bad.length) {
      err.textContent = bad[0].type === "checkbox" ? "Falta aceptar la política de privacidad." : "Revisa los campos marcados.";
      bad[0].focus();
      return;
    }
    var data = { tipo: this.urgent() ? "cargos" : "consulta", quien: s.quien, tema: s.tema, plazo: s.plazo, pagina: location.pathname };
    Array.prototype.forEach.call(el.querySelectorAll("input, textarea"), function (i) {
      if (i.type === "checkbox") return;
      data[i.name] = i.value.trim();
    });
    if (data.sitio_web) { s.step = 5; this.render(true); return; } // bot
    delete data.sitio_web;
    var btn = el.querySelector(".ff-send");
    btn.disabled = true;
    btn.textContent = "Enviando…";
    function done() { s.step = 5; self.render(true); }
    if (!FONS_ENDPOINT) { this.preview = true; setTimeout(done, 400); return; }
    fetch(FONS_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      .then(done)
      .catch(function () {
        btn.disabled = false;
        btn.textContent = self.urgent() ? "Pedir llamada" : "Enviar";
        err.innerHTML = "No pudimos enviar tu mensaje. Escríbenos a <a href=\"mailto:" + CORREO + "\">" + CORREO + "</a>" + (self.urgent() ? " con el asunto \"Cargos notificados\"." : ".");
      });
  };

  function setupForms() {
    var forms = [];
    Array.prototype.forEach.call(document.querySelectorAll("form.fons-form"), function (f) { forms.push(new Form(f)); });
    function cargos(e) {
      if (!forms.length) return;
      if (e) e.preventDefault();
      forms[0].goCargos();
      var sec = forms[0].el.closest("section") || forms[0].el;
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-cargos]"), function (a) { a.addEventListener("click", cargos); });
    if (location.hash === "#cargos") setTimeout(cargos, 50);
  }

  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  function setupRed() {
    if (!window.matchMedia("(min-width: 761px)").matches) return;
    Array.prototype.forEach.call(document.querySelectorAll("details.red"), function (d) { d.open = true; });
  }

  ready(function () { setupMenu(); setupForms(); setupRed(); });
})();
