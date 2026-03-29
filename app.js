/* ── CATEGORY INFO ── */
const catInfo = {
  Road:        { color: "#ef4444", icon: "🛣️" },
  Garbage:     { color: "#f97316", icon: "🗑️" },
  Water:       { color: "#3b82f6", icon: "💧" },
  Electricity: { color: "#eab308", icon: "💡" },
  Safety:      { color: "#8b5cf6", icon: "🚨" },
  Environment: { color: "#22c55e", icon: "🌳" }
};

/* ── DEFAULT SAMPLE ISSUES ──
   Loaded once on first visit into localStorage */
var defaultIssues = [
  {
    id: 1, title: "Large pothole near school",
    category: "Road", location: "MG Road, Near Govt School",
    description: "A deep pothole has formed causing accidents. Needs urgent repair.",
    priority: "High", status: "In Progress", votes: 42,
    date: "2025-04-10", lat: 16.55, lng: 81.52, voted: false
  },
  {
    id: 2, title: "Garbage dump overflowing",
    category: "Garbage", location: "Station Road",
    description: "The garbage bin near Station Road is overflowing for 3 days.",
    priority: "High", status: "Reported", votes: 38,
    date: "2025-04-11", lat: 16.545, lng: 81.525, voted: false
  },
  {
    id: 3, title: "Broken streetlight",
    category: "Electricity", location: "Nehru Street",
    description: "Streetlight not working for a week. Area is very dark at night.",
    priority: "Medium", status: "Reported", votes: 25,
    date: "2025-04-12", lat: 16.558, lng: 81.515, voted: false
  },
  {
    id: 4, title: "Water pipe leakage",
    category: "Water", location: "Rajaji Nagar",
    description: "Water leaking from a broken pipe, wasting water for 5 days.",
    priority: "High", status: "Resolved", votes: 30,
    date: "2025-04-08", lat: 16.542, lng: 81.534, voted: false
  },
  {
    id: 5, title: "Fallen tree blocking road",
    category: "Environment", location: "Park Avenue",
    description: "A large tree fell during last night's storm, blocking half the road.",
    priority: "High", status: "Resolved", votes: 18,
    date: "2025-04-09", lat: 16.562, lng: 81.51, voted: false
  },
  {
    id: 6, title: "Illegal dumping near park",
    category: "Garbage", location: "Gandhi Park",
    description: "People are illegally dumping construction waste near the park entrance.",
    priority: "Medium", status: "Reported", votes: 22,
    date: "2025-04-13", lat: 16.548, lng: 81.528, voted: false
  }
];

/* ── Load issues from localStorage (or use defaults on first visit) ── */
if (!localStorage.getItem('civicIssues')) {
  localStorage.setItem('civicIssues', JSON.stringify(defaultIssues));
}

/* Returns the issues array from localStorage */
function getIssues() {
  return JSON.parse(localStorage.getItem('civicIssues') || '[]');
}

