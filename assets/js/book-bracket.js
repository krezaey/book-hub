// App State
let bracketState = {
    csvData: [],
    headers: [],
    csvFileName: '',
    books: [], // 16 books for the bracket
    bracket: {
        round1: [], // Sweet 16 (8 matchups)
        round2: [], // Quarterfinals (4 matchups)
        round3: [], // Semifinals (2 matchups)
        final: [], // Final (1 matchup)
        winner: null
    },
    currentRound: 1,
    usedReadBooks: false
};

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const bracketSection = document.getElementById('bracket-section');
const winnerSection = document.getElementById('winner-section');

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const uploadZoneContainer = document.getElementById('upload-zone-container');
const csvLoadedNotice = document.getElementById('csv-loaded-notice');
const loadedCsvName = document.getElementById('loaded-csv-name');
const useExistingCsvBtn = document.getElementById('use-existing-csv-btn');
const uploadDifferentCsvBtn = document.getElementById('upload-different-csv-btn');

const bracketTitle = document.getElementById('bracket-title');
const bracketSource = document.getElementById('bracket-source');
const bracketContainer = document.getElementById('bracket-container');
const restartBracketBtn = document.getElementById('restart-bracket-btn');
const downloadBracketBtn = document.getElementById('download-bracket-btn');

const currentRoundView = document.getElementById('current-round-view');
const fullBracketView = document.getElementById('full-bracket-view');
const currentRoundContainer = document.getElementById('current-round-container');
const currentViewBtn = document.getElementById('current-view-btn');
const fullViewBtn = document.getElementById('full-view-btn');

const winnerDetails = document.getElementById('winner-details');
const newBracketBtn = document.getElementById('new-bracket-btn');
const viewBracketBtn = document.getElementById('view-bracket-btn');

let currentView = 'current'; // 'current' or 'full'

