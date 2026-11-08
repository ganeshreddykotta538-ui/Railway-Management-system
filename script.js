
const TOTAL_PLATFORMS = 6;
let trains = [];

// AUTHENTICATION

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("railwayUser"));
  } catch {
    return null;
  }
}

function showRegister() {
  loginForm.hidden = true;
  registerForm.hidden = false;
  document.getElementById("loginSwitch").hidden = false;
  document.getElementById("signupSwitch").hidden = true;
  document.getElementById("authTitle").textContent = "Create Account";
  document.getElementById("authSubtitle").textContent =
    "Railway Control Room Management";
  authMessage.textContent = "";
}

function showLogin() {
  registerForm.hidden = true;
  loginForm.hidden = false;
  document.getElementById("loginSwitch").hidden = true;
  document.getElementById("signupSwitch").hidden = false;
  document.getElementById("authTitle").textContent = "Welcome Back";
  document.getElementById("authSubtitle").textContent =
    "Login to Railway Control Room";
  authMessage.textContent = "";
}

document.getElementById("showLogin").addEventListener("click", e => {
  e.preventDefault();
  showLogin();
});

document.getElementById("showSignup").addEventListener("click", e => {
  e.preventDefault();
  showRegister();
});

registerForm.addEventListener("submit", e => {
  e.preventDefault();

  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    authMessage.style.color = "#f87171";
    authMessage.textContent = "Passwords do not match!";
    return;
  }

  if (getUser()) {
    authMessage.style.color = "#f87171";
    authMessage.textContent =
      "An account already exists in this browser. Please login.";
    return;
  }

  localStorage.setItem(
    "railwayUser",
    JSON.stringify({ username, password })
  );

  registerForm.reset();
  authMessage.style.color = "#4ade80";
  authMessage.textContent = "Account created! Please login.";

  showLogin();
  authMessage.textContent = "Account created! Please login.";
});

loginForm.addEventListener("submit", e => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const user = getUser();

  if (user && user.username === username && user.password === password) {
    loginPage.hidden = true;
    dashboard.hidden = false;
    loginForm.reset();
    render();
    startClock();
  } else {
    authMessage.style.color = "#f87171";
    authMessage.textContent = "Invalid username or password!";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  dashboard.hidden = true;
  loginPage.hidden = false;
  showLogin();
});

// TIME FUNCTIONS

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function overlaps(a, b) {
  const aStart = toMinutes(a.arrival);
  let aEnd = toMinutes(a.departure);

  const bStart = toMinutes(b.arrival);
  let bEnd = toMinutes(b.departure);

  if (aEnd <= aStart) aEnd += 1440;
  if (bEnd <= bStart) bEnd += 1440;

  return (
    (aStart < bEnd && bStart < aEnd) ||
    (aStart < bEnd - 1440 && bStart - 1440 < aEnd) ||
    (aStart - 1440 < bEnd && bStart < aEnd - 1440)
  );
}

// PLATFORM ALLOCATION

function findPlatform(train) {
  for (let p = 1; p <= TOTAL_PLATFORMS; p++) {
    const conflict = trains.some(existing =>
      existing.platform === p && overlaps(train, existing)
    );

    if (!conflict) return p;
  }

  return null;
}

function allocateWaiting() {
  trains.filter(t => !t.platform).forEach(train => {
    const platform = findPlatform(train);

    if (platform) {
      train.platform = platform;
    }
  });
}

// ADD TRAIN

document.getElementById("trainForm").addEventListener("submit", e => {
  e.preventDefault();

  const number = document.getElementById("trainNumber").value.trim();
  const name = document.getElementById("trainName").value.trim();
  const arrival = document.getElementById("arrival").value;
  const departure = document.getElementById("departure").value;

  if (arrival === departure) {
    showResult("Arrival and departure cannot be the same.", false);
    return;
  }

  if (trains.some(t => t.number.toLowerCase() === number.toLowerCase())) {
    showResult("This train number already exists.", false);
    return;
  }

  const train = {
    id: Date.now(),
    number,
    name,
    arrival,
    departure,
    platform: null
  };

  train.platform = findPlatform(train);
  trains.push(train);

  if (train.platform) {
    showResult("Train added successfully! Platform " + train.platform + " allocated.", true);
  } else {
    showResult("Train added to waiting list. No platform is currently available.", false);
  }

  e.target.reset();
  render();
});

