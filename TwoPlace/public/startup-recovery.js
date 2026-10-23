// Loaded inline before modules so a missing or incompatible app bundle cannot hide recovery.
(function () {
  var screen = document.getElementById('launch-screen');
  if (!screen) return;
  var recovery = document.createElement('div');
  recovery.className = 'launch-recovery';
  recovery.hidden = true;
  var message = document.createElement('p');
  message.textContent = '화면을 불러오지 못했어요. 최신 버전으로 다시 열어 주세요.';
  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = '최신 버전 다시 불러오기';
  button.onclick = function () {
    button.disabled = true;
    button.textContent = '최신 버전 불러오는 중…';
    var url = new URL(location.href);
    url.searchParams.set('refresh', String(Date.now()));
    // Preserve the URL's other parameters and all device membership storage.
    location.replace(url.href);
  };
  var hint = document.createElement('small');
  hint.textContent = '커플 연결 정보와 저장된 기록은 유지돼요.';
  recovery.appendChild(message);
  recovery.appendChild(button);
  recovery.appendChild(hint);
  screen.appendChild(recovery);
  function show() {
    if (!screen.isConnected || screen.classList.contains('is-done')) return;
    recovery.hidden = false;
    var dots = screen.querySelector('.launch-dots');
    if (dots) dots.hidden = true;
  }
  var timer = setTimeout(show, 12000);
  window.addEventListener('error', show, true);
  window.addEventListener('unhandledrejection', show);
  window.addEventListener('twoplace:ready', function () {
    clearTimeout(timer);
    window.removeEventListener('error', show, true);
    window.removeEventListener('unhandledrejection', show);
  }, {once:true});
})();
