// "How we build MileCheck" block on the pages where businesses decide whether to trust us
// (partners, advertise, data licensing). Same wording as the homepage Story tab. Idempotent: strips and re-adds.
import { readFileSync, writeFileSync } from 'node:fs';
const PAGES = ['partners/index.html', 'sponsor/index.html', 'api/index.html'];
const BLOCK = `<!-- values:start -->
<section class="mc-values" style="max-width:760px;margin:34px auto 30px;padding:24px 20px 6px;border-top:1px solid #e3e0d6">
  <h2 style="font-size:24px;margin:0 0 8px">Our mission</h2>
  <p style="font-size:16px;line-height:1.7;margin:0 0 18px">We put every state&rsquo;s Department of Transportation data in one place, so drivers, crews and responders get to the right mile marker.</p>
  <h2 style="font-size:24px;margin:0 0 10px">How we build MileCheck</h2>
  <ul style="margin:0 0 14px;padding-left:20px;font-size:16px;line-height:1.7">
    <li style="margin-bottom:8px"><strong>No ads in the app.</strong> Our website is free to use, so it has a clearly marked sponsor slot to help pay for it, without pop-ups.</li>
    <li style="margin-bottom:8px"><strong>Road data, not your data.</strong> We collect road data from state DOTs, not data about you. You don&rsquo;t need an account, your mile marker is calculated on your phone, your trip history stays there, and we never sell your data.</li>
    <li style="margin-bottom:8px"><strong>Only what&rsquo;s needed.</strong> Weather sends your approximate location to the National Weather Service, route planning sends your location and destination to Google, and wildfire alerts send a location rounded to about 7 miles only if you turn them on. Sentry receives anonymous crash reports, we count feature use without location or identity, and Apple or Google handles subscriptions.</li>
    <li style="margin-bottom:8px"><strong>Built for real roads.</strong> Nearly every feature exists because someone on a real road asked for it.</li>
  </ul>
  <p style="font-size:15px">More in our <a href="https://milecheck.github.io/milecheck-privacy/" style="color:#0f7a4f;text-decoration:underline">privacy policy</a> and <a href="/#story" style="color:#0f7a4f;text-decoration:underline">our story</a>.</p>
</section>
<!-- values:end -->
`;
for (const f of PAGES) {
  let s = readFileSync(f, 'utf8');
  s = s.replace(/<!-- values:start -->[\s\S]*?<!-- values:end -->\n?/, '');
  const at = s.includes('</main>') ? s.indexOf('</main>') : s.indexOf('<!-- site-nav:footer') >= 0 ? s.indexOf('<!-- site-nav:footer') : s.indexOf('<footer');
  if (at < 0) { console.log('no anchor', f); continue; }
  s = s.slice(0, at) + BLOCK + s.slice(at);
  writeFileSync(f, s);
}
console.log('values block on', PAGES.length, 'pages');
