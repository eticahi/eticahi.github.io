/* Header / footer injection used on every page.
 *
 * Each page calls renderChrome("active-page-key") in <body> after the
 * <div id="chrome-header"></div> and before </body>. We also auto-inject
 * a footer if a #chrome-footer placeholder exists.
 */

const NAV_ITEMS = [
  { key: "home",       label: "Home",                href: "index.html" },
  { key: "news",       label: "News & Bulletin",     href: "news.html" },
  { key: "statements", label: "Official Statements", href: "statements.html" },
  { key: "orders",     label: "Executive Orders",    href: "executive-orders.html" },
  { key: "legislation", label: "Legislative Tracker", href: "legislation.html" },
  { key: "budget",     label: "State Budget",        href: "budget.html" },
  { key: "map",        label: "District Map",        href: "map.html" }
];

function renderChrome(activeKey) {
  const header = document.getElementById("chrome-header");
  if (header) {
    header.innerHTML = `
      <div class="utility-bar">
        <div class="container">
          <span>An official website of the State of Minnesota (sim)</span>
          <span><a href="admin.html">Admin Log-in</a></span>
        </div>
      </div>
      <header class="site-header">
        <div class="container">
          <a href="index.html" class="seal" aria-label="State Seal — home">
            <img src="assets/stateseal.svg" alt="Minnestoa State seal">
          </a>
          <div class="titles">
            <div class="top">Office of the Governor</div>
            <div class="sub">State of Minnesota</div>
          </div>
          <nav class="site-nav" aria-label="Primary">
            ${NAV_ITEMS.map(item => `
              <a href="${item.href}" class="${item.key === activeKey ? 'active' : ''}">
                ${item.label}
              </a>
            `).join("")}
          </nav>
        </div>
      </header>
    `;
  }

  const footer = document.getElementById("chrome-footer");
  if (footer) {
    footer.outerHTML = `
      <footer class="site">
        <div class="container">
          <div class="cols">
            <div>
              <h4>Office of the Governor</h4>
              <p style="margin:0 0 .5rem">
                130 State Capitol<br>
                St. Paul, MN 55155
              </p>
              <p style="margin:0">
                Phone: (651) 201-3400<br>
                Press: <a href="mailto:press@gov.mn.gov.example">press@gov.mn.gov.example</a>
              </p>
            </div>
            <div>
              <h4>Government</h4>
              <ul>
                <li><a href="index.html">About the Governor</a></li>
                <li><a href="executive-orders.html">Executive Orders</a></li>
                <li><a href="statements.html">Official Statements</a></li>
                <li><a href="news.html">News &amp; Bulletin</a></li>
                <li><a href="budget.html">State Budget</a></li>
              </ul>
            </div>
            <div>
              <h4>Legislative</h4>
              <ul>
                <li><a href="legislation.html">Bill Tracker</a></li>
                <li><a href="map.html">Congressional Districts</a></li>
              </ul>
            </div>
            <div>
              <h4>Staff</h4>
              <ul>
                <li><a href="admin.html">Sign in</a></li>
              </ul>
            </div>
          </div>
          <div class="meta">
            © ${new Date().getFullYear()} Office of the Governor — State of Minnesota (parody).
            This is a simulation site, not an official government website.
          </div>
        </div>
      </footer>
    `;
  }
}

/* Sort an array by date field, newest first */
function sortByDate(arr, field = "date") {
  return [...arr].sort((a, b) => (b[field] || "").localeCompare(a[field] || ""));
}

/* Filter helper used by listing pages */
function applyFilter(items, { search = "", filters = {} } = {}) {
  const q = search.trim().toLowerCase();
  return items.filter(item => {
    if (q) {
      const hay = JSON.stringify(item).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const [key, val] of Object.entries(filters)) {
      if (!val) continue;
      const v = item[key];
      if (Array.isArray(v)) {
        if (!v.includes(val)) return false;
      } else if (v !== val) {
        return false;
      }
    }
    return true;
  });
}
