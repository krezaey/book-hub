// Theme Management
const themes = {
    forest: {
        '--primary': '#4caf50',
        '--primary-light': '#66bb6a',
        '--primary-lighter': '#81c784',
        '--primary-dark': '#2d5016',
        '--bg-gradient-start': '#a8d5a3',
        '--bg-gradient-end': '#6ba843',
        '--accent-light': '#e8f5e9',
        '--accent-lighter': '#c8e6c9',
        '--shadow-color': 'rgba(76, 175, 80, 0.4)'
    },
    ocean: {
        '--primary': '#0288d1',
        '--primary-light': '#03a9f4',
        '--primary-lighter': '#4fc3f7',
        '--primary-dark': '#01579b',
        '--bg-gradient-start': '#81d4fa',
        '--bg-gradient-end': '#0288d1',
        '--accent-light': '#e1f5fe',
        '--accent-lighter': '#b3e5fc',
        '--shadow-color': 'rgba(2, 136, 209, 0.4)'
    },
    sunset: {
        '--primary': '#ff6f61',
        '--primary-light': '#ff8a80',
        '--primary-lighter': '#ffab91',
        '--primary-dark': '#d84315',
        '--bg-gradient-start': '#ffccbc',
        '--bg-gradient-end': '#ff8a65',
        '--accent-light': '#fff3e0',
        '--accent-lighter': '#ffe0b2',
        '--shadow-color': 'rgba(255, 111, 97, 0.4)'
    },
    lavender: {
        '--primary': '#9c27b0',
        '--primary-light': '#ba68c8',
        '--primary-lighter': '#ce93d8',
        '--primary-dark': '#6a1b9a',
        '--bg-gradient-start': '#e1bee7',
        '--bg-gradient-end': '#ab47bc',
        '--accent-light': '#f3e5f5',
        '--accent-lighter': '#e1bee7',
        '--shadow-color': 'rgba(156, 39, 176, 0.4)'
    },
    sage: {
        '--primary': '#8bc34a',
        '--primary-light': '#9ccc65',
        '--primary-lighter': '#aed581',
        '--primary-dark': '#558b2f',
        '--bg-gradient-start': '#dcedc8',
        '--bg-gradient-end': '#9ccc65',
        '--accent-light': '#f1f8e9',
        '--accent-lighter': '#dcedc8',
        '--shadow-color': 'rgba(139, 195, 74, 0.4)'
    }
};

// DOM Elements
const themeBtn = document.getElementById('theme-btn');
const themeDropdown = document.getElementById('theme-dropdown');
const themeOptions = document.querySelectorAll('.theme-option');

// Load saved theme or default to forest
const savedTheme = localStorage.getItem('bookToolsTheme') || 'forest';
applyTheme(savedTheme);

// Toggle dropdown
themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    themeDropdown.classList.remove('show');
});

// Theme selection
themeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        const theme = option.dataset.theme;
        applyTheme(theme);
        localStorage.setItem('bookToolsTheme', theme);
        themeDropdown.classList.remove('show');
        
        // Add a little animation feedback
        themeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            themeBtn.style.transform = 'scale(1)';
        }, 200);
    });
});

function applyTheme(themeName) {
    const theme = themes[themeName];
    const root = document.documentElement;
    
    // Apply all CSS variables
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
    
    // Update active state
    themeOptions.forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.theme === themeName) {
            opt.classList.add('active');
        }
    });
}

