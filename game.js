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
let inventory = { yellowHat: false, redCap: false, greenCap: false, cape: false, face: false, flyingChair: false, blueHat: true };
let equipped = { hat: 'blueHat', cape: false, face: false, chair: false };

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
        inventory = data.inventory || { yellowHat: false, redCap: false, greenCap: false, cape: false, face: false, flyingChair: false, blueHat: true };
        equipped = data.equipped || { hat: 'blueHat', cape: false, face: false, chair: false };
        scoreValue.textContent = score;
        coinsValue.textContent = coins;
    } else {
        coinsValue.textContent = 5;
    }
}

function drawPlayer() {
    // Draw cape first (behind character)
    if (equipped.cape && inventory.cape) {
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        
        if (player.direction === 'left') {
            ctx.moveTo(player.x + player.width, player.y + 5);
            ctx.lineTo(player.x + player.width + 15, player.y + 15);
            ctx.lineTo(player.x + player.width + 10, player.y + 35);
            ctx.lineTo(player.x + player.width, player.y + 30);
        } else if (player.direction === 'right') {
            ctx.moveTo(player.x, player.y + 5);
            ctx.lineTo(player.x - 15, player.y + 15);
            ctx.lineTo(player.x - 10, player.y + 35);
            ctx.lineTo(player.x, player.y + 30);
        } else if (player.direction === 'up') {
            ctx.moveTo(player.x + 15, player.y + player.height);
            ctx.lineTo(player.x + 5, player.y + player.height + 15);
            ctx.lineTo(player.x + 25, player.y + player.height + 15);
        } else if (player.direction === 'down') {
            ctx.moveTo(player.x + 15, player.y);
            ctx.lineTo(player.x + 5, player.y - 15);
            ctx.lineTo(player.x + 25, player.y - 15);
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw flying chair with person sitting in it
    if (equipped.chair && inventory.flyingChair) {
        // Chair backrest
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(player.x - 5, player.y + 15, 5, 25);
        
        // Chair seat
        ctx.fillRect(player.x - 5, player.y + 40, 25, 5);
        
        // Person's body sitting (side view)
        ctx.fillStyle = '#FFD7B5';
        ctx.fillRect(player.x, player.y + 25, 20, 15); // Torso
        
        // Person's legs bent sitting position
        ctx.fillRect(player.x + 15, player.y + 35, 8, 15); // Upper leg
        ctx.fillRect(player.x + 15, player.y + 50, 15, 8); // Lower leg stretched forward
        
        // Foot
        ctx.fillStyle = '#654321';
        ctx.fillRect(player.x + 28, player.y + 50, 8, 10);
        
        // Head
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(player.x + 10, player.y + 18, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Face
        if (equipped.face && inventory.face) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(player.x + 7, player.y + 16, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(player.x + 13, player.y + 16, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(player.x + 10, player.y + 20, 4, 0, Math.PI);
            ctx.stroke();
        }
        
        // Hat on head
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(player.x + 3, player.y + 8, 14, 6);
        
        let capColor = '#1E90FF';
        if (equipped.hat === 'yellowHat') capColor = '#FFD700';
        else if (equipped.hat === 'redCap') capColor = '#FF0000';
        else if (equipped.hat === 'greenCap') capColor = '#00FF00';
        
        ctx.fillStyle = capColor;
        ctx.fillRect(player.x + 2, player.y + 4, 16, 4);
        
        // Left jetpack (behind chair)
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(player.x - 15, player.y + 30, 8, 15);
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(player.x - 13, player.y + 45);
        ctx.lineTo(player.x - 15, player.y + 52);
        ctx.lineTo(player.x - 11, player.y + 52);
        ctx.lineTo(player.x - 9, player.y + 48);
        ctx.closePath();
        ctx.fill();
        
        // Right jetpack (in front of chair)
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(player.x + 22, player.y + 30, 8, 15);
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(player.x + 26, player.y + 45);
        ctx.lineTo(player.x + 24, player.y + 52);
        ctx.lineTo(player.x + 28, player.y + 52);
        ctx.lineTo(player.x + 30, player.y + 48);
        ctx.closePath();
        ctx.fill();
    } else {
        // Draw standing character (when not in chair)
        ctx.fillStyle = '#FFD7B5';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(player.x + 15, player.y - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        if (equipped.face && inventory.face) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(player.x + 10, player.y - 12, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(player.x + 20, player.y - 12, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(player.x + 15, player.y - 7, 5, 0, Math.PI);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(player.x + 5, player.y - 20, 20, 8);
        
        let capColor = '#1E90FF';
        if (equipped.hat === 'yellowHat') capColor = '#FFD700';
        else if (equipped.hat === 'redCap') capColor = '#FF0000';
        else if (equipped.hat === 'greenCap') capColor = '#00FF00';
        
        ctx.fillStyle = capColor;
        ctx.fillRect(player.x + 3, player.y - 25, 24, 5);
    }
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
    if (!coin.collected) {
        const dx = player.x + player.width / 2 - coin.x;
        const dy = player.y + player.height / 2 - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < coin.radius + 15) {
            coin.collected = true;
            coins++;
            coinsValue.textContent = coins;
            saveProgress();
        }
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
    
    frenzyCoins.forEach(fCoin => {
        if (!fCoin.collected) {
            const dx = player.x + player.width / 2 - fCoin.x;
            const dy = player.y + player.height / 2 - fCoin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                fCoin.collected = true;
                coins++;
                coinsValue.textContent = coins;
                saveProgress();
            }
        }
    });
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
    
    // Force focus with multiple attempts
    requestAnimationFrame(() => {
        answerInput.focus();
        requestAnimationFrame(() => {
            answerInput.focus();
            answerInput.click();
        });
    });
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
    const userAnswer = parseInt(answerInput.value);
    
    if (userAnswer === currentAnswer) {
        score++;
        coins++;
        scoreValue.textContent = score;
        coinsValue.textContent = coins;
        feedbackEl.textContent = '✓ Correct!';
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
    // Set speed based on flying chair
    const currentSpeed = (equipped.chair === true && inventory.flyingChair === true) ? 18 : 3;
    
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
    
    if (checkCollision() && canEnterPortal) {
        canEnterPortal = false;
        showQuestionRoom();
    }
}

function draw() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCoin();
    drawSuitcase();
    drawFrenzyCoins();
    drawPortal();
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
        flyingChair: 'Flying Chair'
    };
    
    for (let item in inventory) {
        if (inventory[item]) {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <span>${itemNames[item]}</span>
                <button class="equip-btn ${(equipped.hat === item || (item === 'flyingChair' && equipped.chair) || (item === 'cape' && equipped.cape) || (item === 'face' && equipped.face)) ? 'equipped' : ''}" data-item="${item}">
                    ${(equipped.hat === item || (item === 'flyingChair' && equipped.chair) || (item === 'cape' && equipped.cape) || (item === 'face' && equipped.face)) ? 'Equipped' : 'Equip'}
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
    e.preventDefault();
});

window.addEventListener('keyup', (e) => {
    if (portalRoom.classList.contains('hidden') || shopScreen.classList.contains('hidden') === false) {
        return;
    }
    keys[e.key] = false;
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
        inventory = { yellowHat: false, redCap: false, greenCap: false, cape: false, face: false, flyingChair: false, blueHat: true };
        equipped = { hat: 'blueHat', cape: false, face: false, chair: false };
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
gameLoop();
