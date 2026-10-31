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
const pickContactBtn = document.getElementById("pickContactBtn");
const contactSearchInput = document.getElementById("contactSearch");
const contactSelect = document.getElementById("contactSelect");
const selectedContactInfo = document.getElementById("selectedContactInfo");
const contactFileInput = document.getElementById("contactFile");
const importContactsBtn = document.getElementById("importContactsBtn");
const messageText = document.getElementById("messageText");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const loadDraftBtn = document.getElementById("loadDraftBtn");
const draftSelect = document.getElementById("draftSelect");
const copyMessageBtn = document.getElementById("copyMessageBtn");
const sendSmsBtn = document.getElementById("sendSmsBtn");
const sendWhatsAppBtn = document.getElementById("sendWhatsAppBtn");
const statusMessage = document.getElementById("statusMessage");

function bindIfExists(element, eventName, handler) {
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function showMessage(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = type ? `message ${type}` : "message";
}

function showStatus(text, type = "") {
  if (!statusMessage) return;
  statusMessage.textContent = text;
  statusMessage.className = type ? `status-message ${type}` : "status-message";
}

function isLoggedIn() {
  return sessionStorage.getItem(sessionKey) === "true";
}

function applyTheme(theme) {
  const activeTheme = theme || "light";
  document.body.setAttribute("data-theme", activeTheme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = activeTheme === "dark" ? "☀️ Light" : "🌙 Dark";
  }
  localStorage.setItem(themeStorageKey, activeTheme);
}

function showLogin() {
  if (loginScreen) loginScreen.classList.remove("hidden");
  if (contentPage) contentPage.classList.add("hidden");
  if (usernameInput) usernameInput.focus();
}

function showContent(username) {
  if (loginScreen) loginScreen.classList.add("hidden");
  if (contentPage) contentPage.classList.remove("hidden");
  const userNameLabel = document.getElementById("userNameLabel");
  if (userNameLabel) userNameLabel.textContent = username;
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

function normalizePhone(value) {
  if (!value) return "";
  const cleaned = value.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("+") ? cleaned : cleaned.replace(/^0+/, "");
}

function normalizePhoneForIntent(value) {
  if (!value) return "";
  return value.replace(/[^\d+]/g, "").replace(/^0+/, "") || "";
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function parseVCard(text) {
  const cards = text.split(/BEGIN:VCARD/gi);
  const contacts = [];

  cards.forEach((card) => {
    if (!card.includes("END:VCARD")) return;

    const lines = card
      .replace(/END:VCARD.*$/is, "")
      .split(/\r?\n/)
      .map((line) => line.trim());

    let name = "";
    let mobile = "";

    lines.forEach((line) => {
      if (!line) return;

      if (line.toUpperCase().startsWith("FN:")) {
        name = line.replace(/^FN:/i, "").trim();
      }

      if (line.toUpperCase().startsWith("N:")) {
        const parsedName = line.replace(/^N:/i, "").trim();
        if (!name && parsedName) {
          name = parsedName.split(";").filter(Boolean).reverse().join(" ").trim();
        }
      }

      if (line.toUpperCase().startsWith("TEL")) {
        const value = line.split(":").slice(1).join(":").trim();
        if (!mobile) {
          mobile = normalizePhone(value);
        }
      }
    });

    if (name || mobile) {
      contacts.push({
        name: name || "Imported Contact",
        mobile: mobile || ""
      });
    }
  });

  return contacts.filter((contact) => contact.mobile);
}

function parseCSV(text) {
  const rows = text.split(/\r?\n/).filter(Boolean);
  const contacts = [];

  rows.slice(1).forEach((row) => {
    const cells = row.split(",");
    const name = (cells[0] || "").trim();
    const mobile = normalizePhone(cells[1] || cells[2] || "");

    if (name && mobile) {
      contacts.push({ name, mobile });
    }
  });

  return contacts;
}

function mergeImportedContacts(newContacts) {
  const existing = getContacts();
  const merged = [...existing];

  newContacts.forEach((contact) => {
    const exists = merged.some((item) => item.mobile === contact.mobile || item.name === contact.name);
    if (!exists) {
      merged.push(contact);
    }
  });

  saveContacts(merged);
  renderContacts();
}

function importContactsFromFile() {
  if (!contactFileInput) {
    showStatus("Import controls are not available on this page.", "error");
    return;
  }

  const file = contactFileInput.files[0];

  if (!file) {
    showStatus("Please select a .vcf or .csv file first.", "error");
    return;
  }

  const fileName = file.name.toLowerCase();

  file.text()
    .then((content) => {
      let contacts = [];

      if (fileName.endsWith(".vcf")) {
        contacts = parseVCard(content);
      } else if (fileName.endsWith(".csv")) {
        contacts = parseCSV(content);
      } else {
        showStatus("Unsupported file type. Please upload a .vcf or .csv file.", "error");
        return;
      }

      if (!contacts.length) {
        showStatus("No valid contacts were found in the file.", "error");
        return;
      }

      mergeImportedContacts(contacts);
      contactFileInput.value = "";
      showStatus(`${contacts.length} contact(s) imported successfully.`, "success");
    })
    .catch(() => {
      showStatus("Unable to read the selected file. Please try again.", "error");
    });
}

async function pickContactFromDevice() {
  if (!("contacts" in navigator) || !("select" in navigator.contacts)) {
    showStatus("Contact picker is not supported in this browser. Please add the mobile number manually.", "error");
    return;
  }

  try {
    const contacts = await navigator.contacts.select(["name", "tel"], { multiple: true });

    if (!contacts || !contacts.length) {
      showStatus("No contact was selected.", "error");
      return;
    }

    const imported = contacts
      .map((contact) => {
        const phone = contact.tel && contact.tel[0] ? contact.tel[0].replace(/[^\d+]/g, "") : "";
        const name = contact.name || "Imported Contact";
        return phone ? { name, mobile: phone } : null;
      })
      .filter(Boolean);

    if (!imported.length) {
      showStatus("Selected contact does not contain a valid phone number.", "error");
      return;
    }

    mergeImportedContacts(imported);
    showStatus(`${imported.length} contact(s) added from your device.`, "success");
  } catch (error) {
    console.error(error);
    showStatus("Your browser blocked access to phone contacts. Please use the manual form or import a .vcf file.", "error");
  }
}

function getSelectedContacts() {
  if (!contactSelect) return [];
  const selectedValues = Array.from(contactSelect.selectedOptions).map((option) => option.value);
  return getContacts().filter((contact) => selectedValues.includes(contact.mobile));
}

function updateSelectedContactInfo() {
  if (!selectedContactInfo) return;
  const selectedContacts = getSelectedContacts();

  if (!selectedContacts.length) {
    selectedContactInfo.textContent = "No contact selected";
    return;
  }

  const names = selectedContacts.map((contact) => `${contact.name} (${contact.mobile})`);
  selectedContactInfo.textContent = names.length > 3
    ? `${names.length} contacts selected: ${names.slice(0, 3).join(", ")} ...`
    : names.join(", ");
}

function renderContacts() {
  const searchTerm = (contactSearchInput ? (contactSearchInput.value || "") : "").trim().toLowerCase();
  const previousSelected = contactSelect ? new Set(Array.from(contactSelect.selectedOptions).map((option) => option.value)) : new Set();
  const contacts = getContacts().filter((contact) => {
    const name = (contact.name || "").toLowerCase();
    const mobile = (contact.mobile || "").toLowerCase();
    return name.includes(searchTerm) || mobile.includes(searchTerm);
  });

  if (!contactSelect) return;
  contactSelect.innerHTML = "";

  if (!contacts.length) {
    const placeholder = document.createElement("option");
    placeholder.textContent = "No contact match found";
    placeholder.disabled = true;
    contactSelect.appendChild(placeholder);
    contactSelect.size = 1;
    if (selectedContactInfo) selectedContactInfo.textContent = "No contact selected";
    return;
  }

  contacts.forEach((contact) => {
    const option = document.createElement("option");
    option.value = contact.mobile;
    option.textContent = `${contact.name} — ${contact.mobile}`;
    option.selected = previousSelected.has(contact.mobile);
    contactSelect.appendChild(option);
  });

  contactSelect.size = Math.min(10, Math.max(contacts.length, 1));
  updateSelectedContactInfo();
}

bindIfExists(contactSearchInput, "input", renderContacts);
bindIfExists(contactSelect, "change", updateSelectedContactInfo);

function renderDrafts() {
  if (!draftSelect) return;
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
  if (event) event.preventDefault();

  if (!contactNameInput || !contactMobileInput) {
    showStatus("Contact form fields are missing.", "error");
    return;
  }

  const name = contactNameInput.value.trim();
  const mobile = contactMobileInput.value.trim();

  if (!name || !mobile) {
    showStatus("Please fill in the contact name and mobile number.", "error");
    return;
  }

  const contacts = getContacts();
  const exists = contacts.some((contact) => contact.mobile === mobile || contact.name === name);

  if (exists) {
    showStatus("This contact already exists.", "error");
    return;
  }

  contacts.push({ name, mobile });
  saveContacts(contacts);
  renderContacts();
  contactForm.reset();
  showStatus("Contact added successfully.", "success");
}

function saveDraft() {
  if (!messageText) {
    showStatus("Message composer is not available.", "error");
    return;
  }

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
  if (!draftSelect) {
    showStatus("Draft selector is unavailable.", "error");
    return;
  }

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

  if (messageText) {
    messageText.value = selectedDraft.text;
  }
  showStatus("Draft loaded successfully.", "success");
}

async function copyMessage() {
  if (!messageText) {
    showStatus("Message composer is not available.", "error");
    return;
  }

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

function triggerSMSToContactIndex(index, contacts, messageTextValue) {
  if (index >= contacts.length) {
    showStatus("Completed sending to all selected contacts.", "success");
    return;
  }

  const contact = contacts[index];
  const cleanMobile = normalizePhoneForIntent(contact.mobile);

  if (!cleanMobile) {
    triggerSMSToContactIndex(index + 1, contacts, messageTextValue);
    return;
  }

  const isIOS = isIOSDevice();
  const queryParam = isIOS ? "&body=" : "?body=";
  const smsUrl = `sms:${cleanMobile}${queryParam}${encodeURIComponent(messageTextValue)}`;

  const proceed = window.confirm(`Send SMS to ${contact.name} (${contact.mobile})? (${index + 1}/${contacts.length})`);

  if (!proceed) {
    showStatus("SMS sending cancelled.", "error");
    return;
  }

  showStatus(`Opening SMS to ${contact.name}.`, "success");
  window.location.href = smsUrl;
}

function triggerMessage(type) {
  const selectedContacts = getSelectedContacts();
  const text = messageText ? messageText.value.trim() : "";

  if (!selectedContacts.length) {
    showStatus("Please select at least one recipient before sending.", "error");
    return;
  }

  if (!text) {
    showStatus("Message body cannot be empty.", "error");
    return;
  }

  if (type === "sms") {
    triggerSMSToContactIndex(0, selectedContacts, text);
    return;
  }

  if (type === "whatsapp") {
    const contact = selectedContacts[0];
    const mobile = contact ? normalizePhoneForIntent(contact.mobile) : "";

    if (!mobile) {
      showStatus("Please select a valid contact before sending WhatsApp.", "error");
      return;
    }

    const whatsappUrl = `https://wa.me/${mobile}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
    showStatus(`Opening WhatsApp chat with ${contact.name}.`, "success");
  }
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

bindIfExists(togglePasswordBtn, "click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePasswordBtn.textContent = isPassword ? "Hide" : "Show";
});

bindIfExists(logoutBtn, "click", () => {
  sessionStorage.removeItem(sessionKey);
  showLogin();
  showMessage(loginMessage, "You have been logged out.", "success");
});

bindIfExists(themeToggleBtn, "click", () => {
  const currentTheme = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
});

bindIfExists(contactForm, "submit", addContact);
bindIfExists(pickContactBtn, "click", pickContactFromDevice);
bindIfExists(importContactsBtn, "click", importContactsFromFile);
bindIfExists(saveDraftBtn, "click", saveDraft);
bindIfExists(loadDraftBtn, "click", loadDraft);
bindIfExists(copyMessageBtn, "click", copyMessage);
bindIfExists(sendSmsBtn, "click", () => triggerMessage("sms"));
bindIfExists(sendWhatsAppBtn, "click", () => triggerMessage("whatsapp"));

if (isLoggedIn()) {
  showContent("Participant");
} else {
  showLogin();
}

const savedTheme = localStorage.getItem(themeStorageKey);
applyTheme(savedTheme || "light");

renderContacts();
renderDrafts();
