const r = await fetch("http://127.0.0.1:4173/");
const t = await r.text();
console.log("status", r.status, "len", t.length);
console.log("sponsor_url", t.includes("https://github.com/sponsors/anurbis-dev"));
console.log("nav_sponsor_label", t.includes("Sponsor on GitHub"));
console.log("nav_github_cta", /data-pixis-event="github"[^>]*data-pixis-location="nav"/.test(t));
console.log("beta_try_cta", t.includes('data-pixis-location="beta"'));
console.log("hero_try_cta", t.includes('data-pixis-location="hero"'));
console.log("nav_try_cta", t.includes('data-pixis-location="nav"') && t.includes("Try Pixis Now"));
