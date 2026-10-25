
/* ── CATEGORY INFO ── */
const catInfo = {
  Road:        { color: "#ef4444", icon: "🛣️" },
  Garbage:     { color: "#f97316", icon: "🗑️" },
  Water:       { color: "#3b82f6", icon: "💧" },
  Electricity: { color: "#eab308", icon: "💡" },
  Safety:      { color: "#8b5cf6", icon: "🚨" },
  Environment: { color: "#22c55e", icon: "🌳" }
};

/* ── API BASE URL ── */
const API_URL = (window.location.protocol === 'file:')
  ? 'http://localhost:5000/api/issues'
  : (window.location.origin + '/api/issues');

/* ══════════════════════════════════════
   API HELPER FUNCTIONS
══════════════════════════════════════ */

/* Fetch all issues from the backend */
async function getIssues() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch issues');
    return await res.json();
  } catch (err) {
    console.error('Error fetching issues:', err);
    showToast('⚠️ Could not reach server. Is the backend running?');
    return [];
  }
}

/* POST a new issue to the backend (handles FormData with photos or JSON) */
async function createIssue(issueData) {
  const isFormData = (typeof FormData !== 'undefined') && (issueData instanceof FormData);
  const options = {
    method: 'POST',
    body: isFormData ? issueData : JSON.stringify(issueData)
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(API_URL, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create issue');
  }
  return await res.json();
}

/* PATCH an issue's status in MongoDB */
async function updateIssueStatus(id, newStatus) {
  const res = await fetch(API_URL + '/' + id + '/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update status');
  }
  return await res.json();
}

/* Change status from UI dropdown */
async function changeStatus(id, newStatus, selectEl) {
  try {
    const updated = await updateIssueStatus(id, newStatus);
    showToast(`✅ Status updated to "${newStatus}"`);

    // Update the class of the select element to match the new status color
    if (selectEl) {
      selectEl.className = 'status-select status-' + newStatus.toLowerCase().replace(' ', '-');
    }
  } catch (err) {
    console.error('Error changing status:', err);
    showToast('❌ Could not update status: ' + err.message);
    renderIssues(); // revert dropdown on error
  }
}

/* DELETE an issue by MongoDB _id */
async function deleteIssue(id) {
  const res = await fetch(API_URL + '/' + id, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete issue');
  return await res.json();
}

/* POST a vote on an issue */
async function voteOnIssue(id) {
  const res = await fetch(API_URL + '/' + id + '/vote', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to vote');
  return await res.json();
}


/* ── GLOBAL STATE ── */
var currentFilter       = "All";
var selectedPriority    = "Medium";
var leafletMap          = null;
var catChartInstance    = null;
var statusChartInstance = null;

/* This stores the ID of the issue the user wants to delete.
   It is set when they click the delete button,
   and used when they confirm deletion in the popup. */
var pendingDeleteId = null;


/* ══════════════════════════════════════
   DELETE FUNCTIONS
══════════════════════════════════════ */

/* Called when user clicks 🗑️ on an issue card. */
function askDelete(id) {
  pendingDeleteId = id;
  document.getElementById('modalOverlay').classList.add('show');
}

/* Called when user clicks "Cancel" in the popup */
function closeModal() {
  pendingDeleteId = null;
  document.getElementById('modalOverlay').classList.remove('show');
}

/* Called when user clicks "Yes, Delete" in the popup */
async function confirmDelete() {
  if (pendingDeleteId === null) return;
  try {
    await deleteIssue(pendingDeleteId);
    closeModal();
    showToast('✅ Issue deleted successfully');
    renderIssues();
  } catch (err) {
    closeModal();
    showToast('❌ Failed to delete issue');
    console.error(err);
  }
}


/* ══════════════════════════════════════
   TOAST NOTIFICATION
   Small message that appears briefly at bottom
══════════════════════════════════════ */
function showToast(message) {
  // Remove any existing toast first
  var existing = document.getElementById('toast');
  if (existing) existing.remove();

  // Create the toast element
  var toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Show it
  setTimeout(function() { toast.classList.add('show'); }, 10);

  // Hide and remove it after 3 seconds
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 400);
  }, 3000);
}


/* ══════════════════════════════════════
   TOGGLE THEME
══════════════════════════════════════ */
function toggleTheme() {
    var isLight = document.body.classList.contains('light');

    var theme = isLight ? 'dark' : 'light';

    localStorage.setItem('civiceye-theme', theme);

    loadTheme();
}
/* LOAD SAVED THEME */

