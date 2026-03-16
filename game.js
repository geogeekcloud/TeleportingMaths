const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const portalRoom = document.getElementById('portal-room');
const questionRoom = document.getElementById('question-room');
const questionEl = document.getElementById('question');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackEl = document.getElementById('feedback');
const scoreValue = document.getElementById('score-value');
const coinsValue = document.getElementById('coins-value');
const winScreen = document.getElementById('win-screen');
const restartBtn = document.getElementById('restart-btn');
const shopBtn = document.getElementById('shop-btn');
const shopScreen = document.getElementById('shop-screen');
const closeShopBtn = document.getElementById('close-shop-btn');
const inventoryList = document.getElementById('inventory-list');
const howMadeBtn = document.getElementById('how-made-btn');
const gameTitle = document.getElementById('game-title');
const superResetBtn = document.getElementById('super-reset-btn');

let score = 0;
let coins = 5;
let currentAnswer = 0;
let player = { x: 100, y: 300, width: 30, height: 50, speed: 5, direction: 'right' };
let portal = { x: 650, y: 275, width: 80, height: 150 };
let coin = { x: 0, y: 0, radius: 15, collected: false };
let suitcase = { x: 0, y: 0, width: 30, height: 25, collected: false };
let coinFrenzy = { active: false, timeLeft: 0, spawnTimer: 0 };
let frenzyCoins = [];
let keys = {};
let canEnterPortal = true;
let answerLocked = false;
let inventory = { yellowHat: false, redCap: false, greenCap: false, cape: false, face: false, flyingChair: false, blueHat: true, spiral: false, cloner: false, snake: false, petPortal: false, skibidiMode: false };
let equipped = { hat: 'blueHat', cape: false, face: false, chair: false, spiral: false, cloner: false, snake: false, petPortal: false, skibidiMode: false };
let spiralStartTime = 0; // Track when spiral started
let snakeTrail = []; // Array to store snake trail positions
let cloneSquare = []; // Array to store clone positions in square formation
let petPosition = { x: 0, y: 0 }; // Pet portal position


function ensureNoOverlap() {
    const portalCenterX = portal.x + portal.width / 2;
    const portalCenterY = portal.y + portal.height / 2;
    
    // Check coin doesn't overlap with portal
    if (!coin.collected) {
        const coinDistance = Math.sqrt(Math.pow(coin.x - portalCenterX, 2) + Math.pow(coin.y - portalCenterY, 2));
        if (coinDistance < 150) {
            spawnCoin();
            ensureNoOverlap();
            return;
        }
        
        // Check coin doesn't overlap with player
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const coinPlayerDistance = Math.sqrt(Math.pow(coin.x - playerCenterX, 2) + Math.pow(coin.y - playerCenterY, 2));
        
        if (coinPlayerDistance < 100) {
            spawnCoin();
            ensureNoOverlap();
            return;
        }
    }
    
    // Check suitcase doesn't overlap with portal
    if (!suitcase.collected) {
        const suitcaseCenterX = suitcase.x + suitcase.width / 2;
        const suitcaseCenterY = suitcase.y + suitcase.height / 2;
        const suitcaseDistance = Math.sqrt(Math.pow(suitcaseCenterX - portalCenterX, 2) + Math.pow(suitcaseCenterY - portalCenterY, 2));
        
        if (suitcaseDistance < 150) {
            spawnSuitcase();
            ensureNoOverlap();
            return;
        }
        
        // Check suitcase doesn't overlap with player
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const suitcasePlayerDistance = Math.sqrt(Math.pow(suitcaseCenterX - playerCenterX, 2) + Math.pow(suitcaseCenterY - playerCenterY, 2));
        
        if (suitcasePlayerDistance < 100) {
            spawnSuitcase();
            ensureNoOverlap();
            return;
        }
    }
    
    // Check portal doesn't overlap with player
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const portalPlayerDistance = Math.sqrt(Math.pow(portalCenterX - playerCenterX, 2) + Math.pow(portalCenterY - playerCenterY, 2));
    
    if (portalPlayerDistance < 150) {
        movePortal();
        ensureNoOverlap();
    }
}

function saveProgress() {
    const saveData = {
        score,
        coins,
        inventory,
        equipped
    };
    localStorage.setItem('portalMathGame', JSON.stringify(saveData));
}

function loadProgress() {
    const saved = localStorage.getItem('portalMathGame');
    if (saved) {
        const data = JSON.parse(saved);
        score = data.score || 0;
        coins = data.coins !== undefined ? data.coins : 5;
        inventory = data.inventory || { yellowHat: false, redCap: false, greenCap: false, cape: false, face: false, flyingChair: false, blueHat: true, spiral: false, cloner: false, snake: false, petPortal: false, skibidiMode: false };
        equipped = data.equipped || { hat: 'blueHat', cape: false, face: false, chair: false, spiral: false, cloner: false, snake: false, petPortal: false, skibidiMode: false };
        scoreValue.textContent = score;
        coinsValue.textContent = coins;
    } else {
        coinsValue.textContent = 5;
    }
}

