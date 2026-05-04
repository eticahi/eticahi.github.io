/* Admin panel logic.
 *
 * SECURITY NOTE: this is a SIM. The "credentials" are hardcoded in the
 * client-side JS, which means anyone who opens devtools sees them and
 * anyone with the URL can read them. Do not use this for anything real.
 */

const ADMIN_USER = "eticahi";
const ADMIN_PASS = "oir";
const SESSION_KEY = "mn_gov_admin_session";
// LS_PREFIX is defined in data-loader.js (loaded earlier on admin.html);
// re-declaring it here would throw SyntaxError. Reuse the global.

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

function login(user, pass) {
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

/* ---------- Form templates per content type ---------- */

const FORMS = {
  bills: {
    label: "Bill",
    file: "bills.json",
    fields: [
      { name: "id",            label: "Bill ID",    placeholder: "HB-1234 or SB-5678", required: true },
      { name: "chamber",       label: "Chamber",    type: "select", options: ["House", "Senate"], required: true },
      { name: "session",       label: "Session",    placeholder: "e.g. 2026 Regular", required: true },
      { name: "title",         label: "Title",      placeholder: "Concerning...", required: true },
      { name: "sponsor",       label: "Sponsor",    placeholder: "Sen. R. Alvarez (D-22)" },
      { name: "introduced",    label: "Introduced", type: "date", required: true },
      { name: "lastAction",    label: "Last action date", type: "date" },
      { name: "lastActionText",label: "Last action text", type: "textarea" },
      { name: "status",        label: "Status",     type: "select",
        options: ["in-committee", "on-governors-desk", "signed", "vetoed", "partial-veto", "stalled"], required: true },
      { name: "governorPosition", label: "Governor position", type: "select",
        options: ["", "support", "oppose", "monitoring", "signed", "partial-veto", "vetoed"] },
      { name: "topics",        label: "Topics (comma sep.)", placeholder: "broadband, rural, economic-development", isList: true },
      { name: "summary",       label: "Summary",    type: "textarea", required: true }
    ]
  },
  orders: {
    label: "Executive Order",
    file: "orders.json",
    fields: [
      { name: "id",       label: "ID",       placeholder: "EO-26-05", required: true },
      { name: "number",   label: "Number",   placeholder: "26-05",    required: true },
      { name: "title",    label: "Title",    required: true },
      { name: "issued",   label: "Issued",   type: "date", required: true },
      { name: "status",   label: "Status",   type: "select", options: ["active", "rescinded"], required: true },
      { name: "topics",   label: "Topics (comma sep.)", placeholder: "emergency-management, earthquake", isList: true },
      { name: "supersedes", label: "Supersedes", placeholder: "EO-25-09 (optional)" },
      { name: "summary",  label: "Summary",  type: "textarea", required: true }
    ]
  },
  statements: {
    label: "Official Statement",
    file: "statements.json",
    fields: [
      { name: "id",       label: "ID",       placeholder: "stmt-2026-05-15-housing", required: true },
      { name: "title",    label: "Title",    required: true },
      { name: "date",     label: "Date",     type: "date", required: true },
      { name: "category", label: "Category", placeholder: "Housing / Health / Public Safety...", required: true },
      { name: "summary",  label: "Summary",  type: "textarea", required: true,
        hint: "One- to two-sentence summary that appears in the catalog." },
      { name: "body",     label: "Body",     type: "textarea", required: true,
        hint: "Each blank line is a paragraph. Your signature.svg is appended automatically.",
        isParagraphs: true, rows: 12 }
    ]
  },
  news: {
    label: "News / Bulletin",
    file: "news.json",
    fields: [
      { name: "id",       label: "ID",       placeholder: "news-2026-05-15-housing", required: true },
      { name: "title",    label: "Title",    required: true },
      { name: "date",     label: "Date",     type: "date", required: true },
      { name: "category", label: "Category", placeholder: "Budget / Public Safety / Economic Development...", required: true },
      { name: "tags",     label: "Tags (comma sep.)", isList: true },
      { name: "excerpt",  label: "Excerpt",  type: "textarea", required: true },
      { name: "body",     label: "Body",     type: "textarea", rows: 8,
        hint: "Long-form body shown when the user expands the bulletin item." }
    ]
  }
};

/* ---------- Render ---------- */

function renderLogin() {
  document.getElementById("admin-root").innerHTML = `
    <section>
      <div class="narrow">
        <span class="section-eyebrow">Staff sign-in</span>
        <h1>Office of the Governor &mdash; Admin</h1>
        <hr class="gold-rule">

        <div class="callout">
          This is a sim. Credentials are hardcoded in the JS bundle and visible
          to anyone who opens devtools. Don't treat this as real authentication.
        </div>

        <form id="login-form" class="form-card" autocomplete="off">
          <div class="form-row">
            <label for="user">Username</label>
            <div><input type="text" id="user" name="user" required></div>
          </div>
          <div class="form-row">
            <label for="pass">Password</label>
            <div><input type="password" id="pass" name="pass" required></div>
          </div>
          <div id="login-error" class="callout danger" style="display:none; margin-top:.5rem;">
            Invalid username or password.
          </div>
          <div class="right">
            <button class="btn" type="submit">Sign in</button>
          </div>
        </form>
      </div>
    </section>
  `;
  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var u = document.getElementById("user").value.trim();
    var p = document.getElementById("pass").value;
    if (login(u, p)) {
      renderDashboard();
    } else {
      document.getElementById("login-error").style.display = "block";
    }
  });
}

