const validUsers = {
  participant: "credflex123",
  admin: "admin@123",
  tester: "test@123"
};

const sessionKey = "participant-access-session";
const contactStorageKey = "saved-contacts";
const draftStorageKey = "saved-drafts";
const themeStorageKey = "app-theme";

const loginScreen = document.getElementById("loginScreen");
const contentPage = document.getElementById("contentPage");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggleBtn = document.getElementById("themeToggle");
const contactForm = document.getElementById("contactForm");
const contactNameInput = document.getElementById("contactName");
const contactMobileInput = document.getElementById("contactMobile");
const contactList = document.getElementById("contactList");
const contactSelect = document.getElementById("contactSelect");
const messageText = document.getElementById("messageText");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const loadDraftBtn = document.getElementById("loadDraftBtn");
const draftSelect = document.getElementById("draftSelect");
const copyMessageBtn = document.getElementById("copyMessageBtn");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const statusMessage = document.getElementById("statusMessage");

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = type ? `message ${type}` : "message";
}

function showStatus(text, type = "") {
  statusMessage.textContent = text;
  statusMessage.className = type ? `status-message ${type}` : "status-message";
}

function isLoggedIn() {
  return sessionStorage.getItem(sessionKey) === "true";
}

function applyTheme(theme) {
  const activeTheme = theme || "light";
  document.body.setAttribute("data-theme", activeTheme);
  themeToggleBtn.textContent = activeTheme === "dark" ? "☀️ Light" : "🌙 Dark";
  localStorage.setItem(themeStorageKey, activeTheme);
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  contentPage.classList.add("hidden");
  usernameInput.focus();
}

function showContent(username) {
  loginScreen.classList.add("hidden");
  contentPage.classList.remove("hidden");
  document.getElementById("userNameLabel").textContent = username;
  sessionStorage.setItem(sessionKey, "true");
}

function getContacts() {
  try {
    return JSON.parse(localStorage.getItem(contactStorageKey)) || [];
  } catch {
    return [];
  }
}

function saveContacts(contacts) {
  localStorage.setItem(contactStorageKey, JSON.stringify(contacts));
}

function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(draftStorageKey)) || [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts) {
  localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
}

function renderContacts() {
  const contacts = getContacts();
  contactList.innerHTML = "";

  if (contacts.length === 0) {
    contactList.innerHTML = "<li class='contact-item'>No contacts added yet.</li>";
    return;
  }

  contactSelect.innerHTML = '<option value="">Choose a contact</option>';

  contacts.forEach((contact) => {
    const li = document.createElement("li");
    li.className = "contact-item";

    li.innerHTML = `
      <div>
        <div class="contact-name">${contact.name}</div>
        <div class="contact-mobile">${contact.mobile}</div>
      </div>
    `;

    contactList.appendChild(li);

    const option = document.createElement("option");
    option.value = contact.mobile;
    option.textContent = `${contact.name} (${contact.mobile})`;
    contactSelect.appendChild(option);
  });
}

function renderDrafts() {
  const drafts = getDrafts();
  draftSelect.innerHTML = '<option value="">Select a saved message</option>';

  if (!drafts.length) {
    return;
  }

  drafts.forEach((draft, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = draft.label || `Draft ${index + 1}`;
    draftSelect.appendChild(option);
  });
}

function addContact(event) {
  event.preventDefault();

  const name = contactNameInput.value.trim();
  const mobile = contactMobileInput.value.trim();

  if (!name || !mobile) {
    showStatus("Please fill in the contact name and mobile number.", "error");
    return;
  }

  const contacts = getContacts();
  const exists = contacts.some((contact) => contact.mobile === mobile);

  if (exists) {
    showStatus("This mobile number already exists.", "error");
    return;
  }

  contacts.push({ name, mobile });
  saveContacts(contacts);
  renderContacts();
  contactForm.reset();
  showStatus("Contact added successfully.", "success");
}

function saveDraft() {
  const text = messageText.value.trim();

  if (!text) {
    showStatus("Write a message before saving the draft.", "error");
    return;
  }

  const drafts = getDrafts();
  const label = `Draft ${drafts.length + 1}`;

  drafts.push({ label, text });
  saveDrafts(drafts);
  renderDrafts();
  showStatus("Draft saved successfully.", "success");
}

function loadDraft() {
  const selectedIndex = draftSelect.value;

  if (!selectedIndex) {
    showStatus("Please select a saved draft first.", "error");
    return;
  }

  const drafts = getDrafts();
  const selectedDraft = drafts[Number(selectedIndex)];

  if (!selectedDraft) {
    showStatus("Draft not found.", "error");
    return;
  }

  messageText.value = selectedDraft.text;
  showStatus("Draft loaded successfully.", "success");
}

async function copyMessage() {
  const text = messageText.value.trim();

  if (!text) {
    showStatus("There is no message to copy.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showStatus("Message copied to clipboard.", "success");
  } catch {
    showStatus("Copy failed. Please copy manually.", "error");
  }
}

function sendMessage() {
  const recipient = contactSelect.value;
  const text = messageText.value.trim();

  if (!recipient) {
    showStatus("Please select a recipient before sending.", "error");
    return;
  }

  if (!text) {
    showStatus("Message body cannot be empty.", "error");
    return;
  }

  const selectedContact = getContacts().find((contact) => contact.mobile === recipient);

  if (!selectedContact) {
    showStatus("Selected contact not found.", "error");
    return;
  }

  showStatus(
    `Message sent successfully to ${selectedContact.name} (${selectedContact.mobile}).`,
    "success"
  );

  messageText.value = "";
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showMessage(loginMessage, "Please enter both username and password.", "error");
    return;
  }

  if (validUsers[username] && validUsers[username] === password) {
    showContent(username);
    loginForm.reset();
    showMessage(loginMessage, "", "");
  } else {
    showMessage(loginMessage, "Invalid username or password. Please try again.", "error");
    loginForm.reset();
  }
});

togglePasswordBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePasswordBtn.textContent = isPassword ? "Hide" : "Show";
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(sessionKey);
  showLogin();
  showMessage(loginMessage, "You have been logged out.", "success");
});

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
});

contactForm.addEventListener("submit", addContact);
saveDraftBtn.addEventListener("click", saveDraft);
loadDraftBtn.addEventListener("click", loadDraft);
copyMessageBtn.addEventListener("click", copyMessage);
sendMessageBtn.addEventListener("click", sendMessage);

if (isLoggedIn()) {
  showContent("Participant");
} else {
  showLogin();
}

const savedTheme = localStorage.getItem(themeStorageKey);
applyTheme(savedTheme || "light");

renderContacts();
renderDrafts();
