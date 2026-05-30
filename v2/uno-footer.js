/* uno-footer.js – diskret Uno-logo i footer
   Bruk: <script src="uno-footer.js"></script> (rett før </body>)
   Erstat eksisterende <footer> eller legg til ny. */
(function () {
  var LOGO = 'https://uno.ganddal.net/img/unohundlogo.png';
  var LINK = 'https://uno.ganddal.net';
  var HEIGHT = 11;

  var style = document.createElement('style');
  style.textContent =
    '.uno-footer{text-align:center;padding:1.5rem 0 1rem;}' +
    '.uno-footer-link{display:inline-block;opacity:.28;transition:opacity .18s;line-height:0;}' +
    '.uno-footer-link:hover{opacity:.55;}';
  document.head.appendChild(style);

  var year = new Date().getFullYear();
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
    a.style.cssText = 'font-size:.65rem;letter-spacing:.08em;color:#bbb;font-family:sans-serif;';
  };
  a.appendChild(img);

  var footer = document.querySelector('footer');
  if (!footer) {
    footer = document.createElement('footer');
    document.body.appendChild(footer);
  }
  footer.className = 'uno-footer';
  footer.innerHTML = '';
  footer.appendChild(a);
})();
