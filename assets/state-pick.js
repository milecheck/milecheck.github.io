// Monthly Highway Report signup: turn MailerLite's optional "State" text field into a
// dropdown (Leah 10-27, so the report can be split by state later). MailerLite's own
// dropdowns stop at 20 options, so the form keeps a plain fields[state] input and this
// swaps it for a select with the same name. If this script fails, the text box still works.
(function () {
  var US = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
  var CA = ['Alberta','British Columbia','Manitoba'];
  function swap(input) {
    if (!input || input.tagName !== 'INPUT' || input.dataset.mcState) return;
    var sel = document.createElement('select');
    sel.name = input.name;
    sel.className = input.className;
    sel.setAttribute('aria-label', 'State or province (optional)');
    sel.dataset.mcState = '1';
    sel.style.cssText = 'width:100%;box-sizing:border-box;';
    var html = '<option value="">State or province (optional)</option><optgroup label="United States">';
    US.forEach(function (s) { html += '<option>' + s + '</option>'; });
    html += '</optgroup><optgroup label="Canada">';
    CA.forEach(function (s) { html += '<option>' + s + '</option>'; });
    sel.innerHTML = html + '</optgroup>';
    input.dataset.mcState = '1';
    input.parentNode.replaceChild(sel, input);
  }
  function scan(root) {
    var els = (root || document).querySelectorAll('.ml-embedded input[name="fields[state]"]');
    for (var i = 0; i < els.length; i++) swap(els[i]);
  }
  function start() {
    scan();
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(function () { scan(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 20000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
