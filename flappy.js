// Preloading resources
window.addEventListener('load', function() {
    const resources = [
        'assets/flappy_bird.gif',
        'assets/flappy_bird_backdrop.png',
        'assets/toptube.png',
        'assets/bottomtube.png',
        'assets/bird-jump.mp3',
        'assets/button-click.mp3',
        'assets/game-over.mp3',
        'assets/score-Points.mp3'
    ];

    let loadedResources = 0;
    const minLoadingTime = 700;
    const startTime = Date.now();

    function updatePreloader() {
        loadedResources++;
        const progress = Math.floor((loadedResources / resources.length) * 100);
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('progress-text').innerText = `${progress}%`;

        if (loadedResources === resources.length) {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = minLoadingTime - elapsedTime;
            const hideDelay = remainingTime > 0 ? remainingTime : 0;
            setTimeout(hidePreloader, hideDelay);
        }
    }

    function hidePreloader() {
        document.getElementById('preloader').style.display = 'none';
        showMainMenu();
    }

    resources.forEach(resource => {
        if (resource.endsWith('.mp3')) {
            const audio = new Audio();
            audio.src = resource;
            audio.oncanplaythrough = updatePreloader;
        } else {
            const img = new Image();
            img.src = resource;
            img.onload = updatePreloader;
        }
    });

    document.addEventListener("DOMContentLoaded", updatePreloader);
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game images
const birdImage = new Image();
const backgroundImage = new Image();
const pipeTopImage = new Image();
const pipeBottomImage = new Image();

// Sound effects
const jumpSound = new Audio('assets/bird-jump.mp3');
const clickSound = new Audio('assets/button-click.mp3');
const gameOverSound = new Audio('assets/game-over.mp3');
const scoreSound = new Audio('assets/score-Points.mp3');

// Set sound volume levels
jumpSound.volume = 0.3;
clickSound.volume = 0.4;
gameOverSound.volume = 0.5;
scoreSound.volume = 0.3;

let imagesLoaded = 0;
const totalImages = 4; // Number of images to load

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        updatePreloader(); // Ensure preloader updates after all images are loaded
    }
}

birdImage.src = 'assets/flappy_bird.gif';
birdImage.onload = imageLoaded;

backgroundImage.src = 'assets/background.jpg';
backgroundImage.onload = imageLoaded;

pipeTopImage.src = 'assets/toptube.png';
pipeTopImage.onload = imageLoaded;

pipeBottomImage.src = 'assets/bottomtube.png';
pipeBottomImage.onload = imageLoaded;

// Initial values for bird and pipes
let bird = { x: 100, y: 150, width: 68, height: 48, gravity: 0.3, lift: -4, velocity: 0 };
let pipes = [];
let score = 0;
let gameInterval;
let difficultySettings;
let countdown = 3;
let currentDifficulty = localStorage.getItem('currentDifficulty') || 'easy';

let highestScores = {
    easy: parseInt(localStorage.getItem('easyScore')) || 0,
    hard: parseInt(localStorage.getItem('hardScore')) || 0,
    advanced: parseInt(localStorage.getItem('advancedScore')) || 0
};

// Pipe dimensions
const PIPE_WIDTH = 52;
const PIPE_HEIGHT = 500;

// Full-Screen Functionality
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.mozRequestFullScreen) { // Firefox
            canvas.mozRequestFullScreen();
        } else if (canvas.webkitRequestFullscreen) { // Chrome, Safari, Opera
            canvas.webkitRequestfullscreen();
        } else if (canvas.msRequestFullscreen) { // IE/Edge
            canvas.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Adjust canvas and elements to new dimensions (including scaling bird and pipes)
function resizeCanvas() {
    const aspectRatio = 4 / 3;  // Assume original aspect ratio of the game

    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;

    // Maintain aspect ratio if needed
    if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio;
    } else {
        newHeight = newWidth / aspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;

    // Scale bird dimensions based on the new canvas size
    const scaleFactor = canvas.width / 800;  // Assuming original canvas width is 800px
    bird.width = 55 * scaleFactor;
    bird.height = 50 * scaleFactor;
    bird.x = 100 * scaleFactor;
    bird.y = canvas.height / 2;

    // Adjust pipes and other game elements similarly
    pipes.forEach(pipe => {
        pipe.width = PIPE_WIDTH * scaleFactor;
        pipe.gap = difficultySettings.gap * scaleFactor;
        pipe.topHeight = pipe.topHeight * scaleFactor; // Updated topHeight for scaling
    });
}

window.addEventListener("resize", resizeCanvas);

document.addEventListener("DOMContentLoaded", function() {
    showMainMenu();
    updateSelectedDifficulty(currentDifficulty);
});

function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.log("Audio play error:", e));
}

function startplay() {
    playClickSound();
    hideAll();
    resizeCanvas();  // Ensure canvas is resized before starting the game
    canvas.style.display = 'block';
    startGame(currentDifficulty);
}

function showHighestScores() {
    playClickSound();
    hideAll();
    document.getElementById('highestScoresOverlay').style.display = 'flex';
    document.getElementById('easyScore').innerText = highestScores.easy;
    document.getElementById('hardScore').innerText = highestScores.hard;
    document.getElementById('advancedScore').innerText = highestScores.advanced;
}

function showDifficultyScreen() {
    playClickSound();
    hideAll();
    document.getElementById('difficultyScreen').style.display = 'flex';
}

function showAbout() {
    playClickSound();
    hideAll();
    document.getElementById('about').style.display = 'flex';
}

