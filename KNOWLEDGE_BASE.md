# Knowledge Base: Credflex Messaging Panel

## 1. Overview
This application is a small browser-based messaging panel that simulates a participant access workflow. It includes:

- Login screen for authorized users
- Theme toggle between light and dark mode
- Contact management
- Draft saving and loading
- Message composition
- SMS and WhatsApp launch flows
- Local browser storage for persistence

The app is built as a static front-end using HTML, CSS, and JavaScript, with no backend or database.

## 2. Application Purpose
The app is intended to let a signed-in user:

- Log in with a valid account
- Add saved contacts with names and mobile numbers
- Choose a contact and compose a message
- Save message drafts locally
- Copy a message to the clipboard
- Send via SMS or WhatsApp using device intent links

## 3. Files

### index.html
Contains the page structure:

- Login form
- App content container
- Contact form
- Message composer
- Draft selector
- Theme toggle and logout controls

### style.css
Contains the complete visual styling, including:

- Light/dark theme variables
- Form styling
- Buttons and panels
- Layout for dashboard and auth shell
- Responsive spacing and typography

### script.js
Contains all application logic:

- Authentication checks
- Theme handling
- Contact and draft storage
- UI rendering
- Message actions and clipboard integration

## 4. Supported Users
The application currently recognizes these valid users:

| Username | Password |
| --- | --- |
| participant | credflex123 |
| admin | admin@123 |
| tester | test@123 |

Authentication is done in the browser and is based on a local object in `script.js`.

## 5. Login Flow
1. User enters a username and password.
2. Browser checks whether the entered username exists in `validUsers`.
3. If the password matches, the app hides the login screen and shows the main panel.
4. Session state is stored in `sessionStorage` using the key `participant-access-session`.
5. If the user logs out, the session key is removed and the login screen is shown again.

## 6. Theme Behavior
The app supports a light and dark theme via the `data-theme` attribute on the `body` element.

- Theme is stored in `localStorage` under `app-theme`
- The toggle button updates text between:
  - `🌙 Dark` in light mode
  - `☀️ Light` in dark mode

## 7. Contact Management
Contacts are stored in local browser storage using:

- Key: `saved-contacts`
- Format: an array of objects like:

```json
[
  { "name": "Jane Doe", "mobile": "+1234567890" }
]
```

Features:

- Add contact with name and mobile number
- Prevent duplicate mobile numbers
- Display contacts in a list
- Populate recipient dropdown for message sending

## 8. Draft Management
Saved drafts are stored in local browser storage using:

- Key: `saved-drafts`
- Format: an array of draft objects

Example:

```json
[
  { "label": "Draft 1", "text": "Hello there!" }
]
```

Features:

- Save current message as a draft
- Load a saved draft into the composer
- Save the message body locally without a backend

## 9. Message Sending Actions
The composer supports two actions:

### SMS
- Uses a custom `sms:` URL
- Phone is normalized to remove leading zeros and non-digit characters
- Message body is included as a URL-encoded query parameter

### WhatsApp
- Uses a `wa.me` URL
- Number is normalized and message text is passed through the `text` parameter
- Opens in a new tab via `window.open(..., "_blank")`

## 10. Clipboard Copy
The app can copy the current message to the user clipboard using `navigator.clipboard.writeText()`. If clipboard access fails, the app shows a fallback error message.

## 11. Storage Model
This app uses browser-local persistence instead of a server-side database.

### sessionStorage
Used for login state:

- Key: `participant-access-session`
- Value: `true`

### localStorage
Used for persistent app data:

- `saved-contacts`
- `saved-drafts`
- `app-theme`

## 12. Security and Reliability Notes
Important limitations:

- Credentials are hardcoded in the client-side JavaScript
- There is no real authentication or server validation
- All data is stored in the browser and can be cleared by the user
- There is no API protection or backend business logic

This is suitable for demo or educational purposes, not production security-sensitive systems.

## 13. Current UI Behavior Summary
The main dashboard allows:

- Adding contacts
- Selecting a recipient
- Typing and saving messages
- Loading drafts
- Copying text
- Sending as SMS or WhatsApp
- Logging out and changing theme

## 14. Common Troubleshooting

### Login fails
- Confirm the exact username and password spelling
- Check for autofill or browser form caching
- Use the values exactly as stored in `script.js`

### Contact not appearing
- Refresh the page after adding
- Check browser localStorage is enabled

### Draft not loading
- Verify the draft was saved to localStorage
- Confirm the appropriate option is selected in the saved draft selector

### SMS or WhatsApp does not open
- Ensure the device/browser supports the link handling
- Check if the selected phone number is valid and normalized

## 15. Recommended Improvements
For a real production-ready version, consider:

- Server-side authentication
- Secure password hashing
- Database-backed storage
- Input validation and sanitization
- User role management
- Server-side API for message sending
- Better accessibility and testing coverage

## 16. Conclusion
This app is a front-end prototype for a participant messaging application. It demonstrates a complete local demo flow using browser storage, UI state, and external message intents. It is ideal for testing interface logic and user flows but not for production deployment without backend and security improvements.

## 17. Quick Start
1. Open `index.html` in a browser.
2. Log in with `participant` / `credflex123`.
3. Add contacts, create drafts, and send messages.
4. Use the theme toggle to switch modes.

## 18. Related Files
- `index.html`
- `style.css`
- `script.js`

This document should be treated as the working knowledge base for the current app implementation.
