// App State
let statsData = {
    csvData: [],
    headers: [],
    csvFileName: '',
    currentFilter: 'all', // 'all', 'read', 'unread'
    genreBooks: {},
    authorBooks: {},
    tagBooks: {},
    ratingField: null,
    hasRatings: false
};

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const statsSection = document.getElementById('stats-section');
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const analyzeAgainBtn = document.getElementById('analyze-again-btn');
const uploadZoneContainer = document.getElementById('upload-zone-container');
const csvLoadedNotice = document.getElementById('csv-loaded-notice');
const loadedCsvName = document.getElementById('loaded-csv-name');
const useExistingCsvBtn = document.getElementById('use-existing-csv-btn');
const uploadDifferentCsvBtn = document.getElementById('upload-different-csv-btn');
const downloadStatsBtn = document.getElementById('download-stats-btn');

// Modal elements
const modal = document.getElementById('preview-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

// Check for existing CSV data on page load
window.addEventListener('DOMContentLoaded', () => {
    checkForExistingCSV();
    setupModalHandlers();
    setupToggleHandlers();
    setupDownloadHandler();
});

function checkForExistingCSV() {
    const savedData = localStorage.getItem('bookLibraryCSV');
    const savedFileName = localStorage.getItem('bookLibraryCSVName');
    
    if (savedData && savedFileName) {
        loadedCsvName.textContent = savedFileName;
        csvLoadedNotice.style.display = 'block';
        uploadZoneContainer.style.display = 'none';
    } else {
        csvLoadedNotice.style.display = 'none';
        uploadZoneContainer.style.display = 'block';
    }
}

// Use existing CSV button
useExistingCsvBtn.addEventListener('click', () => {
    const savedData = localStorage.getItem('bookLibraryCSV');
    const savedFileName = localStorage.getItem('bookLibraryCSVName');
    
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        statsData.csvData = parsedData.data;
        statsData.headers = parsedData.headers;
        statsData.csvFileName = savedFileName;
        
        setTimeout(() => {
            showStats();
            calculateStats();
        }, 300);
    }
});

// Upload different CSV button
uploadDifferentCsvBtn.addEventListener('click', () => {
    csvLoadedNotice.style.display = 'none';
    uploadZoneContainer.style.display = 'block';
});

// File Upload Handlers
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
        handleFile(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// File Processing
function handleFile(file) {
    fileName.textContent = `📄 ${file.name}`;
    statsData.csvFileName = file.name;
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            statsData.csvData = results.data;
            statsData.headers = results.meta.fields;
            
            // Save to localStorage
            saveCSVToLocalStorage();
            
            setTimeout(() => {
                showStats();
                calculateStats();
            }, 500);
        },
        error: (error) => {
            alert('Error parsing CSV file: ' + error.message);
        }
    });
}

