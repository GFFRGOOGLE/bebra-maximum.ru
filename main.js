/* =========================================================
   BEBRA MAXIMUM — main.js
   Прямое подключение к серверу через API mcstatus.io
   ========================================================= */

// ==== НАСТРОЙКИ СЕРВЕРА ====
const SERVER = {
  ip: 'bebra-maximum.ru',   // ← замени на реальный IP
  bedrockPort: 19709,
  apiBase: 'https://api.mcstatus.io/v2/status/java/'
};

// ==== КОПИРОВАНИЕ IP ====
function copyIP(el){
  const ip = document.getElementById('serverIP').innerText;
  navigator.clipboard.writeText(ip).then(() => {
    const tip = el.querySelector('.copied');
    tip.classList.add('show');
    logToConsole(`IP ${ip} скопирован в буфер обмена`);
    setTimeout(() => tip.classList.remove('show'), 1600);
  });
}

// ==== ЛОГ В КОНСОЛЬ ПК ====
function logToConsole(text){
  const log = document.getElementById('screenLog');
  if(!log) return;
  const line = document.createElement('div');
  const time = new Date().toLocaleTimeString('ru-RU', {hour12:false});
  line.innerHTML = `[${time}] <span>▸</span> ${text}`;
  log.prepend(line);
  // оставляем последние 6 строк
  while(log.children.length > 6) log.removeChild(log.lastChild);
}

// ==== ПЛАВНЫЙ СЧЁТЧИК ПРОГРЕССА ====
function setProgress(percent){
  const bar = document.getElementById('loadBar');
  const label = document.getElementById('loadPercent');
  if(!bar || !label) return;
  bar.style.width = percent + '%';
  label.textContent = Math.round(percent) + '%';
}

// ==== ОБНОВЛЕНИЕ СТАТУСА СЕРВЕРА ====
async function fetchServerStatus(){
  const tower = document.getElementById('pcTower');
  const statusEl = document.getElementById('connStatus');
  const playersEl = document.getElementById('statPlayers');
  const pingEl = document.getElementById('statPing');
  const versionEl = document.getElementById('statVersion');
  const motdEl = document.getElementById('statMotd');
  const ipEl = document.getElementById('statIP');

  ipEl.textContent = SERVER.ip;
  setProgress(20);
  logToConsole('Пингую сервер...');

  try{
    const res = await fetch(SERVER.apiBase + SERVER.ip);
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    setProgress(60);

    if(data.online){
      // ОНЛАЙН
      tower.classList.remove('offline');
      statusEl.textContent = '● ONLINE';
      statusEl.className = 'screen-status online';

      const online = data.players?.online ?? 0;
      const max = data.players?.max ?? '?';
      playersEl.textContent = `${online} / ${max}`;
      playersEl.className = 'metric-value online';

      // версия
      versionEl.textContent = data.version?.name_clean || data.version?.name || '—';

      // MOTD
      const motd = data.motd?.clean || data.motd?.raw || 'Bebra Maximum';
      motdEl.textContent = motd;

      // пинг — измеряем самим fetch-таймером
      const t1 = performance.now();
      await fetch(SERVER.apiBase + SERVER.ip, {cache:'no-store'}).catch(()=>{});
      const ping = Math.round(performance.now() - t1);
      pingEl.textContent = `~${ping} ms`;
      pingEl.className = 'metric-value online';

      setProgress(100);
      logToConsole(`Сервер онлайн · ${online} игроков · ${ping}ms`);
      logToConsole(`Версия: ${versionEl.textContent}`);
    } else {
      // ОФФЛАЙН
      throw new Error('Server offline');
    }
  } catch(err){
    tower.classList.add('offline');
    statusEl.textContent = '● OFFLINE';
    statusEl.className = 'screen-status offline';
    playersEl.textContent = '— / —';
    playersEl.className = 'metric-value offline';
    pingEl.textContent = '—';
    pingEl.className = 'metric-value offline';
    versionEl.textContent = '—';
    motdEl.textContent = 'Сервер временно недоступен';
    setProgress(0);
    logToConsole('❌ Не удалось подключиться к серверу');
    console.warn('Server status error:', err);
  }
}

// ==== РЕВЕАЛ ПРИ СКРОЛЛЕ ====
function initReveal(){
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('active');
        observer.unobserve(e.target);
      }
    });
  }, {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==== ХЕДЕР ПРИ СКРОЛЛЕ ====
function initHeaderScroll(){
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if(window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });
}

// ==== ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРЯМ ====
function initSmoothScroll(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if(id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if(target){
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({top:y, behavior:'smooth'});
      }
    });
  });
}

// ==== ИНИЦИАЛИЗАЦИЯ ====
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initHeaderScroll();
  initSmoothScroll();

  // первый запрос
  fetchServerStatus();

  // авто-обновление каждые 30 секунд
  setInterval(fetchServerStatus, 30000);

  // приветственный лог
  logToConsole('Система Bebra Maximum готова');
  logToConsole('Ядро: Minecraft Java + Bedrock');
});