function renderDashboard() {
  var params = new URLSearchParams(location.search);
  var tab = params.get("type") || "statements";

  document.getElementById("admin-root").innerHTML = `
    <section class="tight" style="background:var(--paper); border-bottom:1px solid var(--line);">
      <div class="container">
        <div class="flex between align-center" style="flex-wrap:wrap;">
          <div>
            <span class="section-eyebrow">Admin</span>
            <h1 class="mb-0">Content Studio</h1>
            <p class="muted mt-1 mb-0">Drafts are saved to your browser as you go. To publish,
              click <strong>Export updated JSON</strong> and commit the downloaded file to
              <code>data/</code>.</p>
          </div>
          <button class="btn ghost" onclick="logout()">Sign out</button>
        </div>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="filter-bar" style="background:#fff;">
          ${Object.entries(FORMS).map(function (entry) {
            var k = entry[0], f = entry[1];
            return `<a href="?type=${k}" class="btn ${k === tab ? '' : 'ghost'} sm" style="text-decoration:none;">
              ${escapeHTML(f.label)}s
            </a>`;
          }).join("")}
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;" id="admin-grid">
          <div id="form-area"></div>
          <div id="list-area"></div>
        </div>
      </div>
    </section>
  `;

  // Single-column on small screens
  var mq = window.matchMedia("(max-width: 900px)");
  function adapt() {
    document.getElementById("admin-grid").style.gridTemplateColumns =
      mq.matches ? "1fr" : "1fr 1fr";
  }
  adapt();
  mq.addEventListener("change", adapt);

  renderForm(tab);
  renderList(tab);
}

