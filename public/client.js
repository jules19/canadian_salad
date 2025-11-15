// Socket.io connection
const socket = io();

// State
let currentState = null;
let myPlayerId = null;

// UI Elements - Lobby
const lobbyScreen = document.getElementById('lobby');
const waitingScreen = document.getElementById('waiting');
const gameScreen = document.getElementById('game');
const errorDiv = document.getElementById('error');

const createRoomBtn = document.getElementById('createRoom');
const joinRoomBtn = document.getElementById('joinRoom');
const hostNameInput = document.getElementById('hostName');
const joinNameInput = document.getElementById('joinName');
const roomCodeInput = document.getElementById('roomCode');

// UI Elements - Waiting
const displayRoomCode = document.getElementById('displayRoomCode');
const playerList = document.getElementById('playerList');
const startGameBtn = document.getElementById('startGame');

// UI Elements - Game
const roundName = document.getElementById('roundName');
const roundDesc = document.getElementById('roundDesc');
const trickCounter = document.getElementById('trickCounter');
const scoreboardPlayers = document.getElementById('scoreboardPlayers');
const currentTrick = document.getElementById('currentTrick');
const turnIndicator = document.getElementById('turnIndicator');
const playerHand = document.getElementById('playerHand');
const roundEndOverlay = document.getElementById('roundEnd');
const gameOverOverlay = document.getElementById('gameOver');
const continueBtn = document.getElementById('continueBtn');
const newGameBtn = document.getElementById('newGameBtn');

// Event Listeners
createRoomBtn.addEventListener('click', createRoom);
joinRoomBtn.addEventListener('click', joinRoom);
startGameBtn.addEventListener('click', startGame);
continueBtn.addEventListener('click', nextRound);
newGameBtn.addEventListener('click', () => location.reload());

// Allow Enter key to submit
hostNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') createRoom();
});

joinNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinRoom();
});

roomCodeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinRoom();
});

// Create a new room
function createRoom() {
  const name = hostNameInput.value.trim();

  if (!name) {
    showError('Please enter your name');
    return;
  }

  socket.emit('joinRoom', { name }, (response) => {
    if (response.error) {
      showError(response.error);
    } else {
      hideError();
      displayRoomCode.textContent = response.roomId;
      showScreen('waiting');
    }
  });
}

// Join an existing room
function joinRoom() {
  const name = joinNameInput.value.trim();
  const code = roomCodeInput.value.trim().toUpperCase();

  if (!name) {
    showError('Please enter your name');
    return;
  }

  if (!code || code.length !== 4) {
    showError('Please enter a valid 4-character room code');
    return;
  }

  socket.emit('joinRoom', { name, roomCode: code }, (response) => {
    if (response.error) {
      showError(response.error);
    } else {
      hideError();
      displayRoomCode.textContent = response.roomId;
      showScreen('waiting');
    }
  });
}

// Start the game
function startGame() {
  socket.emit('startGame', (response) => {
    if (response.error) {
      alert(response.error);
    }
  });
}

// Continue to next round
function nextRound() {
  socket.emit('nextRound', (response) => {
    if (response.error) {
      alert(response.error);
    }
  });
}

// Socket event handlers
socket.on('gameStateUpdate', (state) => {
  currentState = state;
  myPlayerId = state.myPlayerId;

  if (state.status === 'WAITING') {
    updateWaitingRoom(state);
  } else if (state.status === 'PLAYING') {
    showScreen('game');
    updateGameScreen(state);
    roundEndOverlay.classList.add('hidden');
  } else if (state.status === 'ROUND_END') {
    showScreen('game');
    updateGameScreen(state);
    showRoundEnd(state);
  }
});

socket.on('gameOver', (gameOverState) => {
  showGameOver(gameOverState);
});

socket.on('playersKicked', (data) => {
  alert(data.message);
});

// Update waiting room
function updateWaitingRoom(state) {
  playerList.innerHTML = state.players.map((player, index) => {
    const isHost = index === 0;
    const statusText = isHost ? '(Host)' : '';
    const connectedClass = player.connected ? '' : 'disconnected';

    return `
      <div class="player-item ${connectedClass}">
        <span>${player.name} ${statusText}</span>
        <span>${player.connected ? '🟢 Online' : '🔴 Offline'}</span>
      </div>
    `;
  }).join('');

  // Show start button if host and 3-4 players
  if (state.players[0].id === myPlayerId && state.players.length >= 3 && state.players.length <= 4) {
    startGameBtn.classList.remove('hidden');
  } else {
    startGameBtn.classList.add('hidden');
  }
}

