// App State
let appState = {
    csvData: [],
    headers: [],
    selectedColumns: [],
    selectedValues: {},
    filteredBooks: [],
    csvFileName: '',
    statusField: null,
    unreadValues: []
};

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const columnsSection = document.getElementById('columns-section');
const valuesSection = document.getElementById('values-section');
const resultSection = document.getElementById('result-section');

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const uploadZoneContainer = document.getElementById('upload-zone-container');
const csvLoadedNotice = document.getElementById('csv-loaded-notice');
const loadedCsvName = document.getElementById('loaded-csv-name');
const useExistingCsvBtn = document.getElementById('use-existing-csv-btn');
const uploadDifferentCsvBtn = document.getElementById('upload-different-csv-btn');

const columnsList = document.getElementById('columns-list');
const columnsNextBtn = document.getElementById('columns-next-btn');
const randomBookBtn = document.getElementById('random-book-btn');

const valuesContainer = document.getElementById('values-container');
const pickBookBtn = document.getElementById('pick-book-btn');
const unreadOnlyCheckbox = document.getElementById('unread-only-checkbox');
const unreadHint = document.getElementById('unread-hint');

const bookDetails = document.getElementById('book-details');
const pickAnotherBtn = document.getElementById('pick-another-btn');
const startOverBtn = document.getElementById('start-over-btn');

// Check for existing CSV data on page load
window.addEventListener('DOMContentLoaded', () => {
    checkForExistingCSV();
});

