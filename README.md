# 📚 Reading Tools Hub

A web app for exploring your book collection with smart filtering, statistics, and random book selection.
[Check it out here!](https://krezaey.github.io/book-hub/index.html)

## 📁 Project Structure

```
book-selector/
├── index.html              # Main landing page
├── assets/
│   ├── css/
│   │   └── styles.css     # All styles with theme support
│   └── js/
│       ├── theme.js       # Theme switching logic
│       ├── book-picker.js # Book picker tool logic
│       └── library-stats.js # Library stats tool logic
├── pages/
│   ├── book-picker.html   # Book picker page
│   └── library-stats.html # Library stats page
├── README.md
├── .gitignore
└── .nojekyll             # For GitHub Pages
```
## Important Notes

- ✅ **Privacy**: All CSV processing happens in the browser - no data is sent to any server
- ✅ **Free**: GitHub Pages is completely free for public and private repos
- ✅ **Fast**: Static site, loads instantly
- ✅ **No maintenance**: Once deployed, it just works

---

## 🚀 Run Locally (For Development)

### Option 1: Direct File Opening
Simply open `index.html` in any modern web browser

### Option 2: Local Server

**Using Python:**
```bash
python3 -m http.server 8000
```

**Using Node.js:**
```bash
npx serve
```

**Using PHP:**
```bash
php -S localhost:8000
```

Then open `http://localhost:8000`

---

*Made with 💚 for book lovers*
