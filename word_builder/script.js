let allWords = []; // This will hold the full word list
let validWords = []; // This will hold the filtered words based on input letters

const tileValues = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
    I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
    Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
    Y: 4, Z: 10
};

const tileDistribution = "EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGGBBCCMMPPFFHHVVWWYYKJXQZ".split('');

let wordCounts = {};
let correctGuesses = new Set();
let wrongGuesses = new Set();
let timerInterval;

function submitLetters() {
    const letters = document.getElementById('letters').value.toUpperCase();
    if (letters) {
        // Display the letters as tiles
        displayTiles(letters);

        // Enable the Start button
        document.getElementById('startButton').disabled = false;
    } else {
        console.error("No letters entered.");
    }
}



function generateRandomTiles() {
    const tileCount = parseInt(document.getElementById('tileCount').value) || 7;
    let randomTiles = '';
    for (let i = 0; i < tileCount; i++) {
        const randomIndex = Math.floor(Math.random() * tileDistribution.length);
        randomTiles += tileDistribution[randomIndex];
    }
    document.getElementById('letters').value = randomTiles;
    displayTiles(randomTiles);

    // Ensure the Start button is enabled after generating tiles
    document.getElementById('startButton').disabled = false;

    resetTimerDisplay(); // Reset the timer display
}