/* Saves the updated issues array back to localStorage */
function saveIssues(arr) {
  localStorage.setItem('civicIssues', JSON.stringify(arr));
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

/* Called when user clicks 🗑️ on an issue card.
   Saves the issue ID and shows the confirm popup. */
function askDelete(id) {
  pendingDeleteId = id;             // remember which issue to delete
  document.getElementById('modalOverlay').classList.add('show'); // show popup
}

/* Called when user clicks "Cancel" in the popup */
function closeModal() {
  pendingDeleteId = null;           // forget the ID
  document.getElementById('modalOverlay').classList.remove('show'); // hide popup
}

/* Called when user clicks "Yes, Delete" in the popup */
function confirmDelete() {
  if (pendingDeleteId === null) return; // safety check

  // Get all issues, filter out the one to delete
  var issues = getIssues();
  var updated = issues.filter(function(i) { return i.id !== pendingDeleteId; });

  saveIssues(updated);   // save the updated list
  closeModal();          // hide the popup
  renderIssues();        // re-draw the cards without the deleted one

  // Show a small toast notification at the bottom
  showToast('✅ Issue deleted successfully');
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
  document.body.classList.toggle('light');
  var btn = document.querySelector('.theme-toggle');
  btn.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
}


/* ══════════════════════════════════════
   HOME PAGE — Stats + Category Grid
══════════════════════════════════════ */
function updateHomeStats() {
  var issues = getIssues();

  document.getElementById('stat-total').textContent    = issues.length;
  document.getElementById('stat-resolved').textContent = issues.filter(function(i) { return i.status === 'Resolved'; }).length;
  document.getElementById('stat-progress').textContent = issues.filter(function(i) { return i.status === 'In Progress'; }).length;
  document.getElementById('stat-pending').textContent  = issues.filter(function(i) { return i.status === 'Reported'; }).length;

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
function renderIssues() {
  var issues = getIssues();

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
    var matchSearch = issue.title.toLowerCase().includes(search)    ||
                      issue.location.toLowerCase().includes(search) ||
                      issue.description.toLowerCase().includes(search);
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

    var dotClass = 'p-medium';
    if (issue.priority === 'High') dotClass = 'p-high';
    if (issue.priority === 'Low')  dotClass = 'p-low';

    var statusClass = 'status-reported';
    if (issue.status === 'In Progress') statusClass = 'status-progress';
    if (issue.status === 'Resolved')    statusClass = 'status-resolved';

    grid.innerHTML +=
      '<div class="issue-card" id="card-' + issue.id + '">' +
        '<div class="issue-card-bar" style="background:' + info.color + '"></div>' +
        '<div class="issue-card-body">' +

          /* Top row: category tag + status badge */
          '<div class="issue-card-top">' +
            '<div class="issue-category-tag">' + info.icon + ' ' + issue.category + '</div>' +
            '<div class="issue-status ' + statusClass + '">' + issue.status + '</div>' +
          '</div>' +

          /* Issue info */
          '<div class="issue-title">'    + issue.title       + '</div>' +
          '<div class="issue-location">📍 ' + issue.location + '</div>' +
          '<div class="issue-desc">'     + issue.description + '</div>' +

          /* Footer: vote button + priority/date + DELETE button */
          '<div class="issue-footer">' +

            '<button class="vote-btn ' + (issue.voted ? 'voted' : '') + '" onclick="vote(' + issue.id + ')">' +
              '👍 <span id="vote-' + issue.id + '">' + issue.votes + '</span> votes' +
            '</button>' +

            '<div class="issue-date">' +
              '<span class="priority-dot ' + dotClass + '"></span>' +
              issue.priority + ' · ' + issue.date +
            '</div>' +

            /* 🗑️ Delete button — calls askDelete() which shows confirmation popup */
            '<button class="delete-btn" onclick="askDelete(' + issue.id + ')" title="Delete this issue">' +
              '🗑️ Delete' +
            '</button>' +

          '</div>' +
        '</div>' +
      '</div>';
  });
}


/* ══════════════════════════════════════
   ISSUES PAGE — Vote Toggle
══════════════════════════════════════ */
function vote(id) {
  var issues = getIssues();
  var issue  = issues.find(function(i) { return i.id === id; });
  if (!issue) return;

  if (issue.voted) { issue.votes--; issue.voted = false; }
  else             { issue.votes++; issue.voted = true; }

  saveIssues(issues);

  var el = document.getElementById('vote-' + id);
  if (el) el.textContent = issue.votes;
  var btn = el ? el.closest('.vote-btn') : null;
  if (btn) {
    if (issue.voted) btn.classList.add('voted');
    else             btn.classList.remove('voted');
  }
}


/* ══════════════════════════════════════
   MAP PAGE — Leaflet Map
══════════════════════════════════════ */
function initMap() {
  if (leafletMap) { leafletMap.invalidateSize(); return; }

  leafletMap = L.map('map').setView([16.55, 81.52], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(leafletMap);

  var issues = getIssues();
  issues.forEach(function(issue) {
    var info   = catInfo[issue.category] || { color: '#888', icon: '📌' };
    var marker = L.circleMarker([issue.lat, issue.lng], {
      radius: 10, fillColor: info.color,
      color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
    });
    marker.bindPopup(
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
function renderDashboard() {
  var issues = getIssues();

  document.getElementById('d-total').textContent    = issues.length;
  document.getElementById('d-resolved').textContent = issues.filter(function(i) { return i.status === 'Resolved'; }).length;
  document.getElementById('d-progress').textContent = issues.filter(function(i) { return i.status === 'In Progress'; }).length;
  document.getElementById('d-pending').textContent  = issues.filter(function(i) { return i.status === 'Reported'; }).length;

  var catLabels = Object.keys(catInfo);
  var catCounts = catLabels.map(function(c) { return issues.filter(function(i) { return i.category === c; }).length; });
  var catColors = catLabels.map(function(c) { return catInfo[c].color; });

  if (catChartInstance) catChartInstance.destroy();
  catChartInstance = new Chart(document.getElementById('catChart'), {
    type: 'doughnut',
    data: { labels: catLabels, datasets: [{ data: catCounts, backgroundColor: catColors, borderWidth: 2 }] },
    options: { plugins: { legend: { labels: { color: '#e8eaf0' } } } }
  });

  if (statusChartInstance) statusChartInstance.destroy();
  statusChartInstance = new Chart(document.getElementById('statusChart'), {
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

  var sorted = issues.slice().sort(function(a, b) { return b.votes - a.votes; }).slice(0, 5);
  var tbody  = document.getElementById('topIssuesTable');
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