// Update game screen
function updateGameScreen(state) {
  // Update round info
  roundName.textContent = `Round ${state.roundInfo.roundNumber}: ${state.roundInfo.ruleName}`;
  roundDesc.textContent = state.roundInfo.description;
  trickCounter.textContent = `Trick ${state.trickNumber}/${state.totalTricks}`;

  // Update scoreboard
  scoreboardPlayers.innerHTML = state.players.map((player, index) => {
    const isActive = index === state.activePlayerIndex;
    const isMe = player.id === myPlayerId;
    const activeClass = isActive ? 'active' : '';
    const disconnectedClass = player.connected ? '' : 'disconnected';

    return `
      <div class="score-card ${activeClass} ${disconnectedClass}">
        <div class="name">${player.name}${isMe ? ' (You)' : ''}</div>
        <div class="score">${player.score} pts</div>
        <div style="font-size: 0.9rem; opacity: 0.8;">
          Round: +${player.roundScore} | Tricks: ${player.trickCount}
        </div>
      </div>
    `;
  }).join('');

  // Update current trick
  currentTrick.innerHTML = state.currentTrick.map((trickCard) => {
    const player = state.players.find(p => p.id === trickCard.playerId);
    return `
      <div class="trick-card">
        <div class="player-label">${player.name}</div>
        ${renderCard(trickCard.card, false)}
      </div>
    `;
  }).join('');

  // Update turn indicator
  const activePlayer = state.players[state.activePlayerIndex];
  const isMyTurn = activePlayer.id === myPlayerId;
  turnIndicator.textContent = isMyTurn
    ? "Your turn! Play a card."
    : `Waiting for ${activePlayer.name}...`;

  // Update player's hand
  updatePlayerHand(state);
}

// Update player's hand
function updatePlayerHand(state) {
  const isMyTurn = state.players[state.activePlayerIndex].id === myPlayerId;
  const validCards = getValidCards(state);

  playerHand.innerHTML = state.myHand.map(card => {
    const canPlay = isMyTurn && validCards.includes(card);
    const disabledClass = canPlay ? '' : 'disabled';

    return `<div class="card ${disabledClass} ${getCardColor(card)}"
                 data-card="${card}"
                 onclick="${canPlay ? `playCard('${card}')` : ''}"
            >
              ${formatCard(card)}
            </div>`;
  }).join('');
}

// Get valid cards that can be played
function getValidCards(state) {
  if (!state.leadSuit) {
    return state.myHand; // Can play any card if leading
  }

  // Must follow suit if possible
  const cardsOfLeadSuit = state.myHand.filter(card => card[0] === state.leadSuit);

  if (cardsOfLeadSuit.length > 0) {
    return cardsOfLeadSuit;
  }

  return state.myHand; // Can play any card if don't have lead suit
}

// Play a card
function playCard(card) {
  socket.emit('playCard', { card }, (response) => {
    if (response.error) {
      alert(response.error);
    }
  });
}

// Show round end overlay
function showRoundEnd(state) {
  const scores = state.players
    .map(p => ({ name: p.name, roundScore: p.roundScore, totalScore: p.score }))
    .sort((a, b) => a.roundScore - b.roundScore);

  document.getElementById('roundScores').innerHTML = scores.map(p => `
    <div class="score-line">
      <span>${p.name}</span>
      <span>+${p.roundScore} pts (Total: ${p.totalScore})</span>
    </div>
  `).join('');

  roundEndOverlay.classList.remove('hidden');
}

// Show game over overlay
function showGameOver(gameOverState) {
  document.getElementById('finalScores').innerHTML = gameOverState.finalScores.map((p, index) => {
    const winnerClass = index === 0 ? 'winner' : '';
    const trophy = index === 0 ? '🏆 ' : '';

    return `
      <div class="score-line ${winnerClass}">
        <span>${trophy}${p.name}</span>
        <span>${p.score} pts</span>
      </div>
    `;
  }).join('');

  gameOverOverlay.classList.remove('hidden');
}

// Helper functions
function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenName).classList.add('active');
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  errorDiv.classList.add('hidden');
}

function getCardColor(card) {
  const suit = card[0];
  return (suit === 'H' || suit === 'D') ? 'red' : 'black';
}

function formatCard(card) {
  const suit = card[0];
  const rank = card.slice(1);

  const suitSymbols = {
    'H': '♥',
    'D': '♦',
    'C': '♣',
    'S': '♠'
  };

  return `${rank}${suitSymbols[suit]}`;
}

function renderCard(card, clickable = true) {
  return `<div class="card ${getCardColor(card)}">${formatCard(card)}</div>`;
}