function drawPlayer() {
    // Draw snake trail first if snake is equipped
    if (equipped.snake && inventory.snake) {
        snakeTrail.forEach(segment => {
            drawSinglePlayer(segment.x, segment.y, 0.5); // Draw snake at half opacity
        });
    }
    
    // Draw clones in square formation if cloner is equipped
    if (equipped.cloner && inventory.cloner) {
        cloneSquare.forEach(clone => {
            drawSinglePlayer(clone.x, clone.y, 0.6); // Draw clones slightly transparent
        });
    }
    
    // Draw main player
    drawSinglePlayer(player.x, player.y, 1.0);
}

function drawSinglePlayer(x, y, opacity) {
    ctx.globalAlpha = opacity;
    
    // Draw cape first (behind character)
    if (equipped.cape && inventory.cape) {
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        
        if (player.direction === 'left') {
            ctx.moveTo(x + player.width, y + 5);
            ctx.lineTo(x + player.width + 15, y + 15);
            ctx.lineTo(x + player.width + 10, y + 35);
            ctx.lineTo(x + player.width, y + 30);
        } else if (player.direction === 'right') {
            ctx.moveTo(x, y + 5);
            ctx.lineTo(x - 15, y + 15);
            ctx.lineTo(x - 10, y + 35);
            ctx.lineTo(x, y + 30);
        } else if (player.direction === 'up') {
            ctx.moveTo(x + 15, y + player.height);
            ctx.lineTo(x + 5, y + player.height + 15);
            ctx.lineTo(x + 25, y + player.height + 15);
        } else if (player.direction === 'down') {
            ctx.moveTo(x + 15, y);
            ctx.lineTo(x + 5, y - 15);
            ctx.lineTo(x + 25, y - 15);
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw flying chair with person sitting in it
    if (equipped.chair && inventory.flyingChair) {
        // Chair backrest
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 5, y + 15, 5, 25);
        
        // Chair seat
        ctx.fillRect(x - 5, y + 40, 25, 5);
        
        // Person's body sitting (side view)
        ctx.fillStyle = '#FFD7B5';
        ctx.fillRect(x, y + 25, 20, 15); // Torso
        
        // Person's legs bent sitting position
        ctx.fillRect(x + 15, y + 35, 8, 15); // Upper leg
        ctx.fillRect(x + 15, y + 50, 15, 8); // Lower leg stretched forward
        
        // Foot
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 28, y + 50, 8, 10);
        
        // Head
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(x + 10, y + 18, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Face
        if (equipped.face && inventory.face) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + 7, y + 16, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 13, y + 16, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 10, y + 20, 4, 0, Math.PI);
            ctx.stroke();
        }
        
        // Hat on head
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 3, y + 8, 14, 6);
        
        let capColor = '#1E90FF';
        if (equipped.hat === 'yellowHat') capColor = '#FFD700';
        else if (equipped.hat === 'redCap') capColor = '#FF0000';
        else if (equipped.hat === 'greenCap') capColor = '#00FF00';
        
        ctx.fillStyle = capColor;
        ctx.fillRect(x + 2, y + 4, 16, 4);
        
        // Left jetpack (behind chair)
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x - 15, y + 30, 8, 15);
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(x - 13, y + 45);
        ctx.lineTo(x - 15, y + 52);
        ctx.lineTo(x - 11, y + 52);
        ctx.lineTo(x - 9, y + 48);
        ctx.closePath();
        ctx.fill();
        
        // Right jetpack (in front of chair)
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x + 22, y + 30, 8, 15);
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(x + 26, y + 45);
        ctx.lineTo(x + 24, y + 52);
        ctx.lineTo(x + 28, y + 52);
        ctx.lineTo(x + 30, y + 48);
        ctx.closePath();
        ctx.fill();
    } else {
        // Draw standing character (when not in chair)
        ctx.fillStyle = '#FFD7B5';
        ctx.fillRect(x, y, player.width, player.height);
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        if (equipped.face && inventory.face) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + 10, y - 12, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 20, y - 12, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 15, y - 7, 5, 0, Math.PI);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 5, y - 20, 20, 8);
        
        let capColor = '#1E90FF';
        if (equipped.hat === 'yellowHat') capColor = '#FFD700';
        else if (equipped.hat === 'redCap') capColor = '#FF0000';
        else if (equipped.hat === 'greenCap') capColor = '#00FF00';
        
        ctx.fillStyle = capColor;
        ctx.fillRect(x + 3, y - 25, 24, 5);
    }
    
    ctx.globalAlpha = 1.0; // Reset opacity
}