// Check for existing CSV data on page load
window.addEventListener('DOMContentLoaded', () => {
    checkForExistingCSV();
    setupViewToggle();
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
        bracketState.csvData = parsedData.data;
        bracketState.headers = parsedData.headers;
        bracketState.csvFileName = savedFileName;
        
        initializeBracket();
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
    bracketState.csvFileName = file.name;
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            bracketState.csvData = results.data;
            bracketState.headers = results.meta.fields;
            
            // Save to localStorage
            saveCSVToLocalStorage();
            
            setTimeout(() => {
                initializeBracket();
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
            data: bracketState.csvData,
            headers: bracketState.headers
        };
        localStorage.setItem('bookLibraryCSV', JSON.stringify(dataToSave));
        localStorage.setItem('bookLibraryCSVName', bracketState.csvFileName);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// Check if book is read
function isBookRead(book) {
    const headers = bracketState.headers;
    const readIndicators = ['1', 'completed', 'read', 'finished'];
    
    const statusFields = headers.filter(h => {
        const lower = h.toLowerCase();
        return lower.includes('read') || 
               lower.includes('status') ||
               lower.includes('completed') ||
               lower.includes('bookshelf');
    });
    
    for (const field of statusFields) {
        const value = book[field]?.toLowerCase() || '';
        if (readIndicators.some(indicator => value.includes(indicator))) {
            return true;
        }
    }
    
    // Check tags field
    const tagsField = headers.find(h => h.toLowerCase().includes('tag'));
    if (tagsField) {
        const tags = book[tagsField]?.toLowerCase() || '';
        if (readIndicators.some(indicator => tags.includes(indicator))) {
            return true;
        }
    }
    
    return false;
}

// Get book title
function getBookTitle(book) {
    const titleField = bracketState.headers.find(h => 
        h.toLowerCase().includes('title') && !h.toLowerCase().includes('subtitle')
    );
    return titleField && book[titleField] ? book[titleField] : 'Untitled';
}

// Get book author
function getBookAuthor(book) {
    const authorField = bracketState.headers.find(h => 
        h.toLowerCase().includes('author') || h.toLowerCase().includes('creator')
    );
    return authorField && book[authorField] ? book[authorField] : 'Unknown Author';
}

// Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize bracket with 16 random books
function initializeBracket() {
    if (bracketState.csvData.length < 16) {
        alert(`Not enough books in your library! You need at least 16 books, but you only have ${bracketState.csvData.length}.`);
        return;
    }
    
    // Try to get read books first
    const readBooks = bracketState.csvData.filter(book => isBookRead(book));
    
    let selectedBooks;
    if (readBooks.length >= 16) {
        // Use read books
        selectedBooks = shuffleArray(readBooks).slice(0, 16);
        bracketState.usedReadBooks = true;
        bracketSource.innerHTML = '📚 Featuring books from your <strong>read list</strong>';
    } else {
        // Fallback to all books
        selectedBooks = shuffleArray(bracketState.csvData).slice(0, 16);
        bracketState.usedReadBooks = false;
        if (readBooks.length > 0) {
            bracketSource.innerHTML = `⚠️ Not enough read books (found ${readBooks.length}). Using <strong>random books from your library</strong>`;
        } else {
            bracketSource.innerHTML = '📖 Using <strong>random books from your library</strong>';
        }
    }
    
    bracketState.books = selectedBooks;
    
    // Initialize Round 1 (Sweet 16 - 8 matchups)
    bracketState.bracket.round1 = [];
    for (let i = 0; i < 16; i += 2) {
        bracketState.bracket.round1.push({
            book1: selectedBooks[i],
            book2: selectedBooks[i + 1],
            winner: null
        });
    }
    
    // Reset other rounds
    bracketState.bracket.round2 = [];
    bracketState.bracket.round3 = [];
    bracketState.bracket.final = [];
    bracketState.bracket.winner = null;
    bracketState.currentRound = 1;
    
    // Reset to current round view
    currentView = 'current';
    currentViewBtn.classList.add('active');
    fullViewBtn.classList.remove('active');
    currentRoundView.classList.add('active');
    fullBracketView.classList.remove('active');
    
    showSection('bracket');
    renderBracket();
}

// Setup view toggle
function setupViewToggle() {
    currentViewBtn.addEventListener('click', () => {
        currentView = 'current';
        currentViewBtn.classList.add('active');
        fullViewBtn.classList.remove('active');
        currentRoundView.classList.add('active');
        fullBracketView.classList.remove('active');
    });
    
    fullViewBtn.addEventListener('click', () => {
        currentView = 'full';
        fullViewBtn.classList.add('active');
        currentViewBtn.classList.remove('active');
        fullBracketView.classList.add('active');
        currentRoundView.classList.remove('active');
    });
}

// Render the bracket
function renderBracket() {
    // Update title based on current round
    const roundNames = {
        1: 'Sweet 16 Tournament',
        2: 'Quarterfinals',
        3: 'Semifinals',
        4: 'Finals'
    };
    bracketTitle.textContent = roundNames[bracketState.currentRound] || 'Tournament';
    
    // Render current round view
    renderCurrentRoundView();
    
    // Render full bracket view
    renderFullBracketView();
}

// Render current round view (vertical, no horizontal scroll)
function renderCurrentRoundView() {
    currentRoundContainer.innerHTML = '';
    
    const roundNames = {
        1: 'Round of 16',
        2: 'Quarter Finals',
        3: 'Semi Finals',
        4: 'Final'
    };
    
    const roundTitle = document.createElement('h3');
    roundTitle.className = 'current-round-title';
    roundTitle.textContent = roundNames[bracketState.currentRound] || 'Current Round';
    currentRoundContainer.appendChild(roundTitle);
    
    // Get current round data
    let currentRoundData;
    let roundKey;
    if (bracketState.currentRound === 1) {
        currentRoundData = bracketState.bracket.round1;
        roundKey = 'round1';
    } else if (bracketState.currentRound === 2) {
        currentRoundData = bracketState.bracket.round2;
        roundKey = 'round2';
    } else if (bracketState.currentRound === 3) {
        currentRoundData = bracketState.bracket.round3;
        roundKey = 'round3';
    } else if (bracketState.currentRound === 4) {
        currentRoundData = bracketState.bracket.final;
        roundKey = 'final';
    }
    
    if (!currentRoundData || currentRoundData.length === 0) {
        currentRoundContainer.innerHTML += '<p class="no-data">No matchups available</p>';
        return;
    }
    
    // Progress indicator
    const completedMatchups = currentRoundData.filter(m => m.winner !== null).length;
    const totalMatchups = currentRoundData.length;
    const progressBar = document.createElement('div');
    progressBar.className = 'round-progress';
    progressBar.innerHTML = `
        <div class="progress-text">Progress: ${completedMatchups} / ${totalMatchups} matchups complete</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${(completedMatchups / totalMatchups) * 100}%"></div>
        </div>
    `;
    currentRoundContainer.appendChild(progressBar);
    
    // Render matchups
    const matchupsGrid = document.createElement('div');
    matchupsGrid.className = 'current-matchups-grid';
    
    currentRoundData.forEach((matchup, index) => {
        const matchupCard = createMatchupCard(matchup, index, roundKey, bracketState.currentRound, true);
        matchupsGrid.appendChild(matchupCard);
    });
    
    currentRoundContainer.appendChild(matchupsGrid);
}

// Create a matchup card
function createMatchupCard(matchup, index, roundKey, roundNum, isClickable) {
    const book1Title = getBookTitle(matchup.book1);
    const book1Author = getBookAuthor(matchup.book1);
    const book2Title = getBookTitle(matchup.book2);
    const book2Author = getBookAuthor(matchup.book2);
    
    const hasWinner = matchup.winner !== null;
    const book1Class = hasWinner ? (matchup.winner === 1 ? 'winner' : 'loser') : '';
    const book2Class = hasWinner ? (matchup.winner === 2 ? 'winner' : 'loser') : '';
    
    const matchupDiv = document.createElement('div');
    matchupDiv.className = 'matchup-card';
    
    matchupDiv.innerHTML = `
        <div class="matchup-header">
            <span class="matchup-number">Matchup ${index + 1}</span>
            ${hasWinner ? '<span class="matchup-complete">✓ Complete</span>' : '<span class="matchup-pending">Choose winner</span>'}
        </div>
        <div class="matchup-book ${book1Class}" data-round="${roundKey}" data-index="${index}" data-book="1">
            <div class="book-seed">${roundNum === 1 ? (index * 2 + 1) : ''}</div>
            <div class="book-info-bracket">
                <div class="book-title-bracket">${book1Title}</div>
                <div class="book-author-bracket">${book1Author}</div>
            </div>
            ${hasWinner && matchup.winner === 1 ? '<div class="winner-badge">✓</div>' : ''}
        </div>
        <div class="matchup-vs">VS</div>
        <div class="matchup-book ${book2Class}" data-round="${roundKey}" data-index="${index}" data-book="2">
            <div class="book-seed">${roundNum === 1 ? (index * 2 + 2) : ''}</div>
            <div class="book-info-bracket">
                <div class="book-title-bracket">${book2Title}</div>
                <div class="book-author-bracket">${book2Author}</div>
            </div>
            ${hasWinner && matchup.winner === 2 ? '<div class="winner-badge">✓</div>' : ''}
        </div>
    `;
    
    // Add click handlers if clickable and no winner yet
    if (isClickable && !hasWinner) {
        const book1Elem = matchupDiv.querySelector('[data-book="1"]');
        const book2Elem = matchupDiv.querySelector('[data-book="2"]');
        
        book1Elem.addEventListener('click', () => selectWinner(roundKey, index, 1));
        book2Elem.addEventListener('click', () => selectWinner(roundKey, index, 2));
        
        book1Elem.style.cursor = 'pointer';
        book2Elem.style.cursor = 'pointer';
    }
    
    return matchupDiv;
}

// Render full bracket view (traditional horizontal layout)
function renderFullBracketView() {
    bracketContainer.innerHTML = '';
    
    // Create bracket structure
    const bracketHTML = `
        <div class="bracket-rounds">
            <div class="bracket-round">
                <h3 class="round-title">Round of 16</h3>
                <div class="matchups" id="round1-matchups"></div>
            </div>
            <div class="bracket-round">
                <h3 class="round-title">Quarter Finals</h3>
                <div class="matchups" id="round2-matchups"></div>
            </div>
            <div class="bracket-round">
                <h3 class="round-title">Semi Finals</h3>
                <div class="matchups" id="round3-matchups"></div>
            </div>
            <div class="bracket-round">
                <h3 class="round-title">Final</h3>
                <div class="matchups" id="final-matchups"></div>
            </div>
        </div>
    `;
    
    bracketContainer.innerHTML = bracketHTML;
    
    // Render each round
    renderRound('round1', 1);
    renderRound('round2', 2);
    renderRound('round3', 3);
    renderRound('final', 4);
}

// Render a specific round
function renderRound(roundKey, roundNum) {
    const matchupsContainer = document.getElementById(`${roundKey}-matchups`);
    if (!matchupsContainer) return;
    
    let roundData;
    if (roundKey === 'final') {
        roundData = bracketState.bracket.final.length > 0 ? [bracketState.bracket.final[0]] : [];
    } else {
        roundData = bracketState.bracket[roundKey] || [];
    }
    
    if (roundData.length === 0) {
        matchupsContainer.innerHTML = '<div class="matchup-placeholder">Waiting for previous round...</div>';
        return;
    }
    
    matchupsContainer.innerHTML = '';
    
    roundData.forEach((matchup, index) => {
        const matchupDiv = document.createElement('div');
        matchupDiv.className = 'matchup';
        
        const book1Title = getBookTitle(matchup.book1);
        const book1Author = getBookAuthor(matchup.book1);
        const book2Title = getBookTitle(matchup.book2);
        const book2Author = getBookAuthor(matchup.book2);
        
        const isCurrentRound = bracketState.currentRound === roundNum;
        const hasWinner = matchup.winner !== null;
        
        const book1Class = hasWinner ? (matchup.winner === 1 ? 'winner' : 'loser') : '';
        const book2Class = hasWinner ? (matchup.winner === 2 ? 'winner' : 'loser') : '';
        
        matchupDiv.innerHTML = `
            <div class="matchup-book ${book1Class}" data-round="${roundKey}" data-index="${index}" data-book="1">
                <div class="book-seed">${roundNum === 1 ? (index * 2 + 1) : ''}</div>
                <div class="book-info-bracket">
                    <div class="book-title-bracket">${book1Title}</div>
                    <div class="book-author-bracket">${book1Author}</div>
                </div>
                ${hasWinner && matchup.winner === 1 ? '<div class="winner-badge">✓</div>' : ''}
            </div>
            <div class="matchup-vs">VS</div>
            <div class="matchup-book ${book2Class}" data-round="${roundKey}" data-index="${index}" data-book="2">
                <div class="book-seed">${roundNum === 1 ? (index * 2 + 2) : ''}</div>
                <div class="book-info-bracket">
                    <div class="book-title-bracket">${book2Title}</div>
                    <div class="book-author-bracket">${book2Author}</div>
                </div>
                ${hasWinner && matchup.winner === 2 ? '<div class="winner-badge">✓</div>' : ''}
            </div>
        `;
        
        matchupsContainer.appendChild(matchupDiv);
        
        // Add click handlers if this is the current round and no winner yet
        if (isCurrentRound && !hasWinner) {
            const book1Elem = matchupDiv.querySelector('[data-book="1"]');
            const book2Elem = matchupDiv.querySelector('[data-book="2"]');
            
            book1Elem.addEventListener('click', () => selectWinner(roundKey, index, 1));
            book2Elem.addEventListener('click', () => selectWinner(roundKey, index, 2));
            
            book1Elem.style.cursor = 'pointer';
            book2Elem.style.cursor = 'pointer';
        }
    });
}

// Select a winner for a matchup
function selectWinner(roundKey, matchupIndex, bookNum) {
    let matchup;
    if (roundKey === 'final') {
        matchup = bracketState.bracket.final[0];
    } else {
        matchup = bracketState.bracket[roundKey][matchupIndex];
    }
    
    matchup.winner = bookNum;
    
    // Check if round is complete
    const isRoundComplete = checkRoundComplete(roundKey);
    
    if (isRoundComplete) {
        // Advance to next round
        if (roundKey === 'round1') {
            advanceToRound2();
        } else if (roundKey === 'round2') {
            advanceToRound3();
        } else if (roundKey === 'round3') {
            advanceToFinal();
        } else if (roundKey === 'final') {
            declareWinner();
        }
    }
    
    renderBracket();
}

// Check if a round is complete
function checkRoundComplete(roundKey) {
    let roundData;
    if (roundKey === 'final') {
        roundData = bracketState.bracket.final;
    } else {
        roundData = bracketState.bracket[roundKey];
    }
    
    return roundData.every(matchup => matchup.winner !== null);
}

// Advance to Round 2 (Quarterfinals)
function advanceToRound2() {
    bracketState.bracket.round2 = [];
    
    for (let i = 0; i < bracketState.bracket.round1.length; i += 2) {
        const match1 = bracketState.bracket.round1[i];
        const match2 = bracketState.bracket.round1[i + 1];
        
        const winner1 = match1.winner === 1 ? match1.book1 : match1.book2;
        const winner2 = match2.winner === 1 ? match2.book1 : match2.book2;
        
        bracketState.bracket.round2.push({
            book1: winner1,
            book2: winner2,
            winner: null
        });
    }
    
    bracketState.currentRound = 2;
}

// Advance to Round 3 (Semifinals)
function advanceToRound3() {
    bracketState.bracket.round3 = [];
    
    for (let i = 0; i < bracketState.bracket.round2.length; i += 2) {
        const match1 = bracketState.bracket.round2[i];
        const match2 = bracketState.bracket.round2[i + 1];
        
        const winner1 = match1.winner === 1 ? match1.book1 : match1.book2;
        const winner2 = match2.winner === 1 ? match2.book1 : match2.book2;
        
        bracketState.bracket.round3.push({
            book1: winner1,
            book2: winner2,
            winner: null
        });
    }
    
    bracketState.currentRound = 3;
}

// Advance to Final
function advanceToFinal() {
    const match1 = bracketState.bracket.round3[0];
    const match2 = bracketState.bracket.round3[1];
    
    const winner1 = match1.winner === 1 ? match1.book1 : match1.book2;
    const winner2 = match2.winner === 1 ? match2.book1 : match2.book2;
    
    bracketState.bracket.final = [{
        book1: winner1,
        book2: winner2,
        winner: null
    }];
    
    bracketState.currentRound = 4;
}

// Declare the winner
function declareWinner() {
    const finalMatch = bracketState.bracket.final[0];
    const champion = finalMatch.winner === 1 ? finalMatch.book1 : finalMatch.book2;
    
    bracketState.bracket.winner = champion;
    
    // Display winner
    displayWinner(champion);
    showSection('winner');
}

// Display the winner
function displayWinner(book) {
    let html = '';
    
    const titleField = bracketState.headers.find(h => 
        h.toLowerCase().includes('title') && !h.toLowerCase().includes('subtitle')
    );
    
    if (titleField && book[titleField]) {
        html += `<div class="champion-title">${book[titleField]}</div>`;
    }
    
    // Display book details
    bracketState.headers.forEach(header => {
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
    
    winnerDetails.innerHTML = html;
}

// Helper function to format value as tags if applicable
function formatValue(fieldName, value) {
    if (!value || value.trim() === '') return '';
    
    const tagFields = ['tags', 'tag', 'genre', 'genres', 'categories', 'category', 'authors', 'author'];
    const isTagField = tagFields.some(tf => fieldName.toLowerCase().includes(tf));
    
    if (isTagField) {
        const tags = value.split(',').map(v => v.trim()).filter(v => v);
        if (tags.length >= 1) {
            return tags.map(tag => `<span class="display-tag">${tag}</span>`).join('');
        }
    }
    
    return value;
}

// Navigation Helper
function showSection(sectionName) {
    const sections = {
        'upload': uploadSection,
        'bracket': bracketSection,
        'winner': winnerSection
    };
    
    Object.values(sections).forEach(section => section.classList.remove('active'));
    sections[sectionName].classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Restart bracket button
restartBracketBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to start a new bracket? This will create a new tournament with different books.')) {
        initializeBracket();
    }
});

// New bracket button (from winner screen)
newBracketBtn.addEventListener('click', () => {
    initializeBracket();
});

// View bracket button (from winner screen)
viewBracketBtn.addEventListener('click', () => {
    // Switch to full bracket view
    currentView = 'full';
    fullViewBtn.classList.add('active');
    currentViewBtn.classList.remove('active');
    fullBracketView.classList.add('active');
    currentRoundView.classList.remove('active');
    
    showSection('bracket');
});

// Setup download handler
function setupDownloadHandler() {
    downloadBracketBtn.addEventListener('click', async () => {
        const originalBtn = downloadBracketBtn.innerHTML;
        
        try {
            // Update button to show loading state
            downloadBracketBtn.innerHTML = '<span class="download-icon">⏳</span> Generating...';
            downloadBracketBtn.disabled = true;
            
            // Wait a moment for the button to update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Determine which view to capture
            let elementToCapture;
            let fileName;
            let canvasOptions;
            
            if (currentView === 'current') {
                elementToCapture = document.getElementById('current-round-view');
                const roundNames = {
                    1: 'round-of-16',
                    2: 'quarterfinals',
                    3: 'semifinals',
                    4: 'finals'
                };
                const roundName = roundNames[bracketState.currentRound] || 'bracket';
                fileName = `book-bracket-${roundName}`;
                
                canvasOptions = {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    allowTaint: true,
                    scrollY: -window.scrollY
                };
            } else {
                // For full bracket view, we need to capture the entire scrollable width
                const bracketRounds = document.querySelector('.bracket-rounds');
                elementToCapture = bracketRounds;
                fileName = 'book-bracket-full';
                
                canvasOptions = {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    allowTaint: true,
                    scrollX: 0,
                    scrollY: -window.scrollY,
                    windowWidth: bracketRounds.scrollWidth,
                    width: bracketRounds.scrollWidth,
                    height: bracketRounds.scrollHeight,
                    x: 0,
                    y: 0
                };
            }
            
            // Generate canvas from the bracket
            const canvas = await html2canvas(elementToCapture, canvasOptions);
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const date = new Date().toISOString().split('T')[0];
                link.download = `${fileName}-${date}.png`;
                link.href = url;
                link.click();
                
                // Cleanup
                URL.revokeObjectURL(url);
                
                // Reset button
                downloadBracketBtn.innerHTML = originalBtn;
                downloadBracketBtn.disabled = false;
            });
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please try again.');
            downloadBracketBtn.innerHTML = originalBtn;
            downloadBracketBtn.disabled = false;
        }
    });
}

