# HelpPoint prototype

One place for every support request. A front-end prototype of the Candidate Support and Service Request System (Week 8).

## Run it
Open `index.html` in a browser. No build step or server needed.

## Demo accounts (password: demo1234)
| Role | Email |
|---|---|
| Candidate | amina@demo.test |
| Support | thandi@demo.test |
| Administrator | nomsa@demo.test |

## Structure
- `css/tokens.css` design tokens (colour, type, spacing, radius, layout)
- `css/styles.css` base, layout and components
- `js/app.js` sample data, router, views and form handling

## Added since v1
- Profile page for every role: edit name and email, change password (current password required). Role is read-only.
- Administrator Summary Reports: period filter, resolution rate, average resolution time, and status, priority, category and support team breakdowns.

## Known limitations
- Prototype only: data is fictional and resets on refresh.
- Login and role checks run in the browser, so they are not real security.
- Passwords are stored in plain text for demo purposes only.
- Not built yet: Notifications, pagination, nav icons, focus trap in the mobile drawer.
- Inter loads from Google Fonts and falls back to system fonts if blocked.
# HelpPoint-Support
