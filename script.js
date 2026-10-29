const validUsers = {
  participant: 'credflex123',
  admin: 'admin@123',
  tester: 'test@123'
};

const loginScreen = document.getElementById('loginScreen');
const contentPage = document.getElementById('contentPage');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logoutBtn');
const userNameLabel = document.getElementById('userNameLabel');
const result = document.getElementById('result');
const testButton = document.getElementById('testButton');
const messageLinks = document.getElementById('messageLinks');

const sessionKey = 'participant-access-session';

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = 'message';
  if (type) el.classList.add(type);
}

function isLoggedIn() {
  return sessionStorage.getItem(sessionKey) === 'true';
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  contentPage.classList.add('hidden');
  messageLinks.classList.add('hidden');
  usernameInput.focus();
}

function showContent(username) {
  loginScreen.classList.add('hidden');
  contentPage.classList.remove('hidden');
  userNameLabel.textContent = username;
  result.textContent = '';
  messageLinks.classList.remove('hidden');
  sessionStorage.setItem(sessionKey, 'true');
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showMessage(loginMessage, 'Please enter both username and password.', 'error');
    return;
  }

  if (validUsers[username] && validUsers[username] === password) {
    showContent(username);
    loginForm.reset();
    showMessage(loginMessage, '', '');
  } else {
    showMessage(loginMessage, 'Invalid username or password. Please try again.', 'error');
    loginForm.reset();
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(sessionKey);
  showLogin();
  showMessage(loginMessage, 'You have been logged out.', 'success');
});

testButton.addEventListener('click', () => {
  result.textContent = 'Test passed';
});

if (isLoggedIn()) {
  showContent('Participant');
} else {
  showLogin();
}