function resetTimerDisplay() {
    const minutes = parseInt(document.getElementById('minutes').value) || 3;
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:00`;
    clearInterval(timerInterval); // Ensure the timer is not running
}

function displayTiles(letters) {
    const scrabbleTiles = document.getElementById('scrabbleTiles');
    scrabbleTiles.innerHTML = ''; // Clear previous tiles

    for (let letter of letters) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.innerHTML = `${letter.toUpperCase()}<sub>${tileValues[letter.toUpperCase()]}</sub>`; // Include subscript
        scrabbleTiles.appendChild(tile);
    }
}

async function startGame() {
    console.log("Start button clicked");

    const letters = document.getElementById('letters').value.toUpperCase();
    if (!letters) {
        console.error("No letters found to start the game.");
        return;
    }

    const minLength = parseInt(document.getElementById('minLength').value) || 2;
    const maxLength = parseInt(document.getElementById('maxLength').value) || 5;

    const wordCountsDiv = document.getElementById('wordCounts');
    const correctAnswersDiv = document.getElementById('correctAnswers');
    const wrongAnswersDiv = document.getElementById('wrongAnswers');
    const remainingAnswersDiv = document.getElementById('remainingAnswers');
    const timerDisplay = document.getElementById('timerDisplay');
    const minutes = parseInt(document.getElementById('minutes').value) || 3;

    console.log("Starting game with letters:", letters);

    // Clear previous results
    correctGuesses.clear();
    wrongGuesses.clear();
    correctAnswersDiv.innerHTML = '<strong>Correct Answers:</strong>';
    wrongAnswersDiv.innerHTML = '<strong>Wrong Answers:</strong>';
    remainingAnswersDiv.innerHTML = '<strong>Remaining Answers:</strong>';
    wordCountsDiv.innerHTML = ''; 

    clearInterval(timerInterval);
    startTimer(minutes, timerDisplay);

    document.getElementById('revealButton').disabled = false; // Enable the Reveal Answers button

    try {
        const response = await fetch('https://ia903406.us.archive.org/31/items/csw21/CSW21.txt');
        const words = await response.text();
        allWords = words.split('\n').map(word => word.trim().toUpperCase()); // Store the full list in allWords

        // Pre-filter the word list to include only words that can be made with the available letters
        const filteredWords = allWords.filter(word => 
            canFormWord(word, letters) && word.length >= minLength && word.length <= maxLength
        );
        console.log("Filtered words:", filteredWords);

        validWords = getAllCombinations(letters).filter(word => filteredWords.includes(word));
        console.log("Valid words calculated:", validWords);

        wordCounts = validWords.reduce((counts, word) => {
            const length = word.length;
            if (!counts[length]) {
                counts[length] = 0;
            }
            counts[length]++;
            return counts;
        }, {});

        Object.keys(wordCounts).forEach(length => {
            const countElement = document.createElement('div');
            countElement.textContent = `${length}-letter words: ${wordCounts[length]}`;
            wordCountsDiv.appendChild(countElement);
        });

        document.getElementById('guess').disabled = false;
        document.querySelector('#guessInput button').disabled = false;
    } catch (error) {
        console.error("Error fetching or processing words:", error);
    }
}

function canFormWord(word, letters) {
    const letterCounts = {};
    for (const letter of letters) {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    for (const letter of word) {
        if (!letterCounts[letter]) {
            return false; // Letter in word not available in letters
        }
        letterCounts[letter]--;
    }
    return true;
}

function displayWordWithMark(word, validWords) {
    let prefixStr = '';
    let suffixStr = '';
    let markedWord = word;

    // Check for valid words by adding any letter at the start (A-Z)
    for (let letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        const newWordPrefix = letter + word;
        const newWordSuffix = word + letter;

        if (allWords.includes(newWordPrefix)) {
            prefixStr += letter.toLowerCase();
        }

        if (allWords.includes(newWordSuffix)) {
            suffixStr += letter.toLowerCase();
        }
    }

    // Add hyphens if removing the first or last letter forms a valid word
    const wordWithoutFirstLetter = word.slice(1);
    const wordWithoutLastLetter = word.slice(0, -1);

    if (allWords.includes(wordWithoutFirstLetter)) {
        markedWord = '-' + markedWord; // Add hyphen at the start
    }

    if (allWords.includes(wordWithoutLastLetter)) {
        markedWord = markedWord + '-'; // Add hyphen at the end
    }

    // Combine everything
    markedWord = `${prefixStr} ${markedWord} ${suffixStr}`.trim();

    console.log(`Word: ${word}, Prefixes: ${prefixStr}, Suffixes: ${suffixStr}, Marked: ${markedWord}`);

    return markedWord;
}

function submitGuess() {
    const guess = document.getElementById('guess').value.toUpperCase();

    if (correctGuesses.has(guess) || wrongGuesses.has(guess)) {
        document.getElementById('guess').value = ''; // Clear input
        return;
    }

    const minLength = parseInt(document.getElementById('minLength').value) || 2;
    const maxLength = parseInt(document.getElementById('maxLength').value) || 5;

    if (guess.length < minLength || guess.length > maxLength) {
        document.getElementById('guess').value = ''; // Clear input
        return;
    }

    if (canFormWord(guess, document.getElementById('letters').value)) {
        if (validWords.includes(guess)) {
            correctGuesses.add(guess);
            const markedWord = displayWordWithMark(guess, validWords);

            const correctAnswersDiv = document.getElementById('correctAnswers');
            const groupedWords = {};

            correctGuesses.forEach(word => {
                const length = word.length;
                if (!groupedWords[length]) {
                    groupedWords[length] = [];
                }
                groupedWords[length].push(displayWordWithMark(word, validWords));
            });

            correctAnswersDiv.innerHTML = '<strong>Correct Answers:</strong>';

            Object.keys(groupedWords).forEach(length => {
                const columnDiv = document.createElement('div');
                columnDiv.classList.add('correct-word-column'); // Use a specific class for correct answers
                groupedWords[length].forEach(word => {
                    const wordDiv = document.createElement('div');
                    wordDiv.textContent = word;
                    columnDiv.appendChild(wordDiv);
                });
                correctAnswersDiv.appendChild(columnDiv);
            });

            validWords = validWords.filter(word => word !== guess);

            wordCounts[guess.length]--;
            updateWordCounts();

            if (validWords.length === 0) {
                clearInterval(timerInterval);
                endRound();
            }
        } else {
            wrongGuesses.add(guess);
            const wrongAnswersDiv = document.getElementById('wrongAnswers');
            wrongAnswersDiv.innerHTML += `<div>${guess}</div>`;
        }
    }

    document.getElementById('guess').value = ''; // Clear input
}
function updateWordCounts() {
    const wordCountsDiv = document.getElementById('wordCounts');
    wordCountsDiv.innerHTML = ''; // Clear previous word counts

    Object.keys(wordCounts).forEach(length => {
        const countElement = document.createElement('div');
        countElement.textContent = `${length}-letter words: ${wordCounts[length]}`;
        wordCountsDiv.appendChild(countElement);
    });
}

function getAllCombinations(letters) {
    const combinations = new Set();

    function generateCombinations(prefix, remainingLetters) {
        if (prefix.length > 0) {
            combinations.add(prefix);
        }

        for (let i = 0; i < remainingLetters.length; i++) {
            generateCombinations(
                prefix + remainingLetters[i],
                remainingLetters.slice(0, i) + remainingLetters.slice(i + 1)
            );
        }
    }

    generateCombinations('', letters);
    return Array.from(combinations);
}

function startTimer(minutes, display) {
    let time = minutes * 60;
    timerInterval = setInterval(() => {
        const minutesLeft = Math.floor(time / 60);
        const secondsLeft = time % 60;

        display.textContent = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;

        if (time <= 0) {
            clearInterval(timerInterval);
            endRound();
        }

        time--;
    }, 1000);
}

function endRound() {
    alert("Round over!");
    document.getElementById('guess').disabled = true;
    document.querySelector('#guessInput button').disabled = true;
}

function revealAnswers() {
    clearInterval(timerInterval); // Stop the timer

    const remainingAnswersDiv = document.getElementById('remainingAnswers');
    remainingAnswersDiv.innerHTML = '<strong>Remaining Answers:</strong>'; // Reset remaining answers

    const sortedValidWords = validWords
        .filter(word => !correctGuesses.has(word))
        .sort((a, b) => b.length - a.length || a.localeCompare(b));

    const groupedWords = {};

    sortedValidWords.forEach(word => {
        const length = word.length;
        if (!groupedWords[length]) {
            groupedWords[length] = [];
        }
        groupedWords[length].push(displayWordWithMark(word, validWords));
    });

    Object.keys(groupedWords).forEach(length => {
        const columnDiv = document.createElement('div');
        columnDiv.classList.add('revealed-word-column'); // Use a different class for revealed answers
        groupedWords[length].forEach(word => {
            const wordDiv = document.createElement('div');
            wordDiv.textContent = word;
            columnDiv.appendChild(wordDiv);
        });
        remainingAnswersDiv.appendChild(columnDiv);
    });

    // Disable further guesses after revealing answers
    document.getElementById('guess').disabled = true;
    document.querySelector('#guessInput button').disabled = true;
}

function addExtensions(word, validWords) {
    let prefixStr = '';
    let suffixStr = '';

    // Check for valid words by adding a letter at the start
    for (let letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        if (validWords.includes(letter + word)) {
            prefixStr += letter.toLowerCase();
        }
    }

    // Check for valid words by adding a letter at the end
    for (let letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        if (validWords.includes(word + letter)) {
            suffixStr += letter.toLowerCase();
        }
    }

    // Combine the prefix and suffix with the word
    let markedWord = `${prefixStr} ${word} ${suffixStr}`.trim();

    // Debugging output to understand the state at this point
    console.log(`Word: ${word}, Prefix: ${prefixStr}, Suffix: ${suffixStr}, Marked: ${markedWord}`);

    return markedWord;
}

// Add event listener for key presses to shuffle/sort tiles
document.addEventListener('keydown', function(event) {
    if (['1', '2', '3'].includes(event.key)) {
        event.preventDefault(); // Prevent the key press from affecting the guess input

        if (event.key === '1') {
            shuffleTiles();
        } else if (event.key === '2') {
            sortTilesAlphabetically();
        } else if (event.key === '3') {
            sortTilesVowelsFirst();
        }

        // Ensure the Reveal Answers button remains enabled
        document.getElementById('revealButton').disabled = false;
    }
});

function shuffleTiles() {
    const letters = document.getElementById('letters').value.split('');
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    displayTiles(letters.join(''));
}

function sortTilesAlphabetically() {
    const letters = document.getElementById('letters').value.split('').sort();
    displayTiles(letters.join(''));
}

function sortTilesVowelsFirst() {
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const letters = document.getElementById('letters').value.split('');
    const vowelsArray = [];
    const consonantsArray = [];

    letters.forEach(letter => {
        if (vowels.includes(letter)) {
            vowelsArray.push(letter);
        } else {
            consonantsArray.push(letter);
        }
    });

    vowelsArray.sort();
    consonantsArray.sort();
    const sortedLetters = vowelsArray.concat(consonantsArray);
    displayTiles(sortedLetters.join(''));
}

// Add event listener for the Enter key in the guess input field
document.getElementById('guess').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitGuess();
    }
});

// Add event listener for the Enter key in the letters input field
document.getElementById('letters').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitLetters();
    }
});
