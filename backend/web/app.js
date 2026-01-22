const tg = window.Telegram?.WebApp;
if (tg) tg.expand();
function $(id) { return document.getElementById(id); }

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

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
function setStatus(text) {
  const el = document.getElementById("status");
  if (el) el.textContent = text;
}
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

async function rewardWin(amount = 5) {
  try {
    const initData = tg?.initData || "";
    if (!initData) return null;

    const res = await fetch(`/api/reward`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ initData, amount })
    });
    const data = await res.json();
    if (data.ok) return data;

    console.log("reward error", data);
    return null;
  } catch (e) {
    console.log("reward exception", e);
    return null;
  }
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
  document.getElementById("score").${botScore}`;
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
setText("trump", trumpSuit);
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

  document.getElementById("myCard").;
  document.getElementById("botCard").;

  const res = compareCards(my, bot);
  if (res >= 0) myScore += 1; else botScore += 1;

  renderScore();
  renderHand();

if (hand.length === 0) {
  setTimeout(async () => {
    const win = myScore > botScore;
    alert(win ? "Ты выиграл раунд! 🏆 (+5 монет)" : "Бот выиграл раунд 🤖");

    if (win) {
      try {
        const initData = tg?.initData || "";
        const res = await fetch(`/api/reward`, {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ initData, amount: 5 })
        });
        const data = await res.json();
        if (data.ok) {
          setInfo(`id: ${tg?.initDataUnsafe?.user?.id || "?"} | coins: ${data.coins}`);
        } else {
          await apiMe();
        }
      } catch (e) {
        await apiMe();
      }
    }

    newRound();
  }, 150);
}

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
if (initData) {
  apiMe();
} else {
  // в браузере пусть не ругается
  if (typeof setInfo === "function") {
    setInfo("Открой игру из Telegram (через бота), тогда появятся coins 🪙");
  }
}

// ИГРА ДОЛЖНА СТАРТОВАТЬ ВСЕГДА
try {
  newRound();
} catch (e) {
  alert("Ошибка запуска игры: " + e);
  console.log(e);
}