function loadTheme() {
    var theme = localStorage.getItem('civiceye-theme') || 'dark';

    document.body.classList.toggle('light', theme === 'light');

    var btn = document.querySelector('.theme-toggle');

    if (btn) {
        btn.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

document.addEventListener('DOMContentLoaded', loadTheme);

/* ══════════════════════════════════════
   HOME PAGE — Stats + Category Grid
══════════════════════════════════════ */
async function updateHomeStats() {
  var issues = await getIssues();

  var totalEl    = document.getElementById('stat-total');
  var resolvedEl = document.getElementById('stat-resolved');
  var progressEl = document.getElementById('stat-progress');
  var pendingEl  = document.getElementById('stat-pending');

  if (totalEl)    totalEl.textContent    = issues.length;
  if (resolvedEl) resolvedEl.textContent = issues.filter(function(i) { return i.status === 'Resolved'; }).length;
  if (progressEl) progressEl.textContent = issues.filter(function(i) { return i.status === 'In Progress'; }).length;
  if (pendingEl)  pendingEl.textContent  = issues.filter(function(i) { return i.status === 'Reported'; }).length;

  var grid = document.getElementById('catGrid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.keys(catInfo).forEach(function(catName) {
    var info  = catInfo[catName];
    var count = issues.filter(function(i) { return i.category === catName; }).length;
    grid.innerHTML +=
      '<a href="issues.html?cat=' + catName + '" class="cat-card">' +
        '<div class="icon">' + info.icon + '</div>' +
        '<div class="name">' + catName + '</div>' +
        '<div class="count">' + count + ' issue' + (count !== 1 ? 's' : '') + '</div>' +
      '</a>';
  });
}


/* ══════════════════════════════════════
   REPORT PAGE — Image Preview
══════════════════════════════════════ */
function previewImage(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('previewImg').src             = e.target.result;
    document.getElementById('imagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}


/* ══════════════════════════════════════
   REPORT PAGE — Priority Selector
══════════════════════════════════════ */
function selectPriority(p) {
  selectedPriority = p;
  document.querySelectorAll('.priority-btn').forEach(function(btn) {
    btn.classList.remove('selected');
  });
  document.querySelectorAll('.priority-btn').forEach(function(btn) {
    if (btn.textContent.toLowerCase().includes(p.toLowerCase())) {
      btn.classList.add('selected');
    }
  });
}


/* ══════════════════════════════════════
   ISSUES PAGE — Category Filter
══════════════════════════════════════ */
function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.classList.remove('active');
  });
  var fb = document.getElementById('filter-' + f);
  if (fb) fb.classList.add('active');
  renderIssues();
}