function saveCSVToLocalStorage() {
    try {
        const dataToSave = {
            data: statsData.csvData,
            headers: statsData.headers
        };
        localStorage.setItem('bookLibraryCSV', JSON.stringify(dataToSave));
        localStorage.setItem('bookLibraryCSVName', statsData.csvFileName);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function showStats() {
    uploadSection.classList.remove('active');
    statsSection.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Helper function to check if book is read/unread
function getBookStatus(book) {
    const headers = statsData.headers;
    const unreadIndicators = ['0', 'tbr', 'to be read', 'not begun', 'unread', 'to-read', 'want to read'];
    const readIndicators = ['1', 'completed', 'read', 'finished'];
    
    // Check dedicated status/read fields first
    const statusFields = headers.filter(h => {
        const lower = h.toLowerCase();
        return lower.includes('read') || 
               lower.includes('status') ||
               lower.includes('completed') ||
               lower.includes('bookshelf');
    });
    
    for (const field of statusFields) {
        const value = book[field]?.toLowerCase() || '';
        if (unreadIndicators.some(indicator => value.includes(indicator))) {
            return 'unread';
        } else if (readIndicators.some(indicator => value.includes(indicator))) {
            return 'read';
        }
    }
    
    // Check tags field for status indicators
    const tagsField = headers.find(h => h.toLowerCase().includes('tag'));
    if (tagsField) {
        const tags = book[tagsField]?.toLowerCase() || '';
        if (unreadIndicators.some(indicator => tags.includes(indicator))) {
            return 'unread';
        } else if (readIndicators.some(indicator => tags.includes(indicator))) {
            return 'read';
        }
    }
    
    return 'unknown';
}

// Filter books based on current filter
function getFilteredBooks() {
    if (statsData.currentFilter === 'all') {
        return statsData.csvData;
    }
    
    return statsData.csvData.filter(book => {
        const status = getBookStatus(book);
        return status === statsData.currentFilter;
    });
}

// Calculate and display stats
function calculateStats() {
    const data = statsData.csvData;
    const headers = statsData.headers;
    
    // Detect rating field
    detectRatingField();
    
    // Total books
    document.getElementById('total-books').textContent = data.length;
    
    // Count read/unread books using the smart detection
    let booksRead = 0;
    let booksTBR = 0;
    
    data.forEach(book => {
        const status = getBookStatus(book);
        if (status === 'read') {
            booksRead++;
        } else if (status === 'unread') {
            booksTBR++;
        }
    });
    
    document.getElementById('books-read').textContent = booksRead;
    document.getElementById('books-tbr').textContent = booksTBR > 0 ? booksTBR : 'N/A';
    
    // Total pages - check multiple possible field names
    const pageField = headers.find(h => {
        const lower = h.toLowerCase();
        return (lower.includes('page') && (lower.includes('count') || lower.includes('length'))) ||
               lower === 'pages' ||
               lower === 'length';
    });
    
    if (pageField) {
        const totalPages = data.reduce((sum, book) => {
            const pages = parseInt(book[pageField]) || 0;
            return sum + pages;
        }, 0);
        document.getElementById('total-pages').textContent = totalPages > 0 ? totalPages.toLocaleString() : '0';
    } else {
        document.getElementById('total-pages').textContent = '0';
    }
    
    // Calculate rating statistics if ratings exist
    if (statsData.hasRatings) {
        calculateRatingStats();
    }
    
    // Calculate top lists with filtered data
    calculateTopLists();
}

// Detect rating field in CSV
function detectRatingField() {
    const headers = statsData.headers;
    
    // Look for common rating field names
    const ratingField = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('rating') || 
               lower.includes('stars') || 
               lower === 'my rating' ||
               lower === 'score';
    });
    
    if (ratingField) {
        // Check if field actually has rating values
        const hasValidRatings = statsData.csvData.some(book => {
            const rating = parseFloat(book[ratingField]);
            return !isNaN(rating) && rating > 0;
        });
        
        if (hasValidRatings) {
            statsData.ratingField = ratingField;
            statsData.hasRatings = true;
        }
    }
}

// Calculate rating statistics
function calculateRatingStats() {
    const data = getFilteredBooks(); // Use filtered data instead of all data
    const ratingField = statsData.ratingField;
    
    let totalRating = 0;
    let ratedCount = 0;
    
    data.forEach(book => {
        const rating = parseFloat(book[ratingField]);
        if (!isNaN(rating) && rating > 0) {
            totalRating += rating;
            ratedCount++;
        }
    });
    
    if (ratedCount > 0) {
        const avgRating = (totalRating / ratedCount).toFixed(1);
        document.getElementById('avg-rating').textContent = avgRating;
        document.getElementById('rated-books').textContent = ratedCount;
        
        // Show rating cards
        document.getElementById('avg-rating-card').style.display = 'block';
        document.getElementById('rated-books-card').style.display = 'block';
    }
}

function calculateTopLists() {
    const filteredData = getFilteredBooks();
    const headers = statsData.headers;
    
    // Reset storage objects
    statsData.genreBooks = {};
    statsData.authorBooks = {};
    statsData.tagBooks = {};
    
    // Top genres/categories - check multiple sources
    const genreField = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('genre') || 
               lower.includes('categor') ||
               lower === 'group';
    });
    
    const tagsField = headers.find(h => h.toLowerCase().includes('tag'));
    const genreCounts = {};
    
    filteredData.forEach(book => {
        const genres = new Set();
        
        // Get from dedicated genre/category field
        if (genreField) {
            const genreValues = book[genreField]?.split(',').map(g => g.trim()).filter(g => g) || [];
            genreValues.forEach(g => genres.add(g));
        }
        
        // Extract genres from tags (look for common genre keywords)
        if (tagsField) {
            const tags = book[tagsField]?.split(',').map(t => t.trim()).filter(t => t) || [];
            const genreKeywords = [
                'fiction', 'nonfiction', 'non-fiction',
                'fantasy', 'scifi', 'sci-fi', 'science fiction',
                'horror', 'thriller', 'mystery',
                'romance', 'contemporary', 'historical',
                'biography', 'memoir', 'poetry',
                'classics', 'literary', 'drama',
                'adventure', 'action', 'crime',
                'paranormal', 'urban fantasy', 'dystopian',
                'ya', 'young adult', 'middle grade',
                'graphic novel', 'manga', 'comic'
            ];
            
            tags.forEach(tag => {
                const lowerTag = tag.toLowerCase();
                // Check if tag contains genre keywords (but not status indicators)
                if (genreKeywords.some(keyword => lowerTag.includes(keyword)) &&
                    !lowerTag.includes('tbr') && 
                    !lowerTag.includes('to-read') &&
                    !lowerTag.includes('not begun')) {
                    // Clean up tag - remove status prefixes
                    const cleanTag = tag.replace(/^(TBR|to-read)\s*-\s*/i, '').trim();
                    if (cleanTag) {
                        genres.add(cleanTag);
                    }
                }
            });
        }
        
        // Add to counts
        genres.forEach(genre => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            if (!statsData.genreBooks[genre]) {
                statsData.genreBooks[genre] = [];
            }
            statsData.genreBooks[genre].push(book);
        });
    });
    
    if (Object.keys(genreCounts).length > 0) {
        displayTopList('top-genres', genreCounts, 'genre');
    } else {
        document.getElementById('top-genres').innerHTML = '<p class="no-data">No genre data found</p>';
    }
    
    // Top authors
    const authorField = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('author') || 
               lower.includes('creator') ||
               lower === 'writers';
    });
    
    const authorCounts = {};
    
    if (authorField) {
        filteredData.forEach(book => {
            const authors = book[authorField]?.split(',').map(a => a.trim()).filter(a => a) || [];
            authors.forEach(author => {
                // Clean up author names - remove extra info in parentheses if very long
                let cleanAuthor = author;
                if (author.includes('(') && author.length > 50) {
                    cleanAuthor = author.split('(')[0].trim();
                }
                
                if (cleanAuthor) {
                    authorCounts[cleanAuthor] = (authorCounts[cleanAuthor] || 0) + 1;
                    if (!statsData.authorBooks[cleanAuthor]) {
                        statsData.authorBooks[cleanAuthor] = [];
                    }
                    statsData.authorBooks[cleanAuthor].push(book);
                }
            });
        });
    }
    
    if (Object.keys(authorCounts).length > 0) {
        displayTopList('top-authors', authorCounts, 'author');
    } else {
        document.getElementById('top-authors').innerHTML = '<p class="no-data">No author data found</p>';
    }
    
    // Top tags - exclude status and genre tags that were already counted
    if (tagsField) {
        const tagCounts = {};
        filteredData.forEach(book => {
            const tags = book[tagsField]?.split(',').map(t => t.trim()).filter(t => t) || [];
            tags.forEach(tag => {
                const lowerTag = tag.toLowerCase();
                
                // Skip status indicators
                const statusWords = ['tbr', 'to-read', 'read', 'completed', 'not begun', 'unread', 'finished'];
                if (statusWords.some(word => lowerTag === word || lowerTag.startsWith(word + ' '))) {
                    return;
                }
                
                // Skip if this was already counted as a genre (only if we have a separate genre field)
                if (genreField && statsData.genreBooks[tag]) {
                    return;
                }
                
                // Clean up tag - remove status prefixes
                let cleanTag = tag.replace(/^(TBR|to-read)\s*-\s*/i, '').trim();
                
                if (cleanTag) {
                    tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
                    if (!statsData.tagBooks[cleanTag]) {
                        statsData.tagBooks[cleanTag] = [];
                    }
                    statsData.tagBooks[cleanTag].push(book);
                }
            });
        });
        
        if (Object.keys(tagCounts).length > 0) {
            displayTopList('top-tags', tagCounts, 'tag');
        } else {
            document.getElementById('top-tags').innerHTML = '<p class="no-data">No additional tags found</p>';
        }
    } else {
        document.getElementById('top-tags').innerHTML = '<p class="no-data">No tag data found</p>';
    }
    
    // Top rated books (if ratings exist)
    if (statsData.hasRatings) {
        displayTopRatedBooks();
    }
}

