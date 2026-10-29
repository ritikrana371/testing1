# Knowledge Base: Credflex Messaging Panel

## 1. Overview
This application is a browser-based messaging panel designed for a demo participant workflow. It includes:

- Login screen with user authentication mock flow
- Light/dark theme toggle
- Contact management
- Draft saving and loading
- Message composition
- SMS and WhatsApp launching flows
- Local browser persistence using storage APIs

The app is implemented as a static frontend using HTML, CSS, and JavaScript with no backend or database.

## 2. Application Purpose
The app is intended to let a signed-in user:

- Log in with a valid account
- Add and import contacts with names and mobile numbers
- Choose a recipient and compose a message
- Save message drafts locally
- Copy a message to the clipboard
- Share or send the message as SMS or WhatsApp

## 3. Files

### index.html
Contains the page structure:

- Login form
- Main panel for authorized users
- Contact management form
- Message composer area
- Saved draft selector
- Theme toggle and logout buttons

### style.css
Contains the UI styling for:

- Light/dark theme variables
- Form controls and layout
- Buttons and panels
- Dashboard combination
- Responsive design rules

### script.js
Contains all app behavior:

- Authentication logic
- Theme management
- Contact storage and import logic
- Draft handling
- Message sending and share behavior
- Clipboard interaction

## 4. Supported Users
The application currently recognizes the following users:

| Username | Password |
| --- | --- |
| participant | credflex123 |
| admin | admin@123 |
| tester | test@123 |

Authentication is a client-side mock check implemented in `script.js`.

## 5. Login Flow
1. User enters a username and password.
2. The app checks the entered value against the hardcoded `validUsers` object.
3. If the credentials match, the login screen hides and the dashboard is shown.
4. The app sets a session flag in `sessionStorage` under the key `participant-access-session`.
5. If the user logs out, the session is removed and the login screen is shown again.

## 6. Theme Behavior
The app supports a light and dark theme using the `data-theme` attribute on the `body` element.

- Theme is stored in `localStorage` under `app-theme`
- The toggle button text updates based on the current state
- Default theme is light if no saved theme exists

## 7. Contact Management
Contacts are stored in browser local storage under:

- Key: `saved-contacts`
- Value: array of objects in the form:

```json
[
  { "name": "Jane Doe", "mobile": "+1234567890" }
]
```

Features include:

- Add a contact manually
- Prevent duplicate contact entries by name or mobile number
- Import contacts from `.vcf` or `.csv` files
- Use the device contact picker when supported
- Display saved contacts in the app
- Populate the recipient selector

## 8. Draft Management
Saved drafts are stored in browser local storage under:

- Key: `saved-drafts`
- Value: array of objects like:

```json
[
  { "label": "Draft 1", "text": "Hello there!" }
]
```

Features include:

- Save current message to a draft
- Load a saved draft into the composer
- Keep the drafts across page refreshes using localStorage

## 9. Message Sending Actions
The app supports SMS and WhatsApp actions.

### SMS flow
The app uses a reliable browser-native flow for SMS:

- If `navigator.share` is available, it opens the device share sheet
- This allows the user to choose their preferred messaging app or SMS handler
- A direct `sms:` URL is only used as a fallback for unsupported browsers or devices

This design avoids the common failure mode of multi-recipient `sms:` URI strings being blocked or rejected by mobile operating systems.

### WhatsApp flow
The app uses a direct WhatsApp link in this format:

```text
https://wa.me/<number>?text=<message>
```

The selected contact's mobile number is normalized before creating the URL.

### Copy flow
The current message can be copied to the clipboard using `navigator.clipboard.writeText()`. If clipboard access fails, the app shows an error message.

## 10. Android/iOS SMS Behavior Notes
The app intentionally avoids building a multi-recipient `sms:` URI because the browser and mobile OS do not reliably allow that pattern.

Relevant behavior:

- Some mobile browsers reject multiple numbers in a single `sms:` URI
- iOS and Android may interpret malformed number lists as invalid links
- The native share sheet is more reliable because it delegates the final send action to the OS or the user’s selected app

This is the recommended solution for a static frontend hosted on Vercel or similar hosting platforms.

## 11. Storage Model
This app relies on browser-side storage rather than a server database.

### sessionStorage
Used for login status:

- Key: `participant-access-session`
- Value: `true`

### localStorage
Used for persistent app state:

- `saved-contacts`
- `saved-drafts`
- `app-theme`

## 12. Security and Reliability Notes
Important limitations:

- Credentials are hardcoded in front-end JavaScript
- There is no real backend authentication
- There is no server-side data persistence or security model
- Local browser storage can be cleared by the user or browser settings
- Messaging actions depend on the user’s device/browser capabilities

This application is suitable for educational or demo purposes, not for production-grade sensitive workflows.

## 13. Current UI Behavior Summary
The main dashboard allows:

- Adding contacts
- Importing contacts from files
- Selecting a recipient
- Typing and saving message drafts
- Copying the message text
- Sending through SMS or WhatsApp
- Logging out
- Toggling theme

## 14. Common Troubleshooting

### Login fails
- Check the exact username and password spelling
- Remove any autofill or cached input values
- Use the credentials exactly as defined in `script.js`

### Contact not appearing
- Refresh the page after adding
- Ensure browser storage is enabled
- Verify the imported file contains valid mobile numbers

### Draft not loading
- Confirm the draft was saved successfully
- Check that the correct option is selected in the dropdown

### SMS does not open
- Ensure the browser/device supports the native share API
- Try a direct fallback flow if shared content is not available
- Confirm the selected contact has a valid mobile number

### WhatsApp does not open
- Verify the number is normalized properly
- Check whether the browser can open external links
- Ensure the user has WhatsApp installed on the device

## 15. Recommended Improvements
For a production-ready version, consider:

- Server-side authentication
- Password hashing and secure login
- Persistent database storage
- Validation and sanitization of imported data
- A real messaging backend or SMS gateway integration
- Better accessibility and browser compatibility testing

## 16. Conclusion
This app is a front-end prototype for a participant messaging workflow. It demonstrates local state management, contact handling, draft saving, and device-native message sharing. The current SMS approach is intentionally designed to be robust across mobile devices by using the browser share API when available and a direct `sms:` fallback only when necessary.

## 17. Quick Start
1. Open `index.html` in a browser.
2. Log in with `participant` / `credflex123`.
3. Add or import contacts.
4. Write a message and save a draft if needed.
5. Use the SMS or WhatsApp actions.
6. Toggle the theme from the header controls.

## 18. Related Files
- `index.html`
- `style.css`
- `script.js`

This document reflects the current app implementation and messaging strategy.
