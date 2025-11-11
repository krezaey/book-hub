# 📚 Reading Tools Hub

A web app for exploring your book collection with smart filtering, statistics, and random book selection.

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

## 🌐 Deploy to GitHub Pages

### Quick Setup (5 minutes)

1. **Create a GitHub repository**
   - Go to github.com and create a new repository
   - Name it whatever you like (e.g., `book-tools`)
   - Make it public or private (both work with GitHub Pages)

2. **Upload your files**
   ```bash
   # In your book-selector folder
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **main** branch
   - Click **Save**
   - Your site will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

4. **Share with friends!**
   - Send them the GitHub Pages URL
   - They can upload their own CSV files
   - All data stays in their browser (privacy-first!)

### Important Notes

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