// Display top rated books
function displayTopRatedBooks() {
    const filteredData = getFilteredBooks();
    const ratingField = statsData.ratingField;
    const titleField = statsData.headers.find(h => 
        h.toLowerCase().includes('title') && !h.toLowerCase().includes('subtitle')
    );
    
    // Get books with ratings, sorted by rating (highest first)
    const ratedBooks = filteredData
        .filter(book => {
            const rating = parseFloat(book[ratingField]);
            return !isNaN(rating) && rating > 0;
        })
        .sort((a, b) => {
            const ratingA = parseFloat(a[ratingField]);
            const ratingB = parseFloat(b[ratingField]);
            return ratingB - ratingA;
        })
        .slice(0, 10);
    
    if (ratedBooks.length > 0) {
        const html = ratedBooks.map(book => {
            const title = book[titleField] || 'Untitled';
            const rating = parseFloat(book[ratingField]).toFixed(1);
            
            return `
                <div class="top-list-item rated-book-item">
                    <span class="top-list-name">${title}</span>
                    <span class="top-list-badge rating-badge">⭐ ${rating}</span>
                </div>
            `;
        }).join('');
        
        document.getElementById('top-rated').innerHTML = html;
        document.getElementById('top-rated-card').style.display = 'block';
    } else {
        document.getElementById('top-rated-card').style.display = 'none';
    }
}

