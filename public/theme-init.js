// Applies the saved colour theme before first paint to avoid a flash.
(function () {
  try {
    var pref = localStorage.getItem('pref.theme');
    var dark = pref === 'dark' || (pref !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var lang = localStorage.getItem('pref.locale');
    if (lang === 'en' || lang === 'sv') document.documentElement.lang = lang;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