function checkForExistingCSV() {
    const savedData = localStorage.getItem('bookLibraryCSV');
    const savedFileName = localStorage.getItem('bookLibraryCSVName');
    
    if (savedData && savedFileName) {
        const parsedData = JSON.parse(savedData);
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
        appState.csvData = parsedData.data;
        appState.headers = parsedData.headers;
        appState.csvFileName = savedFileName;
        
        setTimeout(() => {
            showSection('columns');
            renderColumns();
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
    appState.csvFileName = file.name;
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            appState.csvData = results.data;
            appState.headers = results.meta.fields;
            
            // Save to localStorage
            saveCSVToLocalStorage();
            
            // Show columns section after a brief delay
            setTimeout(() => {
                showSection('columns');
                renderColumns();
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
            data: appState.csvData,
            headers: appState.headers
        };
        localStorage.setItem('bookLibraryCSV', JSON.stringify(dataToSave));
        localStorage.setItem('bookLibraryCSVName', appState.csvFileName);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        // If localStorage is full, continue anyway
    }
}

// Check if column is useful for filtering
function isUsefulFilterColumn(header, data) {
    const lowerHeader = header.toLowerCase();
    
    // Exclude patterns - columns that are typically unique or not useful for filtering
    const excludePatterns = [
        'isbn', 'id', 'book id', 
        'price', 'cost',
        'copies', 'copy',
        'disc', 'disk',
        'player',
        'url', 'link',
        'description', 'review', 'note', 'summary',
        'subtitle', 'sub-title',
        'first name', 'last name', 'firstname', 'lastname',
        'date added', 'added', 'completed', 'began', 'started', 'finished',
        'publish date', 'published at', 'publication date', 'review date',
        'ensemble', 'aspect ratio', 'esrb',
        'upc', 'ean',
        'page count', 'pages', 'length', 'page',
        'number of'
    ];
    
    // Check if header matches any exclude pattern
    if (excludePatterns.some(pattern => lowerHeader.includes(pattern))) {
        return false;
    }
    
    // Include patterns - columns that are typically useful for filtering
    const includePatterns = [
        'author', 'creator', 'writer',
        'genre', 'category', 'categories',
        'tag', 'tags',
        'status', 'read', 'bookshelf',
        'publisher', 'imprint',
        'format', 'edition',
        'language', 'lang',
        'series',
        'rating', 'stars',
        'group', 'collection',
        'type', 'item type',
        'translator', 'illustrator', 'narrator', 'editor'
    ];
    
    // Check if header matches any include pattern
    if (includePatterns.some(pattern => lowerHeader.includes(pattern))) {
        return true;
    }
    
    // For other columns, check if they have repeated values (not mostly unique)
    // Get unique values
    const values = data.map(row => row[header]).filter(v => v && v.trim() !== '');
    const uniqueValues = new Set(values);
    
    // If column has values and less than 50% are unique, it's probably useful for filtering
    if (values.length > 0 && uniqueValues.size < values.length * 0.5) {
        return true;
    }
    
    return false;
}

// Render Columns
function renderColumns() {
    columnsList.innerHTML = '';
    
    // Filter headers to only show useful columns
    const usefulHeaders = appState.headers.filter(header => 
        isUsefulFilterColumn(header, appState.csvData)
    );
    
    if (usefulHeaders.length === 0) {
        columnsList.innerHTML = '<p class="no-data">No filterable columns found in your CSV</p>';
        return;
    }
    
    usefulHeaders.forEach(header => {
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        columnItem.innerHTML = `
            <div class="column-checkbox"></div>
            <span>${header}</span>
        `;
        
        columnItem.addEventListener('click', () => {
            columnItem.classList.toggle('selected');
            updateSelectedColumns();
        });
        
        columnsList.appendChild(columnItem);
    });
}

function updateSelectedColumns() {
    const selectedItems = document.querySelectorAll('.column-item.selected');
    appState.selectedColumns = Array.from(selectedItems).map(item => 
        item.querySelector('span').textContent
    );
    
    columnsNextBtn.disabled = appState.selectedColumns.length === 0;
}

columnsNextBtn.addEventListener('click', () => {
    if (appState.selectedColumns.length > 0) {
        showSection('values');
        renderValues();
    }
});

// Random book button - pick completely at random
randomBookBtn.addEventListener('click', () => {
    if (appState.csvData.length === 0) {
        alert('No books available. Please upload a CSV first.');
        return;
    }
    
    // Pick a completely random book from entire library
    const randomBook = appState.csvData[
        Math.floor(Math.random() * appState.csvData.length)
    ];
    
    displayBook(randomBook);
    showSection('result');
});

// Detect unread status field and values
function detectUnreadField() {
    // Find potential status fields
    const statusField = appState.headers.find(h => 
        h.toLowerCase().includes('read') || 
        h.toLowerCase().includes('status') ||
        h.toLowerCase().includes('bookshelf') ||
        h.toLowerCase().includes('completed')
    );
    
    if (!statusField) {
        unreadHint.textContent = 'No status field detected in your CSV';
        unreadOnlyCheckbox.disabled = true;
        return;
    }
    
    appState.statusField = statusField;
    
    // Analyze values to determine what indicates "unread"
    const uniqueValues = [...new Set(
        appState.csvData.map(row => row[statusField]).filter(v => v)
    )];
    
    // Common unread indicators
    const unreadIndicators = ['0', 'tbr', 'to be read', 'not begun', 'unread', 'to-read', 'want to read'];
    
    appState.unreadValues = uniqueValues.filter(value => {
        const lowerValue = value.toLowerCase().trim();
        return unreadIndicators.some(indicator => lowerValue.includes(indicator));
    });
    
    if (appState.unreadValues.length > 0) {
        const unreadCount = appState.csvData.filter(book => {
            const value = book[statusField]?.toLowerCase() || '';
            return appState.unreadValues.some(uv => value.includes(uv.toLowerCase()));
        }).length;
        
        unreadHint.textContent = `Found ${unreadCount} unread books (using "${statusField}" field)`;
        unreadOnlyCheckbox.disabled = false;
    } else {
        unreadHint.textContent = `Status field found ("${statusField}"), but couldn't detect unread values`;
        unreadOnlyCheckbox.disabled = true;
    }
}

// Render Values
function renderValues() {
    valuesContainer.innerHTML = '';
    appState.selectedValues = {};
    
    // Detect and show unread filter
    detectUnreadField();
    
    appState.selectedColumns.forEach(column => {
        // Get unique values for this column
        const uniqueValues = [...new Set(
            appState.csvData
                .map(row => row[column])
                .filter(val => val && val.trim() !== '')
                .flatMap(val => {
                    // Handle comma-separated values
                    return val.split(',').map(v => v.trim());
                })
        )].sort();
        
        if (uniqueValues.length === 0) return;
        
        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group';
        
        const heading = document.createElement('h3');
        heading.textContent = column;
        filterGroup.appendChild(heading);
        
        const valuesList = document.createElement('div');
        valuesList.className = 'values-list';
        
        uniqueValues.forEach(value => {
            const valueTag = document.createElement('div');
            valueTag.className = 'value-tag';
            valueTag.textContent = value;
            
            valueTag.addEventListener('click', () => {
                valueTag.classList.toggle('selected');
                updateSelectedValues(column);
            });
            
            valuesList.appendChild(valueTag);
        });
        
        filterGroup.appendChild(valuesList);
        valuesContainer.appendChild(filterGroup);
    });
}

function updateSelectedValues(column) {
    const filterGroup = Array.from(valuesContainer.children).find(
        group => group.querySelector('h3').textContent === column
    );
    
    const selectedTags = filterGroup.querySelectorAll('.value-tag.selected');
    
    if (selectedTags.length > 0) {
        appState.selectedValues[column] = Array.from(selectedTags).map(tag => tag.textContent);
    } else {
        delete appState.selectedValues[column];
    }
}

pickBookBtn.addEventListener('click', () => {
    filterAndPickBook();
});

// Check if a book is unread
function isBookUnread(book) {
    if (!appState.statusField || appState.unreadValues.length === 0) {
        return true; // If we can't detect, don't filter
    }
    
    const bookStatus = book[appState.statusField]?.toLowerCase() || '';
    return appState.unreadValues.some(uv => bookStatus.includes(uv.toLowerCase()));
}

// Filter and Pick Book
function filterAndPickBook() {
    // Start with all books
    let booksToFilter = appState.csvData;
    
    // Apply unread filter if checked
    if (unreadOnlyCheckbox.checked && appState.statusField) {
        booksToFilter = booksToFilter.filter(book => isBookUnread(book));
    }
    
    // Filter books based on selected values
    appState.filteredBooks = booksToFilter.filter(book => {
        // If no filters selected, include all books
        if (Object.keys(appState.selectedValues).length === 0) {
            return true;
        }
        
        // Check if book matches all selected filters
        return Object.entries(appState.selectedValues).every(([column, values]) => {
            const bookValue = book[column];
            if (!bookValue) return false;
            
            // Handle comma-separated values
            const bookValues = bookValue.split(',').map(v => v.trim());
            
            // Check if any of the book's values match any selected value
            return values.some(selectedValue => 
                bookValues.some(bv => bv === selectedValue)
            );
        });
    });
    
    if (appState.filteredBooks.length === 0) {
        const unreadMsg = unreadOnlyCheckbox.checked ? ' unread' : '';
        alert(`😢 No${unreadMsg} books match your criteria! Try adjusting your filters.`);
        return;
    }
    
    // Pick a random book
    const randomBook = appState.filteredBooks[
        Math.floor(Math.random() * appState.filteredBooks.length)
    ];
    
    displayBook(randomBook);
    showSection('result');
}

// Helper function to check if a field should be displayed as tags/badges
function isTagField(fieldName) {
    const tagFields = ['tags', 'tag', 'genre', 'genres', 'categories', 'category', 'authors', 'author'];
    return tagFields.some(tf => fieldName.toLowerCase().includes(tf));
}

// Helper function to format value as tags if applicable
function formatValue(fieldName, value) {
    if (!value || value.trim() === '') return '';
    
    // Check if this field should be displayed as tags
    if (isTagField(fieldName)) {
        const tags = value.split(',').map(v => v.trim()).filter(v => v);
        if (tags.length > 1 || tags.length === 1) {
            return tags.map(tag => `<span class="display-tag">${tag}</span>`).join('');
        }
    }
    
    return value;
}

// Display Book with prettified tags
function displayBook(book) {
    let html = '';
    
    // Try to find title field (different CSV formats)
    const titleField = appState.headers.find(h => 
        h.toLowerCase().includes('title') && !h.toLowerCase().includes('subtitle')
    );
    
    if (titleField && book[titleField]) {
        html += `<div class="book-title">${book[titleField]}</div>`;
    }
    
    // Display all fields with prettified tags
    appState.headers.forEach(header => {
        const value = book[header];
        if (value && value.trim() !== '' && 
            !header.toLowerCase().includes('description') && 
            !header.toLowerCase().includes('review') &&
            !header.toLowerCase().includes('note') &&
            header !== titleField) {
            
            const formattedValue = formatValue(header, value);
            html += `
                <div class="book-info">
                    <strong>${header}:</strong> 
                    <span class="book-info-value">${formattedValue}</span>
                </div>
            `;
        }
    });
    
    // Display description/review last if it exists
    const longTextField = appState.headers.find(h => 
        h.toLowerCase().includes('description') || 
        h.toLowerCase().includes('review') ||
        h.toLowerCase().includes('note')
    );
    
    if (longTextField && book[longTextField] && book[longTextField].trim() !== '') {
        html += `
            <div class="book-description">
                <strong>${longTextField}:</strong><br>
                ${book[longTextField]}
            </div>
        `;
    }
    
    bookDetails.innerHTML = html;
}

pickAnotherBtn.addEventListener('click', () => {
    if (appState.filteredBooks.length > 1) {
        const currentBook = bookDetails.querySelector('.book-title')?.textContent;
        let newBook;
        
        // Make sure we pick a different book
        do {
            newBook = appState.filteredBooks[
                Math.floor(Math.random() * appState.filteredBooks.length)
            ];
        } while (appState.filteredBooks.length > 1 && 
                 newBook[appState.headers.find(h => h.toLowerCase().includes('title'))] === currentBook);
        
        displayBook(newBook);
    } else {
        filterAndPickBook();
    }
});

startOverBtn.addEventListener('click', () => {
    // Reset selections but keep CSV data
    appState.selectedColumns = [];
    appState.selectedValues = {};
    appState.filteredBooks = [];
    
    // Reset UI
    columnsList.innerHTML = '';
    valuesContainer.innerHTML = '';
    bookDetails.innerHTML = '';
    unreadOnlyCheckbox.checked = false;
    unreadHint.textContent = '';
    
    // Check if we have CSV data loaded
    if (appState.csvData.length > 0) {
        // If we have data, go back to columns selection
        showSection('columns');
        renderColumns();
    } else {
        // Otherwise show upload section
        showSection('upload');
        checkForExistingCSV();
    }
});

// Navigation Helper
function showSection(sectionName) {
    const sections = {
        'upload': uploadSection,
        'columns': columnsSection,
        'values': valuesSection,
        'result': resultSection
    };
    
    Object.values(sections).forEach(section => section.classList.remove('active'));
    sections[sectionName].classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