function showResult(message, success) {
  const result = document.getElementById("result");
  result.textContent = message;
  result.style.color = success ? "#4ade80" : "#fbbf24";
}

// DEPART TRAIN

document.getElementById("trainTable").addEventListener("click", e => {
  const button = e.target.closest("[data-depart]");
  if (!button) return;

  const id = Number(button.dataset.depart);

  trains = trains.filter(t => t.id !== id);
  allocateWaiting();
  render();
});

// RENDER PLATFORM CARDS

function renderPlatforms() {
  const grid = document.getElementById("platformGrid");
  grid.innerHTML = "";

  for (let p = 1; p <= TOTAL_PLATFORMS; p++) {
    const train = trains.find(t => t.platform === p);

    const card = document.createElement("div");
    card.className = "platform";

    card.innerHTML = `
      <div class="platform-top">
        <h3>Platform ${p}</h3>
        <span class="platform-status ${train ? "busy" : ""}">
          ${train ? "OCCUPIED" : "AVAILABLE"}
        </span>
      </div>
      <div class="platform-info">
        <strong>${train ? escapeHTML(train.name) : "No train assigned"}</strong>
        <small>${train ? escapeHTML(train.number) + " · " +
          train.arrival + " – " + train.departure : "Ready for allocation"}</small>
      </div>
    `;

    grid.appendChild(card);
  }
}

// RENDER TRAIN TABLE

function renderTable() {
  const table = document.getElementById("trainTable");

  if (trains.length === 0) {
    table.innerHTML =
      '<tr><td colspan="7" class="empty">No trains added yet.</td></tr>';
    return;
  }

  table.innerHTML = trains.map(train => `
    <tr>
      <td>${escapeHTML(train.number)}</td>
      <td>${escapeHTML(train.name)}</td>
      <td>${train.arrival}</td>
      <td>${train.departure}</td>
      <td>${train.platform ? "Platform " + train.platform : "Waiting"}</td>
      <td>
        <span class="status-tag ${train.platform ? "" : "waiting"}">
          ${train.platform ? "Allocated" : "Waiting"}
        </span>
      </td>
      <td>
        <button class="depart-btn" data-depart="${train.id}">
          Depart
        </button>
      </td>
    </tr>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// UPDATE DASHBOARD

function render() {
  const occupiedPlatforms = new Set(
    trains.filter(t => t.platform).map(t => t.platform)
  );

  const waitingTrains = trains.filter(t => !t.platform).length;

  document.getElementById("totalTrains").textContent = trains.length;
  document.getElementById("occupied").textContent = occupiedPlatforms.size;
  document.getElementById("available").textContent =
    TOTAL_PLATFORMS - occupiedPlatforms.size;
  document.getElementById("waiting").textContent = waitingTrains;

  renderPlatforms();
  renderTable();
}

// DEMO DATA

document.getElementById("demoBtn").addEventListener("click", () => {
  trains = [];

  const demo = [
    ["12001", "Shatabdi Express", "08:00", "09:00"],
    ["12625", "Kerala Express", "08:30", "09:30"],
    ["12723", "Telangana Express", "09:00", "10:00"],
    ["12005", "Kalka Shatabdi", "10:00", "11:00"],
    ["12951", "Mumbai Rajdhani", "11:00", "12:00"],
    ["12615", "Grand Trunk Express", "12:00", "13:00"],
    ["12839", "Chennai Mail", "08:45", "09:15"]
  ];

  demo.forEach((data, index) => {
    const train = {
      id: Date.now() + index,
      number: data[0],
      name: data[1],
      arrival: data[2],
      departure: data[3],
      platform: null
    };

    train.platform = findPlatform(train);
    trains.push(train);
  });

  showResult("Demo train data loaded successfully!", true);
  render();
});

// RESET

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Are you sure you want to clear all train data?")) return;

  trains = [];
  render();
  showResult("All train data has been cleared.", true);
});

// LIVE CLOCK

function startClock() {
  function updateClock() {
    document.getElementById("clock").textContent =
      new Date().toLocaleTimeString("en-IN");
  }

  updateClock();
  if (window.clockInterval) clearInterval(window.clockInterval);
  window.clockInterval = setInterval(updateClock, 1000);
}

render();
