/**
 * loader.js
 * Loads site content from data.json and populates the DOM.
 * To update site content, edit data.json only — no HTML changes needed.
 */
(function () {
  'use strict';

  /* ---------- helpers ---------- */

  function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function mergeValue(targetValue, sourceValue) {
    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      var maxLength = Math.max(targetValue.length, sourceValue.length);
      var mergedArray = [];
      var i;

      for (i = 0; i < maxLength; i++) {
        if (typeof sourceValue[i] === 'undefined') {
          mergedArray[i] = targetValue[i];
        } else if (typeof targetValue[i] === 'undefined') {
          mergedArray[i] = sourceValue[i];
        } else {
          mergedArray[i] = mergeValue(targetValue[i], sourceValue[i]);
        }
      }

      return mergedArray;
    }

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      return deepMerge(targetValue, sourceValue);
    }

    return sourceValue;
  }

  function deepMerge(target, source) {
    Object.keys(source || {}).forEach(function (key) {
      var sourceValue = source[key];
      target[key] = mergeValue(target[key], sourceValue);
    });
    return target;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getCurrentLanguage(data) {
    var params = new URLSearchParams(window.location.search);
    var lang = params.get('lang') || data.default_language || 'pt';
    return (data.translations && data.translations[lang]) ? lang : (data.default_language || 'pt');
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHTML(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function skillBar(level, max) {
    var html = '<div class="skill-bar">';
    for (var i = 0; i < max; i++) {
      html += '<div class="' + (i < level ? 'skill-rate-on' : 'skill-rate-off') + '"></div>';
    }
    return html + '</div>';
  }

  /* ---------- populate functions ---------- */

  function populateMeta(meta) {
    document.title = meta.title;
    var desc = document.querySelector('meta[name="description"]');
    var auth = document.querySelector('meta[name="author"]');
    if (desc) desc.setAttribute('content', meta.description);
    if (auth) auth.setAttribute('content', meta.author);
    document.documentElement.lang = meta.lang || 'pt-BR';
    setText('preloader-name', meta.preloader_name || meta.title);
  }

  function populateNavbar(navbar) {
    setText('navbar-brand', navbar.brand);

    var linksHtml = navbar.links.map(function (l) {
      return '<li><a href="' + l.href + '">' + l.label + '</a></li>';
    }).join('');

    var currentUrl = new URL(window.location.href);
    linksHtml += navbar.languages.map(function (l) {
      var languageUrl = l.href;
      if (!languageUrl && l.code) {
        currentUrl.searchParams.set('lang', l.code);
        languageUrl = currentUrl.pathname + currentUrl.search + currentUrl.hash;
      }
      return '<li><a href="' + languageUrl + '" title="' + l.title + '">' +
        '<img src="' + l.img + '" alt="' + l.alt + '" /></a></li>';
    }).join('');

    setHTML('navbar-links', linksHtml);
  }

  function populateIntro(intro) {
    setText('intro-greeting', intro.greeting);
    // pipe-separated string required by jquery.simple-text-rotator
    var rolesEl = document.getElementById('intro-roles');
    if (rolesEl) rolesEl.textContent = intro.roles.join(' | ');

    var scrollEl = document.querySelector('#intro .mouse-icon-link');
    if (scrollEl) scrollEl.setAttribute('href', intro.scroll_target || '#profile');
  }

  function populateProfile(p) {
    setText('profile-name', p.name);
    setText('profile-subtitle', p.subtitle);

    var photo = document.getElementById('profile-photo');
    if (photo) { photo.src = p.photo; photo.alt = p.photo_alt; }

    setText('profile-bio-title', p.bio_title);
    setText('profile-bio', p.bio);

    // Skills widget
    var skillsHtml = '<h3>' + p.skills_title + '</h3>';
    p.skills.forEach(function (s) {
      skillsHtml += '<h5>' + s.name + '</h5>' + skillBar(s.level, s.max);
    });
    setHTML('profile-skills', skillsHtml);

    // Social widget
    var socialHtml = '<h3>' + p.social_title + '</h3><ul class="widget-social">';
    p.social.forEach(function (s) {
      socialHtml += '<li><a href="' + s.url + '" target="_blank" rel="noreferrer noopener"><i class="' + s.icon + '"></i></a></li>';
    });
    socialHtml += '</ul>';
    setHTML('profile-social', socialHtml);
  }

  function populateStats(stats) {
    setText('stats-title', stats.title);
    var row = document.getElementById('stats-row');
    if (!row) return;

    var animations = ['bounceInDown', 'bounceInUp', 'bounceInRight'];
    stats.items.forEach(function (item, i) {
      var anim = animations[Math.min(i, animations.length - 1)];
      var div = document.createElement('div');
      div.className = 'col-md-3 col-sm-4 wow ' + anim;
      div.innerHTML =
        '<div class="stat"><div class="stat-icon">' +
        '<h2><i class="' + item.icon + '"></i>' +
        '<span class="timer" data-count="' + item.value + '"></span>' + item.suffix + '</h2>' +
        '</div><h3>' + item.label + '</h3></div>';
      row.appendChild(div);
    });
  }

  function populateServices(services) {
    setText('services-title', services.title);
    setText('services-subtitle', services.subtitle);

    var container = document.getElementById('services-items');
    if (!container) return;

    var html = '';
    services.items.forEach(function (item) {
      html +=
        '<article class="service wow bounceInUp">' +
          '<div class="icon"><i class="' + item.icon + '"></i></div>' +
          '<h4>' + item.title + '</h4>' +
          '<div class="text"><p>' + item.description + '</p></div>' +
        '</article>';
    });
    container.innerHTML = html;
  }

  function populateCurrentStatus(cs) {
    setText('status-section-title', cs.section_title);
    setHTML('status-headline',
      cs.headline + ' <a href="' + cs.company_url + '" target="_blank" rel="noreferrer noopener">' + cs.company + '</a>');
    setText('status-description', cs.description);

    var cta = document.getElementById('status-cta');
    if (cta) {
      cta.setAttribute('href', cs.cta_href);
      cta.innerHTML = '<i class="far fa-paper-plane icon-before"></i> ' + cs.cta_label;
    }
  }

  function populateResume(resume) {
    setText('resume-title', resume.title);
    setText('resume-subtitle', resume.subtitle);
    setText('resume-education-title', resume.education_title);

    // Education
    var eduHtml = '';
    resume.education.forEach(function (edu) {
      eduHtml +=
        '<div class="resume-entry">' +
          '<div class="resume-place wow bounceInLeft">' +
            '<h4><i class="fas fa-suitcase"></i> ' + edu.org + '</h4>' +
            '<i class="fas fa-calendar"></i> ' + edu.period +
          '</div>' +
          '<div class="resume-item wow bounceInRight">' +
            '<h4>' + edu.degree + '</h4>' +
            '<p>' + edu.description + '</p>' +
          '</div>' +
        '</div>';
    });
    setHTML('resume-education-items', eduHtml);

    setText('resume-experience-title', resume.experience_title);

    // Experience
    var expHtml = '';
    resume.experience.forEach(function (exp) {
      var desc = exp.description
        ? '<p>' + exp.description + '</p>'
        : '';
      var items = exp.items.length
        ? '<ul>' + exp.items.map(function (it) { return '<li>' + it + '</li>'; }).join('') + '</ul>'
        : '';
      expHtml +=
        '<div class="resume-entry">' +
          '<div class="resume-place wow bounceInLeft">' +
            '<h4><i class="fas fa-suitcase"></i> ' + exp.company + '</h4>' +
            '<i class="fas fa-calendar"></i> ' + exp.period + '<br />' +
            '<i class="fas fa-map-marker"></i> ' + exp.location +
          '</div>' +
          '<div class="resume-item wow bounceInRight">' +
            '<h4>' + exp.title + '</h4>' + desc + items +
          '</div>' +
        '</div>';
    });
    setHTML('resume-experience-items', expHtml);

    var cvBtn = document.getElementById('resume-cv-download');
    if (cvBtn) {
      cvBtn.setAttribute('href', resume.cv_download_url);
      cvBtn.setAttribute('target', '_blank');
      cvBtn.setAttribute('rel', 'noreferrer noopener');
      cvBtn.innerHTML = '<i class="fas fa-download icon-before"></i> ' + resume.cv_download_label;
    }
  }

  function populateContact(contact) {
    setText('contact-title', contact.title);
    setText('contact-subtitle', contact.subtitle);

    var infoHtml = '';
    if (contact.location) infoHtml += '<li><i class="fas fa-fw fa-map-marker"></i>' + contact.location + '</li>';
    if (contact.email)    infoHtml += '<li><i class="far fa-fw fa-envelope"></i><a href="mailto:' + contact.email + '">' + contact.email + '</a></li>';
    if (contact.website)  infoHtml += '<li><i class="fas fa-globe"></i><a href="' + contact.website + '" target="_blank" rel="noreferrer noopener">' + contact.website + '</a></li>';
    if (contact.skype)    infoHtml += '<li><i class="fab fa-fw fa-skype"></i>Skype: <a href="skype:' + contact.skype + '?call">' + contact.skype + '</a></li>';
    if (contact.telegram) infoHtml += '<li><i class="fab fa-fw fa-telegram"></i>Telegram: <a href="' + contact.telegram_url + '" target="_blank" rel="noreferrer noopener">' + contact.telegram + '</a></li>';
    if (contact.whatsapp) infoHtml += '<li><i class="fab fa-fw fa-whatsapp"></i>WhatsApp: <a href="' + contact.whatsapp_url + '" target="_blank">' + contact.whatsapp + '</a></li>';
    setHTML('contact-info', infoHtml);

    var form = contact.form;
    var nameEl    = document.getElementById('name');
    var emailEl   = document.getElementById('email');
    var messageEl = document.getElementById('message');
    var submitEl  = document.getElementById('contact-submit');

    if (nameEl)    nameEl.setAttribute('placeholder', form.name_placeholder);
    if (emailEl)   emailEl.setAttribute('placeholder', form.email_placeholder);
    if (messageEl) messageEl.setAttribute('placeholder', form.message_placeholder);
    if (submitEl)  submitEl.innerHTML = '<i class="fas fa-bullhorn icon-before"></i> ' + form.submit_label;

    // Expose Web3Forms access key for the send function
    window._web3formsKey = form.web3forms_key || '';
  }

  function populateFooter(footer) {
    var year = new Date().getFullYear();
    var copyright = (footer.copyright || '').replace(/\b20\d{2}\b/, String(year));
    setText('footer-copyright', copyright);
  }

  /* ---------- main ---------- */

  // Usa window.siteData definido por data.js (funciona em file:// e https://)
  var rawData = window.siteData;
  var data;
  if (!rawData) {
    console.error('[loader.js] window.siteData não encontrado. Verifique se data.js está carregado.');
    return;
  }

  var lang = getCurrentLanguage(rawData);
  data = clone(rawData);
  if (rawData.translations && rawData.translations[lang]) {
    data = deepMerge(data, rawData.translations[lang]);
  }
  if (data.navbar && data.navbar.languages) {
    data.navbar.languages = data.navbar.languages.map(function (item) {
      return clone(item);
    });
  }

  populateMeta(data.meta);
  populateNavbar(data.navbar);
  populateIntro(data.intro);
  populateProfile(data.profile);
  populateStats(data.stats);
  populateServices(data.services);
  populateCurrentStatus(data.current_status);
  populateResume(data.resume);
  populateContact(data.contact);
  populateFooter(data.footer);

  // Notifica custom.js que o conteúdo foi populado
  if (typeof jQuery !== 'undefined') {
    jQuery(document).trigger('siteDataLoaded', [data]);
  }
})();
