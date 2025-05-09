// Function to get a random three-letter word from the list
function getRandomThreeLetterWord(words) {
    const threeLetterWords = words.filter(word => word.length === 3);
    return threeLetterWords[Math.floor(Math.random() * threeLetterWords.length)];
}

// Function to build a tree structure of words
function buildWordTree(root, words) {
    const wordTree = { name: root, parent: null, children: [], guessed: true };  // Root word starts guessed
    const currentWords = [wordTree];

    while (currentWords.length > 0) {
        const nextWords = [];

        currentWords.forEach(node => {
            const validChildrenLeft = [];
            const validChildrenRight = [];

            for (let letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
                const newWord1 = letter + node.name;
                const newWord2 = node.name + letter;

                if (words.includes(newWord1) && !validChildrenLeft.some(child => child.name === newWord1)) {
                    validChildrenLeft.push({ name: newWord1, parent: node.name, children: [], guessed: false });
                }
                if (words.includes(newWord2) && !validChildrenRight.some(child => child.name === newWord2)) {
                    validChildrenRight.push({ name: newWord2, parent: node.name, children: [], guessed: false });
                }
            }

            if (validChildrenLeft.length > 0) {
                node.children.push(...validChildrenLeft);
                nextWords.push(...validChildrenLeft);
            }
            if (validChildrenRight.length > 0) {
                node.children.push(...validChildrenRight);
                nextWords.push(...validChildrenRight);
            }
        });

        currentWords.splice(0, currentWords.length, ...nextWords);
    }

    return wordTree;
}

// Function to count the number of child words
function countChildren(node) {
    if (!node.children || node.children.length === 0) {
        return 0;
    }

    return node.children.length + node.children.reduce((sum, child) => sum + countChildren(child), 0);
}

// Function to create the user interface for word selection and display
function createWordSelectionUI(words) {
    const uiDiv = document.createElement('div');
    uiDiv.style.position = 'absolute';
    uiDiv.style.top = '10px';
    uiDiv.style.left = '10px';

    const inputLabel = document.createElement('label');
    inputLabel.textContent = 'Enter a 3-letter word: ';
    uiDiv.appendChild(inputLabel);

    const wordInput = document.createElement('input');
    wordInput.type = 'text';
    wordInput.maxLength = 3;
    wordInput.placeholder = 'e.g., CAT';
    uiDiv.appendChild(wordInput);

    const randomButton = document.createElement('button');
    randomButton.textContent = 'Pick Random Word';
    randomButton.onclick = () => {
        const selectedWord = getRandomThreeLetterWord(words);
        wordInput.value = selectedWord;
        generateTree(selectedWord, words);
    };
    uiDiv.appendChild(randomButton);

    const generateButton = document.createElement('button');
    generateButton.textContent = 'Generate Tree';
    generateButton.onclick = () => {
        const selectedWord = wordInput.value.trim().toUpperCase();
        if (selectedWord.length === 3 && words.includes(selectedWord)) {
            generateTree(selectedWord, words);
        } else {
            alert('Please enter a valid 3-letter word.');
        }
    };
    uiDiv.appendChild(generateButton);

    const revealButton = document.createElement('button');
    revealButton.textContent = 'Reveal All';
    revealButton.onclick = () => {
        revealAllWords();
    };
    uiDiv.appendChild(revealButton);

    document.body.appendChild(uiDiv);

    const childrenCountLabel = document.createElement('div');
    childrenCountLabel.style.position = 'absolute';
    childrenCountLabel.style.top = '10px';
    childrenCountLabel.style.right = '10px';  // Move to the top right
    childrenCountLabel.id = 'children-count';
    document.body.appendChild(childrenCountLabel);

    const guessInputDiv = document.createElement('div');
    guessInputDiv.style.position = 'absolute';
    guessInputDiv.style.bottom = '10px';
    guessInputDiv.style.left = '50%';
    guessInputDiv.style.transform = 'translateX(-50%)';

    const guessInput = document.createElement('input');
    guessInput.type = 'text';
    guessInput.id = 'guessInput';  // Apply the CSS style
    guessInput.placeholder = 'Type your guess here...';
    guessInputDiv.appendChild(guessInput);

    guessInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const guess = guessInput.value.trim().toUpperCase();
            checkGuess(guess);
            guessInput.value = '';  // Clear the input box after submission
        }
    });

    document.body.appendChild(guessInputDiv);
}

// Function to generate the tree and update the children count
function generateTree(rootWord, words) {
    d3.select('svg').remove();  // Clear previous tree
    const wordTree = buildWordTree(rootWord, words);
    renderTree(wordTree);
    const childrenCount = countChildren(wordTree);
    document.getElementById('children-count').textContent = `Number of child words: ${childrenCount}`;
}

// Function to check user guesses and reveal the correct word on the tree
function checkGuess(guess) {
    d3.selectAll('.node text').each(function(d) {
        if (d.data.name === guess && !d.data.guessed) {
            d.data.guessed = true;
            d3.select(this)
                .style('opacity', 1)  // Reveal the word by making it fully visible
                .style('font-weight', 'bold')  // Make the word bolder
                .style('fill', 'black');  // Make the word black
        }
    });
}

// Function to reveal all words
function revealAllWords() {
    d3.selectAll('.node text')
        .style('opacity', 1)  // Reveal all words
        .style('font-weight', 'bold')  // Make all words bolder
        .style('fill', 'black');  // Make all words black
}

// Fetch the word list and set up the interface
fetch('https://raw.githubusercontent.com/jalapic/word_games/refs/heads/main/word_builder/CSW25.txt')
    .then(response => response.text())
    .then(data => {
        const words = data.split('\n').map(word => word.trim().toUpperCase());
        createWordSelectionUI(words);
    })
    .catch(error => console.error('Error fetching word list:', error));

// D3.js code to render the tree
function renderTree(treeData) {
    const margin = { top: 20, right: 120, bottom: 20, left: 120 },
        width = 960 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom;

    const svg = d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const root = d3.hierarchy(treeData);

    const treeLayout = d3.tree().size([height, width]);

    treeLayout(root);

    // Links (lines connecting nodes)
    svg.selectAll('.link')
        .data(root.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
        );

    // Nodes (circles and text)
    const node = svg.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append('circle')
        .attr('r', 10)
        .style('fill', '#fff')
        .style('stroke', 'steelblue')
        .style('stroke-width', '3px');

    node.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children ? -13 : 13)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name)
        .style('font', '14px sans-serif')
        .style('font-weight', d => d.depth === 0 ? 'bold' : 'normal')  // Bold the root word
        .style('fill', d => d.depth === 0 ? 'black' : 'gray')  // Black for root word, gray for others
        .style('opacity', d => d.data.guessed || d.depth === 0 ? 1 : 0);  // Make others invisible initially
}
