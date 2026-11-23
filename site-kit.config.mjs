// The adapter of QQ Coffee for site-kit (https://github.com/timofeylebedev/site-kit, SPEC.md there): everything the
// kit's checks, review page, rules and tools need to know about this site. The kit's code never names a site.
// First step (Nov 23, 2026): what the site workflow needs; the checks' part (pages, sizes, probes, scenarios, blocks)
// comes in the next commits.
export default {
  name: "QQ Coffee",
  tag: "QQ",
  owner: "Tim",
  repo: "timofeylebedev/qq",
  live: "https://timofeylebedev.github.io/qq/",
  lang: "ru",

  paths: {
    dist: "dist",
    scale: "design/scale.json",
    decisions: "design/decisions.json",
    questions: "design/questions.json",
    styles: "src/styles",
    // custom properties are set in the scripts, the page templates and the view-transition script in <head>
    scripts: ["src/scripts", "src/templates", "public/vt.js"],
    fonts: "src/assets/fonts",
    out: ".site-kit/out",
    report: ".site-kit/report",
  },

  // the palette: design/colors.json (`colors`: name → #rrggbb[aa]); the CSS writes each as --c-<name>
  colours: {
    file: "design/colors.json",
    read: (c) => Object.entries(c.colors || {}).map(([name, value]) => ({ name, value, css: `--c-${name}`, group: name.split("-")[0], use: "" })),
    groups: [],
  },
};