/* ══════════════════════════════════════
   ISSUES PAGE — Render Cards
   This is the main function that builds
   all the issue cards on screen.
══════════════════════════════════════ */
async function renderIssues() {
  var issues = await getIssues();

  /* Read ?cat=Road from URL if coming from home page */
  var params   = new URLSearchParams(window.location.search);
  var catParam = params.get('cat');
  if (catParam && currentFilter === 'All') {
    currentFilter = catParam;
    var fb = document.getElementById('filter-' + catParam);
    if (fb) {
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      fb.classList.add('active');
    }
  }

  /* Apply search text filter */
  var searchInput = document.getElementById('searchInput');
  var search = searchInput ? searchInput.value.toLowerCase() : '';

  var filtered = issues.filter(function(issue) {
    var matchCat    = (currentFilter === 'All') || (issue.category === currentFilter);
    var matchSearch = (issue.title || '').toLowerCase().includes(search)    ||
                      (issue.location || '').toLowerCase().includes(search) ||
                      (issue.description || '').toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  var grid = document.getElementById('issuesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted);padding:20px;grid-column:1/-1;">No issues found.</p>';
    return;
  }

  filtered.forEach(function(issue) {
    var info = catInfo[issue.category] || { color: '#888', icon: '📌' };
    /* MongoDB uses _id */
    var id = issue._id;

    var dotClass = 'p-medium';
    if (issue.priority === 'High') dotClass = 'p-high';
    if (issue.priority === 'Low')  dotClass = 'p-low';

    var statusClass = 'status-reported';
    if (issue.status === 'In Progress') statusClass = 'status-progress';
    if (issue.status === 'Resolved')    statusClass = 'status-resolved';

    var dateStr = issue.date ? issue.date.split('T')[0] : 'N/A';

    var imageMarkup = '';
    if (issue.imageUrl) {
      imageMarkup =
        '<div class="issue-card-media" onclick="openImageModal(\'' + issue.imageUrl + '\', \'' + (issue.title || '').replace(/'/g, "\\'") + '\')">' +
          '<img src="' + issue.imageUrl + '" alt="' + (issue.title || '') + '" class="issue-card-img" onerror="this.parentElement.style.display=\'none\'" />' +
          '<div class="img-zoom-hint">🔍 View Photo</div>' +
        '</div>';
    }

    var statusSelectMarkup =
      '<div class="status-select-wrapper">' +
        '<select class="status-select ' + statusClass + '" onchange="changeStatus(\'' + id + '\', this.value, this)" title="Change issue status">' +
          '<option value="Reported"'    + (issue.status === 'Reported'    ? ' selected' : '') + '>🟡 Reported</option>' +
          '<option value="In Progress"' + (issue.status === 'In Progress' ? ' selected' : '') + '>🔵 In Progress</option>' +
          '<option value="Resolved"'    + (issue.status === 'Resolved'    ? ' selected' : '') + '>🟢 Resolved</option>' +
        '</select>' +
      '</div>';

    grid.innerHTML +=
      '<div class="issue-card" id="card-' + id + '">' +
        '<div class="issue-card-bar" style="background:' + info.color + '"></div>' +
        imageMarkup +
        '<div class="issue-card-body">' +

          /* Top row: category tag + interactive status selector */
          '<div class="issue-card-top">' +
            '<div class="issue-category-tag">' + info.icon + ' ' + issue.category + '</div>' +
            statusSelectMarkup +
          '</div>' +

          /* Issue info */
          '<div class="issue-title">'    + issue.title       + '</div>' +
          '<div class="issue-location">📍 ' + issue.location + '</div>' +
          '<div class="issue-desc">'     + issue.description + '</div>' +

          /* Footer: vote button + priority/date + DELETE button */
          '<div class="issue-footer">' +

            '<button class="vote-btn" id="vote-btn-' + id + '" onclick="vote(\'' + id + '\')">' +
              '👍 <span id="vote-' + id + '">' + issue.votes + '</span> votes' +
            '</button>' +

            '<div class="issue-date">' +
              '<span class="priority-dot ' + dotClass + '"></span>' +
              issue.priority + ' · ' + dateStr +
            '</div>' +

            '<button class="delete-btn" onclick="askDelete(\'' + id + '\')" title="Delete this issue">' +
              '🗑️ Delete' +
            '</button>' +

          '</div>' +
        '</div>' +
      '</div>';
  });
}

/* ══════════════════════════════════════
   IMAGE LIGHTBOX MODAL
══════════════════════════════════════ */
function openImageModal(imgSrc, title) {
  var modal = document.getElementById('imageLightboxModal');
  if (!modal) return;
  var img = document.getElementById('lightboxImg');
  var titleEl = document.getElementById('lightboxTitle');
  if (img) img.src = imgSrc;
  if (titleEl) titleEl.textContent = title || 'Issue Photo';
  modal.classList.add('show');
}

function closeImageModal() {
  var modal = document.getElementById('imageLightboxModal');
  if (modal) modal.classList.remove('show');
}


/* ══════════════════════════════════════
   ISSUES PAGE — Vote
══════════════════════════════════════ */
async function vote(id) {
  try {
    var updated = await voteOnIssue(id);
    var el = document.getElementById('vote-' + id);
    if (el) el.textContent = updated.votes;
  } catch (err) {
    showToast('❌ Could not vote. Try again.');
    console.error(err);
  }
}


/* ══════════════════════════════════════
   MAP PAGE — Leaflet Map
══════════════════════════════════════ */
async function initMap() {
  if (leafletMap) { leafletMap.invalidateSize(); return; }

  leafletMap = L.map('map').setView([16.55, 81.52], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(leafletMap);

  var issues = await getIssues();
  issues.forEach(function(issue) {
    if (!issue.lat || !issue.lng) return;
    var info   = catInfo[issue.category] || { color: '#888', icon: '📌' };
    var marker = L.circleMarker([issue.lat, issue.lng], {
      radius: 10, fillColor: info.color,
      color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
    });

    var imgHtml = issue.imageUrl 
      ? '<img src="' + issue.imageUrl + '" style="width:100%;max-height:120px;object-fit:cover;border-radius:6px;margin:6px 0;" /><br>' 
      : '';

    marker.bindPopup(
      imgHtml +
      '<b>' + issue.title + '</b><br>' +
      '📍 ' + issue.location + '<br>' +
      info.icon + ' ' + issue.category + '<br>' +
      'Status: <b>' + issue.status + '</b><br>' +
      'Votes: ' + issue.votes
    );
    marker.addTo(leafletMap);
  });
}


/* ══════════════════════════════════════
   DASHBOARD PAGE — Charts + Table
══════════════════════════════════════ */
async function renderDashboard() {
  var issues = await getIssues();

  var totalEl    = document.getElementById('d-total');
  var resolvedEl = document.getElementById('d-resolved');
  var progressEl = document.getElementById('d-progress');
  var pendingEl  = document.getElementById('d-pending');

  if (totalEl)    totalEl.textContent    = issues.length;
  if (resolvedEl) resolvedEl.textContent = issues.filter(function(i) { return i.status === 'Resolved'; }).length;
  if (progressEl) progressEl.textContent = issues.filter(function(i) { return i.status === 'In Progress'; }).length;
  if (pendingEl)  pendingEl.textContent  = issues.filter(function(i) { return i.status === 'Reported'; }).length;

  var catCanvas = document.getElementById('catChart');
  if (!catCanvas) return;

  var catLabels = Object.keys(catInfo);
  var catCounts = catLabels.map(function(c) { return issues.filter(function(i) { return i.category === c; }).length; });
  var catColors = catLabels.map(function(c) { return catInfo[c].color; });

  if (catChartInstance) catChartInstance.destroy();
  catChartInstance = new Chart(catCanvas, {
    type: 'doughnut',
    data: { labels: catLabels, datasets: [{ data: catCounts, backgroundColor: catColors, borderWidth: 2 }] },
    options: { plugins: { legend: { labels: { color: '#e8eaf0' } } } }
  });

  var statusCanvas = document.getElementById('statusChart');
  if (statusCanvas) {
    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(statusCanvas, {
      type: 'bar',
      data: {
        labels: ['Reported', 'In Progress', 'Resolved'],
        datasets: [{
          label: 'Issues',
          data: [
            issues.filter(function(i) { return i.status === 'Reported'; }).length,
            issues.filter(function(i) { return i.status === 'In Progress'; }).length,
            issues.filter(function(i) { return i.status === 'Resolved'; }).length
          ],
          backgroundColor: ['#3b82f6', '#eab308', '#22c55e'],
          borderRadius: 6
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8892a4' }, grid: { color: '#2a3045' } },
          y: { ticks: { color: '#8892a4' }, grid: { color: '#2a3045' } }
        }
      }
    });
  }

  var sorted = issues.slice().sort(function(a, b) { return b.votes - a.votes; }).slice(0, 5);
  var tbody  = document.getElementById('topIssuesTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  sorted.forEach(function(issue) {
    var statusClass = 'status-reported';
    if (issue.status === 'In Progress') statusClass = 'status-progress';
    if (issue.status === 'Resolved')    statusClass = 'status-resolved';
    var icon = catInfo[issue.category] ? catInfo[issue.category].icon : '📌';
    tbody.innerHTML +=
      '<tr>' +
        '<td>' + issue.title + '</td>' +
        '<td>' + icon + ' ' + issue.category + '</td>' +
        '<td>' + issue.location + '</td>' +
        '<td>👍 ' + issue.votes + '</td>' +
        '<td><span class="issue-status ' + statusClass + '">' + issue.status + '</span></td>' +
      '</tr>';
  });
}
/* ── handleCategoryChange() ──
   Called every time the user picks a category.
   If they pick "Other", show the custom text box.
   If they pick anything else, hide it. */
function handleCategoryChange() {
  var select   = document.getElementById('issueCategory');
  var otherBox = document.getElementById('otherCategoryBox');

  if (select.value === 'Other') {
    otherBox.style.display = 'block'; // show the text input
  } else {
    otherBox.style.display = 'none';  // hide it
    document.getElementById('otherCategoryInput').value = ''; // clear it
  }
}