function drawPortal() {
    const isHorizontal = portal.y < 50 || portal.y > canvas.height - 100;
    
    if (isHorizontal) {
        ctx.fillStyle = '#1E90FF';
        ctx.beginPath();
        ctx.ellipse(portal.x + portal.width / 2, portal.y + 40, portal.width / 2, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.ellipse(portal.x + portal.width / 2, portal.y + 40, portal.width / 2 - 10, 30, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#1E90FF';
        ctx.beginPath();
        ctx.ellipse(portal.x + 40, portal.y + 75, 40, 75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.ellipse(portal.x + 40, portal.y + 75, 30, 60, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCoin() {
    if (!coin.collected) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

function drawSuitcase() {
    if (!suitcase.collected) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(suitcase.x, suitcase.y, suitcase.width, suitcase.height);
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(suitcase.x + 2, suitcase.y + 2, suitcase.width - 4, suitcase.height - 4);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(suitcase.x, suitcase.y, suitcase.width, suitcase.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(suitcase.x + suitcase.width / 2 - 3, suitcase.y - 5, 6, 8);
    }
}

function drawFrenzyCoins() {
    frenzyCoins.forEach(fCoin => {
        if (!fCoin.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(fCoin.x, fCoin.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function spawnCoin() {
    // Avoid top-right corner where buttons are (200px from right, 180px from top)
    coin.x = Math.floor(Math.random() * (canvas.width - 300)) + 100;
    coin.y = Math.floor(Math.random() * (canvas.height - 250)) + 150;
    coin.collected = false;
}

function spawnSuitcase() {
    suitcase.x = Math.floor(Math.random() * (canvas.width - 300)) + 100;
    suitcase.y = Math.floor(Math.random() * (canvas.height - 250)) + 150;
    suitcase.collected = false;
}

function spawnFrenzyCoin() {
    const newCoin = {
        x: Math.floor(Math.random() * (canvas.width - 200)) + 100,
        y: Math.floor(Math.random() * (canvas.height - 200)) + 100,
        collected: false
    };
    frenzyCoins.push(newCoin);
}

function checkCoinCollision() {
    // Check main player collision
    if (!coin.collected) {
        const dx = player.x + player.width / 2 - coin.x;
        const dy = player.y + player.height / 2 - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < coin.radius + 15) {
            coin.collected = true;
            const coinValue = (equipped.petPortal && inventory.petPortal) ? 5 : 1;
            coins += coinValue;
            coinsValue.textContent = coins;
            saveProgress();
        }
    }
    
    // Check clone collision with coins if cloner is equipped
    if (equipped.cloner && inventory.cloner && !coin.collected) {
        cloneSquare.forEach(clone => {
            const dx = clone.x + player.width / 2 - coin.x;
            const dy = clone.y + player.height / 2 - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < coin.radius + 15) {
                coin.collected = true;
                const coinValue = (equipped.petPortal && inventory.petPortal) ? 5 : 1;
                coins += coinValue;
                coinsValue.textContent = coins;
                saveProgress();
            }
        });
    }
    
    if (!suitcase.collected) {
        const dx = player.x + player.width / 2 - (suitcase.x + suitcase.width / 2);
        const dy = player.y + player.height / 2 - (suitcase.y + suitcase.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
            suitcase.collected = true;
            coinFrenzy.active = true;
            coinFrenzy.timeLeft = 30;
            coinFrenzy.spawnTimer = 0;
            frenzyCoins = [];
        }
    }
    
    // Check frenzy coins with main player
    frenzyCoins.forEach(fCoin => {
        if (!fCoin.collected) {
            const dx = player.x + player.width / 2 - fCoin.x;
            const dy = player.y + player.height / 2 - fCoin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                fCoin.collected = true;
                const coinValue = (equipped.petPortal && inventory.petPortal) ? 5 : 1;
                coins += coinValue;
                coinsValue.textContent = coins;
                saveProgress();
            }
        }
    });
    
    // Check frenzy coins with clones if cloner is equipped
    if (equipped.cloner && inventory.cloner) {
        frenzyCoins.forEach(fCoin => {
            if (!fCoin.collected) {
                cloneSquare.forEach(clone => {
                    const dx = clone.x + player.width / 2 - fCoin.x;
                    const dy = clone.y + player.height / 2 - fCoin.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 20) {
                        fCoin.collected = true;
                        const coinValue = (equipped.petPortal && inventory.petPortal) ? 5 : 1;
                        coins += coinValue;
                        coinsValue.textContent = coins;
                        saveProgress();
                    }
                });
            }
        });
    }
}

function checkCollision() {
    return player.x + player.width > portal.x &&
           player.x < portal.x + portal.width &&
           player.y + player.height > portal.y &&
           player.y < portal.y + portal.height;
}

function movePortal() {
    // Avoid top-right corner where buttons are
    const minX = 100;
    const maxX = canvas.width - 250;
    const minY = 150;
    const maxY = canvas.height - 200;
    
    portal.x = Math.floor(Math.random() * (maxX - minX)) + minX;
    portal.y = Math.floor(Math.random() * (maxY - minY)) + minY;
    
    // Keep portal away from top-right corner (buttons area)
    if (portal.x > canvas.width - 300 && portal.y < 200) {
        portal.x = canvas.width - 400;
    }
    
    if (portal.y < 50 || portal.y > canvas.height - 100) {
        portal.width = 150;
        portal.height = 80;
    } else {
        portal.width = 80;
        portal.height = 150;
    }
}

function generateQuestion() {
    const operations = ['×', '÷'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2;
    
    if (operation === '×') {
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        currentAnswer = num1 * num2;
        questionEl.textContent = `${num1} × ${num2} = ?`;
    } else {
        num2 = Math.floor(Math.random() * 12) + 1;
        currentAnswer = Math.floor(Math.random() * 12) + 1;
        num1 = num2 * currentAnswer;
        questionEl.textContent = `${num1} ÷ ${num2} = ?`;
    }
}

function showQuestionRoom() {
    keys = {};
    portalRoom.classList.add('hidden');
    questionRoom.classList.remove('hidden');
    generateQuestion();
    answerInput.value = '';
    feedbackEl.textContent = '';
    answerLocked = false;
    
    // Start animation loop for question room
    if (!questionRoom.dataset.animating) {
        questionRoom.dataset.animating = 'true';
        animateQuestionRoom();
    }
    
    // Force focus with multiple attempts
    requestAnimationFrame(() => {
        answerInput.focus();
        requestAnimationFrame(() => {
            answerInput.focus();
            answerInput.click();
        });
    });
}

function animateQuestionRoom() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';
    canvas.id = 'question-animation';
    
    // Remove old canvas if exists
    const oldCanvas = document.getElementById('question-animation');
    if (oldCanvas) oldCanvas.remove();
    
    questionRoom.insertBefore(canvas, questionRoom.firstChild);
    const ctx = canvas.getContext('2d');
    
    let animationFrame = 0;
    
    function animate() {
        if (questionRoom.classList.contains('hidden')) {
            canvas.remove();
            questionRoom.dataset.animating = '';
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrame++;
        
        // Flying chair animation - loop-de-loops
        if (equipped.chair && inventory.flyingChair) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2 - 100;
            const radius = 80;
            const angle = (animationFrame / 30) * Math.PI * 2;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Draw loop-de-loop trail
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw mini player in chair
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x - 3, y, 3, 8);
            ctx.fillRect(x - 3, y + 8, 8, 3);
            ctx.fillStyle = '#FFD7B5';
            ctx.fillRect(x, y + 3, 5, 5);
            ctx.fillStyle = '#FFE4C4';
            ctx.beginPath();
            ctx.arc(x + 2, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Snake animation - running away
        if (equipped.snake && inventory.snake) {
            const playerX = 200 + Math.sin(animationFrame / 20) * 150;
            const playerY = canvas.height / 2;
            
            // Draw player running
            ctx.fillStyle = '#FFD7B5';
            ctx.fillRect(playerX, playerY, 15, 25);
            ctx.fillStyle = '#FFE4C4';
            ctx.beginPath();
            ctx.arc(playerX + 7, playerY - 5, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw snake chasing
            for (let i = 0; i < 10; i++) {
                const snakeX = playerX - 30 - (i * 15) + Math.sin((animationFrame + i * 5) / 10) * 10;
                const snakeY = playerY + 10;
                ctx.fillStyle = `rgba(0, 255, 0, ${1 - i * 0.08})`;
                ctx.beginPath();
                ctx.arc(snakeX, snakeY, 8 - i * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Snake head
            const headX = playerX - 30 + Math.sin(animationFrame / 10) * 10;
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(headX, playerY + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headX - 3, playerY + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, playerY + 8, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Spiral animation
        if (equipped.spiral && inventory.spiral) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const maxRadius = 150;
            const currentRadius = ((animationFrame % 150) / 150) * maxRadius;
            const angle = (animationFrame / 10) * Math.PI * 2;
            
            // Draw spiral trail
            ctx.strokeStyle = 'rgba(30, 144, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 100; i++) {
                const r = (i / 100) * currentRadius;
                const a = (i / 100) * angle;
                const x = centerX + Math.cos(a) * r;
                const y = centerY + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Draw player at end of spiral
            const x = centerX + Math.cos(angle) * currentRadius;
            const y = centerY + Math.sin(angle) * currentRadius;
            ctx.fillStyle = '#FFD7B5';
            ctx.fillRect(x - 7, y - 12, 15, 25);
            ctx.fillStyle = '#FFE4C4';
            ctx.beginPath();
            ctx.arc(x, y - 17, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Pet portal animation
        if (equipped.petPortal && inventory.petPortal) {
            const x = canvas.width - 100;
            const y = 100 + Math.sin(animationFrame / 20) * 20;
            
            ctx.fillStyle = '#1E90FF';
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#4169E1';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 8, y - 5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 8, y - 5, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Smile
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y + 5, 8, 0, Math.PI);
            ctx.stroke();
            
            // Sparkles
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.fillText('✨', x + 20, y - 20);
            ctx.fillText('💰', x - 30, y + 10);
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

function showPortalRoom() {
    keys = {};
    questionRoom.classList.add('hidden');
    portalRoom.classList.remove('hidden');
    player.x = 100;
    player.y = 300;
    movePortal();
    
    // Every 10 rounds spawn suitcase instead of coin
    if (score > 0 && score % 10 === 0) {
        spawnSuitcase();
    } else {
        spawnCoin();
    }
    
    ensureNoOverlap();
    canEnterPortal = true;
    answerInput.blur();
}

function checkAnswer() {
    if (answerLocked) return;
    const userAnswer = parseInt(answerInput.value);
    
    if (userAnswer === currentAnswer) {
        answerLocked = true;
        score++;
        const coinValue = (equipped.petPortal && inventory.petPortal) ? 5 : 1;
        coins += coinValue;
        
        // Give free pet portal on round 29!
        if (score === 29) {
            if (!inventory.petPortal) {
                inventory.petPortal = true;
                feedbackEl.textContent = '✓ Correct! 🎉 FREE PET PORTAL!';
            } else {
                feedbackEl.textContent = '✓ Correct!';
            }
        } else {
            feedbackEl.textContent = '✓ Correct!';
        }
        
        scoreValue.textContent = score;
        coinsValue.textContent = coins;
        feedbackEl.style.color = '#90EE90';
        saveProgress();
        
        if (score >= 30) {
            setTimeout(() => {
                questionRoom.classList.add('hidden');
                winScreen.classList.remove('hidden');
            }, 1000);
        } else {
            setTimeout(() => {
                showPortalRoom();
            }, 1000);
        }
    } else {
        if (coins > 0) {
            coins--;
            coinsValue.textContent = coins;
            saveProgress();
        }
        feedbackEl.textContent = '✗ Try again!';
        feedbackEl.style.color = '#FF6B6B';
        answerInput.value = '';
    }
}

function update() {
    // Store old position for clones
    const oldX = player.x;
    const oldY = player.y;
    
    // Set speed based on flying chair
    const currentSpeed = (equipped.chair === true && inventory.flyingChair === true) ? 18 : 2;
    
    // Handle spiral movement
    if (equipped.spiral && inventory.spiral) {
        // Calculate time since spiral started
        const timeSinceStart = (Date.now() - spiralStartTime) / 1000; // in seconds
        
        // Spiral grows from 0 to full screen height over time
        const maxRadius = canvas.height / 2; // Half screen height = full screen when spiraling
        const growthTime = 5; // Takes 5 seconds to reach full size
        const currentRadius = (timeSinceStart % growthTime) / growthTime * maxRadius; // Loops back to 0 after reaching max
        
        // Spiral angle - spins faster as it grows
        const angle = (Date.now() - spiralStartTime) / 150; // Controls rotation speed
        
        // Center of screen
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Calculate position on spiral
        player.x = centerX + Math.cos(angle) * currentRadius - player.width / 2;
        player.y = centerY + Math.sin(angle) * currentRadius - player.height / 2;
        
        // Keep player in bounds
        if (player.x < 0) player.x = 0;
        if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
        if (player.y < 0) player.y = 0;
        if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
        
        // Update direction based on movement
        if (Math.cos(angle) > 0) player.direction = 'right';
        else player.direction = 'left';
    } else {
        // Normal movement with WASD
        if (keys['a'] || keys['A']) {
            if (player.x > 0) player.x -= currentSpeed;
            player.direction = 'left';
        }
        if (keys['d'] || keys['D']) {
            if (player.x < canvas.width - player.width) player.x += currentSpeed;
            player.direction = 'right';
        }
        if (keys['w'] || keys['W']) {
            if (player.y > 0) player.y -= currentSpeed;
            player.direction = 'up';
        }
        if (keys['s'] || keys['S']) {
            if (player.y < canvas.height - player.height) player.y += currentSpeed;
            player.direction = 'down';
        }
    }
    
    // Update snake trail to follow player with delay
    if (equipped.snake && inventory.snake) {
        // Add current position to front of snake trail
        snakeTrail.unshift({ x: oldX, y: oldY });
        // Keep only 100 segments
        if (snakeTrail.length > 100) {
            snakeTrail.pop();
        }
    }
    
    // Update clone square positions to move with player
    if (equipped.cloner && inventory.cloner) {
        // Create 500 clones to fill the entire screen!
        cloneSquare = [];
        const spacing = 35; // Space between clones
        const cols = Math.floor(canvas.width / spacing); // How many fit across
        const rows = Math.floor(canvas.height / spacing); // How many fit down
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                cloneSquare.push({
                    x: col * spacing,
                    y: row * spacing
                });
            }
        }
    }
    
    // Update pet portal position to follow player
    if (equipped.petPortal && inventory.petPortal) {
        // Pet follows player with a slight delay and bounces
        const targetX = player.x + player.width / 2 - 30;
        const targetY = player.y - 40 + Math.sin(Date.now() / 300) * 10; // Bouncing effect
        
        petPosition.x += (targetX - petPosition.x) * 0.1; // Smooth following
        petPosition.y += (targetY - petPosition.y) * 0.1;
    }
    
    checkCoinCollision();
    
    // Update coin frenzy
    if (coinFrenzy.active) {
        coinFrenzy.timeLeft -= 1/60; // Decrease by frame time
        coinFrenzy.spawnTimer += 1/60;
        
        if (coinFrenzy.spawnTimer >= 1) {
            spawnFrenzyCoin();
            coinFrenzy.spawnTimer = 0;
        }
        
        if (coinFrenzy.timeLeft <= 0) {
            coinFrenzy.active = false;
            frenzyCoins = [];
        }
    }
    
    // Only enter portal if not spinning in spiral
    if (checkCollision() && canEnterPortal && !(equipped.spiral && inventory.spiral)) {
        canEnterPortal = false;
        showQuestionRoom();
    }
}

function draw() {
    // Draw sky background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw buildings in background
    drawBuildings();
    
    drawCoin();
    drawSuitcase();
    drawFrenzyCoins();
    drawPortal();
    
    // Draw Skibidi Toilet if equipped
    if (equipped.skibidiMode && inventory.skibidiMode) {
        const toiletX = 50;
        const toiletY = canvas.height - 150;
        
        // Toilet bowl
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(toiletX, toiletY + 40, 60, 50);
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(toiletX + 5, toiletY + 45, 50, 40);
        
        // Toilet tank
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(toiletX + 10, toiletY, 40, 45);
        
        // Toilet lid (open)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(toiletX + 30, toiletY + 50, 25, 10, -0.5, 0, Math.PI);
        ctx.fill();
        
        // Face on toilet
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(toiletX + 20, toiletY + 20, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(toiletX + 40, toiletY + 20, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Evil smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(toiletX + 30, toiletY + 30, 8, Math.PI, 0);
        ctx.stroke();
        
        // LASER EYES!
        const laserTime = Date.now() / 100;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF0000';
        
        // If snake is equipped, shoot at the snake trail, otherwise shoot randomly
        if (equipped.snake && inventory.snake && snakeTrail.length > 0) {
            // Target the snake segments
            const targetSegment = snakeTrail[Math.floor(snakeTrail.length / 2)] || snakeTrail[0];
            
            // Left laser shooting at snake
            ctx.beginPath();
            ctx.moveTo(toiletX + 20, toiletY + 20);
            ctx.lineTo(targetSegment.x + 15, targetSegment.y + 25);
            ctx.stroke();
            
            // Right laser shooting at snake
            ctx.beginPath();
            ctx.moveTo(toiletX + 40, toiletY + 20);
            ctx.lineTo(targetSegment.x + 15, targetSegment.y + 25);
            ctx.stroke();
            
            // Draw explosion effect on snake
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(targetSegment.x + 15, targetSegment.y + 25, 10 + Math.sin(laserTime) * 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Shoot randomly if no snake
            // Left laser
            ctx.beginPath();
            ctx.moveTo(toiletX + 20, toiletY + 20);
            ctx.lineTo(toiletX + 20 + Math.cos(laserTime) * 200, toiletY + 20 + Math.sin(laserTime) * 50);
            ctx.stroke();
            
            // Right laser
            ctx.beginPath();
            ctx.moveTo(toiletX + 40, toiletY + 20);
            ctx.lineTo(toiletX + 40 + Math.cos(laserTime + 0.5) * 200, toiletY + 20 + Math.sin(laserTime + 0.5) * 50);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
    }
    
    // Draw pet portal
    if (equipped.petPortal && inventory.petPortal) {
        // Draw mini portal body
        ctx.fillStyle = '#1E90FF';
        ctx.beginPath();
        ctx.arc(petPosition.x, petPosition.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner portal circle
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(petPosition.x, petPosition.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Super cute eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(petPosition.x - 6, petPosition.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(petPosition.x + 6, petPosition.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // White sparkles in eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(petPosition.x - 5, petPosition.y - 6, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(petPosition.x + 7, petPosition.y - 6, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Cute smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(petPosition.x, petPosition.y + 3, 6, 0, Math.PI);
        ctx.stroke();
    }
    
    drawPlayer();
    
    // Draw frenzy timer
    if (coinFrenzy.active) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.fillRect(10, 10, 200, 40);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`COIN FRENZY: ${Math.ceil(coinFrenzy.timeLeft)}s`, 20, 35);
    }
}

function drawBuildings() {
    // Draw multiple buildings in the background
    const buildings = [
        { x: 50, y: 200, width: 80, height: 400, color: '#696969' },
        { x: 150, y: 250, width: 100, height: 350, color: '#808080' },
        { x: 270, y: 150, width: 90, height: 450, color: '#696969' },
        { x: 380, y: 220, width: 110, height: 380, color: '#778899' },
        { x: 510, y: 180, width: 85, height: 420, color: '#696969' },
        { x: 615, y: 240, width: 95, height: 360, color: '#808080' },
        { x: 730, y: 190, width: 70, height: 410, color: '#778899' }
    ];
    
    buildings.forEach(building => {
        // Draw building
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Draw windows
        ctx.fillStyle = '#FFD700';
        const windowRows = Math.floor(building.height / 40);
        const windowCols = Math.floor(building.width / 25);
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                const windowX = building.x + 10 + (col * 25);
                const windowY = building.y + 20 + (row * 40);
                ctx.fillRect(windowX, windowY, 10, 15);
            }
        }
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function updateInventoryDisplay() {
    inventoryList.innerHTML = '';
    
    const itemNames = {
        blueHat: 'Blue Hat',
        yellowHat: 'Yellow Hat',
        redCap: 'Red Cap',
        greenCap: 'Green Cap',
        cape: 'Cape',
        face: 'Face',
        flyingChair: 'Flying Chair',
        spiral: 'Spiral',
        snake: 'Snake',
        petPortal: 'Pet Portal',
        skibidiMode: 'Skibidi Toilet',
        cloner: 'Cloner'
    };
    
    for (let item in inventory) {
        if (inventory[item]) {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <span>${itemNames[item]}</span>
                <button class="equip-btn ${(equipped.hat === item || (item === 'flyingChair' && equipped.chair) || (item === 'cape' && equipped.cape) || (item === 'face' && equipped.face) || (item === 'spiral' && equipped.spiral) || (item === 'cloner' && equipped.cloner) || (item === 'snake' && equipped.snake) || (item === 'petPortal' && equipped.petPortal) || (item === 'skibidiMode' && equipped.skibidiMode)) ? 'equipped' : ''}" data-item="${item}">
                    ${(equipped.hat === item || (item === 'flyingChair' && equipped.chair) || (item === 'cape' && equipped.cape) || (item === 'face' && equipped.face) || (item === 'spiral' && equipped.spiral) || (item === 'cloner' && equipped.cloner) || (item === 'snake' && equipped.snake) || (item === 'petPortal' && equipped.petPortal) || (item === 'skibidiMode' && equipped.skibidiMode)) ? 'Equipped' : 'Equip'}
                </button>
            `;
            inventoryList.appendChild(div);
        }
    }
    
    document.querySelectorAll('.inventory-item .equip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.target.dataset.item;
            
            if (item === 'yellowHat' || item === 'blueHat' || item === 'redCap' || item === 'greenCap') {
                equipped.hat = item;
            } else if (item === 'cape') {
                equipped.cape = !equipped.cape;
            } else if (item === 'face') {
                equipped.face = !equipped.face;
            } else if (item === 'flyingChair') {
                equipped.chair = !equipped.chair;
            } else if (item === 'spiral') {
                const wasEquipped = equipped.spiral;
                equipped.spiral = !equipped.spiral;
                
                if (equipped.spiral && !wasEquipped) {
                    // When equipping spiral, move to center and start timer
                    player.x = canvas.width / 2 - player.width / 2;
                    player.y = canvas.height / 2 - player.height / 2;
                    spiralStartTime = Date.now();
                } else if (!equipped.spiral) {
                    // When unequipping spiral, teleport back to portal
                    player.x = portal.x + portal.width / 2 - player.width / 2;
                    player.y = portal.y + portal.height / 2 - player.height / 2;
                }
            } else if (item === 'cloner') {
                equipped.cloner = !equipped.cloner;
                if (!equipped.cloner) {
                    cloneSquare = []; // Clear clones when unequipped
                }
            } else if (item === 'snake') {
                equipped.snake = !equipped.snake;
                if (!equipped.snake) {
                    snakeTrail = [];
                }
            } else if (item === 'petPortal') {
                equipped.petPortal = !equipped.petPortal;
                if (equipped.petPortal) {
                    petPosition.x = player.x - 30;
                    petPosition.y = player.y - 40;
                }
            } else if (item === 'skibidiMode') {
                equipped.skibidiMode = !equipped.skibidiMode;
            }
            
            saveProgress();
            updateInventoryDisplay();
        });
    });
}

window.addEventListener('keydown', (e) => {
    if (portalRoom.classList.contains('hidden') || shopScreen.classList.contains('hidden') === false) {
        return;
    }
    keys[e.key] = true;
    keys[e.key.toLowerCase()] = true;
    e.preventDefault();
});

window.addEventListener('keyup', (e) => {
    if (portalRoom.classList.contains('hidden') || shopScreen.classList.contains('hidden') === false) {
        return;
    }
    keys[e.key] = false;
    keys[e.key.toLowerCase()] = false;
});

submitBtn.addEventListener('click', checkAnswer);

answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

answerInput.addEventListener('focus', () => {
    // Ensure keys object is cleared when input gets focus
    keys = {};
});

restartBtn.addEventListener('click', () => {
    score = 0;
    scoreValue.textContent = score;
    winScreen.classList.add('hidden');
    showPortalRoom();
});

shopBtn.addEventListener('click', () => {
    if (!shopScreen.classList.contains('hidden')) {
        shopScreen.classList.add('hidden');
        portalRoom.classList.remove('hidden');
        gameTitle.style.display = 'block';
    } else {
        keys = {};
        portalRoom.classList.add('hidden');
        shopScreen.classList.remove('hidden');
        gameTitle.style.display = 'none';
        updateInventoryDisplay();
    }
});

closeShopBtn.addEventListener('click', () => {
    shopScreen.classList.add('hidden');
    portalRoom.classList.remove('hidden');
    gameTitle.style.display = 'block';
});

howMadeBtn.addEventListener('click', () => {
    window.location.href = 'how-i-made-this.html';
});

superResetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset everything? This will delete all your coins, items, and score!')) {
        score = 0;
        coins = 5;
        inventory = { yellowHat: false, redCap: false, greenCap: false, cape: false, face: false, flyingChair: false, blueHat: true, spiral: false, cloner: false, snake: false, petPortal: false, skibidiMode: false };
        equipped = { hat: 'blueHat', cape: false, face: false, chair: false, spiral: false, cloner: false, snake: false, petPortal: false, skibidiMode: false };
        scoreValue.textContent = score;
        coinsValue.textContent = coins;
        localStorage.removeItem('portalMathGame');
        saveProgress();
        updateInventoryDisplay();
        alert('Everything has been reset!');
        location.reload();
    }
});

document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const item = e.target.dataset.item;
        const price = parseInt(e.target.dataset.price);
        
        if (coins >= price && !inventory[item]) {
            coins -= price;
            coinsValue.textContent = coins;
            inventory[item] = true;
            e.target.disabled = true;
            e.target.textContent = 'Owned';
            saveProgress();
            updateInventoryDisplay();
        }
    });
});

loadProgress();
updateInventoryDisplay();
movePortal();
spawnCoin();
suitcase.collected = true; // Start with suitcase collected
ensureNoOverlap();

// Add touch button event listeners for everyone
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

if (btnUp) {
    btnUp.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['w'] = true;
        keys['W'] = true;
    });
    btnUp.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['w'] = false;
        keys['W'] = false;
    });
    btnUp.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['w'] = true;
        keys['W'] = true;
    });
    btnUp.addEventListener('mouseup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['w'] = false;
        keys['W'] = false;
    });
    btnUp.addEventListener('mouseleave', (e) => {
        keys['w'] = false;
        keys['W'] = false;
    });
}

if (btnDown) {
    btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['s'] = true;
        keys['S'] = true;
    });
    btnDown.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['s'] = false;
        keys['S'] = false;
    });
    btnDown.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['s'] = true;
        keys['S'] = true;
    });
    btnDown.addEventListener('mouseup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['s'] = false;
        keys['S'] = false;
    });
    btnDown.addEventListener('mouseleave', (e) => {
        keys['s'] = false;
        keys['S'] = false;
    });
}

if (btnLeft) {
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['a'] = true;
        keys['A'] = true;
    });
    btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['a'] = false;
        keys['A'] = false;
    });
    btnLeft.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['a'] = true;
        keys['A'] = true;
    });
    btnLeft.addEventListener('mouseup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['a'] = false;
        keys['A'] = false;
    });
    btnLeft.addEventListener('mouseleave', (e) => {
        keys['a'] = false;
        keys['A'] = false;
    });
}

if (btnRight) {
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['d'] = true;
        keys['D'] = true;
    });
    btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['d'] = false;
        keys['D'] = false;
    });
    btnRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['d'] = true;
        keys['D'] = true;
    });
    btnRight.addEventListener('mouseup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys['d'] = false;
        keys['D'] = false;
    });
    btnRight.addEventListener('mouseleave', (e) => {
        keys['d'] = false;
        keys['D'] = false;
    });
}

gameLoop();
