const validUsers = {
  participant: "credflex123",
  admin: "admin@123",
  tester: "test@123"
};

const sessionKey = "participant-access-session";
const contactStorageKey = "saved-contacts";
const draftStorageKey = "saved-drafts";
const themeStorageKey = "app-theme";

function bindIfExists(element, eventName, handler) {
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function isLoggedIn() {
  return sessionStorage.getItem(sessionKey) === "true";
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

function showMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = type ? `message ${type}` : "message";
}

function showStatus(text, type = "") {
  const element = document.getElementById("statusMessage");
  if (!element) return;
  element.textContent = text;
  element.className = type ? `status-message ${type}` : "status-message";
}

function applyTheme(theme) {
  const activeTheme = theme || "light";
  document.body.setAttribute("data-theme", activeTheme);
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.textContent = activeTheme === "dark" ? "☀️ Light" : "🌙 Dark";
  }
  localStorage.setItem(themeStorageKey, activeTheme);
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

function renderContactsList() {
  const list = document.getElementById("contactList");
  if (!list) return;

  list.innerHTML = "";
  const contacts = getContacts();

  if (!contacts.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No contacts saved yet.";
    list.appendChild(empty);
    return;
  }

  contacts.forEach((contact) => {
    const item = document.createElement("li");
    item.className = "contact-item";
    item.textContent = `${contact.name} — ${contact.mobile}`;
    list.appendChild(item);
  });
}

function addManualContact(event) {
  event.preventDefault();

  const nameInput = document.getElementById("contactName");
  const mobileInput = document.getElementById("contactMobile");
  if (!nameInput || !mobileInput) return;

  const name = nameInput.value.trim();
  const mobile = mobileInput.value.trim();

  if (!name || !mobile) {
    showStatus("Please fill in both fields before saving the contact.", "error");
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
  renderContactsList();
  event.target.reset();
  showStatus("Contact added successfully.", "success");
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
  renderContactsList();
}

function importContactsFromFile(file) {
  if (!file) {
    showStatus("Please choose a .vcf or .csv file first.", "error");
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
      showStatus(`${contacts.length} contact(s) imported successfully.`, "success");
    })
    .catch(() => {
      showStatus("Unable to read the selected file. Please try again.", "error");
    });
}

async function pickContactFromDevice() {
  if (!("contacts" in navigator) || !("select" in navigator.contacts)) {
    showStatus("Contact picker is not supported in this browser.", "error");
    return;
  }

  try {
    const selected = await navigator.contacts.select(["name", "tel"], { multiple: true });
    if (!selected || !selected.length) {
      showStatus("No contact was selected.", "error");
      return;
    }

    const imported = selected
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
  } catch {
    showStatus("Your browser blocked access to phone contacts. Please use the manual form or import a .vcf file.", "error");
  }
}

function getSelectedContacts() {
  const select = document.getElementById("contactSelect");
  if (!select) return [];

  const selectedValues = Array.from(select.selectedOptions).map((option) => option.value);
  return getContacts().filter((contact) => selectedValues.includes(contact.mobile));
}

function updateSelectedContactInfo() {
  const info = document.getElementById("selectedContactInfo");
  if (!info) return;

  const selectedContacts = getSelectedContacts();
  if (!selectedContacts.length) {
    info.textContent = "No contact selected";
    return;
  }

  const names = selectedContacts.map((contact) => `${contact.name} (${contact.mobile})`);
  info.textContent = names.length > 3
    ? `${names.length} contacts selected: ${names.slice(0, 3).join(", ")} ...`
    : names.join(", ");
}

function renderRecipientOptions() {
  const select = document.getElementById("contactSelect");
  const input = document.getElementById("contactSearch");
  if (!select || !input) return;

  const searchTerm = input.value.trim().toLowerCase();
  const previousSelection = new Set(Array.from(select.selectedOptions).map((option) => option.value));
  const contacts = getContacts().filter((contact) => {
    const name = (contact.name || "").toLowerCase();
    const mobile = (contact.mobile || "").toLowerCase();
    return name.includes(searchTerm) || mobile.includes(searchTerm);
  });

  select.innerHTML = "";

  if (!contacts.length) {
    const placeholder = document.createElement("option");
    placeholder.textContent = "No matching contact found";
    placeholder.disabled = true;
    select.appendChild(placeholder);
    select.size = 1;
    updateSelectedContactInfo();
    return;
  }

  contacts.forEach((contact) => {
    const option = document.createElement("option");
    option.value = contact.mobile;
    option.textContent = `${contact.name} — ${contact.mobile}`;
    option.selected = previousSelection.has(contact.mobile);
    select.appendChild(option);
  });

  select.size = Math.min(10, Math.max(contacts.length, 1));
  updateSelectedContactInfo();
}

function renderDrafts() {
  const draftSelect = document.getElementById("draftSelect");
  if (!draftSelect) return;

  const drafts = getDrafts();
  draftSelect.innerHTML = '<option value="">Select a saved message</option>';

  if (!drafts.length) return;

  drafts.forEach((draft, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = draft.label || `Draft ${index + 1}`;
    draftSelect.appendChild(option);
  });
}

function saveDraft() {
  const input = document.getElementById("messageText");
  if (!input) return;

  const text = input.value.trim();
  if (!text) {
    showStatus("Write a message before saving the draft.", "error");
    return;
  }

  const drafts = getDrafts();
  drafts.push({ label: `Draft ${drafts.length + 1}`, text });
  saveDrafts(drafts);
  renderDrafts();
  showStatus("Draft saved successfully.", "success");
}

function loadDraft() {
  const draftSelect = document.getElementById("draftSelect");
  const input = document.getElementById("messageText");
  if (!draftSelect || !input) return;

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

  input.value = selectedDraft.text;
  showStatus("Draft loaded successfully.", "success");
}

async function copyMessage() {
  const input = document.getElementById("messageText");
  if (!input) return;

  const text = input.value.trim();
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
  const input = document.getElementById("messageText");
  if (!input) return;

  const text = input.value.trim();

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

function ensureLoggedIn() {
  const page = document.body.dataset.page || "login";
  const protectedPages = ["add-contact", "import-contacts", "send-message"];

  if (protectedPages.includes(page) && !isLoggedIn()) {
    window.location.href = "index.html";
    return false;
  }

  return true;
}

function initLoginPage() {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const toggle = document.getElementById("togglePassword");

  if (isLoggedIn()) {
    window.location.href = "send-message.html";
    return;
  }

  bindIfExists(form, "submit", (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showMessage(document.getElementById("loginMessage"), "Please enter both username and password.", "error");
      return;
    }

    if (validUsers[username] && validUsers[username] === password) {
      sessionStorage.setItem(sessionKey, "true");
      window.location.href = "send-message.html";
      return;
    }

    showMessage(document.getElementById("loginMessage"), "Invalid username or password. Please try again.", "error");
    form.reset();
  });

  bindIfExists(toggle, "click", () => {
    if (!passwordInput) return;
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    toggle.textContent = isPassword ? "Hide" : "Show";
  });
}

function initSharedControls() {
  const logoutBtn = document.getElementById("logoutBtn");
  bindIfExists(logoutBtn, "click", () => {
    sessionStorage.removeItem(sessionKey);
    window.location.href = "index.html";
  });
}

function initAddContactPage() {
  const form = document.getElementById("contactForm");
  bindIfExists(form, "submit", addManualContact);
  renderContactsList();
}

function initImportPage() {
  const form = document.getElementById("importContactsForm");
  const fileInput = document.getElementById("contactFileInput");
  const deviceBtn = document.getElementById("deviceImportBtn");

  bindIfExists(form, "submit", (event) => {
    event.preventDefault();
    if (fileInput && fileInput.files && fileInput.files[0]) {
      importContactsFromFile(fileInput.files[0]);
      form.reset();
    } else {
      showStatus("Please choose a .vcf or .csv file first.", "error");
    }
  });

  bindIfExists(deviceBtn, "click", pickContactFromDevice);
  renderContactsList();
}

function initSendMessagePage() {
  const searchInput = document.getElementById("contactSearch");
  const select = document.getElementById("contactSelect");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const loadDraftBtn = document.getElementById("loadDraftBtn");
  const copyBtn = document.getElementById("copyMessageBtn");
  const smsBtn = document.getElementById("sendSmsBtn");
  const whatsappBtn = document.getElementById("sendWhatsAppBtn");

  bindIfExists(searchInput, "input", renderRecipientOptions);
  bindIfExists(select, "change", updateSelectedContactInfo);
  bindIfExists(saveDraftBtn, "click", saveDraft);
  bindIfExists(loadDraftBtn, "click", loadDraft);
  bindIfExists(copyBtn, "click", copyMessage);
  bindIfExists(smsBtn, "click", () => triggerMessage("sms"));
  bindIfExists(whatsappBtn, "click", () => triggerMessage("whatsapp"));

  renderRecipientOptions();
  renderDrafts();
}

function initApp() {
  const page = document.body.dataset.page || "login";
  const savedTheme = localStorage.getItem(themeStorageKey) || "light";
  applyTheme(savedTheme);

  if (page === "login") {
    initLoginPage();
    return;
  }

  if (!ensureLoggedIn()) return;
  initSharedControls();

  if (page === "add-contact") {
    initAddContactPage();
  }

  if (page === "import-contacts") {
    initImportPage();
  }

  if (page === "send-message") {
    initSendMessagePage();
  }
}

initApp();
