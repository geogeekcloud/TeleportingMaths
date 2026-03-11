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

let score = 0;
let coins = 0;
let currentAnswer = 0;
let player = { x: 100, y: 300, width: 30, height: 50, speed: 5, direction: 'right' };
let portal = { x: 650, y: 275, width: 80, height: 150 };
let coin = { x: 0, y: 0, radius: 15, collected: false };
let keys = {};
let canEnterPortal = true;
let inventory = { yellowHat: false, redCap: false, greenCap: false, cape: false, face: false, flyingChair: false, blueHat: true };
let equipped = { hat: 'blueHat', cape: false, face: false, chair: false };

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
        coins = data.coins || 0;
        inventory = data.inventory || { yellowHat: false, redCap: false, greenCap: false, cape: false, face: false, flyingChair: false, blueHat: true };
        equipped = data.equipped || { hat: 'blueHat', cape: false, face: false, chair: false };
        scoreValue.textContent = score;
        coinsValue.textContent = coins;
    }
}

function drawPlayer() {
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
    
    if (equipped.chair && inventory.flyingChair) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(player.x - 5, player.y + 40, 40, 5);
        ctx.fillRect(player.x - 5, player.y + 20, 5, 20);
        ctx.fillRect(player.x + 30, player.y + 20, 5, 20);
        ctx.fillRect(player.x - 5, player.y + 10, 5, 15);
    }
    
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

function spawnCoin() {
    coin.x = Math.floor(Math.random() * (canvas.width - 100)) + 50;
    coin.y = Math.floor(Math.random() * (canvas.height - 100)) + 50;
    coin.collected = false;
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
}

function checkCollision() {
    return player.x + player.width > portal.x &&
           player.x < portal.x + portal.width &&
           player.y + player.height > portal.y &&
           player.y < portal.y + portal.height;
}

function movePortal() {
    const minX = 50;
    const maxX = canvas.width - 150;
    const minY = 20;
    const maxY = canvas.height - 170;
    
    portal.x = Math.floor(Math.random() * (maxX - minX)) + minX;
    portal.y = Math.floor(Math.random() * (maxY - minY)) + minY;
    
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
    setTimeout(() => {
        answerInput.focus();
        answerInput.click();
    }, 150);
}

function showPortalRoom() {
    keys = {};
    questionRoom.classList.add('hidden');
    portalRoom.classList.remove('hidden');
    player.x = 100;
    player.y = 300;
    movePortal();
    spawnCoin();
    canEnterPortal = true;
    answerInput.blur();
}

function checkAnswer() {
    const userAnswer = parseInt(answerInput.value);
    
    if (userAnswer === currentAnswer) {
        score++;
        scoreValue.textContent = score;
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
        feedbackEl.textContent = '✗ Try again!';
        feedbackEl.style.color = '#FF6B6B';
        answerInput.value = '';
    }
}

function update() {
    if (keys['a'] || keys['A']) {
        if (player.x > 0) player.x -= player.speed;
        player.direction = 'left';
    }
    if (keys['d'] || keys['D']) {
        if (player.x < canvas.width - player.width) player.x += player.speed;
        player.direction = 'right';
    }
    if (keys['w'] || keys['W']) {
        if (player.y > 0) player.y -= player.speed;
        player.direction = 'up';
    }
    if (keys['s'] || keys['S']) {
        if (player.y < canvas.height - player.height) player.y += player.speed;
        player.direction = 'down';
    }
    
    checkCoinCollision();
    
    if (checkCollision() && canEnterPortal) {
        canEnterPortal = false;
        showQuestionRoom();
    }
}

function draw() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCoin();
    drawPortal();
    drawPlayer();
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
    } else {
        keys = {};
        portalRoom.classList.add('hidden');
        shopScreen.classList.remove('hidden');
        updateInventoryDisplay();
    }
});

closeShopBtn.addEventListener('click', () => {
    shopScreen.classList.add('hidden');
    portalRoom.classList.remove('hidden');
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
spawnCoin();
gameLoop();
