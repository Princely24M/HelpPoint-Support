# HelpPoint prototype

One place for every support request. A front-end prototype of the Candidate Support and Service Request System (Week 8).

## Run it
Open `index.html` in a browser. No build step or server needed.

## Login pages (one per role)
| Role | Page | Demo email (password: demo1234) |
|---|---|---|
| Candidate | `#/login` | amina@demo.test |
| Support | `#/support-login` | thandi@demo.test |
| Administrator | `#/admin-login` | nomsa@demo.test |

Each page only accepts accounts with that role. Candidates can register; staff accounts are created by an administrator (Users > Add user).

## Structure
- `css/tokens.css` design tokens
- `css/styles.css` base, layout and components
- `js/app.js` sample data, router, views and form handling

## Features added since v1
- Profile page for every role (edit name and email, change password).
- Administrator Summary Reports.
- Separate Support and Administrator login pages.
- File and image attachments on Submit Request and in the request conversation (JPG, PNG, PDF; max 5 files, 5 MB each).
- Administrator can add users (any role) and search or filter users by name, email, role and status.

## Known limitations
- Prototype only: data is fictional and resets on refresh.
- Files are held in the browser for the session. Nothing is uploaded or stored.
- Login and role checks run in the browser, so they are not real security.
- Passwords are stored in plain text for demo purposes only. In the real build, hash them (bcrypt) and force a password change on first login for admin-created accounts.
- In the real build, validate file type (by content) and size on the server, store files outside the public folder with random names, and only serve them to the request owner and staff.
- Not built yet: Notifications, pagination, nav icons, focus trap in the mobile drawer.
- Inter loads from Google Fonts and falls back to system fonts if blocked.
# HelpPoint-Support