function displayTopList(elementId, counts, type) {
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const html = sorted.map(([name, count]) => `
        <div class="top-list-item" data-name="${name}" data-type="${type}">
            <span class="top-list-name">${name}</span>
            <span class="top-list-badge">${count}</span>
        </div>
    `).join('');
    
    document.getElementById(elementId).innerHTML = html || '<p class="no-data">No data available</p>';
    
    // Add click handlers for preview
    document.querySelectorAll(`#${elementId} .top-list-item`).forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            const type = item.dataset.type;
            showPreview(name, type);
        });
    });
}

// Modal handlers
function setupModalHandlers() {
    modalClose.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

function showPreview(name, type) {
    let books = [];
    let title = '';
    
    if (type === 'genre') {
        books = statsData.genreBooks[name] || [];
        title = `Books in "${name}"`;
    } else if (type === 'author') {
        books = statsData.authorBooks[name] || [];
        title = `Books by ${name}`;
    } else if (type === 'tag') {
        books = statsData.tagBooks[name] || [];
        title = `Books tagged "${name}"`;
    }
    
    modalTitle.textContent = title;
    
    // Get title and author fields
    const titleField = statsData.headers.find(h => 
        h.toLowerCase().includes('title') && !h.toLowerCase().includes('subtitle')
    );
    const authorField = statsData.headers.find(h => 
        h.toLowerCase().includes('author') || h.toLowerCase().includes('creator')
    );
    
    // Sort books alphabetically by title
    const sortedBooks = [...books].sort((a, b) => {
        const titleA = (a[titleField] || 'Untitled').toLowerCase();
        const titleB = (b[titleField] || 'Untitled').toLowerCase();
        return titleA.localeCompare(titleB);
    });
    
    const html = sortedBooks.map(book => {
        const bookTitle = book[titleField] || 'Untitled';
        const bookAuthor = book[authorField] || 'Unknown Author';
        
        return `
            <div class="book-preview-item">
                <div class="book-preview-title">${bookTitle}</div>
                <div class="book-preview-author">${bookAuthor}</div>
            </div>
        `;
    }).join('');
    
    modalBody.innerHTML = html || '<p class="no-data">No books found</p>';
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

// Toggle handlers
function setupToggleHandlers() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter
            statsData.currentFilter = btn.dataset.filter;
            
            // Recalculate rating stats if ratings exist
            if (statsData.hasRatings) {
                calculateRatingStats();
            }
            
            // Recalculate top lists
            calculateTopLists();
        });
    });
}

analyzeAgainBtn.addEventListener('click', () => {
    // Reset display but keep CSV data
    statsSection.classList.remove('active');
    uploadSection.classList.add('active');
    
    // Reset filter
    statsData.currentFilter = 'all';
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });
    
    checkForExistingCSV();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Setup download handler
function setupDownloadHandler() {
    downloadStatsBtn.addEventListener('click', async () => {
        const statsContent = document.getElementById('stats-content');
        const originalBtn = downloadStatsBtn.innerHTML;
        
        try {
            // Update button to show loading state
            downloadStatsBtn.innerHTML = '<span class="download-icon">⏳</span> Generating...';
            downloadStatsBtn.disabled = true;
            
            // Wait a moment for the button to update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Generate canvas from the stats content
            const canvas = await html2canvas(statsContent, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true,
                allowTaint: true
            });
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const date = new Date().toISOString().split('T')[0];
                link.download = `book-library-stats-${date}.png`;
                link.href = url;
                link.click();
                
                // Cleanup
                URL.revokeObjectURL(url);
                
                // Reset button
                downloadStatsBtn.innerHTML = originalBtn;
                downloadStatsBtn.disabled = false;
            });
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please try again.');
            downloadStatsBtn.innerHTML = originalBtn;
            downloadStatsBtn.disabled = false;
        }
    });
}