function showReset() {
    playClickSound();
    hideAll();
    document.getElementById('reset').style.display = 'flex';
}

function closeOverlay() {
    playClickSound();
    hideAll();
    document.getElementById('Mainmenu').style.display = 'flex';
}

function startGame(difficulty) {
    hideAll();
    resizeCanvas();  // Resize canvas when starting the game
    canvas.style.display = 'block';
    currentDifficulty = difficulty;
    updateSelectedDifficulty(difficulty);
    setDifficultySettings(difficulty);

    resetGameState();
    drawStaticGame();
    startCountdown();
}

function setDifficultySettings(difficulty) {
    switch(difficulty) {
        case 'easy':
            difficultySettings = { gap: 200, speed: 3 }; // Adjusted gap for easy difficulty
            break;
        case 'hard':
            difficultySettings = { gap: 160, speed: 4 }; // Adjusted gap for hard difficulty
            break;
        case 'advanced':
            difficultySettings = { gap: 120, speed: 5 }; // Adjusted gap for advanced difficulty
            break;
    }
}

function resetGameState() {
    pipes = [];
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    countdown = 3;
}

function startCountdown() {
    const countdownInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStaticGame();
        ctx.font = '72px "Press Start 2P"';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.textAlign = 'center';

        if (countdown > 0) {
            drawCountdownText(countdown);
        } else {
            drawCountdownText('Go!');
        }
        countdown--;

        if (countdown < -1) {
            clearInterval(countdownInterval);
            gameInterval = setInterval(gameLoop, 1000 / 60);
            document.addEventListener('keydown', controlBird);
            canvas.addEventListener('click', controlBird);
        }
    }, 1000);
}

function drawCountdownText(text) {
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function controlBird(event) {
    if ((event.type === 'keydown' && event.code === 'Space') || event.type === 'click') {
        bird.velocity = bird.lift;
        jumpSound.currentTime = 0;
        jumpSound.play().catch(e => console.log("Jump sound error:", e));
    }
}

function gameLoop() {
    updateBird();
    updatePipes();
    checkCollisions();
    drawGame();
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
}

function updatePipes() {
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) {
        const gap = difficultySettings.gap; // Gap between the top and bottom pipes

        // Top pipe starts at y = 0 (top border)
        const topPipeHeight = Math.random() * (canvas.height - gap - 100) + 50;

        pipes.push({
            x: canvas.width,
            y: 0, // Top pipe starts at the top border
            width: PIPE_WIDTH,
            gap: gap,
            topHeight: topPipeHeight,
            bottomHeight: canvas.height - (topPipeHeight + gap) // Bottom pipe height
        });
    }

    pipes.forEach(pipe => {
        pipe.x -= difficultySettings.speed; // Move the pipe to the left
    });

    if (pipes.length > 0 && pipes[0].x + pipes[0].width < 0) {
        pipes.shift(); // Remove pipes that have gone off-screen
        score++;
        scoreSound.currentTime = 0;
        scoreSound.play().catch(e => console.log("Score sound error:", e));
    }
}

function checkCollisions() {
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        endGame();
    }

    pipes.forEach(pipe => {
        const bottomPipeY = pipe.y + pipe.topHeight + pipe.gap; // Position for the bottom pipe
        if (bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x &&
            (bird.y < pipe.y + pipe.topHeight || bird.y + bird.height > bottomPipeY)) {
            endGame();
        }
    });
}

function endGame() {
    clearInterval(gameInterval);
    document.removeEventListener('keydown', controlBird);
    canvas.removeEventListener('click', controlBird);

    if (score > highestScores[currentDifficulty]) {
        highestScores[currentDifficulty] = score;
        localStorage.setItem(`${currentDifficulty}Score`, score);
    }

    document.getElementById('finalScore').innerText = `Score: ${score}\n\nHighest Score: ${highestScores[currentDifficulty]}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
    
    // Play game over sound
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(e => console.log("Game over sound error:", e));
}

function restartGame() {
    playClickSound();
    startGame(currentDifficulty);
}

function showMainMenu() {
    hideAll();
    document.getElementById('Mainmenu').style.display = 'flex';
}

function confirmResetBtn() {
    playClickSound();
    localStorage.clear();
    highestScores = { easy: 0, hard: 0, advanced: 0 };
    closeOverlay();
}

function hideAll() {
    const overlays = [
        'Mainmenu',
        'highestScoresOverlay',
        'difficultyScreen',
        'about',
        'reset',
        'gameOverScreen'
    ];
    overlays.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    canvas.style.display = 'none';
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    drawBird();
    drawPipes();
    drawScore();
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(Math.min(bird.velocity * 0.05, 0.5));
    ctx.drawImage(birdImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
}

function drawPipes() {
    pipes.forEach(pipe => {
        // Draw the top pipe (starts at y = 0)
        ctx.drawImage(pipeTopImage, pipe.x, pipe.y, pipe.width, pipe.topHeight);

        // Draw the bottom pipe (starts at y = topPipeHeight + gap)
        const bottomPipeY = pipe.y + pipe.topHeight + pipe.gap;
        ctx.drawImage(pipeBottomImage, pipe.x, bottomPipeY, pipe.width, pipe.bottomHeight);
    });
}

function drawScore() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`Score: ${score}`, 60, 50);
}

window.addEventListener('keydown', function(e) {
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
    }
});

function drawStaticGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);
}

function updateSelectedDifficulty(difficulty) {
    const selectedDifficultySpan = document.getElementById('selectedDifficulty');
    selectedDifficultySpan.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    localStorage.setItem('currentDifficulty', difficulty);
}