/* uno-footer.js v4 – Uno-logo + © årstall sist redigert
   Bruk: <footer></footer> + <script src="uno-footer.js"></script> */
(function () {
  var LOGO   = 'https://uno.ganddal.net/img/unohundlogo.png';
  var LINK   = 'https://uno.ganddal.net';
  var HEIGHT = 11;

  var style = document.createElement('style');
  style.textContent =
    '.uno-footer{text-align:center;padding:1.5rem 0 1.2rem;display:flex;' +
    'align-items:center;justify-content:center;gap:10px;}' +
    '.uno-footer-link{display:inline-block;opacity:.28;transition:opacity .18s;line-height:0;}' +
    '.uno-footer-link:hover{opacity:.55;}' +
    '.uno-footer-copy{font-size:.62rem;letter-spacing:.04em;opacity:.3;' +
    'font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:currentColor;}';
  document.head.appendChild(style);

  // Årstall sist redigert – hentes fra document.lastModified (settes av server/GitHub Pages)
  var modified = new Date(document.lastModified);
  var year = (modified && modified.getFullYear() > 2000)
    ? modified.getFullYear()
    : new Date().getFullYear();

  var a = document.createElement('a');
  a.href = LINK;
  a.target = '_blank';
  a.rel = 'noopener';
  a.title = 'uno';
  a.className = 'uno-footer-link';

  var img = document.createElement('img');
  img.src = LOGO;
  img.alt = 'uno';
  img.height = HEIGHT;
  img.onerror = function () {
    a.textContent = 'uno';
    a.style.cssText = 'font-size:.65rem;letter-spacing:.08em;color:#bbb;font-family:sans-serif;opacity:.3;';
  };
  a.appendChild(img);

  var copy = document.createElement('span');
  copy.className = 'uno-footer-copy';
  copy.textContent = '© ' + year;

  var footer = document.querySelector('footer');
  if (!footer) {
    footer = document.createElement('footer');
    document.body.appendChild(footer);
  }
  footer.className = 'uno-footer';
  footer.innerHTML = '';
  footer.appendChild(a);
  footer.appendChild(copy);
})();