function renderForm(type) {
  var cfg = FORMS[type];
  var container = document.getElementById("form-area");
  container.innerHTML = `
    <div class="form-card">
      <h2 style="margin-top:0;">New ${escapeHTML(cfg.label)}</h2>
      <form id="entry-form" autocomplete="off">
        ${cfg.fields.map(function (f) { return fieldHtml(f); }).join("")}
        <div class="callout info" style="font-size:.88rem;">
          Saving will add this entry to your browser's draft cache and let you preview it on the
          public pages immediately. To publish for real, click "Export updated JSON" below the list
          on the right.
        </div>
        <div class="right">
          <button class="btn ghost" type="reset">Clear</button>
          <button class="btn" type="submit">Save draft</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("entry-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var entry = collectForm(cfg);
    saveEntry(type, entry);
    renderForm(type);
    renderList(type);
    flash(`Draft saved. ${cfg.label} "${entry.id}" is now live in your local preview.`);
  });
}

function fieldHtml(f) {
  var id = "f-" + f.name;
  var input;
  var required = f.required ? "required" : "";
  if (f.type === "textarea") {
    input = `<textarea id="${id}" name="${f.name}" rows="${f.rows || 5}" ${required}
                       placeholder="${escapeHTML(f.placeholder || '')}"></textarea>`;
  } else if (f.type === "select") {
    input = `<select id="${id}" name="${f.name}" ${required}>
      ${f.options.map(function (o) { return `<option value="${escapeHTML(o)}">${escapeHTML(o || '-- none --')}</option>`; }).join("")}
    </select>`;
  } else {
    input = `<input type="${f.type || 'text'}" id="${id}" name="${f.name}" ${required}
                    placeholder="${escapeHTML(f.placeholder || '')}">`;
  }
  return `
    <div class="form-row">
      <label for="${id}">${escapeHTML(f.label)}${f.required ? ' *' : ''}</label>
      <div>
        ${input}
        ${f.hint ? `<div class="hint">${escapeHTML(f.hint)}</div>` : ''}
      </div>
    </div>
  `;
}

function collectForm(cfg) {
  var obj = {};
  for (var i = 0; i < cfg.fields.length; i++) {
    var f = cfg.fields[i];
    var el = document.getElementById("f-" + f.name);
    var val = el.value;
    if (f.isList) {
      val = val.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    } else if (f.isParagraphs) {
      val = val.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    if (val !== "" && val !== undefined && !(Array.isArray(val) && val.length === 0)) {
      obj[f.name] = val;
    }
  }
  return obj;
}

function getOverlay(type) {
  var raw = localStorage.getItem(LS_PREFIX + type);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function loadEntriesForAdmin(type) {
  var overlay = getOverlay(type);
  if (overlay) return Promise.resolve(overlay);
  return loadData(type);
}

function saveEntry(type, entry) {
  loadEntriesForAdmin(type).then(function (existing) {
    var arr = existing.slice();
    var idx = arr.findIndex(function (x) { return x.id === entry.id; });
    if (idx >= 0) arr[idx] = entry;
    else arr.unshift(entry);
    localStorage.setItem(LS_PREFIX + type, JSON.stringify(arr));
    renderList(type);
  }).catch(function (err) { alert("Failed to save: " + err.message); });
}

function deleteEntry(type, id) {
  loadEntriesForAdmin(type).then(function (existing) {
    var arr = existing.filter(function (x) { return x.id !== id; });
    localStorage.setItem(LS_PREFIX + type, JSON.stringify(arr));
    renderList(type);
    flash('Removed "' + id + '" from your local draft cache.');
  });
}

function exportJson(type) {
  loadEntriesForAdmin(type).then(function (arr) {
    var blob = new Blob([JSON.stringify(arr, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = FORMS[type].file;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 100);
  });
}

function clearOverlay(type) {
  if (!confirm("Clear all local drafts for " + FORMS[type].label + "? This will revert to data/" + FORMS[type].file + ".")) return;
  localStorage.removeItem(LS_PREFIX + type);
  renderList(type);
  flash("Local drafts cleared. Public pages will now use data/" + FORMS[type].file + ".");
}

function renderList(type) {
  var container = document.getElementById("list-area");
  var overlay = getOverlay(type);
  var entriesPromise = overlay ? Promise.resolve(overlay) : loadData(type);
  var isOverlay = !!overlay;

  entriesPromise.then(function (entries) {
    var dateField =
      type === "bills" ? "lastAction" :
      type === "orders" ? "issued" : "date";
    var sorted = sortByDate(entries, dateField);

    container.innerHTML = `
      <div class="form-card">
        <div class="flex between align-center">
          <h2 style="margin:0;">Existing ${escapeHTML(FORMS[type].label)}s</h2>
          <span class="muted" style="font-size:.85rem;">
            ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} &middot;
            ${isOverlay ? '<span style="color: var(--gold-600); font-weight:600;">DRAFT cache</span>' : 'data/' + FORMS[type].file}
          </span>
        </div>
        <hr class="divider">
        ${sorted.length === 0 ? '<p class="muted">None yet.</p>' :
          `<div style="max-height:520px; overflow-y:auto;">
            ${sorted.map(function (e) { return `
              <div style="padding:.75rem 0; border-bottom:1px solid var(--line);">
                <div class="flex between align-center" style="flex-wrap:wrap;">
                  <div>
                    <strong>${escapeHTML(e.id)}</strong>
                    <div style="font-size:.92rem;">${escapeHTML(e.title || '-')}</div>
                    <div class="muted" style="font-size:.78rem;">
                      ${formatDate(e[dateField] || '')}
                    </div>
                  </div>
                  <button class="btn ghost sm" onclick="deleteEntry('${type}','${escapeHTML(e.id)}')">
                    Remove from drafts
                  </button>
                </div>
              </div>
            `; }).join("")}
          </div>`}
        <hr class="divider">
        <div class="flex" style="flex-wrap:wrap;">
          <button class="btn gold" onclick="exportJson('${type}')">
            Export updated ${FORMS[type].file}
          </button>
          ${isOverlay ? `<button class="btn ghost" onclick="clearOverlay('${type}')">
            Clear local drafts
          </button>` : ''}
        </div>
        <p class="muted mt-2" style="font-size:.82rem;">
          After exporting, replace the file in your repo's <code>data/</code> folder
          and commit. The public site will pick it up on the next page load.
        </p>
      </div>
    `;
  }).catch(function (err) {
    container.innerHTML = '<div class="callout danger">Could not load: ' + escapeHTML(err.message) + '</div>';
  });
}

var flashTimer = null;
function flash(msg) {
  var existing = document.getElementById("flash");
  if (existing) existing.remove();
  var div = document.createElement("div");
  div.id = "flash";
  div.className = "callout";
  div.style.cssText = "position:fixed; bottom: 1.5rem; right: 1.5rem; z-index:1000; max-width: 420px; box-shadow: var(--shadow);";
  div.textContent = msg;
  document.body.appendChild(div);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(function () { div.remove(); }, 4000);
}

function bootAdmin() {
  if (isLoggedIn()) renderDashboard();
  else renderLogin();
}
