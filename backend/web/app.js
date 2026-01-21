const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// API на том же домене (Render)
const API_BASE = "";

function setHello() {
  if (tg) {
    const u = tg.initDataUnsafe?.user;
    document.getElementById("hello").textContent = u ? `Привет, ${u.first_name}! 👋` : "Привет! 👋";
  } else {
    document.getElementById("hello").textContent = "Открыто не из Telegram (это ок).";
  }
}
function setInfo(text) {
  document.getElementById("info").textContent = text;
}

async function apiMe() {
  try {
    const initData = tg?.initData || "";
    const res = await fetch(`${API_BASE}/api/me`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    });
    const data = await res.json();
    if (data.ok) setInfo(`id: ${data.user.tg_id} | coins: ${data.user.coins}`);
    else setInfo("API error: " + JSON.stringify(data));
  } catch (e) {
    setInfo("Ошибка запроса к API: " + e);
  }
}

async function rewardWin(amount = 10) {
  try {
    const initData = tg?.initData || "";
    const res = await fetch(`${API_BASE}/api/reward`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ initData, amount })
    });
    const data = await res.json();
    if (data.ok) {
      setInfo(`id: ${tg?.initDataUnsafe?.user?.id || "?"} | coins: ${data.coins}`);
      return data;
    } else {
      alert("API error: " + JSON.stringify(data));
      return null;
    }
  } catch (e) {
    alert("Ошибка награды: " + e);
    return null;
  }
}

// --- Мини-логика игры (упрощённо) ---
const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const rankPower = Object.fromEntries(ranks.map((r, i) => [r, i]));

let hand = [];
let trumpSuit = null;
let myScore = 0;
let botScore = 0;

function randomCard() {
  const r = ranks[Math.floor(Math.random() * ranks.length)];
  const s = suits[Math.floor(Math.random() * suits.length)];
  return { r, s };
}
function cardToText(c) { return `${c.r}${c.s}`; }

function clearTable() {
  document.getElementById("myCard").textContent = "—";
  document.getElementById("botCard").textContent = "—";
}
function renderScore() {
  document.getElementById("score").textContent = `${myScore} : ${botScore}`;
}
function renderHand() {
  const el = document.getElementById("hand");
  el.innerHTML = "";
  hand.forEach((c, idx) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = cardToText(c);
    b.addEventListener("click", () => playCard(idx));
    el.appendChild(b);
  });
}

function newRound() {
  myScore = 0; botScore = 0;
  trumpSuit = suits[Math.floor(Math.random() * suits.length)];
  document.getElementById("trump").textContent = trumpSuit;
  hand = [randomCard(), randomCard(), randomCard()];
  renderHand();
  clearTable();
  renderScore();
}

function compareCards(my, bot) {
  const myTrump = my.s === trumpSuit;
  const botTrump = bot.s === trumpSuit;

  if (myTrump && !botTrump) return 1;
  if (!myTrump && botTrump) return -1;

  if (my.s === bot.s) {
    if (rankPower[my.r] > rankPower[bot.r]) return 1;
    if (rankPower[my.r] < rankPower[bot.r]) return -1;
    return 0;
  }
  return 1;
}

function playCard(idx) {
  const my = hand.splice(idx, 1)[0];
  const bot = randomCard();

  document.getElementById("myCard").textContent = cardToText(my);
  document.getElementById("botCard").textContent = cardToText(bot);

  const res = compareCards(my, bot);
  if (res >= 0) myScore += 1; else botScore += 1;

  renderScore();
  renderHand();

if (hand.length === 0) {
  setTimeout(async () => {
    const win = myScore > botScore;
    alert(win ? "Ты выиграл раунд! 🏆" : "Бот выиграл раунд 🤖");

    if (win) {
      await rewardWin(5); // +5 монет за победу
      await apiMe();      // обновим шапку
    }

    newRound();
  }, 150);
}
}

// Навешиваем кнопки и стартуем
document.getElementById("newRoundBtn").addEventListener("click", newRound);

setHello();

const initData = tg?.initData || "";
if (!initData) {
  setInfo("Открой игру из Telegram (через бота), тогда появятся coins 🪙");
} else {
  apiMe();
}

newRound();

