const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- PIXEL ART OVERRIDES ---
const originalArc = ctx.arc.bind(ctx);
ctx.arc = function(x, y, radius, startAngle, endAngle, counterclockwise) {
  if (Math.abs(endAngle - startAngle) >= Math.PI * 2 - 0.1) {
    this.rect(x - radius, y - radius, radius * 2, radius * 2);
  } else {
    originalArc(x, y, radius, startAngle, endAngle, counterclockwise);
  }
};

const originalEllipse = ctx.ellipse.bind(ctx);
ctx.ellipse = function(x, y, rx, ry, rot, sa, ea, ccw) {
  if (Math.abs(ea - sa) >= Math.PI * 2 - 0.1) {
    this.rect(x - rx, y - ry, rx * 2, ry * 2);
  } else {
    originalEllipse(x, y, rx, ry, rot, sa, ea, ccw);
  }
};

Object.defineProperty(ctx, 'shadowBlur', { set: function() {}, get: function() { return 0; } });
Object.defineProperty(ctx, 'shadowOffsetX', { set: function() {}, get: function() { return 0; } });
Object.defineProperty(ctx, 'shadowOffsetY', { set: function() {}, get: function() { return 0; } });

const W = canvas.width;
const H = canvas.height;

const el = {
  p1Hp: document.getElementById("p1hp"),
  p2Hp: document.getElementById("p2hp"),
  p1Energy: document.getElementById("p1energy"),
  p2Energy: document.getElementById("p2energy"),
  p1Info: document.getElementById("p1Info"),
  p2Info: document.getElementById("p2Info"),
  p1Name: document.getElementById("p1Name"),
  p2Name: document.getElementById("p2Name"),
  p1Bomb: document.getElementById("p1Bomb"),
  p2Bomb: document.getElementById("p2Bomb"),
  p1AmmoText: document.getElementById("p1AmmoText"),
  p2AmmoText: document.getElementById("p2AmmoText"),
  p1Ammo: document.getElementById("p1ammo"),
  p2Ammo: document.getElementById("p2ammo"),
  levelText: document.getElementById("levelText"),
  waveText: document.getElementById("waveText"),
  bossBar: document.getElementById("bossBar"),
  bossFill: document.getElementById("bossFill"),
  intro: document.getElementById("introScreen"),
  menu: document.getElementById("menuScreen"),
  shop: document.getElementById("shopScreen"),
  p1HudCard: document.getElementById("p1HudCard"),
  p2HudCard: document.getElementById("p2HudCard"),
  p2SelectCard: document.getElementById("p2SelectCard"),
  modeLabel: document.getElementById("modeLabel"),
  dollarBalance: document.getElementById("dollarBalance"),
  unlockStatus: document.getElementById("unlockStatus"),
  shopGrid: document.getElementById("shopGrid"),
  shopMoney: document.getElementById("shopMoney"),
  toast: document.getElementById("toast"),
  missionPanel: document.getElementById("missionPanel"),
  recordBox: document.getElementById("recordBox"),
  p1Select: document.getElementById("p1Select"),
  p2Select: document.getElementById("p2Select"),
  mapSelect: document.getElementById("mapSelect"),
  mapDesc: document.getElementById("mapDesc"),
  p1Desc: document.getElementById("p1Desc"),
  p2Desc: document.getElementById("p2Desc"),
  miniGameScreen: document.getElementById("miniGameScreen"),
  slot1: document.getElementById("slot1"),
  slot2: document.getElementById("slot2"),
  slot3: document.getElementById("slot3"),
  miniGameSlot: document.getElementById("miniGameSlot"),
  miniGameTiming: document.getElementById("miniGameTiming"),
  timingZone: document.getElementById("timingZone"),
  timingCursor: document.getElementById("timingCursor"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  roomStatus: document.getElementById("roomStatus"),
  onlinePanel: document.getElementById("onlinePanel"),
  networkScreen: document.getElementById("networkScreen"),
  authContainer: document.getElementById("authContainer"),
  userInfo: document.getElementById("userInfo"),
  userNameDisplay: document.getElementById("userNameDisplay"),
  authButtons: document.getElementById("authButtons"),
  authModal: document.getElementById("authModal"),
  authTitle: document.getElementById("authTitle"),
  authUsername: document.getElementById("authUsername"),
  authPassword: document.getElementById("authPassword"),
  authError: document.getElementById("authError")
};

const btn = {
  start: document.getElementById("startBtn"),
  restart: document.getElementById("restartBtn"),
  openShop: document.getElementById("openShopBtn"),
  openShopMenu: document.getElementById("openShopFromMenuBtn"),
  closeShop: document.getElementById("closeShopBtn"),
  continueIntro: document.getElementById("continueFromIntroBtn"),
  mode1: document.getElementById("mode1Btn"),
  mode2: document.getElementById("mode2Btn"),
  autoSkip: document.getElementById("autoSkipBtn"),
  autoSkipSide: document.getElementById("autoSkipSideBtn"),
  buyP1Char: document.getElementById("buyP1CharBtn"),
  buyP2Char: document.getElementById("buyP2CharBtn"),
  returnMenu: document.getElementById("returnMenuBtn"),
  miniGameBtn: document.getElementById("miniGameBtn"),
  spinBtn: document.getElementById("spinBtn"),
  timingBtn: document.getElementById("timingBtn"),
  closeMiniGameBtn: document.getElementById("closeMiniGameBtn"),
  btnPlayOffline: document.getElementById("btnPlayOffline"),
  btnPlayOnline: document.getElementById("btnPlayOnline"),
  btnCreateRoom: document.getElementById("btnCreateRoom"),
  btnJoinRoom: document.getElementById("btnJoinRoom"),
  btnStartOnline: document.getElementById("btnStartOnline"),
  btnLogout: document.getElementById("btnLogout"),
  btnLoginModal: document.getElementById("btnLoginModal"),
  btnRegisterModal: document.getElementById("btnRegisterModal"),
  btnSubmitAuth: document.getElementById("btnSubmitAuth"),
  btnCloseAuth: document.getElementById("btnCloseAuth")
};

const keys = {};
let state = "network"; // start at network screen
let socket = null;
let isOnline = false;
let isHost = false;
let loggedInUser = null;
let isRegisterMode = false;
let myPlayerId = 1;
let currentRoomCode = "";
let shopOpen = false;
let miniGameOpen = false;
let level = 1;
const autoSkipKey = "zombie2p_v35_auto_skip";
const AUTO_SKIP_DELAY_FRAMES = 60 * 5;
const MINIGAME_COOLDOWN_KEY = "zombie2p_minigame_cooldown";
const MINIGAME_COOLDOWN_MS = 10 * 60 * 1000;
let isSpinning = false;
let spinInterval = null;
let currentMiniGame = "";
let timingInterval = null;
let timingPos = 0;
let timingDir = 1;
let isTimingActive = false;
let autoSkipEnabled = localStorage.getItem(autoSkipKey) === "1";
let levelAgeFrames = 0;
let levelAutoSkipped = false;
let combo = 0;
let comboTimer = 0;
let toastTimer = 0;
let playerMode = 2;
let currentMapKey = "base";
let bossMiniGame = { active:false, timer:0, cooldown:0, key:"", label:"" };

let players = [];
let bullets = [];
let enemyBullets = [];
let bombs = [];
let mines = [];
let blackHoles = [];
let zombies = [];
let particles = [];
let shockwaves = [];
let texts = [];
let pickups = [];
let coins = [];
let turrets = [];
let drones = [];
let pets = [];
let chests = [];
let missions = [];
let feverTimer = 0;
let paused = false;
let eventType = "";
let eventTimer = 0;
let eventTick = 0;
let airdropTimer = 60 * 24;
let luckyUpgradeCount = 0;
let comboChestMarks = new Set();
let treasureSpawnedThisLevel = false;
let mapMechanicTick = 0;
let thirstWarningTimer = 0;
let totalKills = 0;
let bombsUsed = 0;
let chestsOpened = 0;

let timeOfDay = 0;
let dayNightCycleSpeed = 0.00015;
let weatherType = "none";
let weatherTimer = 0;
let weatherParticles = [];

const highScoreKey = "zombie2p_v7_highscore";
let highScore = Number(localStorage.getItem(highScoreKey) || 0);


const dollarKey = "zombie2p_v25_dollars";
const unlockedCharactersKey = "zombie2p_v25_unlocked_characters";
let dollarBalance = Number(localStorage.getItem(dollarKey) || 0);
const characterPrices = {
  soldier: 0,

  // Giá V36: đi từ dễ mở khóa -> trung cấp -> cao cấp, tránh lệch Y Tá/Bác Sĩ.
  rookie: 100,
  scout: 140,
  nurse: 180,
  ammoSmith: 220,
  iceApprentice: 260,
  guardCadet: 300,
  fireApprentice: 340,
  miner: 380,
  sparkKid: 420,
  coinRogue: 480,

  medic: 650,
  captain: 760,
  ice: 850,
  pyro: 930,
  thunder: 1050,
  guardian: 1180,
  vampire: 1250,
  sniperHero: 1350,
  bomber: 1450,
  timeMage: 1650,
  ninja: 1800,
  moneyKing: 2000,
  engineer: 2200,
  robot: 2500
};
let unlockedCharacters = new Set(JSON.parse(localStorage.getItem(unlockedCharactersKey) || '["soldier"]'));
unlockedCharacters.add("soldier");

function saveWallet() {
  localStorage.setItem(dollarKey, String(Math.max(0, Math.floor(dollarBalance))));
  localStorage.setItem(unlockedCharactersKey, JSON.stringify([...unlockedCharacters]));
  if (loggedInUser) {
    apiSave({ dollars: dollarBalance, unlocked_characters: [...unlockedCharacters] });
  }
}
function isCharacterUnlocked(key) {
  return unlockedCharacters.has(key) || (characterPrices[key] || 0) === 0;
}
function characterPriceText(key) {
  const price = characterPrices[key] || 0;
  return price === 0 ? "FREE" : price + "$";
}
function awardDollars(amount, label="") {
  const gain = Math.max(0, Math.floor(amount));
  if (!gain) return;
  dollarBalance += gain;
  saveWallet();
  updateCharacterUI();
  const msg = "+" + gain + "$" + (label ? " " + label : "");
  addText(msg, W / 2, 132, 22);
  toast("Nhận " + gain + "$" + (label ? " - " + label : ""));
}
function calculateRunDollars() {
  // Chỉ tính $ khi kết thúc lượt chơi. Ví dụ: level 20 = 50$, level 30 = 75$.
  return Math.max(0, Math.floor(level * 2.5));
}
function runDollarFormulaText() {
  return "màn " + level + " x 2.5$ = " + calculateRunDollars() + "$";
}
function getSelectedCharPriceInfo(selectEl) {
  const key = selectEl.value;
  const c = characters[key];
  const price = characterPrices[key] || 0;
  const unlocked = isCharacterUnlocked(key);
  return { key, c, price, unlocked };
}
function buySelectedCharacter(playerNumber) {
  const selectEl = playerNumber === 1 ? el.p1Select : el.p2Select;
  if (!selectEl) return;
  const info = getSelectedCharPriceInfo(selectEl);
  if (info.unlocked) {
    toast(info.c.name + " đã được mở khóa");
    updateCharacterUI();
    return;
  }
  if (dollarBalance < info.price) {
    toast("Chưa đủ $ để mua " + info.c.name + " - cần " + info.price + "$");
    updateCharacterUI();
    return;
  }
  dollarBalance -= info.price;
  unlockedCharacters.add(info.key);
  saveWallet();
  toast("Đã mua " + info.c.name + " với giá " + info.price + "$");
  updateCharacterUI();
}

const mapConfigs = {
  base: { name:"Căn cứ quân sự", desc:"Map cân bằng, nhiều công trình quân sự, trạm tiếp tế và vật cản chiến thuật.", theme:"base", obstacles:[
    { x: 71, y:65, w:135, h:41, kind:"sandbag" }, { x:249, y:57, w:178, h:57, kind:"hangar" }, { x:541, y:65, w:84, h:90, kind:"tower" }, { x:793, y:70, w:157, h:65, kind:"barracks" }, { x:1078, y:65, w:135, h:48, kind:"bunker" }, { x:1236, y:129, w:80, h:97, kind:"tower" },
    { x:95, y:299, w:129, h:34, kind:"barrier" }, { x:286, y:280, w:128, h:84, kind:"command" }, { x:494, y:306, w:98, h:34, kind:"crate" }, { x:699, y:256, w:124, h:60, kind:"fuel" }, { x:877, y:306, w:97, h:34, kind:"barrier" }, { x:1049, y:274, w:162, h:80, kind:"command" }, { x:1253, y:307, w:68, h:105, kind:"tower" },
    { x:165, y:498, w:131, h:58, kind:"crate" }, { x:371, y:512, w:117, h:36, kind:"sandbag" }, { x:580, y:489, w:157, h:80, kind:"armory" }, { x:804, y:506, w:103, h:36, kind:"barrier" }, { x:971, y:477, w:125, h:65, kind:"hangar" }, { x:1164, y:512, w:138, h:44, kind:"crate" },
    { x:233, y:631, w:104, h:40, kind:"bunker" }, { x:680, y:611, w:191, h:51, kind:"sandbag" }, { x:1053, y:637, w:111, h:40, kind:"bunker" }
  ]},
  desert: { name:"Sa mạc bỏ hoang", desc:"Có thanh khát. Chạy sẽ tụt khát, đứng yên mới hồi. Hết khát mất 10 HP mỗi 2 giây.", theme:"desert", obstacles:[
    {x:90,y:95,w:180,h:44,kind:"dune"},{x:410,y:85,w:130,h:70,kind:"rock"},{x:730,y:80,w:160,h:64,kind:"cactus"},{x:1050,y:95,w:190,h:52,kind:"boneWall"},
    {x:210,y:250,w:170,h:56,kind:"dune"},{x:545,y:240,w:220,h:80,kind:"tent"},{x:940,y:252,w:150,h:58,kind:"rock"},{x:75,y:430,w:160,h:60,kind:"waterTank"},
    {x:415,y:440,w:190,h:46,kind:"boneWall"},{x:760,y:430,w:230,h:70,kind:"tent"},{x:1130,y:420,w:150,h:72,kind:"cactus"},{x:275,y:615,w:240,h:46,kind:"dune"},{x:650,y:605,w:150,h:70,kind:"rock"},{x:995,y:610,w:210,h:46,kind:"boneWall"}
  ]},
  city: { name:"Thành phố đổ nát", desc:"Có xe cháy, khói làm chậm zombie và nhiều ngõ hẹp để dụ quái.", theme:"city", obstacles:[
    {x:80,y:80,w:170,h:90,kind:"skyscraper"},{x:335,y:70,w:130,h:120,kind:"store"},{x:640,y:85,w:240,h:80,kind:"skyscraper"},{x:1040,y:75,w:200,h:100,kind:"store"},
    {x:170,y:265,w:230,h:68,kind:"bus"},{x:530,y:255,w:160,h:110,kind:"skyscraper"},{x:840,y:265,w:260,h:62,kind:"rubble"},{x:70,y:460,w:210,h:82,kind:"store"},
    {x:410,y:455,w:230,h:62,kind:"car"},{x:780,y:440,w:170,h:110,kind:"skyscraper"},{x:1110,y:450,w:165,h:82,kind:"police"},{x:310,y:620,w:200,h:62,kind:"rubble"},{x:690,y:610,w:280,h:64,kind:"store"},{x:1080,y:620,w:170,h:58,kind:"car"}
  ]},
  lab: { name:"Phòng thí nghiệm", desc:"Có sàn năng lượng hồi kỹ năng và bẫy điện gây sát thương zombie theo nhịp.", theme:"lab", obstacles:[
    {x:80,y:70,w:220,h:60,kind:"server"},{x:420,y:80,w:130,h:105,kind:"capsule"},{x:735,y:70,w:240,h:66,kind:"reactor"},{x:1130,y:75,w:130,h:115,kind:"capsule"},
    {x:160,y:260,w:150,h:95,kind:"console"},{x:475,y:258,w:250,h:62,kind:"server"},{x:875,y:248,w:160,h:110,kind:"tank"},{x:1165,y:270,w:110,h:86,kind:"console"},
    {x:80,y:470,w:230,h:60,kind:"reactor"},{x:450,y:450,w:165,h:105,kind:"capsule"},{x:760,y:468,w:260,h:64,kind:"server"},{x:1140,y:460,w:145,h:100,kind:"tank"},{x:280,y:635,w:210,h:48,kind:"console"},{x:740,y:620,w:160,h:74,kind:"reactor"}
  ]}
};

const mapRules = {
  base: {
    name:"Căn cứ tiếp tế", short:"Căn cứ",
    desc:"Đứng trong ô tiếp tế màu xanh để hồi nhẹ máu, năng lượng và nạp thêm đạn.",
    startCoins:80, coinMul:1, zombieSpeedMul:1, zombieHpMul:1, zombieCountBonus:0, eliteChance:.03, treasureChance:.05, chestEvery:4
  },
  desert: {
    name:"Sa mạc khát", short:"Sa mạc",
    desc:"Có thanh khát. Di chuyển làm tụt khát, đứng yên mới hồi. Hết khát mất 10 HP mỗi 2 giây.",
    startCoins:120, coinMul:1.12, zombieSpeedMul:1.08, zombieHpMul:.96, zombieCountBonus:3, eliteChance:.04, treasureChance:.07, chestEvery:3
  },
  city: {
    name:"Thành phố cháy", short:"Đô thị",
    desc:"Khói làm chậm zombie. Vùng lửa gây sát thương cả zombie lẫn người chơi, có thể dùng để dụ quái.",
    startCoins:70, coinMul:1.18, zombieSpeedMul:1.02, zombieHpMul:1.05, zombieCountBonus:7, eliteChance:.06, treasureChance:.09, chestEvery:4
  },
  lab: {
    name:"Lab năng lượng", short:"Lab",
    desc:"Ô năng lượng hồi kỹ năng nhanh. Bẫy điện theo nhịp có thể giật zombie trong vùng.",
    startCoins:90, coinMul:1.05, zombieSpeedMul:1.03, zombieHpMul:1.10, zombieCountBonus:2, eliteChance:.10, treasureChance:.06, chestEvery:3, energyMul:1.25
  }
};
function currentMapRule() {
  return mapRules[currentMapKey] || mapRules.base;
}
function mapRuleDesc(key=currentMapKey) {
  const r = mapRules[key] || mapRules.base;
  return "Luật map: " + r.name + " - " + r.desc;
}
function addTeamText(text, size=22) {
  addText(text, W / 2, 105 + Math.random() * 28, size);
}

let obstacles = mapConfigs.base.obstacles.map(o => ({ ...o }));


const mapFeatureZones = {
  base: [
    {type:"supply", x:80, y:575, w:120, h:70, label:"TIẾP TẾ"},
    {type:"supply", x:1110, y:195, w:125, h:70, label:"TIẾP TẾ"}
  ],
  desert: [
    {type:"shade", x:70, y:420, w:175, h:75, label:"BÓNG RÂM"},
    {type:"shade", x:710, y:400, w:175, h:85, label:"LỀU TRẠI"}
  ],
  city: [
    {type:"fire", x:610, y:370, w:155, h:65, label:"LỬA"},
    {type:"smoke", x:865, y:350, w:185, h:85, label:"KHÓI"},
    {type:"smoke", x:230, y:520, w:180, h:72, label:"KHÓI"}
  ],
  lab: [
    {type:"energy", x:625, y:345, w:135, h:74, label:"NĂNG LƯỢNG"},
    {type:"energy", x:1010, y:560, w:150, h:72, label:"NĂNG LƯỢNG"},
    {type:"zap", x:315, y:345, w:155, h:75, label:"BẪY ĐIỆN"},
    {type:"zap", x:905, y:185, w:145, h:75, label:"BẪY ĐIỆN"}
  ]
};
function activeMapZones() {
  return mapFeatureZones[currentMapKey] || [];
}
function inZone(entity, zone) {
  return entity && entity.x >= zone.x && entity.x <= zone.x + zone.w && entity.y >= zone.y && entity.y <= zone.y + zone.h;
}
function isZoneActive(zone) {
  if (zone.type !== "zap") return true;
  return (mapMechanicTick % 180) < 54;
}

const characters = {
  soldier: {
    name: "Chiến Binh", color: "#60a5fa", skill: "Mưa Đạn",
    desc: "Bắn nhanh hơn rất nhiều trong 7 giây. Nội tại: sát thương súng +10%.",
    apply(p) { p.damageBonus += .10; },
    use(p) { p.rapidTimer = 60 * 7; addText("MƯA ĐẠN!", p.x, p.y - 30, 22); toast(p.name + " dùng Mưa Đạn"); }
  },

  rookie: {
    name: "Tân Binh", color: "#93c5fd", skill: "Xả Đạn Ngắn",
    desc: "Nhân vật rẻ để mở khóa sớm. Kỹ năng: bắn nhanh trong 4 giây. Nội tại: sát thương +4%.",
    apply(p) { p.damageBonus += .04; },
    use(p) {
      p.rapidTimer = Math.max(p.rapidTimer, 60 * 4);
      addText("XẢ ĐẠN!", p.x, p.y - 30, 20);
      toast(p.name + " dùng Xả Đạn Ngắn");
    }
  },

  nurse: {
    name: "Y Tá", color: "#86efac", skill: "Cứu Thương Nhanh",
    desc: "Bản giá rẻ của Bác Sĩ. Kỹ năng: hồi máu vừa phải cho cả đội. Nội tại: hồi máu +10%.",
    apply(p) { p.healBonus += .10; },
    use(p) {
      players.forEach(x => {
        if (!x.alive) { x.alive = true; x.hp = 25; }
        heal(x, 28);
        x.shieldTimer = Math.max(x.shieldTimer, 60 * 2);
      });
      toast(p.name + " dùng Cứu Thương Nhanh");
    }
  },

  scout: {
    name: "Trinh Sát", color: "#22d3ee", skill: "Tăng Tốc Đội",
    desc: "Nhanh và rẻ. Kỹ năng: cả đội tăng tốc 6 giây. Nội tại: tốc độ +0.45.",
    apply(p) { p.speed += .45; },
    use(p) {
      players.forEach(x => {
        x.speedBoostTimer = Math.max(x.speedBoostTimer, 60 * 6);
        addParticles(x.x, x.y, "#22d3ee", 16);
      });
      addText("TĂNG TỐC!", p.x, p.y - 30, 20);
      toast(p.name + " dùng Tăng Tốc Đội");
    }
  },

  ammoSmith: {
    name: "Thợ Đạn", color: "#cbd5e1", skill: "Tiếp Đạn",
    desc: "Hợp người mới. Kỹ năng: nạp đầy đạn cho cả đội và tăng tốc bắn ngắn. Nội tại: năng lượng lên nhanh hơn.",
    apply(p) { p.energyGainBonus *= 1.08; },
    use(p) {
      players.forEach(x => {
        refillAmmo(x);
        x.rapidTimer = Math.max(x.rapidTimer, 60 * 2.5);
        addText("FULL AMMO", x.x, x.y - 30, 16);
      });
      toast(p.name + " dùng Tiếp Đạn");
    }
  },

  iceApprentice: {
    name: "Học Viên Băng", color: "#7dd3fc", skill: "Gió Lạnh",
    desc: "Bản rẻ của Pháp Sư Băng. Kỹ năng: làm chậm zombie quanh người. Nội tại: đạn có ít cơ hội đóng băng.",
    apply(p) { p.freezeChance += .06; },
    use(p) {
      zombies.forEach(z => {
        if (Math.hypot(z.x - p.x, z.y - p.y) < 260) z.freezeTimer = Math.max(z.freezeTimer, 60 * 4);
      });
      addShockwave(p.x, p.y, "#7dd3fc", 120, 4, 30);
      addText("GIÓ LẠNH!", p.x, p.y - 30, 20);
      toast(p.name + " dùng Gió Lạnh");
    }
  },

  guardCadet: {
    name: "Tập Sự Khiên", color: "#2dd4bf", skill: "Khiên Nhỏ",
    desc: "Chống chịu giá rẻ. Kỹ năng: tạo khiên ngắn cho cả đội. Nội tại: máu tối đa +15.",
    apply(p) { p.maxHp += 15; p.hp = p.maxHp; },
    use(p) {
      players.forEach(x => {
        x.shieldTimer = Math.max(x.shieldTimer, 60 * 5);
        addParticles(x.x, x.y, "#2dd4bf", 18);
      });
      addText("KHIÊN NHỎ!", p.x, p.y - 30, 20);
      toast(p.name + " dùng Khiên Nhỏ");
    }
  },

  fireApprentice: {
    name: "Học Viên Lửa", color: "#fdba74", skill: "Bùng Cháy",
    desc: "Bản rẻ của Hỏa Sư. Kỹ năng: nổ lửa vừa quanh người. Nội tại: sát thương +5%.",
    apply(p) { p.damageBonus += .05; },
    use(p) {
      explosion(p.x, p.y, 92, 58, p.id, "#fb923c", { burn: 210 });
      addText("BÙNG CHÁY!", p.x, p.y - 30, 20);
      toast(p.name + " dùng Bùng Cháy");
    }
  },

  miner: {
    name: "Thợ Mìn", color: "#fbbf24", skill: "Bãi Mìn",
    desc: "Giá rẻ nhưng chơi chiến thuật. Kỹ năng: đặt 3 mìn quanh người. Nội tại: bắt đầu có thêm mìn.",
    apply(p) { p.bombs.mine += 2; },
    use(p) {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 3;
        mines.push({ x:p.x + Math.cos(a) * 42, y:p.y + Math.sin(a) * 42, r:12, owner:p.id, type:"mine", color:"#f97316", life:60*28, armed:14 });
      }
      addText("BÃI MÌN!", p.x, p.y - 30, 20);
      toast(p.name + " đặt Bãi Mìn");
    }
  },

  sparkKid: {
    name: "Tia Chớp Nhỏ", color: "#c4b5fd", skill: "Sét Nhỏ",
    desc: "Bản rẻ của Thần Sấm. Kỹ năng: giật sét lan ít mục tiêu. Nội tại: sát thương +4%, năng lượng +5%.",
    apply(p) { p.damageBonus += .04; p.energyGainBonus *= 1.05; },
    use(p) {
      chainLightning(p.x, p.y, p.id, 6, 48);
      addParticles(p.x, p.y, "#c4b5fd", 24);
      addText("SÉT NHỎ!", p.x, p.y - 30, 20);
      toast(p.name + " dùng Sét Nhỏ");
    }
  },

  coinRogue: {
    name: "Kẻ Săn Coin", color: "#fde68a", skill: "Nhặt Nhanh",
    desc: "Kiếm coin trong trận tốt hơn. Kỹ năng: hút coin và nhận coin ngay. Nội tại: coin rơi ra +12%.",
    apply(p) { p.coinBonus += .12; },
    use(p) {
      const gain = 55 + Math.floor(level * 1.5);
      p.coins += gain;
      p.magnetTimer = Math.max(p.magnetTimer, 60 * 7);
      dropCoins(p.x, p.y, 20, p.id);
      addText("+" + gain + " COIN", p.x, p.y - 30, 20);
      toast(p.name + " dùng Nhặt Nhanh");
    }
  },
  medic: {
    name: "Bác Sĩ", color: "#22c55e", skill: "Vòng Hồi Máu",
    desc: "Hồi máu cho cả đội. Nội tại: hồi máu hiệu quả hơn.",
    apply(p) { p.healBonus += .35; },
    use(p) {
      players.forEach(x => {
        if (!x.alive) { x.alive = true; x.hp = 35; }
        heal(x, 55);
        x.shieldTimer = Math.max(x.shieldTimer, 60 * 5);
      });
      toast(p.name + " hồi máu cả đội");
    }
  },
  engineer: {
    name: "Kỹ Sư", color: "#f59e0b", skill: "Trụ Súng",
    desc: "Đặt turret tự động. Nội tại: turret và drone bền hơn.",
    apply(p) { p.engineerBonus = 1; },
    use(p) { createTurret(p, 60 * 22); addText("TURRET!", p.x, p.y - 30, 20); }
  },
  ninja: {
    name: "Ninja Sát Thủ", color: "#c084fc", skill: "Loạn Phi Tiêu",
    desc: "Không còn chỉ dùng để di chuyển. Ninja gây sát thương mạnh quanh người và bắn phi tiêu xuyên nhiều zombie. Nội tại: sát thương +22%, tốc bắn +10%.",
    apply(p) { p.speed += .45; p.damageBonus += .22; p.ninjaPower = true; },
    use(p) {
      const count = 18;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const dx = Math.cos(angle), dy = Math.sin(angle);
        bullets.push({ x:p.x + dx * 22, y:p.y + dy * 22, vx:dx * 10.5, vy:dy * 10.5, r:4, owner:p.id, color:"#c084fc", damage:42, life:70, pierce:3, explosive:0, weapon:"shuriken", freezeChance:0, burn:0, chain:0 });
      }
      explosion(p.x, p.y, 82, 42, p.id, "#c084fc");
      p.teamBuffTimer = Math.max(p.teamBuffTimer, 60 * 4);
      addText("LOẠN PHI TIÊU!", p.x, p.y - 34, 20);
      toast(p.name + " dùng Loạn Phi Tiêu");
    }
  },
  ice: {
    name: "Pháp Sư Băng", color: "#38bdf8", skill: "Bão Băng",
    desc: "Làm chậm toàn bộ zombie. Nội tại: đạn có cơ hội đóng băng.",
    apply(p) { p.freezeChance += .16; },
    use(p) { zombies.forEach(z => z.freezeTimer = Math.max(z.freezeTimer, 60 * 6)); addText("BÃO BĂNG!", p.x, p.y - 30, 22); }
  },
  captain: {
    name: "Đội Trưởng", color: "#f43f5e", skill: "Hào Quang Đội",
    desc: "Cả đội tăng sát thương trong 8 giây. Nội tại: thêm coin qua level.",
    apply(p) { p.levelCoinBonus += 10; },
    use(p) { players.forEach(x => x.teamBuffTimer = Math.max(x.teamBuffTimer, 60 * 8)); addText("BUFF TEAM!", p.x, p.y - 30, 20); }
  },

  bomber: {
    name: "Chuyên Gia Bom", color: "#fb923c", skill: "Siêu Bom",
    desc: "Ném một quả bom cực mạnh miễn phí. Nội tại: bắt đầu game có sẵn nhiều bom hơn.",
    apply(p) {
      p.bombDamageBonus = .28;
      p.startBonusBombs = true;
    },
    use(p) {
      const d = norm(p.lastDir.x, p.lastDir.y);
      const x = p.x + d.x * 90;
      const y = p.y + d.y * 90;
      explosion(x, y, 125, 145, p.id, "#fb923c", { burn: 180 });
      addText("SIÊU BOM!", x, y - 20, 24);
      toast(p.name + " dùng Siêu Bom");
    }
  },
  robot: {
    name: "Robot Xạ Thủ", color: "#94a3b8", skill: "Đàn Drone",
    desc: "Triệu hồi 2 drone hỗ trợ. Nội tại: drone bắn nhanh hơn.",
    apply(p) {
      p.droneMaster = true;
      p.maxDrones = 5;
    },
    use(p) {
      createDrone(p);
      createDrone(p);
      addText("DRONE TEAM!", p.x, p.y - 30, 20);
      toast(p.name + " gọi Đàn Drone");
    }
  },
  vampire: {
    name: "Ma Cà Rồng", color: "#dc2626", skill: "Hút Máu",
    desc: "Gây sát thương quanh người và hồi máu. Nội tại: tiêu diệt zombie sẽ hồi ít máu.",
    apply(p) {
      p.lifeSteal = 4;
      p.damageBonus += .05;
    },
    use(p) {
      explosion(p.x, p.y, 105, 85, p.id, "#dc2626");
      heal(p, 45);
      addText("HÚT MÁU!", p.x, p.y - 30, 22);
      toast(p.name + " dùng Hút Máu");
    }
  },
  guardian: {
    name: "Vệ Binh", color: "#14b8a6", skill: "Tường Khiên",
    desc: "Tạo khiên rất mạnh cho cả đội. Nội tại: máu tối đa cao hơn.",
    apply(p) {
      p.maxHp += 35;
      p.hp = p.maxHp;
      p.guardian = true;
    },
    use(p) {
      players.forEach(x => {
        x.shieldTimer = Math.max(x.shieldTimer, 60 * 12);
        x.invincibleTimer = Math.max(x.invincibleTimer, 60 * 1.5);
        addParticles(x.x, x.y, "#14b8a6", 26);
        addText("KHIÊN!", x.x, x.y - 30, 18);
      });
      toast(p.name + " dựng Tường Khiên");
    }
  },
  sniperHero: {
    name: "Thiện Xạ", color: "#fde047", skill: "Một Phát Kết Liễu",
    desc: "Bắn phát đạn cực mạnh xuyên toàn bản đồ. Nội tại: súng Sniper/Laser mạnh hơn.",
    apply(p) {
      p.precision = true;
      p.damageBonus += .08;
    },
    use(p) {
      const d = norm(p.lastDir.x, p.lastDir.y);
      bullets.push({
        x:p.x + d.x * 22, y:p.y + d.y * 22,
        vx:d.x * 15, vy:d.y * 15, r:7,
        owner:p.id, color:"#fde047", damage:180, life:130,
        pierce:12, explosive:0, weapon:"ultimate", freezeChance:0, burn:0, chain:0
      });
      addText("HEADSHOT!", p.x, p.y - 30, 22);
      toast(p.name + " dùng Một Phát Kết Liễu");
    }
  },
  thunder: {
    name: "Thần Sấm", color: "#a78bfa", skill: "Sét Chuỗi",
    desc: "Gọi sét đánh lan qua nhiều zombie. Nội tại: Lightning Gun mạnh hơn.",
    apply(p) {
      p.thunderBonus = true;
      p.damageBonus += .06;
    },
    use(p) {
      chainLightning(p.x, p.y, p.id, 12, 85);
      addParticles(p.x, p.y, "#a78bfa", 45);
      addText("SÉT CHUỖI!", p.x, p.y - 30, 22);
      toast(p.name + " gọi Sét Chuỗi");
    }
  },
  pyro: {
    name: "Hỏa Sư", color: "#f97316", skill: "Vòng Lửa",
    desc: "Tạo vụ nổ lửa lớn quanh người. Nội tại: Flame Gun và bom lửa mạnh hơn.",
    apply(p) {
      p.fireBonus = true;
      p.damageBonus += .05;
    },
    use(p) {
      explosion(p.x, p.y, 135, 95, p.id, "#f97316", { burn: 420 });
      addText("VÒNG LỬA!", p.x, p.y - 30, 22);
      toast(p.name + " dùng Vòng Lửa");
    }
  },
  timeMage: {
    name: "Pháp Sư Thời Gian", color: "#818cf8", skill: "Làm Chậm Thời Gian",
    desc: "Làm chậm toàn bộ zombie rất lâu. Nội tại: kỹ năng nạp nhanh hơn khi nhặt coin.",
    apply(p) {
      p.energyGainBonus = 1.35;
    },
    use(p) {
      zombies.forEach(z => z.freezeTimer = Math.max(z.freezeTimer, 60 * 9));
      addParticles(p.x, p.y, "#818cf8", 48);
      addText("TIME SLOW!", p.x, p.y - 30, 22);
      toast(p.name + " làm chậm thời gian");
    }
  },
  moneyKing: {
    name: "Vua Coin", color: "#facc15", skill: "Mưa Coin",
    desc: "Nhận coin ngay lập tức. Nội tại: nhận nhiều coin hơn khi diệt zombie.",
    apply(p) {
      p.coinBonus = .35;
      p.levelCoinBonus += 15;
    },
    use(p) {
      const gain = 160 + level * 5;
      p.coins += gain;
      dropCoins(p.x, p.y, 60, p.id);
      addText("+" + gain + " COIN", p.x, p.y - 30, 22);
      toast(p.name + " dùng Mưa Coin");
    }
  }
};

const weapons = {
  pistol: { name:"Pistol", price:0, damage:22, cooldown:14, speed:8.5, bullets:1, spread:0, pierce:0, explosive:0, radius:4, freeze:0, burn:0, chain:0, desc:"Súng mặc định." },
  dual: { name:"Dual Pistols", price:900, damage:18, cooldown:11, speed:8.8, bullets:2, spread:.16, pierce:0, explosive:0, radius:3.8, freeze:0, burn:0, chain:0, desc:"Hai súng lục, bắn 2 viên mỗi lần." },
  smg: { name:"SMG", price:1300, damage:14, cooldown:5, speed:9.2, bullets:1, spread:.05, pierce:0, explosive:0, radius:3.4, freeze:0, burn:0, chain:0, desc:"Bắn rất nhanh." },
  rifle: { name:"Assault Rifle", price:1900, damage:24, cooldown:9, speed:10, bullets:1, spread:.03, pierce:0, explosive:0, radius:3.8, freeze:0, burn:0, chain:0, desc:"Súng trường cân bằng, mạnh hơn Pistol." },
  shotgun: { name:"Shotgun", price:2300, damage:16, cooldown:22, speed:8, bullets:6, spread:.36, pierce:0, explosive:0, radius:3.4, freeze:0, burn:0, chain:0, desc:"Bắn tỏa rộng, mạnh khi zombie áp sát." },
  sniper: { name:"Sniper", price:6200, damage:66, cooldown:31, speed:12, bullets:1, spread:0, pierce:4, explosive:0, radius:4.2, freeze:0, burn:0, chain:0, desc:"Sát thương cao, đạn xuyên." },
  laser: { name:"Laser Rifle", price:8600, damage:34, cooldown:9, speed:11.5, bullets:1, spread:0, pierce:3, explosive:0, radius:5.3, freeze:0, burn:0, chain:0, desc:"Đạn laser xuyên nhiều zombie." },
  flame: { name:"Flame Gun", price:7800, damage:12, cooldown:4, speed:6.8, bullets:2, spread:.22, pierce:0, explosive:12, radius:5.5, freeze:0, burn:180, chain:0, desc:"Phun lửa, đốt zombie theo thời gian." },
  icegun: { name:"Ice Gun", price:8200, damage:18, cooldown:8, speed:8.2, bullets:1, spread:.04, pierce:1, explosive:0, radius:5, freeze:.65, burn:0, chain:0, desc:"Có khả năng đóng băng zombie." },
  lightning: { name:"Lightning Gun", price:9400, damage:30, cooldown:13, speed:10, bullets:1, spread:0, pierce:0, explosive:0, radius:5, freeze:0, burn:0, chain:3, desc:"Điện giật lan sang zombie gần đó." },
  grenade: { name:"Grenade Launcher", price:10400, damage:64, cooldown:36, speed:6, bullets:1, spread:0, pierce:0, explosive:72, radius:6, freeze:0, burn:0, chain:0, desc:"Bắn lựu đạn nổ diện rộng." },
  rocket: { name:"Rocket Launcher", price:12400, damage:86, cooldown:46, speed:6.2, bullets:1, spread:0, pierce:0, explosive:92, radius:6.5, freeze:0, burn:0, chain:0, desc:"Tên lửa nổ cực mạnh." },
  minigun: { name:"Minigun", price:14400, damage:19, cooldown:3, speed:10.5, bullets:1, spread:.08, pierce:0, explosive:0, radius:3.2, freeze:0, burn:0, chain:0, desc:"Bắn cực nhanh, rất mạnh ở level cao." }
};

const ammoDefs = {
  pistol:   { mag: 12, reload: 55 },
  dual:     { mag: 18, reload: 65 },
  smg:      { mag: 32, reload: 70 },
  rifle:    { mag: 30, reload: 75 },
  shotgun:  { mag: 8,  reload: 85 },
  sniper:   { mag: 5,  reload: 95 },
  laser:    { mag: 24, reload: 80 },
  flame:    { mag: 60, reload: 90 },
  icegun:   { mag: 22, reload: 80 },
  lightning:{ mag: 18, reload: 85 },
  grenade:  { mag: 2,  reload: 210 },
  rocket:   { mag: 1,  reload: 260 },
  minigun:  { mag: 90, reload: 120 },
  ultimate: { mag: 1,  reload: 1 },
  support:  { mag: 1,  reload: 1 }
};

function getAmmoDef(key) {
  return ammoDefs[key] || { mag: 12, reload: 60 };
}
function refillAmmo(p) {
  p.ammo = getAmmoDef(p.weapon).mag;
  p.reloadTimer = 0;
}
function startReload(p) {
  if (!p || p.reloadTimer > 0) return;
  const def = getAmmoDef(p.weapon);
  if (p.ammo >= def.mag) return;
  p.reloadTimer = def.reload;
  addText("RELOAD", p.x, p.y - 34, 16);
}

const bombTypes = {
  frag: { name:"Frag Bomb", price:800, color:"#facc15", radius:90, damage:95, desc:"Bom nổ sát thương rộng." },
  fire: { name:"Fire Bomb", price:1100, color:"#fb923c", radius:85, damage:55, burn:300, desc:"Bom lửa, đốt zombie sau khi nổ." },
  ice: { name:"Ice Bomb", price:1100, color:"#7dd3fc", radius:95, damage:40, freeze:360, desc:"Bom băng, làm chậm zombie rất mạnh." },
  shock: { name:"Shock Bomb", price:1300, color:"#a78bfa", radius:92, damage:65, chain:5, desc:"Bom điện, giật lan sang nhiều zombie." },
  blackhole: { name:"Black Hole", price:3600, color:"#c084fc", radius:130, damage:70, desc:"Tạo hố đen hút zombie rồi nổ." },
  mine: { name:"Land Mine", price:900, color:"#f97316", radius:80, damage:100, desc:"Đặt mìn, zombie lại gần sẽ nổ." }
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return min + Math.random() * (max - min); }
function norm(x, y) { const l = Math.hypot(x, y) || 1; return { x:x/l, y:y/l }; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add("show");
  toastTimer = 140;
}
function addText(text, x, y, size=16) {
  texts.push({ text, x, y, size, life:60 });
}
function addParticles(x, y, color, count=10) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(1, 4);
    particles.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, r:rand(1,4), color, life:rand(25,55) });
  }
}
function addShockwave(x, y, color, maxR=80, width=4, life=28) {
  shockwaves.push({ x, y, color, r:12, maxR, width, life, maxLife:life });
}

function totalScore() {
  return players.reduce((sum, p) => sum + (p.score || 0), 0);
}

function saveHighScore() {
  const score = totalScore();
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(highScoreKey, String(highScore));
    toast("Kỷ lục mới: " + highScore + " điểm!");
    if (loggedInUser) {
      apiSave({ high_score: highScore });
    }
  }
}

function initMissions() {
  missions = [
    { id:"kills", text:"Tiêu diệt 35 zombie", target:35, progress:0, reward:140, done:false },
    { id:"bombs", text:"Dùng 3 quả bom", target:3, progress:0, reward:120, done:false },
    { id:"chests", text:"Mở 1 rương hoặc airdrop", target:1, progress:0, reward:160, done:false }
  ];
  updateMissionPanel();
}

function addMissionProgress(id, amount, player) {
  const m = missions.find(x => x.id === id);
  if (!m || m.done) return;
  m.progress = clamp(m.progress + amount, 0, m.target);
  if (m.progress >= m.target) {
    m.done = true;
    const receiver = player || players[0];
    if (receiver) {
      receiver.coins += m.reward;
      receiver.energy = clamp(receiver.energy + 35, 0, receiver.energyMax);
    }
    addText("NHIỆM VỤ +" + m.reward, W / 2, 86, 20);
    toast("Hoàn thành nhiệm vụ: " + m.text);
  }
  updateMissionPanel();
}

function updateMissionPanel() {
  if (!el.missionPanel) return;
  const lines = missions.length ? missions.map(m => {
    const mark = m.done ? "✅" : "🎯";
    return `<div class="small" style="margin:6px 0">${mark} ${m.text}: ${m.progress}/${m.target} <b>+${m.reward}</b></div>`;
  }).join("") : '<div class="small">Bắt đầu game để nhận nhiệm vụ.</div>';
  el.missionPanel.innerHTML = `<h4 style="margin:0 0 6px">Nhiệm vụ</h4>${lines}`;
  if (el.recordBox) {
    el.recordBox.innerHTML = `<h4 style="margin:0 0 6px">Kỷ lục</h4><div class="small">Điểm hiện tại: <b>${totalScore()}</b></div><div class="small">Cao nhất: <b>${highScore}</b></div><div class="small">Map: <b>${currentMapRule().name}</b></div><div class="small">Nâng cấp may mắn: <b>${luckyUpgradeCount}</b></div>`;
  }
}

function triggerFever() {
  if (feverTimer > 0) return;
  feverTimer = 60 * 10;
  players.forEach(p => {
    p.teamBuffTimer = Math.max(p.teamBuffTimer, feverTimer);
    p.energy = clamp(p.energy + 35, 0, p.energyMax);
  });
  addText("FEVER MODE!", W / 2, 150, 34);
  toast("FEVER MODE: tăng sức mạnh toàn đội!");
}

function startSpecialEvent() {
  const types = ["coinRain", "energyStorm", "starFall", "supplyDrop"];
  eventType = types[Math.floor(Math.random() * types.length)];
  eventTimer = 60 * 10;
  eventTick = 0;
  const names = { coinRain:"Mưa Coin", energyStorm:"Bão Năng Lượng", starFall:"Sao Băng", supplyDrop:"Airdrop" };
  addText("SỰ KIỆN: " + names[eventType], W / 2, 100, 24);
  toast("Sự kiện đặc biệt: " + names[eventType]);
  if (eventType === "supplyDrop") spawnAirdrop();
}

function spawnAirdrop() {
  chests.push({ x:rand(150, W-150), y:rand(120, H-120), r:18, life:60*20, pulse:0, rare:true });
  addText("AIRDROP!", W / 2, 118, 22);
}

function updateSpecialFeatures() {
  if (feverTimer > 0) feverTimer--;

  airdropTimer--;
  if (airdropTimer <= 0) {
    spawnAirdrop();
    airdropTimer = 60 * rand(22, 34);
  }

  if (eventTimer > 0) {
    eventTimer--;
    eventTick++;
    if (eventType === "coinRain" && eventTick % 24 === 0) {
      const owner = players[Math.floor(Math.random() * Math.max(1, players.length))];
      dropCoins(rand(80, W - 80), rand(80, H - 80), 22, owner ? owner.id : 1);
    }
    if (eventType === "energyStorm" && eventTick % 45 === 0) {
      players.forEach(p => p.energy = clamp(p.energy + 8, 0, p.energyMax));
      addParticles(rand(120, W-120), rand(90, H-90), "#facc15", 12);
    }
    if (eventType === "starFall" && eventTick % 70 === 0) {
      const target = zombies.length ? zombies[Math.floor(Math.random() * zombies.length)] : {x:rand(120,W-120), y:rand(90,H-90)};
      explosion(target.x, target.y, 76, 70, 1, "#fde047");
      addText("★", target.x, target.y - 20, 24);
    }
    if (eventTimer <= 0) eventType = "";
  }
}

function updateCharacterOptions() {
  [el.p1Select, el.p2Select].forEach(select => {
    if (!select) return;
    const previous = select.value || "soldier";
    select.innerHTML = "";
    Object.entries(characters).forEach(([key, c]) => {
      const opt = document.createElement("option");
      opt.value = key;
      const unlocked = isCharacterUnlocked(key);
      opt.textContent = (unlocked ? "✅ " : "🔒 ") + c.name + " - " + c.skill + " - " + characterPriceText(key);
      select.appendChild(opt);
    });
    select.value = characters[previous] ? previous : "soldier";
  });
}

function updateCharacterUI() {
  updateCharacterOptions();
  if (el.dollarBalance) el.dollarBalance.textContent = "$" + Math.floor(dollarBalance);

  const p1 = getSelectedCharPriceInfo(el.p1Select);
  const p2 = getSelectedCharPriceInfo(el.p2Select);
  const descHtml = info => {
    const status = info.unlocked
      ? `<span class="unlock-note">Đã mở khóa - ${characterPriceText(info.key)}</span>`
      : `<span class="lock-note">Đang khóa - cần ${info.price}$</span>`;
    return `<b>${info.c.skill}:</b> ${info.c.desc}<br>${status}`;
  };
  if (el.p1Desc) el.p1Desc.innerHTML = descHtml(p1);
  if (el.p2Desc) el.p2Desc.innerHTML = descHtml(p2);

  if (btn.buyP1Char) {
    btn.buyP1Char.textContent = p1.unlocked ? "P1 đã mở khóa" : "P1 mua " + p1.c.name + " - " + p1.price + "$";
    btn.buyP1Char.disabled = p1.unlocked;
    btn.buyP1Char.classList.toggle("gray", p1.unlocked);
  }
  if (btn.buyP2Char) {
    btn.buyP2Char.textContent = p2.unlocked ? "P2 đã mở khóa" : "P2 mua " + p2.c.name + " - " + p2.price + "$";
    btn.buyP2Char.disabled = p2.unlocked || playerMode === 1;
    btn.buyP2Char.classList.toggle("gray", p2.unlocked || playerMode === 1);
    btn.buyP2Char.style.display = playerMode === 1 ? "none" : "block";
  }

  const locked = [];
  if (!p1.unlocked) locked.push("P1: " + p1.c.name + " cần " + p1.price + "$");
  if (playerMode === 2 && !p2.unlocked) locked.push("P2: " + p2.c.name + " cần " + p2.price + "$");
  if (el.unlockStatus) {
    el.unlockStatus.innerHTML = locked.length
      ? "<b>Chưa thể bắt đầu:</b> " + locked.join(" | ")
      : "Có thể bắt đầu. Nhân vật đã mở khóa sẽ được lưu vĩnh viễn trên trình duyệt này.";
  }
  if (btn.start) btn.start.disabled = locked.length > 0;
}

function initSelects() {
  updateCharacterOptions();
  el.p1Select.value = "soldier";
  el.p2Select.value = "soldier";
  el.p1Select.addEventListener("change", updateCharacterUI);
  el.p2Select.addEventListener("change", updateCharacterUI);
  initMapSelect();
  setPlayerMode(2);
  updateCharacterUI();
}


function updateAutoSkipUI() {
  const label = autoSkipEnabled ? "Auto Skip: BẬT" : "Auto Skip: TẮT";
  if (btn.autoSkip) {
    btn.autoSkip.textContent = label;
    btn.autoSkip.classList.toggle("active", autoSkipEnabled);
  }
  if (btn.autoSkipSide) {
    btn.autoSkipSide.textContent = label + " / phím N";
    btn.autoSkipSide.classList.toggle("blue", autoSkipEnabled);
  }
}

function toggleAutoSkip(forceValue) {
  autoSkipEnabled = typeof forceValue === "boolean" ? forceValue : !autoSkipEnabled;
  localStorage.setItem(autoSkipKey, autoSkipEnabled ? "1" : "0");
  if (loggedInUser) {
    apiSave({ auto_skip: autoSkipEnabled ? 1 : 0 });
  }
  updateAutoSkipUI();
  toast(autoSkipEnabled ? "Đã bật Auto Skip: tự qua màn sau 5 giây" : "Đã tắt Auto Skip");
}

function updateAutoSkip() {
  if (!autoSkipEnabled || state !== "playing" || shopOpen || paused) return;
  if (level >= 40) return; // Boss cuối không tự skip
  if (levelAutoSkipped) return;

  levelAgeFrames++;
  if (levelAgeFrames >= AUTO_SKIP_DELAY_FRAMES) {
    levelAutoSkipped = true;
    addTeamText("⏩ AUTO SKIP: QUA MÀN, ZOMBIE CŨ VẪN CÒN!", 21);
    toast("Auto Skip: qua level " + (level + 1) + " nhưng không xóa zombie cũ");
    advanceToNextLevel("auto");
  }
}

function initMapSelect() {
  if (!el.mapSelect) return;
  el.mapSelect.innerHTML = "";
  Object.keys(mapConfigs).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = mapConfigs[key].name;
    el.mapSelect.appendChild(opt);
  });
  const updateMapDesc = () => {
    currentMapKey = el.mapSelect.value;
    if (el.mapDesc) el.mapDesc.textContent = mapConfigs[currentMapKey].desc + " " + mapRuleDesc(currentMapKey);
  };
  el.mapSelect.addEventListener("change", updateMapDesc);
  updateMapDesc();
}

function applySelectedMap() {
  currentMapKey = el.mapSelect ? el.mapSelect.value : currentMapKey;
  obstacles = mapConfigs[currentMapKey].obstacles.map(o => ({ ...o }));
}

function setPlayerMode(mode) {
  playerMode = mode;
  btn.mode1.classList.toggle("active", mode === 1);
  btn.mode2.classList.toggle("active", mode === 2);
  if (el.p2SelectCard) el.p2SelectCard.style.display = mode === 1 ? "none" : "block";
  if (el.modeLabel) el.modeLabel.textContent = mode === 1 ? "Đang chọn: Chế độ 1 người." : "Đang chọn: Chế độ 2 người.";
  updateCharacterUI();
}

function closeIntro() {
  if (el.intro) el.intro.classList.add("hidden");
}

function makePlayer(id, charKey) {
  const c = characters[charKey] || characters["soldier"];
  
  const names = ["", "P1", "P2", "P3", "P4"];
  const startXs = [0, 178, 505, 178, 505];
  const startYs = [0, 213, 213, 500, 500];
  const colors = ["", "#3b82f6", "#ef4444", "#eab308", "#22c55e"]; // xanh, đỏ, vàng, xanh lá

  const p = {
    id, name: names[id] || ("P" + id), label:c.name, charKey,
    x: startXs[id] || 300, y: startYs[id] || 300, r:15,
    color: colors[id] || "#ffffff", accent:c.color,
    hp:100, maxHp:100, speed:4.35, alive:true,
    lastDir:{ x: id % 2 === 1 ? 1 : -1, y:0 },
    shootCooldown:0, bombCooldown:0,
    weapon:"pistol", owned:new Set(["pistol"]),
    ammo:getAmmoDef("pistol").mag, reloadTimer:0,
    bombType:"frag", bombs:{ frag:0, fire:0, ice:0, shock:0, blackhole:0, mine:0 },
    coins:0, score:0, energy:0, energyMax:100,
    shieldTimer:0, invincibleTimer:0, rapidTimer:0, teamBuffTimer:0, magnetTimer:0, speedBoostTimer:0, damageBoostTimer:0, secondWind:true,
    thirst:100, thirstDamageTimer:0, mapHazardTimer:0, isMoving:false, isMecha:false, mechaTimer:0,
    damageBonus:0, healBonus:0, freezeChance:0, engineerBonus:0, levelCoinBonus:0, bombDamageBonus:0, startBonusBombs:false, maxDrones:3, droneMaster:false, lifeSteal:0, guardian:false, precision:false, thunderBonus:false, fireBonus:false, energyGainBonus:1, coinBonus:0
  };
  c.apply(p);
  if (p.startBonusBombs) { p.bombs.frag += 3; p.bombs.fire += 2; p.bombs.mine += 2; }
  return p;
}

function resetGame() {
  const p1Info = getSelectedCharPriceInfo(el.p1Select);
  const p2Info = getSelectedCharPriceInfo(el.p2Select);
  if (!p1Info.unlocked || (playerMode === 2 && !p2Info.unlocked)) {
    toast("Hãy mua/mở khóa nhân vật trước khi bắt đầu");
    updateCharacterUI();
    return;
  }
  applySelectedMap();
  bossMiniGame = { active:false, timer:0, cooldown:0, key:"", label:"" };
  level = 1; levelAgeFrames = 0; levelAutoSkipped = false; combo = 0; comboTimer = 0; feverTimer = 0; paused = false; eventType = ""; eventTimer = 0; eventTick = 0; airdropTimer = 60 * 18; luckyUpgradeCount = 0; comboChestMarks = new Set(); treasureSpawnedThisLevel = false; mapMechanicTick = 0; thirstWarningTimer = 0; totalKills = 0; bombsUsed = 0; chestsOpened = 0;
  timeOfDay = 0; weatherType = "none"; weatherTimer = 0; weatherParticles = [];
  bullets = []; enemyBullets = []; bombs = []; mines = []; blackHoles = [];
  zombies = []; particles = []; shockwaves = []; texts = []; pickups = []; coins = []; turrets = []; drones = []; pets = []; chests = [];
  players = [makePlayer(1, el.p1Select.value)];
  if (playerMode === 2) players.push(makePlayer(2, el.p2Select.value));
  const rule = currentMapRule();
  players.forEach(p => {
    p.coins += rule.startCoins || 0;
    p.energyGainBonus *= rule.energyMul || 1;
    if (rule.startCoins) addText("MAP +" + rule.startCoins + " COIN", p.x, p.y - 36, 16);
  });

  state = "playing";
  shopOpen = false;
  closeIntro();
  el.menu.classList.add("hidden");
  el.shop.classList.add("hidden");
  initMissions();
  spawnLevel();
  updateShop();
  updateHud();
}

function rectCircle(rect, circle) {
  const cx = clamp(circle.x, rect.x, rect.x + rect.w);
  const cy = clamp(circle.y, rect.y, rect.y + rect.h);
  return Math.hypot(circle.x - cx, circle.y - cy) < circle.r;
}
function blocked(e) { return obstacles.some(o => rectCircle(o, e)); }
function nearestObstacleInfo(e) {
  let best = null;
  let bestD = Infinity;
  for (const o of obstacles) {
    const cx = clamp(e.x, o.x, o.x + o.w);
    const cy = clamp(e.y, o.y, o.y + o.h);
    const d = Math.hypot(e.x - cx, e.y - cy);
    if (d < bestD) {
      bestD = d;
      best = { obstacle: o, cx, cy, d };
    }
  }
  return best;
}
function move(e, dx, dy, fly=false) {
  const oldX = e.x, oldY = e.y;
  e.x += dx; e.x = clamp(e.x, e.r, W - e.r);
  if (!fly && blocked(e)) e.x = oldX;
  e.y += dy; e.y = clamp(e.y, e.r, H - e.r);
  if (!fly && blocked(e)) e.y = oldY;
  return Math.hypot(e.x - oldX, e.y - oldY);
}
function updateZombieEscapeState(z, movedDist, targetDir) {
  if (z.canFly) return;
  const info = nearestObstacleInfo(z);
  if (z.escapeTimer > 0) {
    z.escapeTimer--;
    z.lastX = z.x;
    z.lastY = z.y;
    return;
  }
  if (info && info.d < z.r + 9 && movedDist < 0.2) z.stuckFrames++;
  else z.stuckFrames = Math.max(0, z.stuckFrames - 2);

  if (z.stuckFrames >= 180 && info) {
    const away = norm(z.x - info.cx, z.y - info.cy);
    const side = Math.random() < 0.5 ? 1 : -1;
    const tangent = norm((-away.y * side) + targetDir.x * 0.35, (away.x * side) + targetDir.y * 0.35);
    z.escapeDirX = tangent.x;
    z.escapeDirY = tangent.y;
    z.escapeTimer = 80;
    z.stuckFrames = 0;
  }
  z.lastX = z.x;
  z.lastY = z.y;
}

function startArmoredRevive(z) {
  if (!z || z.type !== "armored" || (z.lives || 1) <= 1 || z.reviveTimer > 0) return false;
  z.lives--;
  z.hp = 0;
  z.reviveTimer = 60 * 3;
  z.burnTimer = 0;
  z.freezeTimer = 0;
  z.smokeTimer = 0;
  z.hitCooldown = 60 * 3;
  addText("HỒI PHỤC 3s", z.x, z.y - z.r - 30, 18);
  addParticles(z.x, z.y, "#e5e7eb", 26);
  addShockwave(z.x, z.y, "#cbd5e1", 54, 3, 26);
  return true;
}

function ghostAvoidsHit(z) {
  if (!z || z.type !== "ghost") return false;
  if (z.phaseTimer > 0) return true;
  if ((z.phaseCooldown || 0) <= 0 && Math.random() < (z.phaseChance || .26)) {
    z.phaseTimer = 60;
    z.phaseCooldown = 105;
    addText("XUYÊN ĐẠN!", z.x, z.y - z.r - 22, 16);
    addParticles(z.x, z.y, "#a7e8f4", 16);
    return true;
  }
  return false;
}

function handleBossObstacleBreaking(z) {
  if (!z || !z.isBoss) return;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    const cx = clamp(z.x, o.x, o.x + o.w);
    const cy = clamp(z.y, o.y, o.y + o.h);
    const d = Math.hypot(z.x - cx, z.y - cy);
    if (d < z.r + 10) {
      o.breakTimer = (o.breakTimer || 0) + 1;
      if (o.breakTimer === 1) addText("BOSS ĐẬP TƯỜNG!", o.x + o.w / 2, o.y - 10, 16);
      if (o.breakTimer >= 60) {
        addParticles(o.x + o.w / 2, o.y + o.h / 2, "#f97316", 34);
        addShockwave(o.x + o.w / 2, o.y + o.h / 2, "#fb923c", Math.max(o.w, o.h) * .75, 5, 24);
        obstacles.splice(i, 1);
      }
    } else if (o.breakTimer) {
      o.breakTimer = Math.max(0, o.breakTimer - 2);
    }
  }
}

function maybeSpawnTreasureZombie() {
  const rule = currentMapRule();
  if (treasureSpawnedThisLevel || level < 3) return;
  const chance = (rule.treasureChance || .05) + Math.min(.08, level * .002);
  if (Math.random() < chance) {
    treasureSpawnedThisLevel = true;
    spawnZombie("treasure");
    addTeamText("💰 ZOMBIE KHO BÁU XUẤT HIỆN!", 24);
    toast("Bắt zombie kho báu trước khi nó chạy thoát!");
  }
}

function giveLuckyUpgrade() {
  luckyUpgradeCount++;
  const upgrades = [
    {
      name:"+15 Máu tối đa",
      apply:p => { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 15); }
    },
    {
      name:"+8% sát thương vĩnh viễn",
      apply:p => { p.damageBonus += .08; }
    },
    {
      name:"+10% coin trong trận",
      apply:p => { p.coinBonus = (p.coinBonus || 0) + .10; }
    },
    {
      name:"+0.35 tốc độ chạy",
      apply:p => { p.speed += .35; }
    },
    {
      name:"Tặng drone hỗ trợ",
      apply:p => { createDrone(p); }
    },
    {
      name:"Nạp đầy kỹ năng + khiên",
      apply:p => { p.energy = p.energyMax; p.shieldTimer = Math.max(p.shieldTimer, 60 * 7); }
    },
    {
      name:"Tặng 2 bom đang chọn",
      apply:p => { p.bombs[p.bombType] += 2; }
    }
  ];
  const pick = upgrades[Math.floor(Math.random() * upgrades.length)];
  players.forEach(p => { if (p) pick.apply(p); addParticles(p.x, p.y, "#facc15", 28); });
  addTeamText("🎲 NÂNG CẤP MAY MẮN: " + pick.name, 23);
  toast("Nâng cấp may mắn: " + pick.name);
}

function levelTypes(lv) {
  if (lv <= 5) return ["normal"];
  if (lv <= 10) return ["normal", "archer"];
  if (lv <= 15) return ["normal", "archer", "mutant"];
  if (lv <= 20) return ["normal", "archer", "mutant", "flyer"];
  if (lv <= 25) return ["normal", "archer", "mutant", "flyer", "bomb"];
  if (lv <= 30) return ["normal", "archer", "mutant", "flyer", "bomb", "armored"];
  if (lv <= 35) return ["normal", "archer", "mutant", "flyer", "bomb", "armored", "jumper"];
  if (lv <= 39) return ["normal", "archer", "mutant", "flyer", "bomb", "armored", "jumper", "ghost"];
  return ["normal", "archer", "mutant", "flyer", "bomb", "armored", "jumper"];
}
function zombieConfig(type) {
  const s = 1 + level * .018;
  const data = {
    normal:{ name:"Thường", color:"#22c55e", r:14, hp:26*s, speed:1.05+level*.01, damage:8, points:5, coin:4 },
    archer:{ name:"Bắn cung", color:"#b8e80d", r:18, hp:23*s, speed:.85+level*.006, damage:6, points:8, coin:7, range:260, cd:120 },
    mutant:{ name:"Đột biến", color:"#a347b8", r:22, hp:52*s, speed:1.35+level*.012, damage:12, points:12, coin:10 },
    flyer:{ name:"Bay", color:"#88d4ea", r:15, hp:26*s, speed:1.75+level*.012, damage:7, points:10, coin:8, fly:true },
    bomb:{ name:"Bom", color:"#ff8c1a", r:19, hp:26*s, speed:1.25+level*.008, damage:24, points:12, coin:10, boom:72 },
    armored:{ name:"2 mạng", color:"#9ca3af", r:21, hp:50*s, speed:.95+level*.006, damage:10, points:17, coin:15, armor:true, lives:2 },
    jumper:{ name:"Nhảy cao", color:"#f2e400", r:18, hp:38*s, speed:1.05+level*.006, damage:13, points:16, coin:14, jump:true },
    ghost:{ name:"Ma", color:"#a7e8f4", r:18, hp:44*s, speed:1.34+level*.010, damage:11, points:18, coin:16, fly:true, ghost:true },
    boss:{ name:"Trùm", color:"#ff1d1d", r:40, hp:260*s, speed:.78+level*.005, damage:18, points:80, coin:120, range:340, cd:82, boss:true },
    miniboss:{ name:"Mini-Boss", color:"#15803d", r:28, hp:160*s, speed:.85+level*.005, damage:15, points:40, coin:65, miniboss:true },
    fast:{ name:"Nhanh", color:"#10b981", r:10, hp:18*s, speed:1.85+level*.01, damage:6, points:6, coin:5 },
    treasure:{ name:"Kho báu", color:"#facc15", r:17, hp:35*s, speed:2.35+level*.012, damage:0, points:25, coin:90 + level * 5, treasure:true }
  };
  const c = data[type];
  return {
    type, name:c.name, color:c.color, r:c.r, hp:Math.round(c.hp), maxHp:Math.round(c.hp),
    speed:c.speed, damage:c.damage, points:c.points, coin:c.coin, range:c.range || 0,
    shootCooldown:Math.floor(rand(20, 100)), shootCooldownMax:c.cd || 0, canFly:!!c.fly,
    explosionRadius:c.boom || 0, armored:!!c.armor, isBoss:!!c.boss, isMiniBoss:!!c.miniboss, treasure:!!c.treasure, elite:false, jump:!!c.jump,
    ghost:!!c.ghost, phaseTimer:0, phaseCooldown:0, phaseChance:c.ghost ? .26 : 0,
    lives:c.lives || 1, reviveTimer:0, invulnTimer:0,
    jumpTimer:Math.floor(rand(0, 90)), hitCooldown:0, freezeTimer:0, burnTimer:0, burnDamage:0,
    lastX:0, lastY:0, stuckFrames:0, escapeTimer:0, escapeDirX:0, escapeDirY:0, escapeLife:c.treasure ? 60 * 14 : 0
  };
}
function spawnPos() {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x:rand(0, W), y:-32 };
  if (side === 1) return { x:W+32, y:rand(0, H) };
  if (side === 2) return { x:rand(0, W), y:H+32 };
  return { x:-32, y:rand(0, H) };
}
function spawnZombie(type) {
  const z = zombieConfig(type);
  const rule = currentMapRule();
  if (!z.treasure) {
    z.speed *= rule.zombieSpeedMul || 1;
    z.maxHp = Math.round(z.maxHp * (rule.zombieHpMul || 1));
    z.hp = z.maxHp;
    if (z.range) z.range *= rule.enemyRangeMul || 1;
    if (!z.isBoss && Math.random() < ((rule.eliteChance || 0) + Math.min(.05, level * .0015))) {
      z.elite = true;
      z.name = "Tinh anh " + z.name;
      z.r = Math.round(z.r * 1.15);
      z.maxHp = Math.round(z.maxHp * 1.75);
      z.hp = z.maxHp;
      z.speed *= 1.07;
      z.damage = Math.round(z.damage * 1.25);
      z.points += 10;
      z.coin += 12;
    }
  }
  const p = spawnPos();
  z.x = p.x; z.y = p.y; z.lastX = z.x; z.lastY = z.y;
  zombies.push(z);
}
function spawnLevel(keepItems = false) {
  if (!keepItems) {
    bullets = []; enemyBullets = []; bombs = []; mines = []; blackHoles = []; pickups = []; coins = []; chests = [];
  }
  levelAgeFrames = 0;
  levelAutoSkipped = false;
  const types = levelTypes(level);
  treasureSpawnedThisLevel = false;
  const rule = currentMapRule();
  const count = Math.min(8 + Math.floor(level * 1.3) + (rule.zombieCountBonus || 0), 92);
  for (let i = 0; i < count; i++) {
    let t = types[Math.floor(Math.random() * types.length)];
    spawnZombie(t);
  }
  if (level === 40) {
    spawnZombie("boss");
    addTeamText("⚠️ BOSS CUỐI XUẤT HIỆN - CÓ THỂ PHÁ VẬT CẢN!", 24);
  } else if (level === 20) {
    spawnZombie("miniboss");
    addTeamText("⚠️ MINI-BOSS XUẤT HIỆN - NÓ CÓ THỂ TÁCH RA LÀM NHIỀU PHẦN!", 24);
  } else if (level >= 36 && level <= 39) {
    addTeamText("👻 MA XUẤT HIỆN: xuyên tường và né đạn trong 1 giây!", 22);
  }
  maybeSpawnTreasureZombie();
  if (level % (rule.chestEvery || 4) === 0) chests.push({ x:rand(160, W-160), y:rand(120, H-120), r:16, life:60*16, pulse:0 });
  addText("LEVEL " + level, W/2, 120, 36);
  if (level > 1 && level % 5 === 0) startSpecialEvent();
}

function shoot(p) {
  if (state !== "playing" || shopOpen || !p.alive || p.shootCooldown > 0) return;
  const w = weapons[p.weapon];
  if (p.reloadTimer > 0) return;
  if (p.ammo <= 0) { startReload(p); return; }
  p.ammo--;
  const base = Math.atan2(p.lastDir.y, p.lastDir.x);
  const cooldownMul = (p.rapidTimer > 0 ? .35 : 1) * (p.ninjaPower ? .90 : 1);
  const teamBonus = p.teamBuffTimer > 0 ? .25 : 0;

  for (let i = 0; i < w.bullets; i++) {
    const offset = w.bullets === 1 ? 0 : (i - (w.bullets - 1) / 2) * w.spread;
    const angle = base + offset + (Math.random() - .5) * w.spread * .5;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    bullets.push({
      x:p.x + dx * (p.r + 9), y:p.y + dy * (p.r + 9),
      vx:dx * w.speed, vy:dy * w.speed, r:w.radius,
      owner:p.id, color:p.color, damage:Math.round(w.damage * (1 + p.damageBonus + teamBonus + ((p.precision && (p.weapon === 'sniper' || p.weapon === 'laser')) ? .22 : 0) + ((p.thunderBonus && p.weapon === 'lightning') ? .22 : 0) + ((p.fireBonus && p.weapon === 'flame') ? .25 : 0) + (feverTimer > 0 ? .25 : 0) + (p.damageBoostTimer > 0 ? .75 : 0))),
      life:p.weapon === "flame" ? 45 : 95, pierce:w.pierce, explosive:w.explosive,
      weapon:p.weapon, freezeChance:w.freeze + p.freezeChance, burn:Math.round(w.burn * (p.fireBonus ? 1.45 : 1)), chain:w.chain + ((p.thunderBonus && p.weapon === 'lightning') ? 2 : 0)
    });
  }
  p.shootCooldown = Math.max(2, Math.round(w.cooldown * cooldownMul));
  if (p.ammo <= 0) startReload(p);
}

function throwBomb(p) {
  if (state !== "playing" || shopOpen || !p.alive || p.bombCooldown > 0) return;
  const type = p.bombType;
  if (!p.bombs[type] || p.bombs[type] <= 0) {
    toast(p.name + " hết " + bombTypes[type].name);
    return;
  }
  p.bombs[type]--;
  bombsUsed++;
  addMissionProgress("bombs", 1, p);
  p.bombCooldown = 45;
  const d = norm(p.lastDir.x, p.lastDir.y);
  const b = bombTypes[type];

  if (type === "mine") {
    mines.push({ x:p.x, y:p.y, r:12, owner:p.id, type, color:b.color, life:60*30, armed:20 });
    addText("ĐẶT MÌN", p.x, p.y - 25, 16);
    return;
  }

  bombs.push({
    x:p.x + d.x * 18, y:p.y + d.y * 18, vx:d.x * 6.5, vy:d.y * 6.5,
    r:8, owner:p.id, type, color:b.color, life:42, pulse:0,
    damageMul:1 + (p.bombDamageBonus || 0) + ((p.fireBonus && type === 'fire') ? .35 : 0)
  });
}

function useSkill(p) {
  if (state !== "playing" || shopOpen || !p.alive) return;
  if (p.energy < p.energyMax) {
    toast(p.name + " chưa đủ năng lượng");
    return;
  }
  p.energy = 0;
  characters[p.charKey].use(p);
}

function heal(p, amount) {
  const a = Math.round(amount * (1 + p.healBonus));
  p.hp = clamp(p.hp + a, 0, p.maxHp);
  addText("+" + a + " HP", p.x, p.y - 25, 16);
  addParticles(p.x, p.y, "#22c55e", 14);
}

function damagePlayer(p, amount) {
  if (p.invincibleTimer > 0) return;
  let dmg = amount;
  if (p.shieldTimer > 0) dmg = Math.ceil(dmg * .38);
  p.hp = clamp(p.hp - dmg, 0, p.maxHp);
  addText("-" + dmg, p.x, p.y - 25, 15);
  addParticles(p.x, p.y, p.color, 8);
  if (p.hp <= 0) {
    if (p.secondWind) {
      p.secondWind = false;
      p.alive = true;
      p.hp = Math.max(30, Math.round(p.maxHp * .35));
      p.invincibleTimer = 60 * 2.5;
      p.shieldTimer = Math.max(p.shieldTimer, 60 * 6);
      addText("SECOND WIND!", p.x, p.y - 34, 22);
      addParticles(p.x, p.y, "#facc15", 34);
      return;
    }
    p.alive = false; addText(p.name + " gục!", p.x, p.y - 28, 20);
  }
}

function nearestZombie(src, range=Infinity) {
  let best = null, bd = range;
  for (const z of zombies) {
    const d = Math.hypot(src.x - z.x, src.y - z.y);
    if (d < bd) { best = z; bd = d; }
  }
  return best;
}
function nearestPlayer(z) {
  const alive = players.filter(p => p.alive);
  if (!alive.length) return null;
  alive.sort((a,b) => dist(z,a) - dist(z,b));
  return alive[0];
}
function enemyShoot(z, target) {
  const d = norm(target.x - z.x, target.y - z.y);
  enemyBullets.push({
    x:z.x + d.x * (z.r + 8), y:z.y + d.y * (z.r + 8),
    vx:d.x * (z.isBoss ? 4.8 : 4.2), vy:d.y * (z.isBoss ? 4.8 : 4.2),
    r:z.isBoss ? 6 : 4, color:z.isBoss ? "#fecaca" : "#bbf7d0",
    damage:z.isBoss ? 13 : 8, life:180
  });
}

function createTurret(p, life) {
  turrets.push({ x:p.x, y:p.y, r:13, owner:p.id, color:p.color, cooldown:0, life:Math.round(life * (p.engineerBonus ? 1.35 : 1)) });
}
function createDrone(p) {
  if (drones.filter(d => d.owner === p.id).length >= (p.maxDrones || 3)) { addText("MAX DRONE", p.x, p.y - 25, 16); return; }
  drones.push({ x:p.x + rand(-25,25), y:p.y + rand(-25,25), r:9, owner:p.id, color:p.color, cooldown:0, angle:Math.random()*Math.PI*2 });
  addText("DRONE", p.x, p.y - 25, 18);
}

function createPet(p, type) {
  const existing = pets.find(x => x.owner === p.id && x.type === type);
  if (existing) {
    existing.level = Math.min(3, existing.level + 1);
    addText("PET +LV", p.x, p.y - 28, 18);
    toast(p.name + " nâng cấp pet");
    return;
  }
  const names = { wolf:"Sói Máy", fairy:"Tiên Hồi Máu", cat:"Mèo Nam Châm" };
  const colors = { wolf:"#93c5fd", fairy:"#86efac", cat:"#f0abfc" };
  pets.push({ owner:p.id, type, name:names[type], color:colors[type], x:p.x, y:p.y, r:10, cooldown:0, level:1, angle:Math.random()*Math.PI*2 });
  addText(names[type], p.x, p.y - 30, 18);
}

function updatePets() {
  pets.forEach(pet => {
    const owner = players.find(p => p.id === pet.owner);
    if (!owner || !owner.alive) return;
    pet.angle += .035 + pet.level * .004;
    const targetX = owner.x + Math.cos(pet.angle) * (54 + pet.level * 4);
    const targetY = owner.y + Math.sin(pet.angle) * (54 + pet.level * 4);
    pet.x += (targetX - pet.x) * .075;
    pet.y += (targetY - pet.y) * .075;
    pet.cooldown--;

    if (pet.type === "wolf" && pet.cooldown <= 0) {
      const z = nearestZombie(pet, 260 + pet.level * 30);
      if (z) {
        supportBullet({x:pet.x, y:pet.y, owner:pet.owner, color:pet.color}, z, 12 + pet.level * 7, 9.5);
        pet.cooldown = Math.max(16, 36 - pet.level * 5);
      }
    }

    if (pet.type === "fairy" && pet.cooldown <= 0) {
      heal(owner, 8 + pet.level * 4);
      addParticles(owner.x, owner.y, pet.color, 8);
      pet.cooldown = 60 * 5;
    }

    if (pet.type === "cat") {
      owner.magnetTimer = Math.max(owner.magnetTimer, 12);
      if (pet.cooldown <= 0) {
        dropCoins(pet.x, pet.y, 8 + pet.level * 4, owner.id);
        pet.cooldown = 60 * 7;
      }
    }
  });
}

function drawPets() {
  pets.forEach(pet => {
    ctx.save();
    ctx.shadowColor = pet.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = pet.color;
    ctx.beginPath();
    ctx.arc(pet.x, pet.y, pet.r + pet.level, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#07111f";
    ctx.font = "bold 10px Roboto Mono";
    ctx.textAlign = "center";
    ctx.fillText(pet.type === "wolf" ? "W" : pet.type === "fairy" ? "+" : "$", pet.x, pet.y + 3);
    ctx.restore();
  });
}

function explosion(x, y, radius, damage, owner, color, extra={}) {
  addParticles(x, y, color, Math.round(radius / 2));
  addShockwave(x, y, color, radius * .9, 5, 24);
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    const d = Math.hypot(x - z.x, y - z.y);
    if (d < radius + z.r) {
      if (z.reviveTimer > 0 || z.invulnTimer > 0 || ghostAvoidsHit(z)) continue;
      const dmg = Math.round(damage * (1 - d / (radius + z.r)) + damage * .35);
      z.hp -= dmg;
      if (extra.freeze) z.freezeTimer = Math.max(z.freezeTimer, extra.freeze);
      if (extra.burn) { z.burnTimer = Math.max(z.burnTimer, extra.burn); z.burnDamage = Math.max(z.burnDamage, 2); }
      if (z.hp <= 0) killZombie(i, owner);
    }
  }
  if (extra.chain) chainLightning(x, y, owner, extra.chain, damage * .55);
}

function chainLightning(x, y, owner, jumps, damage) {
  let source = { x, y };
  const hit = new Set();
  for (let n = 0; n < jumps; n++) {
    let bestIndex = -1, bestD = 150;
    for (let i = 0; i < zombies.length; i++) {
      if (hit.has(i)) continue;
      const d = Math.hypot(zombies[i].x - source.x, zombies[i].y - source.y);
      if (d < bestD) { bestD = d; bestIndex = i; }
    }
    if (bestIndex < 0) break;
    const z = zombies[bestIndex];
    hit.add(bestIndex);
    addParticles(z.x, z.y, "#a78bfa", 12);
    if (z.reviveTimer > 0 || z.invulnTimer > 0 || ghostAvoidsHit(z)) { source = z; continue; }
    z.hp -= Math.round(damage);
    source = z;
    if (z.hp <= 0) killZombie(bestIndex, owner);
  }
}

function explodeBomb(b) {
  const def = bombTypes[b.type];
  if (b.type === "blackhole") {
    blackHoles.push({ x:b.x, y:b.y, r:def.radius, owner:b.owner, color:def.color, life:60*4, damage:def.damage * (b.damageMul || 1) });
    addShockwave(b.x, b.y, def.color, 100, 4, 34);
    addText("HỐ ĐEN!", b.x, b.y - 20, 18);
    return;
  }
  explosion(b.x, b.y, def.radius, def.damage * (b.damageMul || 1), b.owner, def.color, { freeze:def.freeze || 0, burn:def.burn || 0, chain:def.chain || 0 });
}

function zombieExplode(z) {
  addParticles(z.x, z.y, "#fb923c", 38);
  addShockwave(z.x, z.y, "#fb923c", z.explosionRadius, 5, 22);
  players.forEach(p => {
    if (!p.alive) return;
    const d = dist(z, p);
    if (d < z.explosionRadius) damagePlayer(p, Math.round(z.damage * (1 - d / z.explosionRadius) + 10));
  });
}

function killZombie(i, ownerId) {
  const z = zombies[i];
  if (!z) return;
  if (startArmoredRevive(z)) return;
  const owner = players.find(p => p.id === ownerId) || players[0];
  combo++;
  totalKills++;
  comboTimer = 60 * 3;
  addMissionProgress("kills", 1, players.find(p => p.id === ownerId) || players[0]);
  if (combo >= 25 && combo % 25 === 0) triggerFever();
  const mul = Math.min(5, 1 + Math.floor(combo / 12));
  const mapCoinMul = currentMapRule().coinMul || 1;
  const gain = Math.round(z.coin * mul * mapCoinMul * (1 + (owner.coinBonus || 0)));
  owner.score += z.points;
  owner.coins += gain;
  owner.energy = clamp(owner.energy + Math.round(10 * (owner.energyGainBonus || 1)), 0, owner.energyMax);
  if (owner.lifeSteal) heal(owner, owner.lifeSteal);
  if (z.treasure) {
    owner.coins += 160 + level * 8;
    owner.energy = owner.energyMax;
    dropCoins(z.x, z.y, 180 + level * 10, ownerId);
    spawnPickup("damage", z.x + rand(-20, 20), z.y + rand(-20, 20));
    spawnPickup("ammo", z.x + rand(-20, 20), z.y + rand(-20, 20));
    addText("KHO BÁU!", z.x, z.y - 38, 22);
  }
  if (z.elite && Math.random() < .55) {
    chests.push({ x:z.x, y:z.y, r:16, life:60*14, pulse:0, rare:Math.random() < .35 });
    addText("RƯƠNG ELITE!", z.x, z.y - 38, 17);
  }
  const comboMark = Math.floor(combo / 40);
  if (comboMark > 0 && !comboChestMarks.has(comboMark)) {
    comboChestMarks.add(comboMark);
    chests.push({ x:z.x, y:z.y, r:17, life:60*15, pulse:0, rare:comboMark % 2 === 0 });
    addText("COMBO RƯƠNG!", z.x, z.y - 52, 19);
  }
  if (z.type === "bomb") zombieExplode(z);
  addText("+" + gain + " coin", z.x, z.y - 18, 16);
  addParticles(z.x, z.y, z.color, z.isBoss ? 36 : 16);
  dropCoins(z.x, z.y, Math.ceil(gain / 2), ownerId);
  maybeDropPickup(z.x, z.y);
  zombies.splice(i, 1);
}

function dropCoins(x, y, amount, owner) {
  const pieces = Math.max(1, Math.min(8, Math.ceil(amount / 10)));
  for (let i = 0; i < pieces; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(1.2, 3.2);
    coins.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, r:5, value:Math.max(1, Math.round(amount / pieces)), owner, life:60*10 });
  }
}
function maybeDropPickup(x, y) {
  const r = Math.random();
  if (r < .07) spawnPickup("heal", x, y);
  else if (r < .12) spawnPickup("shield", x, y);
  else if (r < .17) spawnPickup("speed", x, y);
  else if (r < .22) spawnPickup("magnet", x, y);
  else if (r < .29) spawnPickup("energy", x, y);
  else if (r < .325) spawnPickup("damage", x, y);
  else if (r < .35) spawnPickup("ammo", x, y);
  else if (r < .36) spawnPickup("mecha", x, y);
}
function spawnPickup(type, x, y) {
  const colors = { heal:"#22c55e", shield:"#60a5fa", speed:"#facc15", magnet:"#c084fc", energy:"#f59e0b", damage:"#ef4444", ammo:"#e2e8f0", mecha:"#475569" };
  pickups.push({ type, x, y, r:12, color:colors[type], life:60*12, pulse:0 });
}


function startBossMiniGame() {
  const options = [{key:"Digit1", label:"1"},{key:"Digit2", label:"2"},{key:"Digit3", label:"3"},{key:"Digit4", label:"4"}];
  const pick = options[Math.floor(Math.random() * options.length)];
  bossMiniGame = { active:true, timer:180, cooldown:0, key:pick.key, label:pick.label };
  toast("Boss Mini Game: nhấn phím " + pick.label);
}
function updateBossMiniGame() {
  if (state !== "playing") return;
  const boss = zombies.find(z => z.isBoss);
  if (!boss) { bossMiniGame.active = false; bossMiniGame.cooldown = 180; return; }
  if (bossMiniGame.active) {
    bossMiniGame.timer--;
    if (bossMiniGame.timer <= 0) {
      bossMiniGame.active = false; bossMiniGame.cooldown = 360;
      players.forEach(p => { if (p.alive) damagePlayer(p, 8); });
      addText("MISS!", boss.x, boss.y - 45, 22);
    }
  } else {
    bossMiniGame.cooldown--;
    if (bossMiniGame.cooldown <= 0) startBossMiniGame();
  }
}
function resolveBossMiniGame(code) {
  if (!bossMiniGame.active || code !== bossMiniGame.key) return false;
  const bossIndex = zombies.findIndex(z => z.isBoss);
  if (bossIndex >= 0) {
    const boss = zombies[bossIndex];
    boss.hp -= Math.round(boss.maxHp * .12);
    boss.freezeTimer = Math.max(boss.freezeTimer, 60 * 2);
    players.forEach(p => { p.energy = clamp(p.energy + 25, 0, p.energyMax); p.shieldTimer = Math.max(p.shieldTimer, 60 * 3); });
    addShockwave(boss.x, boss.y, "#facc15", 95, 5, 28);
    addText("BOSS STUN!", boss.x, boss.y - 52, 24);
    if (boss.hp <= 0) killZombie(bossIndex, players[0] ? players[0].id : 1);
  }
  bossMiniGame.active = false; bossMiniGame.cooldown = 420;
  return true;
}
function drawBossMiniGame() {
  if (!bossMiniGame.active) return;
  ctx.save();
  const w = 350, h = 110, x = W / 2 - w / 2, y = 102;
  ctx.fillStyle = "rgba(7, 12, 22, .88)"; roundRect(x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = "rgba(250,204,21,.8)"; ctx.lineWidth = 3; roundRect(x, y, w, h, 18); ctx.stroke();
  ctx.fillStyle = "#fef3c7"; ctx.textAlign = "center"; ctx.font = "900 20px Roboto Mono"; ctx.fillText("BOSS MINI GAME", W/2, y + 30);
  ctx.font = "900 42px Roboto Mono"; ctx.fillText("ẤN " + bossMiniGame.label, W/2, y + 76);
  const pct = clamp(bossMiniGame.timer / 180, 0, 1);
  ctx.fillStyle = "rgba(255,255,255,.14)"; roundRect(x + 26, y + 88, w - 52, 10, 99); ctx.fill();
  ctx.fillStyle = "#facc15"; roundRect(x + 26, y + 88, (w - 52) * pct, 10, 99); ctx.fill();
  ctx.restore();
}

function updatePlayers() {
  players.forEach(p => {
    if (!p.alive) return;
    let dx = 0, dy = 0;
    if (p.id === 1) {
      if (keys.ArrowLeft) dx--;
      if (keys.ArrowRight) dx++;
      if (keys.ArrowUp) dy--;
      if (keys.ArrowDown) dy++;
    } else {
      if (keys.KeyA) dx--;
      if (keys.KeyD) dx++;
      if (keys.KeyW) dy--;
      if (keys.KeyS) dy++;
    }
    const spd = p.speed + (p.speedBoostTimer > 0 ? 1.35 : 0);
    p.isMoving = false;
    if (dx || dy) {
      const d = norm(dx, dy);
      p.lastDir = d;
      const moved = move(p, d.x * spd, d.y * spd);
      p.isMoving = moved > 0.2;
    }
    if (p.shootCooldown > 0) p.shootCooldown--;
    if (p.reloadTimer > 0) {
      p.reloadTimer--;
      if (p.reloadTimer <= 0) {
        p.ammo = getAmmoDef(p.weapon).mag;
        addText("ĐẦY ĐẠN", p.x, p.y - 34, 14);
      }
    }
    if (p.bombCooldown > 0) p.bombCooldown--;
    if (p.shieldTimer > 0) p.shieldTimer--;
    if (p.invincibleTimer > 0) p.invincibleTimer--;
    if (p.rapidTimer > 0) p.rapidTimer--;
    if (p.teamBuffTimer > 0) p.teamBuffTimer--;
    if (p.magnetTimer > 0) p.magnetTimer--;
    if (p.speedBoostTimer > 0) p.speedBoostTimer--;
    if (p.damageBoostTimer > 0) p.damageBoostTimer--;
    
    if (p.isMecha) {
      p.mechaTimer--;
      if (p.mechaTimer % 12 === 0) {
        const target = nearestZombie(p, 300);
        if (target) {
          const d = norm(target.x - p.x, target.y - p.y);
          bullets.push({x:p.x+d.x*20, y:p.y+d.y*20, vx:d.x*10, vy:d.y*10, r:6, owner:p.id, color:"#ef4444", damage:75, life:90, pierce:0, explosive:80, weapon:"rocket", freezeChance:0, burn:0, chain:0});
        }
      }
      if (p.mechaTimer <= 0) {
        p.isMecha = false;
        explosion(p.x, p.y, 150, 120, p.id, "#fb923c");
        addText("MECHA DETONATE!", p.x, p.y - 40, 22);
      }
    }
  });
}


function updateMapMechanics() {
  mapMechanicTick++;
  const zones = activeMapZones();

  // Sa mạc: thanh khát. Di chuyển làm tụt, đứng yên mới hồi. Hết khát mất 10 HP mỗi 2 giây.
  if (currentMapKey === "desert") {
    players.forEach(p => {
      if (!p.alive) return;
      const inShade = zones.some(z => z.type === "shade" && inZone(p, z));
      if (p.isMoving) p.thirst = clamp((p.thirst ?? 100) - (inShade ? 0.035 : 0.065), 0, 100);
      else p.thirst = clamp((p.thirst ?? 100) + (inShade ? 0.22 : 0.13), 0, 100);

      if (p.thirst <= 0) {
        p.thirstDamageTimer = (p.thirstDamageTimer || 0) + 1;
        if (p.thirstDamageTimer >= 120) {
          p.thirstDamageTimer = 0;
          damagePlayer(p, 10);
          addText("KHÁT -10 HP", p.x, p.y - 48, 18);
          if (thirstWarningTimer <= 0) { toast("Sa mạc: hết khát sẽ mất 10 HP mỗi 2 giây. Đứng yên để hồi!"); thirstWarningTimer = 240; }
        }
      } else p.thirstDamageTimer = 0;
    });
    if (thirstWarningTimer > 0) thirstWarningTimer--;
  }

  // Căn cứ: ô tiếp tế giúp hồi nhẹ nếu đứng trong vùng.
  if (currentMapKey === "base" && mapMechanicTick % 60 === 0) {
    players.forEach(p => {
      if (!p.alive) return;
      if (zones.some(z => z.type === "supply" && inZone(p, z))) {
        p.hp = clamp(p.hp + 3, 0, p.maxHp);
        p.energy = clamp(p.energy + 7, 0, p.energyMax);
        const def = getAmmoDef(p.weapon);
        if (p.reloadTimer <= 0 && p.ammo < def.mag) p.ammo = Math.min(def.mag, p.ammo + 2);
        addParticles(p.x, p.y, "#22c55e", 6);
      }
    });
  }

  // Thành phố: lửa gây sát thương, khói làm chậm zombie.
  if (currentMapKey === "city") {
    const fireZones = zones.filter(z => z.type === "fire");
    const smokeZones = zones.filter(z => z.type === "smoke");
    players.forEach(p => {
      if (!p.alive) return;
      if (fireZones.some(z => inZone(p, z))) {
        p.mapHazardTimer = (p.mapHazardTimer || 0) + 1;
        if (p.mapHazardTimer >= 90) { p.mapHazardTimer = 0; damagePlayer(p, 4); addText("NÓNG!", p.x, p.y - 42, 15); }
      } else p.mapHazardTimer = 0;
    });
    zombies.forEach(z => {
      if (smokeZones.some(zone => inZone(z, zone))) z.smokeTimer = Math.max(z.smokeTimer || 0, 12);
    });
    if (mapMechanicTick % 45 === 0) {
      for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        if (fireZones.some(zone => inZone(z, zone))) {
          if (z.reviveTimer > 0 || z.invulnTimer > 0) continue;
          z.hp -= 9;
          z.burnTimer = Math.max(z.burnTimer || 0, 80);
          z.burnDamage = Math.max(z.burnDamage || 0, 2);
          addParticles(z.x, z.y, "#fb923c", 4);
          if (z.hp <= 0) killZombie(i, players[0] ? players[0].id : 1);
        }
      }
    }
  }

  // Lab: ô năng lượng hồi kỹ năng, bẫy điện giật zombie khi sáng.
  if (currentMapKey === "lab") {
    const energyZones = zones.filter(z => z.type === "energy");
    players.forEach(p => {
      if (!p.alive) return;
      if (energyZones.some(z => inZone(p, z))) {
        p.energy = clamp(p.energy + 0.55, 0, p.energyMax);
        if (mapMechanicTick % 25 === 0) addParticles(p.x, p.y, "#38bdf8", 5);
      }
    });
    const zapZones = zones.filter(z => z.type === "zap" && isZoneActive(z));
    if (zapZones.length && mapMechanicTick % 24 === 0) {
      for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        if (zapZones.some(zone => inZone(z, zone))) {
          if (z.reviveTimer > 0 || z.invulnTimer > 0) continue;
          z.hp -= 16;
          z.freezeTimer = Math.max(z.freezeTimer || 0, 16);
          addParticles(z.x, z.y, "#67e8f9", 8);
          if (z.hp <= 0) killZombie(i, players[0] ? players[0].id : 1);
        }
      }
    }
  }
}

function updateZombies() {
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    const target = nearestPlayer(z);
    if (!target) break;

    if (z.phaseTimer > 0) z.phaseTimer--;
    if (z.phaseCooldown > 0) z.phaseCooldown--;
    if (z.invulnTimer > 0) z.invulnTimer--;

    // Zombie 2 mạng: mạng đầu chết sẽ đứng hồi 3 giây rồi sang mạng 2.
    if (z.reviveTimer > 0) {
      z.reviveTimer--;
      z.hitCooldown = Math.max(z.hitCooldown || 0, 8);
      if (z.reviveTimer <= 0) {
        z.hp = z.maxHp;
        z.invulnTimer = 45;
        addText("MẠNG 2!", z.x, z.y - z.r - 26, 19);
        addParticles(z.x, z.y, "#f8fafc", 30);
      }
      continue;
    }

    if (z.burnTimer > 0) {
      z.burnTimer--;
      if (z.burnTimer % 20 === 0) {
        z.hp -= z.burnDamage || 2;
        addParticles(z.x, z.y, "#fb923c", 3);
        if (z.hp <= 0) { killZombie(i, target.id); continue; }
      }
    }

    let spd = z.speed;
    if (z.freezeTimer > 0) { z.freezeTimer--; spd *= .35; }
    if (z.smokeTimer > 0) { z.smokeTimer--; spd *= .68; }
    if (timeOfDay > 0.5 && timeOfDay < 1.5) spd *= 1.15;
    if (z.jump) {
      z.jumpTimer++;
      if (z.jumpTimer > 90) {
        spd *= 3.1;
        if (z.jumpTimer > 108) z.jumpTimer = 0;
      }
    }

    const d = dist(z, target);
    const dir = norm(target.x - z.x, target.y - z.y);
    let movedDist = 0;

    if (z.treasure) {
      z.escapeLife--;
      const wiggle = Math.sin((Date.now() / 180) + z.x * .02) * .85;
      movedDist = move(z, -dir.x * spd + -dir.y * wiggle, -dir.y * spd + dir.x * wiggle, z.canFly);
      if (z.escapeLife <= 0 || z.x < 8 || z.x > W - 8 || z.y < 8 || z.y > H - 8) {
        addText("KHO BÁU CHẠY MẤT!", z.x, z.y - 22, 15);
        zombies.splice(i, 1);
        continue;
      }
    } else if (z.escapeTimer > 0) {
      movedDist = move(z, z.escapeDirX * spd * 1.12, z.escapeDirY * spd * 1.12, z.canFly);
    } else if ((z.type === "archer" || z.isBoss) && d < z.range && d > 90) {
      z.shootCooldown--;
      if (z.shootCooldown <= 0) { enemyShoot(z, target); z.shootCooldown = z.shootCooldownMax; }
      movedDist = move(z, -dir.x * spd * .25, -dir.y * spd * .25, z.canFly);
    } else {
      movedDist = move(z, dir.x * spd, dir.y * spd, z.canFly);
    }

    updateZombieEscapeState(z, movedDist, dir);
    if (z.isBoss) handleBossObstacleBreaking(z);

    const touchDist = dist(z, target);
    if (touchDist < z.r + target.r + 2 && z.hitCooldown <= 0) {
      if (z.treasure) { z.escapeLife -= 60; continue; }
      if (z.type === "bomb") { zombieExplode(z); zombies.splice(i, 1); continue; }
      damagePlayer(target, z.damage);
      z.hitCooldown = z.type === "ghost" ? 54 : 42;
    }
    if (z.hitCooldown > 0) z.hitCooldown--;

    if (z.isMiniBoss) {
      let stage = Math.ceil((z.hp / z.maxHp) * 4);
      if (z.lastStage === undefined) z.lastStage = 4;
      if (stage < z.lastStage) {
        z.lastStage = stage;
        explosion(z.x, z.y, 40, 20, 1, "#22c55e");
        addText("TÁCH RA!", z.x, z.y - 40, 18);
        for(let j=0; j<3; j++) {
          let mz = zombieConfig("fast");
          mz.x = z.x + rand(-20,20); mz.y = z.y + rand(-20,20); mz.lastX = mz.x; mz.lastY = mz.y;
          zombies.push(mz);
        }
      }
    }
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx; b.y += b.vy; b.life--;
    const hitWall = obstacles.some(o => rectCircle(o, b));
    if (b.life <= 0 || b.x < -35 || b.x > W+35 || b.y < -35 || b.y > H+35 || hitWall) {
      if (b.explosive && (b.weapon === "rocket" || b.weapon === "grenade")) explosion(b.x, b.y, b.explosive, b.damage * .75, b.owner, b.color);
      bullets.splice(i, 1);
      continue;
    }
    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];
      if (Math.hypot(b.x - z.x, b.y - z.y) < b.r + z.r) {
        if (z.reviveTimer > 0 || z.invulnTimer > 0 || ghostAvoidsHit(z)) {
          addParticles(b.x, b.y, z.type === "ghost" ? "#a7e8f4" : "#e5e7eb", 5);
          continue;
        }
        z.hp -= b.damage;
        if (b.freezeChance && Math.random() < b.freezeChance) z.freezeTimer = Math.max(z.freezeTimer, 60 * 2.5);
        if (b.burn) { z.burnTimer = Math.max(z.burnTimer, b.burn); z.burnDamage = Math.max(z.burnDamage, 2); }
        if (b.explosive) explosion(b.x, b.y, b.explosive, b.damage * .75, b.owner, b.color);
        if (b.chain) chainLightning(b.x, b.y, b.owner, b.chain, b.damage * .65);
        addParticles(b.x, b.y, z.color, 8);
        if (z.hp <= 0) killZombie(j, b.owner);
        if (b.pierce > 0) b.pierce--;
        else bullets.splice(i, 1);
        break;
      }
    }
  }
}

function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx; b.y += b.vy; b.life--;
    const hitWall = obstacles.some(o => rectCircle(o, b));
    if (b.life <= 0 || b.x < -30 || b.x > W+30 || b.y < -30 || b.y > H+30 || hitWall) {
      enemyBullets.splice(i, 1);
      continue;
    }
    for (const p of players) {
      if (!p.alive) continue;
      if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + p.r) {
        damagePlayer(p, b.damage);
        enemyBullets.splice(i, 1);
        break;
      }
    }
  }
}

function updateBombsMinesBlackholes() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    b.x += b.vx; b.y += b.vy; b.vx *= .97; b.vy *= .97; b.life--; b.pulse += .12;
    const hitWall = obstacles.some(o => rectCircle(o, b));
    const hitZombie = zombies.some(z => Math.hypot(b.x - z.x, b.y - z.y) < b.r + z.r);
    if (b.life <= 0 || hitWall || hitZombie) {
      explodeBomb(b);
      bombs.splice(i, 1);
    }
  }

  for (let i = mines.length - 1; i >= 0; i--) {
    const m = mines[i];
    m.life--; if (m.armed > 0) m.armed--;
    if (m.life <= 0) { mines.splice(i, 1); continue; }
    if (m.armed <= 0 && zombies.some(z => Math.hypot(m.x - z.x, m.y - z.y) < m.r + z.r + 14)) {
      const def = bombTypes.mine;
      explosion(m.x, m.y, def.radius, def.damage, m.owner, def.color);
      mines.splice(i, 1);
    }
  }

  for (let i = blackHoles.length - 1; i >= 0; i--) {
    const h = blackHoles[i];
    h.life--;
    zombies.forEach(z => {
      const d = Math.hypot(h.x - z.x, h.y - z.y);
      if (d < h.r) {
        const dir = norm(h.x - z.x, h.y - z.y);
        z.x += dir.x * 2.7;
        z.y += dir.y * 2.7;
        z.freezeTimer = Math.max(z.freezeTimer, 5);
      }
    });
    if (h.life <= 0) {
      explosion(h.x, h.y, h.r * .75, h.damage, h.owner, h.color);
      blackHoles.splice(i, 1);
    }
  }
}

function updateSupport() {
  for (let i = turrets.length - 1; i >= 0; i--) {
    const t = turrets[i];
    t.life--; t.cooldown--;
    if (t.life <= 0) { addParticles(t.x, t.y, t.color, 12); turrets.splice(i, 1); continue; }
    if (t.cooldown <= 0) {
      const z = nearestZombie(t, 330);
      if (z) { supportBullet(t, z, 18, 9); t.cooldown = 18; }
    }
  }

  drones.forEach(d => {
    const owner = players.find(p => p.id === d.owner);
    if (!owner || !owner.alive) return;
    d.angle += .045;
    d.x += (owner.x + Math.cos(d.angle) * 38 - d.x) * .08;
    d.y += (owner.y + Math.sin(d.angle) * 38 - d.y) * .08;
    d.cooldown--;
    if (d.cooldown <= 0) {
      const z = nearestZombie(d, 260);
      if (z) { supportBullet(d, z, d.owner && players.find(p => p.id === d.owner && p.droneMaster) ? 16 : 13, 8.5); d.cooldown = (d.owner && players.find(p => p.id === d.owner && p.droneMaster)) ? 20 : 28; }
    }
  });

  updatePets();
}
function supportBullet(src, target, damage, speed) {
  const d = norm(target.x - src.x, target.y - src.y);
  bullets.push({ x:src.x+d.x*14, y:src.y+d.y*14, vx:d.x*speed, vy:d.y*speed, r:3.6, owner:src.owner, color:src.color, damage, life:70, pierce:0, explosive:0, weapon:"support", freezeChance:0, burn:0, chain:0 });
}

function updatePickupsCoinsChests() {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const item = pickups[i];
    item.life--; item.pulse += .08;
    if (item.life <= 0) { pickups.splice(i, 1); continue; }
    for (const p of players) {
      if (!p.alive) continue;
      if (Math.hypot(item.x - p.x, item.y - p.y) < item.r + p.r + 5) {
        applyPickup(p, item.type);
        pickups.splice(i, 1);
        break;
      }
    }
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.life--;
    let target = null;
    const owner = players.find(p => p.id === c.owner && p.alive);
    const magnet = players.find(p => p.alive && p.magnetTimer > 0 && Math.hypot(p.x - c.x, p.y - c.y) < 230);
    if (magnet) target = magnet;
    else if (owner && Math.hypot(owner.x - c.x, owner.y - c.y) < 90) target = owner;
    if (target) {
      const d = norm(target.x - c.x, target.y - c.y);
      c.vx += d.x * .55; c.vy += d.y * .55;
    }
    c.x += c.vx; c.y += c.vy; c.vx *= .94; c.vy *= .94;
    if (c.life <= 0) { coins.splice(i, 1); continue; }
    for (const p of players) {
      if (!p.alive) continue;
      if (Math.hypot(c.x - p.x, c.y - p.y) < c.r + p.r) {
        p.coins += c.value; p.energy = clamp(p.energy + Math.round(2 * (p.energyGainBonus || 1)), 0, p.energyMax);
        addText("+" + c.value, p.x, p.y - 18, 14);
        coins.splice(i, 1);
        break;
      }
    }
  }

  for (let i = chests.length - 1; i >= 0; i--) {
    const ch = chests[i];
    ch.life--; ch.pulse += .06;
    if (ch.life <= 0) { chests.splice(i, 1); continue; }
    for (const p of players) {
      if (!p.alive) continue;
      if (Math.hypot(ch.x - p.x, ch.y - p.y) < ch.r + p.r + 5) {
        const reward = (ch.rare ? 180 : 90) + level * 4;
        chestsOpened++;
        addMissionProgress("chests", 1, p);
        p.coins += reward;
        p.energy = p.energyMax;
        p.bombs[p.bombType] += ch.rare ? 3 : 1;
        heal(p, ch.rare ? 45 : 25);
        addText("RƯƠNG +" + reward, ch.x, ch.y - 22, 18);
        addParticles(ch.x, ch.y, "#facc15", 30);
        chests.splice(i, 1);
        break;
      }
    }
  }
}

function applyPickup(p, type) {
  if (type === "heal") heal(p, 35);
  if (type === "shield") { p.shieldTimer = 60 * 8; addText("SHIELD", p.x, p.y - 24, 16); }
  if (type === "speed") { p.speedBoostTimer = 60 * 7; addText("SPEED", p.x, p.y - 24, 16); }
  if (type === "magnet") { p.magnetTimer = 60 * 8; addText("MAGNET", p.x, p.y - 24, 16); }
  if (type === "energy") { p.energy = clamp(p.energy + 35, 0, p.energyMax); addText("+ENERGY", p.x, p.y - 24, 16); }
  if (type === "damage") { p.damageBoostTimer = 60 * 8; addText("x2 DAMAGE", p.x, p.y - 24, 17); addParticles(p.x, p.y, "#ef4444", 22); }
  if (type === "ammo") { p.reloadTimer = 0; p.ammo = getAmmoDef(p.weapon).mag; addText("FULL AMMO", p.x, p.y - 24, 16); }
  if (type === "mecha") { p.isMecha = true; p.mechaTimer = 60 * 18; p.invincibleTimer = Math.max(p.invincibleTimer, 60 * 18); addText("MECHA SUIT!", p.x, p.y - 34, 24); addParticles(p.x, p.y, "#94a3b8", 40); }
}

function updateParticlesTexts() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vx *= .96; p.vy *= .96; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    s.life--;
    s.r += (s.maxR - s.r) * .24;
    if (s.life <= 0) shockwaves.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.y -= .36; t.life--;
    if (t.life <= 0) texts.splice(i, 1);
  }
  if (toastTimer > 0) {
    toastTimer--;
    if (toastTimer <= 0) el.toast.classList.remove("show");
  }
  if (comboTimer > 0) comboTimer--;
  else combo = 0;
}

function advanceToNextLevel(reason = "clear") {
  if (level >= 40 || state !== "playing") return;

  const oldLevel = level;
  level++;

  players.forEach(p => {
    p.coins += 100;
    addText("+100 COIN", p.x, p.y - 40, 18);
    if (!p.alive) { p.alive = true; p.hp = Math.max(42, Math.round(p.maxHp * .4)); }
    else heal(p, 20);
    p.coins += 15 + Math.floor(level / 2) + p.levelCoinBonus;
    p.energy = clamp(p.energy + 25, 0, p.energyMax);
    if (level % 5 === 0) p.bombs[p.bombType] += 1;
  });

  if (level % 5 === 0) giveLuckyUpgrade();
  if (reason === "auto") {
    addText("Zombie màn " + oldLevel + " vẫn tiếp tục đuổi!", W / 2, 158, 18);
  }
  spawnLevel(reason === "auto");
  updateShop();
}

function updateProgress() {
  if (zombies.length === 0 && state === "playing") {
    if (level >= 40) {
      saveHighScore();
      const finalBonus = calculateRunDollars();
      awardDollars(finalBonus, "thưởng kết thúc trận");
      state = "menu";
      el.menu.classList.remove("hidden");
      el.menu.querySelector("h3").textContent = "Chiến thắng!";
      el.menu.querySelector("p").textContent = "Bạn đã hoàn thành level 40. Tổng thưởng trận này: " + finalBonus + "$ (" + runDollarFormulaText() + "). Hãy mở khóa thêm nhân vật để chơi lại.";
      btn.start.textContent = "Chơi lại";
      return;
    }
    advanceToNextLevel("clear");
  }
}
function returnToMenu() {
  if (shopOpen) {
    toggleShop(false);
    return;
  }
  if (state === "network") {
    if (isOnline) {
      location.reload();
    }
    return;
  }
  if (state !== "playing") return;
  
  saveHighScore();
  const bonus = calculateRunDollars();
  awardDollars(bonus, "thưởng thoát trận");
  state = "menu";
  paused = false;
  el.menu.classList.remove("hidden");
  el.menu.querySelector("h3").textContent = "Đã thoát game";
  el.menu.querySelector("p").textContent = "Bạn đã thoát ra ở level " + level + ". Tổng thưởng trận này: " + bonus + "$ (" + runDollarFormulaText() + ").";
  btn.start.textContent = "Chơi lại";
  updateCharacterUI();
}

function checkGameOver() {
  if (state === "playing" && !players.some(p => p.alive)) {
    saveHighScore();
    const bonus = calculateRunDollars();
    awardDollars(bonus, "thưởng kết thúc trận");
    state = "menu";
    el.menu.classList.remove("hidden");
    el.menu.querySelector("h3").textContent = "Game Over";
    el.menu.querySelector("p").textContent = "Cả hai người chơi đã hết máu ở level " + level + ". Tổng thưởng trận này: " + bonus + "$ (" + runDollarFormulaText() + ").";
    btn.start.textContent = "Chơi lại";
  }
}

function updateEnvironment() {
  if (state !== "playing" || shopOpen || paused) return;
  
  timeOfDay += dayNightCycleSpeed;
  if (timeOfDay >= 2) timeOfDay = 0;
  
  if (weatherType === "none" && Math.random() < 0.0005) {
    const types = ["rain", "snow", "sandstorm"];
    weatherType = types[Math.floor(Math.random() * types.length)];
    if (weatherType === "sandstorm" && currentMapKey !== "desert") weatherType = "rain";
    if (weatherType === "snow" && currentMapKey === "desert") weatherType = "none";
    
    if (weatherType !== "none") {
      weatherTimer = 60 * rand(20, 45);
      toast("Thời tiết thay đổi: " + (weatherType==="rain"?"Mưa lớn":weatherType==="snow"?"Tuyết rơi":"Bão cát"));
    }
  }
  
  if (weatherType !== "none") {
    weatherTimer--;
    if (weatherTimer <= 0) {
      weatherType = "none";
      weatherParticles = [];
      toast("Thời tiết trở lại bình thường");
    } else {
      if (weatherType === "rain") {
        for (let i=0; i<3; i++) weatherParticles.push({x: rand(0, W), y: -20, vx: rand(-1, 0), vy: rand(12, 18)});
        if (Math.random() < 0.05) zombies.forEach(z => { if (z.burnTimer > 0) z.burnTimer = 0; });
      } else if (weatherType === "snow") {
        weatherParticles.push({x: rand(0, W), y: -10, vx: rand(-2, 2), vy: rand(2, 4), s: rand(1, 3)});
      } else if (weatherType === "sandstorm") {
        for (let i=0; i<4; i++) weatherParticles.push({x: W+20, y: rand(0, H), vx: rand(-15, -8), vy: rand(-1, 1), s: rand(2, 5)});
      }
    }
  }
  
  for (let i = weatherParticles.length - 1; i >= 0; i--) {
    let p = weatherParticles[i];
    p.x += p.vx; p.y += p.vy;
    if (p.y > H || p.x < 0 || p.x > W) weatherParticles.splice(i, 1);
  }
}

function emitGameState() {
  if (!socket || !isOnline || !isHost) return;
  const stateData = {
    players: players,
    zombies: zombies,
    bullets: bullets,
    enemyBullets: enemyBullets,
    bombs: bombs,
    mines: mines,
    blackHoles: blackHoles,
    pickups: pickups,
    coins: coins,
    chests: chests,
    turrets: turrets,
    drones: drones,
    pets: pets,
    level: level,
    combo: combo,
    timeOfDay: timeOfDay,
    weatherType: weatherType,
    bossMiniGame: bossMiniGame
  };
  socket.emit('game_state', { room_code: currentRoomCode, state: stateData });
}

function emitPlayerInputs() {
  if (!socket || !isOnline || isHost) return;
  const p = players.find(x => x.id === myPlayerId);
  const shootInput = keys['KeyL'] || keys['KeyF'] || false;
  const skillInput = keys['KeyK'] || keys['KeyG'] || false;
  const bombInput = keys['KeyO'] || keys['KeyR'] || false;
  
  socket.emit('player_input', {
    room_code: currentRoomCode,
    player_id: myPlayerId,
    keys: keys,
    dir: p ? p.lastDir : {x:1, y:0},
    shoot: shootInput,
    skill: skillInput,
    bomb: bombInput
  });
}

let netTick = 0;
function updateGame() {
  if (state !== "playing" || shopOpen || paused) { updateParticlesTexts(); return; }
  
  netTick++;
  if (isOnline && !isHost) {
    updateParticlesTexts();
    updateHud();
    if (netTick % 3 === 0) emitPlayerInputs();
    return;
  }

  updateEnvironment();
  updatePlayers();
  updateMapMechanics();
  updateZombies();
  updateBullets();
  updateEnemyBullets();
  updateBombsMinesBlackholes();
  updateSupport();
  updatePickupsCoinsChests();
  updateSpecialFeatures();
  updateBossMiniGame();
  updateAutoSkip();
  updateParticlesTexts();
  updateProgress();
  checkGameOver();
  updateHud();
  
  if (isOnline && isHost) {
    if (netTick % 3 === 0) emitGameState();
    // host still processes local inputs directly in updatePlayers
  }
}

function roundRect(x, y, w, h, r) {
  // Fix V32: clamp radius so pill bars/zones do not explode into huge blue shapes.
  if (w < 0) { x += w; w = Math.abs(w); }
  if (h < 0) { y += h; h = Math.abs(h); }
  r = Math.max(0, Math.min(r || 0, w / 2, h / 2));

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}


function drawGroundTile(x, y, s) {
  ctx.fillStyle = "rgba(255,255,255,.020)";
  ctx.fillRect(x, y, s, s);
  if ((x + y) % (s * 4) === 0) {
    ctx.fillStyle = "rgba(15,23,42,.12)";
    ctx.fillRect(x + s * .18, y + s * .18, s * .32, s * .08);
  }
  ctx.strokeStyle = "rgba(255,255,255,.018)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + .5, y + .5, s - 1, s - 1);
}

function drawAmbientDecorations(theme) {
  ctx.save();
  const t = Date.now() / 1000;
  const glows = { base:"rgba(34,197,94,.12)", desert:"rgba(251,191,36,.14)", city:"rgba(96,165,250,.11)", lab:"rgba(34,211,238,.15)" };

  // Mảng sáng động để nền đỡ phẳng.
  for (let i = 0; i < 16; i++) {
    const x = (i * 173 + Math.sin(t * .45 + i) * 34) % W;
    const y = (i * 97 + Math.cos(t * .36 + i * 1.7) * 24) % H;
    ctx.fillStyle = glows[theme] || glows.base;
    ctx.beginPath();
    ctx.arc(x, y, 18 + (i % 5) * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (theme === "desert") {
    ctx.globalAlpha = .34;
    ctx.strokeStyle = "rgba(253,230,138,.34)";
    ctx.lineWidth = 2;
    for (let y = 105; y < H - 80; y += 82) {
      ctx.beginPath();
      for (let x = 35; x < W - 35; x += 42) {
        const yy = y + Math.sin(x * .016 + t * 1.1) * 10;
        if (x === 35) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  } else if (theme === "city") {
    ctx.globalAlpha = .32;
    ctx.strokeStyle = "rgba(226,232,240,.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      const x = 55 + (i * 83) % (W - 120);
      const y = 90 + (i * 57) % (H - 170);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 28, y + 8);
      ctx.lineTo(x + 8, y + 28);
      ctx.stroke();
    }
  } else if (theme === "lab") {
    ctx.globalAlpha = .24;
    ctx.strokeStyle = "rgba(103,232,249,.32)";
    ctx.lineWidth = 1.5;
    for (let x = 75; x < W; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x + Math.sin(t + x) * 18, H - 86); ctx.stroke();
    }
    for (let y = 75; y < H; y += 110) {
      ctx.beginPath(); ctx.moveTo(45, y); ctx.lineTo(W - 45, y + Math.cos(t + y) * 12); ctx.stroke();
    }
  } else {
    ctx.globalAlpha = .26;
    ctx.strokeStyle = "rgba(134,239,172,.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W - 185, 145, 58 + Math.sin(t * 2) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 185, 145);
    ctx.lineTo(W - 185 + Math.cos(t * 1.8) * 75, 145 + Math.sin(t * 1.8) * 75);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScreenVignette() {
  ctx.save();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .18, W / 2, H / 2, W * .62);
  v.addColorStop(0, "rgba(255,255,255,0)");
  v.addColorStop(.72, "rgba(15,23,42,.10)");
  v.addColorStop(1, "rgba(0,0,0,.38)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawSandbagObstacle(o) {
  ctx.save();
  const bags = Math.max(3, Math.floor(o.w / 28));
  const bagW = o.w / bags;
  for (let i = 0; i < bags; i++) {
    const x = o.x + i * bagW;
    const y = o.y + (i % 2) * 4;
    // pixel blocky sandbag
    ctx.fillStyle = "#c3aa72";
    ctx.fillRect(x + 2, y + 2, bagW - 4, o.h - 6);
    ctx.fillStyle = "#7b6844"; // shadow
    ctx.fillRect(x + 2, y + o.h - 10, bagW - 4, 6);
    // rigid outline
    ctx.strokeStyle = "#2e2214";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, bagW - 4, o.h - 6);
  }
  ctx.restore();
}

function drawCrateObstacle(o) {
  ctx.save();
  ctx.fillStyle = "#2f6f91";
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = "#17384f"; // bottom shadow
  ctx.fillRect(o.x, o.y + o.h - 10, o.w, 10);
  
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.strokeRect(o.x, o.y, o.w, o.h);
  
  // blocky crate details
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.fillRect(o.x + 8, o.y + 8, o.w - 16, Math.max(8, o.h * .18));
  
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(o.x + 8, o.y + o.h - 8); ctx.lineTo(o.x + o.w - 8, o.y + 8);
  ctx.moveTo(o.x + 8, o.y + 8); ctx.lineTo(o.x + o.w - 8, o.y + o.h - 8);
  ctx.stroke();
  ctx.restore();
}

function drawBuildingObstacle(o) {
  ctx.save();
  ctx.fillStyle = "#617489";
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = "#2c3d51";
  ctx.fillRect(o.x, o.y + o.h/2, o.w, o.h/2);
  
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.strokeRect(o.x, o.y, o.w, o.h);

  // square windows
  ctx.fillStyle = "#111";
  for (let y = o.y + 12; y < o.y + o.h - 12; y += 22) {
    ctx.fillRect(o.x + 12, y, o.w - 24, 10);
  }
  ctx.restore();
}

function drawTowerObstacle(o) {
  ctx.save();
  ctx.fillStyle = "#385d7c";
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = "#173149";
  ctx.fillRect(o.x, o.y + o.h/2, o.w, o.h/2);
  
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.strokeRect(o.x, o.y, o.w, o.h);

  // square grating
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(o.x + 12, o.y + 14, o.w - 24, 18);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(o.x + 10, o.y + o.h - 10); ctx.lineTo(o.x + o.w - 10, o.y + 10);
  ctx.moveTo(o.x + o.w - 10, o.y + o.h - 10); ctx.lineTo(o.x + 10, o.y + 10);
  ctx.stroke();
  ctx.restore();
}


function drawDesertObstacle(o) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (o.kind === "cactus") {
    const cx = o.x + o.w / 2, base = o.y + o.h;
    ctx.fillStyle = "#2f7d3d";
    ctx.fillRect(cx - 6, o.y + 12, 12, base - (o.y + 12));
    ctx.fillRect(cx - 24, o.y + o.h * .3, 8, o.h * .25);
    ctx.fillRect(cx - 24, o.y + o.h * .55, 18, 8);
    ctx.fillRect(cx + 16, o.y + o.h * .2, 8, o.h * .28);
    ctx.fillRect(cx + 6, o.y + o.h * .48, 18, 8);
    // outline
    ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
    ctx.strokeRect(cx - 6, o.y + 12, 12, base - (o.y + 12));
  } else if (o.kind === "rock") {
    ctx.fillStyle = "#b08b57";
    ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
    ctx.fillStyle = "#5f452b"; // shadow
    ctx.fillRect(o.x + 4, o.y + o.h/2, o.w - 8, o.h/2 - 4);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
    ctx.strokeRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
  } else if (o.kind === "tent") {
    ctx.fillStyle = "#b7793d";
    ctx.beginPath(); ctx.moveTo(o.x+8,o.y+o.h-6); ctx.lineTo(o.x+o.w*.5,o.y+8); ctx.lineTo(o.x+o.w-8,o.y+o.h-6); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#3c2512"; ctx.fillRect(o.x+o.w*.43,o.y+o.h*.48,o.w*.14,o.h*.42);
    ctx.strokeStyle="#111"; ctx.lineWidth=2; ctx.stroke();
  } else if (o.kind === "waterTank") {
    ctx.fillStyle="#6b7280"; ctx.fillRect(o.x+12,o.y+8,o.w-24,o.h-14);
    ctx.fillStyle="#38bdf8"; ctx.fillRect(o.x+16,o.y+16,o.w-32,o.h*.34);
    ctx.strokeStyle="#111"; ctx.lineWidth=3; ctx.strokeRect(o.x+12,o.y+8,o.w-24,o.h-14);
  } else {
    ctx.fillStyle = "#d6b26f"; ctx.fillRect(o.x, o.y + o.h*.28, o.w, o.h*.58);
    ctx.fillStyle = "#8b6f3f"; ctx.fillRect(o.x, o.y + o.h*.6, o.w, o.h*.26);
    ctx.strokeStyle="#111"; ctx.lineWidth=2; ctx.strokeRect(o.x, o.y + o.h*.28, o.w, o.h*.58);
  }
  ctx.restore();
}

function drawCityObstacle(o) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (["car","police"].includes(o.kind)) {
    ctx.fillStyle= o.kind === "police" ? "#93c5fd" : "#ef4444";
    ctx.fillRect(o.x+8,o.y+o.h*.25,o.w-16,o.h*.52);
    ctx.fillStyle="#1f2937";
    ctx.fillRect(o.x+8,o.y+o.h*.5,o.w-16,o.h*.27);
    ctx.fillStyle="#dbeafe"; ctx.fillRect(o.x+o.w*.25,o.y+o.h*.14,o.w*.42,o.h*.24);
    ctx.fillStyle="#111"; ctx.fillRect(o.x+o.w*.18,o.y+o.h*.72,12,12); ctx.fillRect(o.x+o.w*.72,o.y+o.h*.72,12,12);
    ctx.strokeStyle="#111"; ctx.lineWidth=2; ctx.strokeRect(o.x+8,o.y+o.h*.25,o.w-16,o.h*.52);
  } else if (o.kind === "bus") {
    ctx.fillStyle="#f59e0b"; ctx.fillRect(o.x,o.y+6,o.w,o.h-12);
    ctx.fillStyle="#1f2937"; for(let x=o.x+18;x<o.x+o.w-24;x+=34) ctx.fillRect(x,o.y+16,22,16);
    ctx.fillStyle="#111"; ctx.fillRect(o.x+24,o.y+o.h-14,16,16); ctx.fillRect(o.x+o.w-40,o.y+o.h-14,16,16);
    ctx.strokeStyle="#111"; ctx.lineWidth=2; ctx.strokeRect(o.x,o.y+6,o.w,o.h-12);
  } else if (o.kind === "rubble") {
    ctx.fillStyle="#6b7280"; ctx.fillRect(o.x,o.y+o.h*.45,o.w,o.h*.36);
    for(let i=0;i<9;i++){ ctx.fillStyle=i%2?"#374151":"#9ca3af"; ctx.fillRect(o.x+12+i*(o.w-30)/9,o.y+10+(i%3)*6,18,14); }
  } else {
    ctx.fillStyle="#6b7280"; ctx.fillRect(o.x,o.y,o.w,o.h);
    ctx.fillStyle="#1f2937"; ctx.fillRect(o.x,o.y+o.h/2,o.w,o.h/2);
    ctx.fillStyle="#bfdbfe"; for(let yy=o.y+14; yy<o.y+o.h-12; yy+=24) for(let xx=o.x+14; xx<o.x+o.w-24; xx+=32) ctx.fillRect(xx,yy,18,10);
    if (o.kind === "store") { ctx.fillStyle="#ef4444"; ctx.fillRect(o.x+10,o.y+o.h-22,o.w-20,14); }
    ctx.strokeStyle="#111"; ctx.lineWidth=3; ctx.strokeRect(o.x,o.y,o.w,o.h);
  }
  ctx.restore();
}

function drawLabObstacle(o) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle="#164e63"; ctx.fillRect(o.x,o.y,o.w,o.h);
  ctx.fillStyle="#0f172a"; ctx.fillRect(o.x,o.y+o.h/2,o.w,o.h/2);
  
  if (o.kind === "capsule" || o.kind === "tank") { ctx.fillStyle="#7dd3fc"; ctx.fillRect(o.x+o.w*.26,o.y+8,o.w*.48,o.h-16); }
  else if (o.kind === "reactor") { ctx.fillStyle="#22d3ee"; ctx.fillRect(o.x+o.w*.25,o.y+o.h*.25,o.w*.5,o.h*.5); }
  else { ctx.fillStyle="#22c55e"; for(let x=o.x+14;x<o.x+o.w-18;x+=28) ctx.fillRect(x,o.y+14,16,12); }
  ctx.strokeStyle="#111"; ctx.lineWidth=3; ctx.strokeRect(o.x,o.y,o.w,o.h);
  ctx.restore();
}

function drawObstacle(o) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.20)";
  ctx.fillRect(o.x + 6, o.y + 7, o.w, o.h);

  if (["cactus", "rock", "dune", "tent", "waterTank", "boneWall"].includes(o.kind)) drawDesertObstacle(o);
  else if (["car", "bus", "rubble", "skyscraper", "police", "store"].includes(o.kind)) drawCityObstacle(o);
  else if (["reactor", "capsule", "console", "server", "tank"].includes(o.kind)) drawLabObstacle(o);
  else if (["sandbag", "barrier", "bunker"].includes(o.kind)) drawSandbagObstacle(o);
  else if (["crate", "fuel"].includes(o.kind)) drawCrateObstacle(o);
  else if (o.kind === "tower") drawTowerObstacle(o);
  else drawBuildingObstacle(o);

  if (o.breakTimer > 0) {
    const pct = clamp(o.breakTimer / 60, 0, 1);
    ctx.strokeStyle = "rgba(248,113,113,.90)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.x + o.w * .18, o.y + o.h * .20); ctx.lineTo(o.x + o.w * .48, o.y + o.h * .54); ctx.lineTo(o.x + o.w * .32, o.y + o.h * .82);
    ctx.moveTo(o.x + o.w * .67, o.y + o.h * .18); ctx.lineTo(o.x + o.w * .53, o.y + o.h * .50); ctx.lineTo(o.x + o.w * .80, o.y + o.h * .78);
    ctx.stroke();
    ctx.fillStyle = "rgba(239,68,68,.22)";
    ctx.fillRect(o.x, o.y - 9, o.w * pct, 5);
  }
  ctx.restore();
}


function drawMapFeatureZones() {
  const zones = activeMapZones();
  zones.forEach(z => {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const active = isZoneActive(z);
    if (z.type === "supply") { ctx.fillStyle="rgba(34,197,94,.18)"; ctx.strokeStyle="rgba(134,239,172,.55)"; }
    else if (z.type === "shade") { ctx.fillStyle="rgba(15,23,42,.16)"; ctx.strokeStyle="rgba(253,230,138,.38)"; }
    else if (z.type === "fire") { ctx.fillStyle="rgba(248,113,113,.22)"; ctx.strokeStyle="rgba(251,146,60,.65)"; }
    else if (z.type === "smoke") { ctx.fillStyle="rgba(148,163,184,.18)"; ctx.strokeStyle="rgba(226,232,240,.32)"; }
    else if (z.type === "energy") { ctx.fillStyle="rgba(14,165,233,.18)"; ctx.strokeStyle="rgba(125,211,252,.60)"; }
    else if (z.type === "zap") { ctx.fillStyle=active ? "rgba(34,211,238,.24)" : "rgba(15,23,42,.12)"; ctx.strokeStyle=active ? "rgba(103,232,249,.82)" : "rgba(148,163,184,.28)"; }
    
    ctx.fillRect(z.x, z.y, z.w, z.h); 
    ctx.lineWidth=2.4; 
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    
    if (z.type === "fire") {
      ctx.fillStyle="#fb923c"; 
      for(let i=0;i<5;i++){ 
        ctx.fillRect(z.x+20+i*28, z.y+z.h*.55+Math.sin(Date.now()/160+i)*5, 12, 12); 
      }
    }
    if (z.type === "smoke") {
      ctx.fillStyle="rgba(226,232,240,.20)"; 
      for(let i=0;i<6;i++){ 
        ctx.fillRect(z.x+24+i*28, z.y+20+Math.sin(Date.now()/250+i)*10, 26, 26); 
      }
    }
    if (z.type === "zap" && active) {
      ctx.strokeStyle="#67e8f9"; ctx.lineWidth=2;
      for(let i=0;i<4;i++){ 
        ctx.beginPath(); ctx.moveTo(z.x+18+i*32,z.y+14); ctx.lineTo(z.x+34+i*32,z.y+z.h*.50); ctx.lineTo(z.x+22+i*32,z.y+z.h-12); ctx.stroke(); 
      }
    }
    ctx.fillStyle="rgba(255,255,255,.72)"; ctx.font="900 16px Roboto Mono"; ctx.textAlign="center"; ctx.fillText(z.label, z.x + z.w/2, z.y + z.h/2 + 6);
    ctx.restore();
  });
}

function drawMapStatusOverlay() {
  if (currentMapKey !== "desert" || !players.length || state !== "playing") return;
  ctx.save();
  const boxW = playerMode === 2 ? 380 : 230;
  const boxX = W / 2 - boxW / 2;
  const boxY = 148;
  ctx.fillStyle = "rgba(15,23,42,.68)";
  ctx.fillRect(boxX, boxY, boxW, 68);
  ctx.strokeStyle = "rgba(253,230,138,.35)"; ctx.lineWidth = 2; ctx.strokeRect(boxX, boxY, boxW, 68);
  ctx.fillStyle = "#fde68a"; ctx.font = "bold 18px 'Roboto Mono'"; ctx.textAlign = "center";
  ctx.fillText("SA MẠC: THANH KHÁT - ĐỨNG YÊN ĐỂ HỒI", W / 2, boxY + 18);
  players.forEach((p, idx) => {
    if (!p) return;
    const bw = playerMode === 2 ? 160 : 180;
    const x = boxX + 24 + idx * 190;
    const y = boxY + 34;
    ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(x, y, bw, 12);
    const pct = clamp((p.thirst ?? 100) / 100, 0, 1);
    ctx.fillStyle = pct <= .2 ? "#ef4444" : pct <= .45 ? "#f59e0b" : "#38bdf8";
    ctx.fillRect(x, y, bw * pct, 12);
    ctx.fillStyle = "#e5e7eb"; ctx.font = "bold 16px Roboto Mono"; ctx.textAlign = "left";
    ctx.fillText(p.name + ": " + Math.round(p.thirst ?? 100) + "%", x, y + 27);
  });
  ctx.restore();
}

function drawBackground() {
  // map themes
  const theme = mapConfigs[currentMapKey]?.theme || "base";
  const palettes = { base:["#24433c","#3f554d","#263c36","#62746b","#4e6059"], desert:["#6f5c35","#9b8050","#5a4729","#b99b62","#8d7449"], city:["#293241","#4b5563","#1f2937","#65717e","#4b5563"], lab:["#102f3a","#17485a","#0f2630","#355f70","#244653"] };
  const pal = palettes[theme] || palettes.base;
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, W, H);
  
  // draw 2D retro grid - thicker for pixel art style
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  drawAmbientDecorations(theme);

  // base yard
  ctx.save();
  const pad = 34;
  ctx.fillStyle = pal[3];
  ctx.fillRect(pad, pad, W - pad * 2, H - 88);
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, W - pad * 2, H - 88);
  ctx.restore();

  // border fence
  ctx.save();
  ctx.strokeStyle = "rgba(180, 205, 190, .20)";
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  for (let x = 20; x < W - 20; x += 26) {
    ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x + 10, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, H - 18); ctx.lineTo(x + 10, H - 18); ctx.stroke();
  }
  ctx.restore();

  // road
  ctx.fillStyle = "#6b7970";
  roundRect(205, 210, 570, 110, 16); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.20)";
  for (let x = 230; x < 745; x += 38) ctx.fillRect(x, 262, 18, 5);

  // second lane
  ctx.fillStyle = "rgba(89,102,94,.65)";
  roundRect(60, 388, W - 120, 34, 10); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.07)";
  for (let x = 82; x < W - 90; x += 42) ctx.fillRect(x, 402, 19, 3);

  // helipad
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(118, 210, 58, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(92, 186, 46, 50);
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.font = "900 40px Roboto Mono"; ctx.textAlign = "center";
  ctx.fillText("H", 115, 223);
  ctx.restore();

  // grass/tactical zones
  [
    {x: 690, y: 420, w: 165, h: 95},
    {x: 520, y: 295, w: 110, h: 55},
    {x: 1090, y: 200, w: 120, h: 70}
  ].forEach(g => {
    const grad = ctx.createLinearGradient(g.x, g.y, g.x + g.w, g.y + g.h);
    grad.addColorStop(0, "rgba(62, 128, 78, .42)");
    grad.addColorStop(1, "rgba(39, 101, 55, .34)");
    ctx.fillStyle = grad;
    roundRect(g.x, g.y, g.w, g.h, 8); ctx.fill();
  });

  // tents
  ctx.fillStyle = "rgba(126, 170, 130, .62)";
  ctx.beginPath(); ctx.moveTo(650, 140); ctx.lineTo(725, 82); ctx.lineTo(780, 140); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(620, 174); ctx.lineTo(682, 116); ctx.lineTo(728, 174); ctx.closePath(); ctx.fill();

  // lights
  for (const p of [{x:98,y:482},{x:843,y:498},{x:584,y:336},{x:1164,y:352}]) {
    ctx.save();
    ctx.shadowColor = "rgba(250,204,21,.65)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#fde047";
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawMapFeatureZones();
  obstacles.forEach(drawObstacle);
}

function drawWeaponArt(ctx, key) {
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const OL = "#111"; const G1 = "#444"; const G2 = "#222"; const W1 = "#8b5a2b"; const W2 = "#654321";
  if (key === "pistol") {
    px(-1,-1,5,4,OL); px(0,0,3,2,G1); px(-1,1,2,3,OL); px(0,2,1,1,G2);
  } else if (key === "dual") {
    px(-1,-1,5,4,OL); px(0,0,3,2,G1); px(-1,1,2,3,OL); px(0,2,1,1,G2);
    px(2,2,5,4,OL); px(3,3,3,2,G1); px(2,4,2,3,OL); px(3,5,1,1,G2);
  } else if (key === "smg") {
    px(-2,-1,8,5,OL); px(-1,0,6,3,G2); px(1,0,5,2,G1); px(6,0,3,2,OL); 
    px(-1,1,2,4,OL); px(0,2,1,2,G2); px(3,1,2,4,OL); px(4,2,1,2,G2);
    px(-4,0,3,3,OL); px(-3,1,2,1,G1);
  } else if (key === "rifle") {
    px(-4,-1,14,5,OL); px(-3,0,12,3,G1); px(1,0,8,2,G2); 
    px(-1,1,2,4,OL); px(0,2,1,2,W2); px(2,2,4,3,OL); px(3,3,2,1,G1);
    px(-5,0,3,3,OL); px(-4,1,3,1,W1);
  } else if (key === "shotgun") {
    px(-5,-1,16,4,OL); px(-4,0,14,2,G2); 
    px(-1,1,2,3,OL); px(0,2,1,1,W2); px(3,1,5,3,OL); px(4,2,3,1,W1);
    px(-6,0,4,3,OL); px(-5,1,4,1,W1);
  } else if (key === "sniper") {
    px(-6,-1,24,4,OL); px(-5,0,22,2,G2);
    px(2,-3,6,3,OL); px(3,-2,4,1,"#60a5fa");
    px(-1,1,2,3,OL); px(0,2,1,1,G1);
    px(-7,0,5,4,OL); px(-6,1,4,2,"#4ade80");
  } else if (key === "laser") {
    px(-3,-2,16,6,OL); px(-2,-1,14,4,"#1e3a8a"); px(2,0,8,2,"#38bdf8");
    px(-1,1,3,4,OL); px(0,2,1,2,G2); px(-4,0,3,4,OL); px(-3,1,2,2,G1);
  } else if (key === "flame") {
    px(-4,-2,14,6,OL); px(-3,-1,12,4,G2); px(-1,1,2,3,OL); px(0,2,1,1,G1);
    px(4,2,4,3,OL); px(5,3,2,1,"#ef4444"); px(10,0,3,2,OL); px(11,0,2,2,"#fb923c");
    px(-5,0,3,4,OL); px(-4,1,2,2,G1);
  } else if (key === "icegun") {
    px(-3,-2,16,6,OL); px(-2,-1,14,4,"#0284c7"); px(2,0,8,2,"#bae6fd");
    px(-1,1,2,4,OL); px(0,2,1,2,G2); px(9,-1,4,4,OL); px(10,0,2,2,"#7dd3fc");
  } else if (key === "lightning") {
    px(-3,-2,14,6,OL); px(-2,-1,12,4,G2); px(2,-1,2,4,"#fde047"); px(6,-1,2,4,"#fde047");
    px(-1,1,2,4,OL); px(0,2,1,2,G2); px(11,-1,3,4,OL); px(12,0,2,2,"#c4b5fd");
  } else if (key === "grenade") {
    px(-3,-2,12,7,OL); px(-2,-1,10,5,"#166534"); px(-1,1,2,4,OL); px(0,2,1,2,G2);
    px(4,2,4,4,OL); px(5,3,2,2,"#4ade80");
  } else if (key === "rocket") {
    px(-6,-3,20,8,OL); px(-5,-2,18,6,"#14532d"); px(-1,1,2,4,OL); px(0,2,1,2,G2);
    px(14,-2,4,6,OL); px(15,-1,2,4,"#ef4444"); px(-7,-1,3,4,OL); px(-6,0,2,2,G2);
  } else if (key === "minigun") {
    px(-3,-2,18,7,OL); px(-2,-1,16,5,G2); px(2,0,14,1,G1); px(2,2,14,1,G1);
    px(-1,1,3,4,OL); px(0,2,1,2,G1); px(4,3,2,5,OL); px(4,4,2,3,"#fbbf24");
    px(6,-3,4,3,OL); px(7,-2,2,1,G1);
  } else {
    px(-1,-1,5,4,OL); px(0,0,3,2,G1); px(-1,1,2,3,OL); px(0,2,1,1,G2);
  }
}

function drawBombArt(ctx, type) {
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const OL = "#111";
  if (type === "frag") {
    px(-3,-4,6,8,OL); px(-2,-3,4,6,"#166534");
    px(-1,-5,2,2,OL); px(2,-4,2,2,"#94a3b8");
    px(-2,-1,4,1,"#14532d"); px(-2,1,4,1,"#14532d");
  } else if (type === "fire") {
    px(-4,-4,8,8,OL); px(-3,-3,6,6,"#7c2d12");
    px(-1,-6,2,3,"#d97706"); px(0,-7,2,2,"#ef4444");
    px(-2,1,4,2,"#f97316"); px(-1,2,2,1,"#fde047");
  } else if (type === "ice") {
    px(-4,-3,8,6,OL); px(-3,-2,6,4,"#0ea5e9");
    px(-2,-5,4,2,OL); px(-1,-4,2,2,"#bae6fd");
    px(-5,-1,2,2,OL); px(-6,0,2,2,"#e0f2fe");
    px(3,-1,2,2,OL); px(4,0,2,2,"#e0f2fe");
    px(-2,3,4,2,OL); px(-1,2,2,2,"#e0f2fe");
  } else if (type === "shock") {
    px(-5,-3,10,6,OL); px(-4,-2,8,4,"#1e3a8a");
    px(-3,-3,2,6,"#eab308"); px(1,-3,2,6,"#eab308");
    px(-6,-4,2,2,"#a8a29e"); px(4,-4,2,2,"#a8a29e");
    px(-1,-1,2,2,"#fde047");
  } else if (type === "blackhole") {
    px(-4,-4,8,8,OL); px(-3,-3,6,6,"#3b0764");
    px(-2,-2,4,4,"#111827");
    px(-5,0,2,2,"#7e22ce"); px(3,-2,2,2,"#7e22ce");
    px(-1,-5,2,2,"#7e22ce"); px(0,3,2,2,"#7e22ce");
  } else if (type === "mine") {
    px(-5,-2,10,4,OL); px(-4,-1,8,2,"#475569");
    px(-2,-4,4,3,OL); px(-1,-3,2,2,"#ef4444");
    px(-6,-1,2,2,"#94a3b8"); px(4,-1,2,2,"#94a3b8");
  }
}

function drawPlayer(p) {
  ctx.save();
  ctx.globalAlpha = p.alive ? 1 : .45;
  ctx.imageSmoothingEnabled = false;

  // Determine facing direction
  const ax = Math.abs(p.lastDir.x), ay = Math.abs(p.lastDir.y);
  let facing = "right";
  if (ax >= ay) facing = p.lastDir.x < 0 ? "left" : "right";
  else facing = p.lastDir.y < 0 ? "up" : "down";

  // Pixel size for sprite
  const S = 1.5;
  // Center offset - character drawn relative to p.x, p.y (center of body)
  const cx = p.x, cy = p.y;

  // Helper: draw pixel block (col, row relative to center in sprite pixels)
  function px(col, row, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cx + col * S, cy + row * S, w * S, h * S);
  }

  // === COLORS ===
  const OL = "#111111";              // thick black outline
  const robeMain = p.id === 2 ? "#ef4444" : (p.accent || "#38bdf8");  // bright blue or red robe
  const robeDark = p.id === 2 ? "#b91c1c" : "#1d8abf";         // darker shade
  const robeLight = p.id === 2 ? "#fca5a5" : "#63ccff";        // lighter highlight
  const monitorOuter = "#c8d4dc";     // monitor frame - light gray
  const monitorInner = "#e8ece8";     // screen - off-white/light green
  const monitorTop = "#d8e0e4";       // top of monitor
  const eyeCol = "#222";              // pixel eyes
  const mouthCol = "#333";            // mouth
  const skinCol = "#f0d0a0";          // skin (hands)
  const shoeCol = "#222";             // dark shoes
  const gunMetal = "#444";            // gun barrel
  const gunDark = "#222";             // gun dark

  // === DROP SHADOW ===
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(cx - 10 * S, cy + 18 * S, 20 * S, 3 * S);

  if (p.isMecha) {
    // Draw huge mecha instead of normal player
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(cx - 24, cy + 30, 48, 8); // huge shadow
    const M_S = 2.5; // Bigger pixels
    function mpx(col, row, w, h, color) { ctx.fillStyle = color; ctx.fillRect(cx + col*M_S, cy + row*M_S, w*M_S, h*M_S); }
    mpx(-12, -12, 24, 20, "#0f172a"); // body outline
    mpx(-11, -11, 22, 18, "#475569"); // body fill
    mpx(-8, -8, 16, 6, "#020617"); // visor
    mpx(-6, -6, 4, 2, "#ef4444"); // glowing eye left
    mpx(2, -6, 4, 2, "#ef4444"); // glowing eye right
    mpx(-16, -4, 6, 18, "#1e293b"); // left arm
    mpx(10, -4, 6, 18, "#1e293b"); // right arm
    mpx(-10, 8, 8, 14, "#334155"); // left leg
    mpx(2, 8, 8, 14, "#334155"); // right leg
    mpx(-14, -14, 6, 10, "#111827"); // rocket launcher left
    mpx(8, -14, 6, 10, "#111827"); // rocket launcher right
    // minigun barrels
    ctx.fillStyle="#000"; ctx.fillRect(cx-16*M_S, cy+14*M_S, 6*M_S, 8*M_S);
    ctx.fillRect(cx+10*M_S, cy+14*M_S, 6*M_S, 8*M_S);
    ctx.restore();
    return;
  }

  // === ACCENT GLOW ===
  const pulse = 1 + Math.sin(Date.now() / 200 + p.id) * 0.04;
  ctx.globalAlpha = (p.alive ? 1 : .45) * 0.12;
  ctx.fillStyle = p.accent || "#38bdf8";
  ctx.fillRect(cx - 14 * S * pulse, cy - 18 * S * pulse, 28 * S * pulse, 38 * S * pulse);
  ctx.globalAlpha = p.alive ? 1 : .45;

  // ===== DRAW CHARACTER BY DIRECTION =====

  if (facing === "right") {
    // -- SHOES --
    px(-6, 15, 5, 3, OL);       // left shoe outline
    px(-5, 16, 3, 2, shoeCol);  // left shoe fill
    px(2, 15, 5, 3, OL);        // right shoe outline
    px(3, 16, 3, 2, shoeCol);   // right shoe fill

    // -- ROBE BODY -- (wide rectangle with slight trapezoid feel)
    px(-8, -1, 17, 17, OL);         // body outline
    px(-7, 0, 15, 15, robeMain);    // body fill
    // shading
    px(-7, 0, 3, 15, robeDark);     // left shadow
    px(5, 0, 3, 15, robeLight);     // right highlight
    // bottom hem
    px(-7, 13, 15, 2, robeDark);
    // collar
    px(-4, 0, 9, 2, monitorOuter);

    // -- RIGHT ARM & WEAPON --
    px(9, 3, 7, 3, OL);            // arm outline
    px(10, 4, 5, 1, skinCol);      // arm skin
    ctx.save(); ctx.translate(cx + 14 * S, cy + 3 * S); ctx.scale(S, S); drawWeaponArt(ctx, p.weapon); ctx.restore();

    // -- MONITOR HEAD --
    px(-7, -16, 15, 15, OL);           // head outline
    px(-6, -15, 13, 13, monitorOuter); // monitor frame
    px(-5, -14, 11, 11, monitorInner); // screen
    // antenna
    px(-1, -18, 3, 2, OL);
    px(0, -17, 1, 1, monitorOuter);
    // screen face
    px(-3, -12, 2, 2, eyeCol);     // left eye
    px(3, -12, 2, 2, eyeCol);      // right eye
    px(-1, -8, 4, 1, mouthCol);    // mouth line
    // monitor stand/neck
    px(-2, -1, 5, 2, OL);
    px(-1, 0, 3, 1, monitorOuter);

  } else if (facing === "left") {
    // -- SHOES --
    px(-6, 15, 5, 3, OL);
    px(-5, 16, 3, 2, shoeCol);
    px(2, 15, 5, 3, OL);
    px(3, 16, 3, 2, shoeCol);

    // -- ROBE BODY --
    px(-8, -1, 17, 17, OL);
    px(-7, 0, 15, 15, robeMain);
    px(5, 0, 3, 15, robeDark);    // right shadow (mirrored)
    px(-7, 0, 3, 15, robeLight);  // left highlight
    px(-7, 13, 15, 2, robeDark);
    px(-4, 0, 9, 2, monitorOuter);

    // -- LEFT ARM & WEAPON --
    px(-15, 3, 7, 3, OL);           // arm outline
    px(-14, 4, 5, 1, skinCol);      // arm skin
    ctx.save(); ctx.translate(cx - 14 * S, cy + 3 * S); ctx.scale(-S, S); drawWeaponArt(ctx, p.weapon); ctx.restore();

    // -- MONITOR HEAD --
    px(-7, -16, 15, 15, OL);
    px(-6, -15, 13, 13, monitorOuter);
    px(-5, -14, 11, 11, monitorInner);
    px(-1, -18, 3, 2, OL);
    px(0, -17, 1, 1, monitorOuter);
    px(-3, -12, 2, 2, eyeCol);
    px(3, -12, 2, 2, eyeCol);
    px(-1, -8, 4, 1, mouthCol);
    px(-2, -1, 5, 2, OL);
    px(-1, 0, 3, 1, monitorOuter);

  } else if (facing === "down") {
    // -- SHOES --
    px(-6, 15, 5, 3, OL);
    px(-5, 16, 3, 2, shoeCol);
    px(2, 15, 5, 3, OL);
    px(3, 16, 3, 2, shoeCol);

    // -- ROBE BODY --
    px(-8, -1, 17, 17, OL);
    px(-7, 0, 15, 15, robeMain);
    px(-7, 0, 2, 15, robeDark);
    px(6, 0, 2, 15, robeDark);
    px(-7, 13, 15, 2, robeDark);
    px(-4, 0, 9, 2, monitorOuter);

    // -- LEFT ARM & WEAPON --
    px(-13, 4, 5, 3, OL);        // arm
    px(-12, 5, 3, 1, skinCol);
    ctx.save(); ctx.translate(cx - 12 * S, cy + 8 * S); ctx.rotate(Math.PI/2); ctx.scale(S, S); drawWeaponArt(ctx, p.weapon); ctx.restore();

    // -- MONITOR HEAD --
    px(-7, -16, 15, 15, OL);
    px(-6, -15, 13, 13, monitorOuter);
    px(-5, -14, 11, 11, monitorInner);
    px(-1, -18, 3, 2, OL);
    px(0, -17, 1, 1, monitorOuter);
    px(-3, -12, 2, 2, eyeCol);
    px(3, -12, 2, 2, eyeCol);
    px(-1, -8, 4, 1, mouthCol);
    px(-2, -1, 5, 2, OL);
    px(-1, 0, 3, 1, monitorOuter);

  } else { // up
    // -- SHOES --
    px(-6, 15, 5, 3, OL);
    px(-5, 16, 3, 2, shoeCol);
    px(2, 15, 5, 3, OL);
    px(3, 16, 3, 2, shoeCol);

    // -- ROBE BODY --
    px(-8, -1, 17, 17, OL);
    px(-7, 0, 15, 15, robeMain);
    px(-7, 0, 2, 15, robeDark);
    px(6, 0, 2, 15, robeDark);
    px(-7, 13, 15, 2, robeDark);
    px(-4, 0, 9, 2, monitorOuter);

    // -- RIGHT ARM & WEAPON --
    px(8, -4, 3, 6, OL);          // arm going up
    px(9, -3, 1, 4, skinCol);
    ctx.save(); ctx.translate(cx + 8 * S, cy - 10 * S); ctx.rotate(-Math.PI/2); ctx.scale(S, S); drawWeaponArt(ctx, p.weapon); ctx.restore();

    // -- MONITOR HEAD --
    px(-7, -16, 15, 15, OL);
    px(-6, -15, 13, 13, monitorOuter);
    px(-5, -14, 11, 11, monitorInner);
    px(-1, -18, 3, 2, OL);
    px(0, -17, 1, 1, monitorOuter);
    // back of head - no face visible when facing up
    px(-4, -13, 9, 9, monitorOuter);
    px(-2, -1, 5, 2, OL);
    px(-1, 0, 3, 1, monitorOuter);
  }

  // === MUZZLE FLASH ===
  const gunLen = p.r + 22;
  const muzzleX = cx + p.lastDir.x * gunLen;
  const muzzleY = cy + p.lastDir.y * gunLen;
  if (p.shootCooldown > 0 && p.shootCooldown < 5) {
    ctx.fillStyle = "#fde047";
    ctx.fillRect(muzzleX - 3 * S, muzzleY - 3 * S, 6 * S, 6 * S);
    ctx.fillStyle = "#fff";
    ctx.fillRect(muzzleX - 1.5 * S, muzzleY - 1.5 * S, 3 * S, 3 * S);
  }

  // === SHIELD / INVINCIBLE ===
  if (p.shieldTimer > 0 || p.invincibleTimer > 0) {
    ctx.strokeStyle = p.invincibleTimer > 0 ? "rgba(216,180,254,.95)" : "rgba(125,211,252,.90)";
    ctx.lineWidth = 3;
    const ss = 22 + Math.sin(Date.now() / 120) * 2;
    ctx.strokeRect(cx - ss, cy - ss - 8, ss * 2, ss * 2 + 8);
  }

  // === TEAM BUFF ===
  if (p.teamBuffTimer > 0) {
    ctx.strokeStyle = "rgba(251,113,133,.72)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cx - 46, cy - 46, 92, 92);
  }

  // === MAGNET ===
  if (p.magnetTimer > 0) {
    ctx.strokeStyle = "rgba(216,180,254,.58)";
    ctx.lineWidth = 2;
    const magS = 60 + Math.sin(Date.now() / 150) * 4;
    ctx.strokeRect(cx - magS, cy - magS, magS * 2, magS * 2);
  }

  // === NAME TAG ===
  ctx.fillStyle = "white";
  ctx.font = "900 11px Roboto Mono";
  ctx.textAlign = "center";
  ctx.fillText(p.name + " " + p.label, cx, cy - 20 * S);

  ctx.restore();
}


function drawZombie(z) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const S = 1.5 * (z.r / 14); // Scale based on radius. 14 is default normal zombie r
  const cx = z.x, cy = z.y;

  function px(col, row, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cx + col * S, cy + row * S, w * S, h * S);
  }

  // shadow
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(cx - 8 * S, cy + 15 * S, 16 * S, 3 * S);

  const bodyColor = z.freezeTimer > 0 ? "#8fd8f0" : z.color;
  const OL = "#111"; // outline
  const eyeCol = z.isBoss ? "#fecaca" : "#000";

  // Base zombie drawing function
  function drawPixelZombie(headR_S, bodyW_S, bodyH_S, color) {
    // Shoes
    px(-5, bodyH_S + 2, 4, 3, OL);
    px(-4, bodyH_S + 3, 2, 2, "#222");
    px(1, bodyH_S + 2, 4, 3, OL);
    px(2, bodyH_S + 3, 2, 2, "#222");

    // Body
    px(-bodyW_S/2 - 1, 0, bodyW_S + 2, bodyH_S + 2, OL);
    px(-bodyW_S/2, 1, bodyW_S, bodyH_S, color);
    px(-bodyW_S/2, 1, 2, bodyH_S, "rgba(0,0,0,0.2)"); // shadow
    
    // Head
    px(-headR_S/2 - 1, -headR_S - 2, headR_S + 2, headR_S + 2, OL);
    px(-headR_S/2, -headR_S - 1, headR_S, headR_S, color);
    
    // Eyes
    px(-headR_S/2 + 2, -headR_S + 3, 2, 2, eyeCol);
    px(headR_S/2 - 4, -headR_S + 3, 2, 2, eyeCol);
    // Mouth
    px(-2, -headR_S + 7, 4, 1, "#222");
  }

  if (z.isBoss) {
    // Boss
    ctx.globalAlpha = 1;
    drawPixelZombie(24, 28, 22, bodyColor);
    
    // Star on chest
    px(-4, 6, 8, 8, "#ff7f2a");
    px(-2, 8, 4, 4, "#f18c22");
    
    // Side hands
    px(-20, 8, 6, 6, OL);
    px(-19, 9, 4, 4, bodyColor);
    px(14, 8, 6, 6, OL);
    px(15, 9, 4, 4, bodyColor);

  } else if (z.type === "ghost") {
    ctx.globalAlpha = z.phaseTimer > 0 ? .45 : .88;
    const w = 16, h = 20;
    
    // Ghost body
    px(-w/2 - 1, -h/2 - 1, w + 2, h + 2, OL);
    px(-w/2, -h/2, w, h, bodyColor);
    px(-w/2, -h/2, 2, h, "rgba(0,0,0,0.2)");
    
    // Ghost tail
    px(-w/2, h/2, 4, 4, OL); px(-w/2 + 1, h/2, 2, 3, bodyColor);
    px(-2, h/2 + 2, 4, 4, OL); px(-1, h/2 + 2, 2, 3, bodyColor);
    px(w/2 - 4, h/2, 4, 4, OL); px(w/2 - 3, h/2, 2, 3, bodyColor);

    // Eyes
    px(-4, -4, 2, 3, eyeCol);
    px(2, -4, 2, 3, eyeCol);
    
    if (z.phaseTimer > 0) {
      ctx.strokeStyle = "rgba(186,230,253,.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w*S, cy - h*S, w*2*S, h*2*S);
    }
  } else if (z.type === "armored") {
    ctx.globalAlpha = 1;
    const bodyC = z.reviveTimer > 0 ? "#dbeafe" : bodyColor;
    drawPixelZombie(14, 16, 14, bodyC);
    
    // Armor Frame
    px(-10, -18, 20, 36, "rgba(148, 163, 184, 0.4)");
    ctx.strokeStyle = z.lives > 1 ? "#94a3b8" : "#ef4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 10*S, cy - 18*S, 20*S, 36*S);
    
    ctx.fillStyle = "#111827";
    ctx.font = "bold " + Math.floor(10*S) + "px Roboto Mono";
    ctx.textAlign = "center";
    ctx.fillText((z.lives || 1) + "M", cx, cy - 20*S);

    if (z.reviveTimer > 0) {
      const pct = clamp(1 - z.reviveTimer / 180, 0, 1);
      px(-8, -22, 16, 3, "rgba(15,23,42,.28)");
      px(-8, -22, 16 * pct, 3, "#38bdf8");
    }

  } else {
    ctx.globalAlpha = 1;
    drawPixelZombie(12, 14, 12, bodyColor);

    if (z.type === "archer") {
      // bow
      px(8, 2, 2, 10, "#8b5a2b");
      px(10, 3, 1, 8, "#000"); // string
      // arrow
      px(2, 6, 8, 1, "#000");
    }

    if (z.type === "flyer") {
      // wings
      px(-14, 2, 6, 4, OL); px(-13, 3, 4, 2, "#fff");
      px(8, 2, 6, 4, OL); px(9, 3, 4, 2, "#fff");
    }

    if (z.type === "bomb") {
      // bomb on belly
      px(-4, 4, 8, 8, "#000");
      px(-1, 5, 2, 2, "#ef4444"); // spark
      px(0, 2, 1, 2, "#e11d48"); // fuse
    }

    if (z.treasure) {
      px(-3, 2, 6, 8, "#fde68a");
      ctx.fillStyle = "#78350f";
      ctx.font = "bold " + Math.floor(8*S) + "px Arial";
      ctx.textAlign = "center";
      ctx.fillText("$", cx, cy + 9*S);
    }

    if (z.elite) {
      ctx.strokeStyle = "#f472b6";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 10*S, cy - 18*S, 20*S, 36*S);
    }

    if (z.type === "jumper") {
      // springs
      px(-5, 14, 4, 4, "#999");
      px(-6, 15, 6, 2, "#555");
      px(1, 14, 4, 4, "#999");
      px(0, 15, 6, 2, "#555");
    }
  }

  // hp bar
  ctx.restore();
  const bw = z.isBoss ? z.r * 2.8 : z.r * 2.1;
  const hp = clamp(z.hp / z.maxHp, 0, 1);
  ctx.fillStyle = "rgba(0,0,0,.38)";
  ctx.fillRect(z.x - bw/2, z.y - z.r - 18, bw, 6);
  ctx.fillStyle = z.isBoss ? "#fecaca" : (z.type === "ghost" ? "#bae6fd" : "#bbf7d0");
  ctx.fillRect(z.x - bw/2, z.y - z.r - 18, bw * hp, 6);
  if (z.type === "armored") {
    ctx.fillStyle = "#f8fafc";
    ctx.font = "900 12px Roboto Mono";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,.8)";
    ctx.shadowBlur = 6;
    ctx.fillText("❤".repeat(Math.max(1, z.lives || 1)), z.x, z.y - z.r - 24);
  }
  if (z.type === "ghost" && z.phaseTimer > 0) {
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "900 11px Roboto Mono";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,.8)";
    ctx.shadowBlur = 6;
    ctx.fillText("NÉ ĐẠN", z.x, z.y - z.r - 25);
  }
}

function drawProjectiles() {
  bullets.forEach(b => {
    ctx.save();
    const angle = Math.atan2(b.vy, b.vx);
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.shadowColor = b.color;
    ctx.shadowBlur = (b.weapon === "rocket" || b.weapon === "laser" || b.weapon === "lightning") ? 20 : 12;

    if (b.weapon === "laser") {
      ctx.strokeStyle = "#67e8f9"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(6, 0); ctx.stroke();
    } else if (b.weapon === "lightning") {
      ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-4, -2); ctx.lineTo(1, 2); ctx.lineTo(7, -1); ctx.stroke();
    } else if (b.weapon === "rocket") {
      ctx.fillStyle = "#e2e8f0"; roundRect(-8, -3.5, 13, 7, 3); ctx.fill();
      ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.moveTo(5,0); ctx.lineTo(10,-4); ctx.lineTo(10,4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(251,146,60,.8)"; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-15,-3); ctx.lineTo(-15,3); ctx.closePath(); ctx.fill();
    } else if (b.weapon === "grenade") {
      ctx.fillStyle = "#94a3b8"; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-2,-6); ctx.lineTo(2,-8); ctx.stroke();
    } else if (b.weapon === "flame") {
      ctx.fillStyle = "#fb923c"; ctx.beginPath(); ctx.ellipse(0,0,7,3.6,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fde68a"; ctx.beginPath(); ctx.ellipse(2,0,3.4,1.8,0,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = b.weapon === "icegun" ? "#7dd3fc" : b.color;
      ctx.beginPath(); ctx.arc(0,0,b.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(-1.5,-1.5,Math.max(1.2,b.r*.35),0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  });

  enemyBullets.forEach(b => {
    ctx.save();
    ctx.shadowColor = b.color; ctx.shadowBlur = 12;
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.moveTo(b.x-4,b.y); ctx.lineTo(b.x+4,b.y); ctx.stroke();
    ctx.restore();
  });

  bombs.forEach(b => {
    ctx.save();
    const pulse = Math.sin(b.pulse) * 1.8;
    ctx.translate(b.x, b.y);
    ctx.shadowColor = b.color; ctx.shadowBlur = 18;
    ctx.rotate(Date.now() / 150);
    ctx.scale(1.8 + pulse/10, 1.8 + pulse/10);
    drawBombArt(ctx, b.type);
    ctx.restore();
  });

  mines.forEach(m => {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.shadowColor = m.color; ctx.shadowBlur = 12;
    if (m.armed <= 0 && Math.sin(Date.now() / 100) > 0) ctx.shadowColor = "#ef4444";
    ctx.scale(2, 2);
    drawBombArt(ctx, "mine");
    ctx.restore();
  });

  blackHoles.forEach(h => {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.shadowColor = h.color; ctx.shadowBlur = 28;
    ctx.strokeStyle = h.color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0,0,h.r * .34 + Math.sin(Date.now()/110)*5,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,h.r * .18 + Math.sin(Date.now()/140)*3,0,Math.PI*2); ctx.stroke();
    ctx.rotate(-Date.now() / 100);
    ctx.scale(2.5, 2.5);
    drawBombArt(ctx, "blackhole");
    ctx.restore();
  });
}

function drawSupport() {
  turrets.forEach(t => {
    ctx.save(); ctx.shadowColor = t.color; ctx.shadowBlur = 16;
    ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(t.x,t.y,t.r+4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(t.x,t.y,t.r,0,Math.PI*2); ctx.fill();
    const z = nearestZombie(t, 330);
    if (z) { const d = norm(z.x-t.x,z.y-t.y); ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(t.x,t.y); ctx.lineTo(t.x+d.x*22,t.y+d.y*22); ctx.stroke(); }
    ctx.restore();
  });

  drones.forEach(d => {
    ctx.save(); ctx.shadowColor = d.color; ctx.shadowBlur = 12; ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(d.x+2,d.y-1,2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });

  drawPets();
}

function drawItems() {
  coins.forEach(c => {
    ctx.save(); ctx.shadowColor = "#facc15"; ctx.shadowBlur = 10; ctx.fillStyle = "#facc15";
    ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#78350f"; ctx.font = "bold 8px Roboto Mono"; ctx.textAlign = "center"; ctx.fillText("$", c.x, c.y+3);
    ctx.restore();
  });

  pickups.forEach(item => {
    ctx.save(); const pulse = Math.sin(item.pulse)*2;
    ctx.shadowColor = item.color; ctx.shadowBlur = 18; ctx.fillStyle = item.color;
    ctx.beginPath(); ctx.arc(item.x,item.y,item.r+pulse,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#07111f"; ctx.font = item.type === "damage" ? "bold 10px Roboto Mono" : "bold 12px Roboto Mono"; ctx.textAlign = "center";
    const icon = item.type === "heal" ? "+" : item.type === "shield" ? "S" : item.type === "speed" ? ">" : item.type === "magnet" ? "M" : item.type === "damage" ? "x2" : item.type === "ammo" ? "A" : "E";
    ctx.fillText(icon, item.x, item.y+4); ctx.restore();
  });

  chests.forEach(ch => {
    ctx.save(); const pulse = Math.sin(ch.pulse)*2;
    ctx.shadowColor = "#facc15"; ctx.shadowBlur = 18; ctx.fillStyle = "#f59e0b";
    roundRect(ch.x-16-pulse,ch.y-12-pulse,32+pulse*2,24+pulse*2,6); ctx.fill();
    ctx.fillStyle = "#fde68a"; ctx.fillRect(ch.x-16,ch.y-2,32,4);
    ctx.restore();
  });
}

function drawParticlesTexts() {
  shockwaves.forEach(s => {
    ctx.save();
    ctx.globalAlpha = clamp(s.life / s.maxLife, 0, 1) * .9;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  });
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = clamp(p.life / 45, 0, 1);
    ctx.fillStyle = p.color;
    if (p.r > 2.2) {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.restore();
  });
  texts.forEach(t => {
    ctx.save(); ctx.globalAlpha = clamp(t.life / 45, 0, 1);
    ctx.fillStyle = "#fff"; ctx.font = "900 " + t.size + "px Arial"; ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 10; ctx.fillText(t.text,t.x,t.y);
    ctx.restore();
  });
}

function drawMiniMap() {
  const x = W - 122, y = H - 92, w = 102, h = 72;
  ctx.save();
  ctx.fillStyle = "rgba(3,8,18,.64)"; ctx.strokeStyle = "rgba(255,255,255,.14)";
  roundRect(x,y,w,h,10); ctx.fill(); ctx.stroke();
  players.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x+p.x/W*w, y+p.y/H*h, 3.5,0,Math.PI*2); ctx.fill(); });
  zombies.slice(0,70).forEach(z => { ctx.fillStyle = z.treasure ? "#facc15" : z.elite ? "#f472b6" : z.isBoss ? "#ef4444" : "#22c55e"; ctx.fillRect(x+z.x/W*w-1, y+z.y/H*h-1, z.treasure ? 3 : 2, z.treasure ? 3 : 2); });
  ctx.restore();
}

function drawEnvironment() {
  if (state !== "playing") return;
  ctx.save();
  if (weatherParticles.length > 0) {
    if (weatherType === "rain") {
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
      ctx.beginPath();
      weatherParticles.forEach(p => { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*1.5, p.y - p.vy*1.5); });
      ctx.stroke();
    } else if (weatherType === "snow") {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      weatherParticles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill(); });
    } else if (weatherType === "sandstorm") {
      ctx.fillStyle = "rgba(214,182,111,0.3)";
      weatherParticles.forEach(p => { ctx.fillRect(p.x, p.y, p.s*3, p.s); });
      ctx.fillStyle = "rgba(214,182,111,0.15)"; ctx.fillRect(0,0,W,H);
    }
  }

  let darkness = timeOfDay < 1 ? timeOfDay * 0.85 : (2 - timeOfDay) * 0.85;
  if (darkness > 0.05) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(5, 5, 15, ${darkness})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "destination-out";
    
    players.forEach(p => {
      if (!p.alive) return;
      const r = 180 + (p.isMecha ? 100 : 0);
      let g = ctx.createRadialGradient(p.x, p.y, r*0.2, p.x, p.y, r);
      g.addColorStop(0, `rgba(255,255,255, ${darkness})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.fill();
    });
    
    activeMapZones().forEach(z => {
      if (z.type === "fire" || z.type === "zap") {
        const cx = z.x + z.w/2, cy = z.y + z.h/2;
        let g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 150);
        g.addColorStop(0, `rgba(255,255,255, ${darkness})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, 150, 0, Math.PI*2); ctx.fill();
      }
    });
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}

function draw() {
  drawBackground();
  drawItems();
  drawSupport();
  drawProjectiles();
  zombies.forEach(drawZombie);
  players.forEach(drawPlayer);
  drawEnvironment();
  drawParticlesTexts();
  drawMiniMap();
  drawBossMiniGame();
  drawMapStatusOverlay();
  drawScreenVignette();

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.font = "14px 'Roboto Mono'";
  ctx.textAlign = "left";
  const p1 = players[0], p2 = players[1];
  ctx.fillText("P1 điểm: " + (p1 ? p1.score : 0), 18, H - 38);
  if (playerMode === 2) ctx.fillText("P2 điểm: " + (p2 ? p2.score : 0), 18, H - 18);
  else ctx.fillText("Chế độ: 1 người", 18, H - 18);
  const activeBuffs = [];
  players.forEach(p => {
    if (!p || !p.alive) return;
    if (p.damageBoostTimer > 0) activeBuffs.push(p.name + " x2");
    if (p.secondWind) activeBuffs.push(p.name + " Second Wind");
  });
  if (activeBuffs.length) {
    ctx.fillStyle = "rgba(15,23,42,.62)";
    roundRect(16, 104, Math.min(390, 120 + activeBuffs.join(" | ").length * 7), 28, 10); ctx.fill();
    ctx.fillStyle = "#fef3c7";
    ctx.font = "900 14px 'Roboto Mono'";
    ctx.textAlign = "left";
    ctx.fillText(activeBuffs.slice(0, 4).join(" | "), 28, 123);
  }

  if (feverTimer > 0) {
    ctx.textAlign = "center";
    ctx.font = "900 28px Roboto Mono";
    ctx.fillStyle = "rgba(253,224,71,.95)";
    ctx.fillText("FEVER MODE", W/2, 56);
  }
  if (eventType) {
    ctx.textAlign = "center";
    ctx.font = "bold 14px 'Roboto Mono'";
    ctx.fillStyle = "rgba(191,219,254,.9)";
    ctx.fillText("Sự kiện: " + eventType.toUpperCase(), W/2, 80);
  }
  if (shopOpen || paused) {
    ctx.fillStyle = "rgba(255,255,255,.86)";
    ctx.textAlign = "center";
    ctx.font = "bold 18px 'Roboto Mono'";
    ctx.fillText(paused ? "GAME TẠM DỪNG - NHẤN P ĐỂ CHƠI TIẾP" : "GAME TẠM DỪNG - CỬA HÀNG ĐANG MỞ", W/2, H - 24);
  }
  ctx.restore();
}

function updateAmmoHudForPlayer(p, textEl, fillEl) {
  if (!p) {
    textEl.textContent = "Đạn: -";
    fillEl.style.width = "0%";
    fillEl.className = "fill ammo-fill";
    return;
  }
  const def = getAmmoDef(p.weapon);
  if (p.reloadTimer > 0) {
    const progress = 1 - p.reloadTimer / def.reload;
    textEl.textContent = "Đạn: Reloading " + Math.round(progress * 100) + "%";
    fillEl.style.width = clamp(progress * 100, 0, 100) + "%";
    fillEl.className = "fill reload-fill";
  } else {
    textEl.textContent = "Đạn: " + p.ammo + "/" + def.mag;
    fillEl.style.width = clamp(p.ammo / def.mag * 100, 0, 100) + "%";
    fillEl.className = "fill ammo-fill";
  }
}

function drawHearts(container, hp, maxHp) {
  if (!container) return;
  const hpPerHeart = 10;
  const totalHearts = Math.ceil(maxHp / hpPerHeart);
  let html = '<div style="display:flex; flex-wrap:wrap; gap:2px; margin: 6px 0;">';
  for (let i = 0; i < totalHearts; i++) {
    const heartHp = Math.max(0, Math.min(hpPerHeart, hp - i * hpPerHeart));
    if (heartHp <= 0) {
      html += '<span style="font-size:16px; line-height:1; filter: grayscale(100%) brightness(40%);">❤️</span>';
    } else if (heartHp <= hpPerHeart / 2) {
      html += '<span style="font-size:16px; line-height:1; filter: sepia(100%) hue-rotate(320deg) saturate(300%);">💔</span>';
    } else {
      html += '<span style="font-size:16px; line-height:1;">❤️</span>';
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

function updateHud() {
  if (!players.length) return;
  const p1 = players[0], p2 = players[1];
  el.p1Name.textContent = "Player 1 - " + p1.label;
  el.p1Info.textContent = weapons[p1.weapon].name + " | Coin: " + p1.coins + " | Skill: " + characters[p1.charKey].skill;
  el.p1Bomb.textContent = "Bom: " + bombTypes[p1.bombType].name + " x" + p1.bombs[p1.bombType];
  updateAmmoHudForPlayer(p1, el.p1AmmoText, el.p1Ammo);
  drawHearts(el.p1Hp, p1.hp, p1.maxHp);
  el.p1Energy.style.width = clamp(p1.energy / p1.energyMax * 100, 0, 100) + "%";

  if (playerMode === 2 && p2) {
    el.p2HudCard.classList.remove("card-dim");
    el.p2Name.textContent = "Player 2 - " + p2.label;
    el.p2Info.textContent = weapons[p2.weapon].name + " | Coin: " + p2.coins + " | Skill: " + characters[p2.charKey].skill;
    el.p2Bomb.textContent = "Bom: " + bombTypes[p2.bombType].name + " x" + p2.bombs[p2.bombType];
    updateAmmoHudForPlayer(p2, el.p2AmmoText, el.p2Ammo);
    drawHearts(el.p2Hp, p2.hp, p2.maxHp);
    el.p2Energy.style.width = clamp(p2.energy / p2.energyMax * 100, 0, 100) + "%";
  } else {
    el.p2HudCard.classList.add("card-dim");
    el.p2Name.textContent = "Player 2 - TẮT";
    el.p2Info.textContent = "Chế độ 1 người";
    el.p2Bomb.textContent = "Bom: -";
    updateAmmoHudForPlayer(null, el.p2AmmoText, el.p2Ammo);
    drawHearts(el.p2Hp, 0, 100);
    el.p2Energy.style.width = "0%";
  }

  el.levelText.textContent = "Level " + level + "/40";
  const mul = Math.min(5, 1 + Math.floor(combo / 12));
  const treasureLive = zombies.some(z => z.treasure) ? " | 💰 Kho báu!" : "";
  const autoSkipText = autoSkipEnabled && level < 40 ? (" | ⏩ Skip: " + Math.max(0, Math.ceil((AUTO_SKIP_DELAY_FRAMES - levelAgeFrames) / 60)) + "s") : "";
  el.waveText.textContent = "Zombie: " + zombies.length + " | Combo: " + combo + " | Coin x" + mul + " | Map: " + currentMapRule().short + treasureLive + autoSkipText;
  const boss = zombies.find(z => z.isBoss);
  if (boss) { el.bossBar.classList.remove("hidden"); el.bossFill.style.width = clamp(boss.hp / boss.maxHp * 100, 0, 100) + "%"; }
  else el.bossBar.classList.add("hidden");
  el.shopMoney.textContent = playerMode === 2 && p2 ? ("$: " + Math.floor(dollarBalance) + " | P1 coin: " + p1.coins + " | P2 coin: " + p2.coins) : ("$: " + Math.floor(dollarBalance) + " | P1 coin: " + p1.coins + " | Chế độ 1 người");
  updateCharacterUI();
  updateMissionPanel();
}

function updateShop() {
  el.shopGrid.innerHTML = "";
  if (!players.length) {
    el.shopGrid.innerHTML = '<div class="shop-card"><h4>Shop súng, bom & pet</h4><p>Sau khi bắt đầu game, bạn sẽ kiếm coin để mua súng/bom. Nhân vật được mở khóa ở menu bằng $ vĩnh viễn.</p></div>';
    return;
  }

  const items = [];
  Object.keys(weapons).forEach(k => { if (k !== "pistol") items.push({ type:"weapon", key:k }); });
  Object.keys(bombTypes).forEach(k => items.push({ type:"bomb", key:k }));
  items.push(
    { type:"upgrade", key:"heal", name:"Bình hồi máu", price:700, desc:"Hồi ngay 45 máu.", action:p => heal(p,45) },
    { type:"upgrade", key:"maxhp", name:"Tăng máu tối đa", price:1700, desc:"Tăng máu tối đa thêm 20.", action:p => { p.maxHp += 20; heal(p,20); } },
    { type:"upgrade", key:"speed", name:"Tăng tốc vĩnh viễn", price:1600, desc:"Di chuyển nhanh hơn rõ rệt.", action:p => { p.speed += .45; addText("+SPEED", p.x, p.y-25, 18); } },
    { type:"upgrade", key:"shield", name:"Khiên bảo vệ", price:1300, desc:"Giảm sát thương trong 12 giây.", action:p => { p.shieldTimer = 60*12; addText("SHIELD", p.x, p.y-25, 18); } },
    { type:"upgrade", key:"drone", name:"Drone hỗ trợ", price:2600, desc:"Một drone đi theo và tự bắn.", action:p => createDrone(p) },
    { type:"upgrade", key:"turret", name:"Turret tự động", price:2300, desc:"Đặt trụ súng tự động.", action:p => createTurret(p, 60*18) },
    { type:"upgrade", key:"petwolf", name:"Pet Sói Máy", price:3400, desc:"Pet bắn hỗ trợ zombie gần nhất. Mua lại để nâng cấp.", action:p => createPet(p, "wolf") },
    { type:"upgrade", key:"petfairy", name:"Pet Tiên Hồi Máu", price:3200, desc:"Pet tự hồi máu định kỳ. Mua lại để nâng cấp.", action:p => createPet(p, "fairy") },
    { type:"upgrade", key:"petcat", name:"Pet Mèo Nam Châm", price:2800, desc:"Pet hút coin và tạo coin nhỏ định kỳ. Mua lại để nâng cấp.", action:p => createPet(p, "cat") },
    { type:"upgrade", key:"airdrop", name:"Gọi Airdrop", price:2600, desc:"Gọi ngay một rương hiếm xuống bản đồ.", action:p => { spawnAirdrop(); addText("AIRDROP!", p.x, p.y-25, 18); } },
    { type:"upgrade", key:"energy", name:"Nạp năng lượng", price:900, desc:"Nạp đầy thanh kỹ năng.", action:p => { p.energy = p.energyMax; addText("FULL ENERGY", p.x, p.y-25, 16); } },
    { type:"upgrade", key:"lucky", name:"Hộp may mắn", price:1800, desc:"Nhận ngẫu nhiên heal/khiên/x2 sát thương/đạn đầy/nam châm/năng lượng.", action:p => { const types=["heal","shield","damage","ammo","magnet","energy"]; applyPickup(p, types[Math.floor(Math.random()*types.length)]); } }
  );

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "shop-card";
    if (item.type === "weapon") {
      const w = weapons[item.key];
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 64; tempCanvas.height = 36;
      const tCtx = tempCanvas.getContext("2d");
      tCtx.imageSmoothingEnabled = false;
      tCtx.translate(32, 18); tCtx.scale(2.5, 2.5);
      drawWeaponArt(tCtx, item.key);
      const dataUrl = tempCanvas.toDataURL();
      card.innerHTML = `
        <div style="text-align:center; margin-bottom:8px; background:rgba(0,0,0,.2); border-radius:6px; padding:6px; border:2px solid rgba(253,230,138,.3);">
          <img src="${dataUrl}" style="image-rendering:pixelated; max-width:100%; height:auto; filter:drop-shadow(2px 2px 0px #000);" alt="${w.name}"/>
        </div>
        <h4>${w.name} - ${w.price} coin</h4>
        <p>${w.desc}</p>
        <div class="small">Damage: ${w.damage} | Tốc bắn: ${Math.max(1, 50 - w.cooldown)} | Đạn: ${w.bullets}</div>
        <div class="buy-row">
          <button class="mini-btn" data-type="weapon" data-key="${item.key}" data-player="1">P1 mua/chọn</button>
          <button class="mini-btn red" data-type="weapon" data-key="${item.key}" data-player="2">P2 mua/chọn</button>
        </div>`;
    } else if (item.type === "bomb") {
      const b = bombTypes[item.key];
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 64; tempCanvas.height = 36;
      const tCtx = tempCanvas.getContext("2d");
      tCtx.imageSmoothingEnabled = false;
      tCtx.translate(32, 18); tCtx.scale(3, 3);
      drawBombArt(tCtx, item.key);
      const dataUrl = tempCanvas.toDataURL();
      card.innerHTML = `
        <div style="text-align:center; margin-bottom:8px; background:rgba(0,0,0,.2); border-radius:6px; padding:6px; border:2px solid rgba(253,230,138,.3);">
          <img src="${dataUrl}" style="image-rendering:pixelated; max-width:100%; height:auto; filter:drop-shadow(2px 2px 0px #000);" alt="${b.name}"/>
        </div>
        <h4>${b.name} - ${b.price} coin / gói 3 quả</h4>
        <p>${b.desc}</p>
        <div class="small">Mua xong sẽ tự chọn loại bom này.</div>
        <div class="buy-row">
          <button class="mini-btn" data-type="bomb" data-key="${item.key}" data-player="1">P1 mua/chọn</button>
          <button class="mini-btn red" data-type="bomb" data-key="${item.key}" data-player="2">P2 mua/chọn</button>
        </div>`;
    } else {
      card.innerHTML = `
        <h4>${item.name} - ${item.price} coin</h4>
        <p>${item.desc}</p>
        <div class="buy-row">
          <button class="mini-btn" data-type="upgrade" data-key="${item.key}" data-player="1">P1 mua</button>
          <button class="mini-btn red" data-type="upgrade" data-key="${item.key}" data-player="2">P2 mua</button>
        </div>`;
    }
    el.shopGrid.appendChild(card);
  });

  el.shopGrid.querySelectorAll("button").forEach(b => {
    if (playerMode === 1 && b.dataset.player === "2") {
      b.style.display = "none";
      return;
    }
    b.addEventListener("click", () => {
      const p = players[Number(b.dataset.player) - 1];
      if (!p) return;
      if (b.dataset.type === "weapon") buyWeapon(p, b.dataset.key);
      if (b.dataset.type === "bomb") buyBomb(p, b.dataset.key);
      if (b.dataset.type === "upgrade") {
        const up = items.find(x => x.type === "upgrade" && x.key === b.dataset.key);
        if (p.coins < up.price) toast(p.name + " chưa đủ coin");
        else { p.coins -= up.price; up.action(p); toast(p.name + " đã mua " + up.name); }
      }
      updateHud(); updateShop();
    });
  });
}

function buyWeapon(p, key) {
  const w = weapons[key];
  if (p.owned.has(key)) {
    p.weapon = key;
    p.ammo = getAmmoDef(key).mag;
    p.reloadTimer = 0;
    toast(p.name + " đã chọn " + w.name);
    return;
  }
  if (p.coins < w.price) { toast(p.name + " chưa đủ coin"); return; }
  p.coins -= w.price;
  p.owned.add(key);
  toast(p.name + " đã mua " + w.name + " - súng đang cầm vẫn giữ nguyên");
}
function buyBomb(p, key) {
  const b = bombTypes[key];
  if (p.coins < b.price) {
    if (p.bombs[key] > 0) { p.bombType = key; toast(p.name + " đã chọn " + b.name); }
    else toast(p.name + " chưa đủ coin");
    return;
  }
  p.coins -= b.price; p.bombs[key] += 3; p.bombType = key;
  toast(p.name + " đã mua 3 " + b.name);
}

function toggleShop(force) {
  if (state === "menu" && !players.length) {
    el.shop.classList.toggle("hidden", force === false ? true : false);
    updateShop();
    return;
  }
  if (state !== "playing") return;
  shopOpen = typeof force === "boolean" ? force : !shopOpen;
  el.shop.classList.toggle("hidden", !shopOpen);
  if (shopOpen) updateShop();
}

function loop() {
  updateGame();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", e => {
  if (el.intro && !el.intro.classList.contains("hidden") && (e.code === "Enter" || e.code === "Space")) { closeIntro(); }
  if (resolveBossMiniGame(e.code)) return;
  keys[e.code] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyM") toggleShop();
  if (e.code === "Escape") returnToMenu();
  if (e.code === "KeyN") toggleAutoSkip();
  if (e.code === "KeyP" && state === "playing" && !shopOpen) { paused = !paused; toast(paused ? "Đã tạm dừng" : "Tiếp tục chơi"); }
  if (e.code === "KeyL" && players[0]) shoot(players[0]);
  if (e.code === "KeyF" && players[1]) shoot(players[1]);
  if (e.code === "KeyK" && players[0]) useSkill(players[0]);
  if (e.code === "KeyG" && players[1]) useSkill(players[1]);
  if (e.code === "KeyO" && players[0]) throwBomb(players[0]);
  if (e.code === "KeyR" && players[1]) throwBomb(players[1]);
});
window.addEventListener("keyup", e => { keys[e.code] = false; });

btn.start.addEventListener("click", () => {
  if (!loggedInUser) {
    toast("Vui lòng đăng nhập để bắt đầu!");
    if (btn.btnLoginModal) btn.btnLoginModal.click();
    return;
  }
  resetGame();
});
btn.continueIntro.addEventListener("click", closeIntro);
btn.mode1.addEventListener("click", () => setPlayerMode(1));
btn.mode2.addEventListener("click", () => setPlayerMode(2));
if (btn.autoSkip) btn.autoSkip.addEventListener("click", () => toggleAutoSkip());
if (btn.autoSkipSide) btn.autoSkipSide.addEventListener("click", () => toggleAutoSkip());
if (btn.returnMenu) btn.returnMenu.addEventListener("click", returnToMenu);
if (btn.buyP1Char) btn.buyP1Char.addEventListener("click", () => buySelectedCharacter(1));
if (btn.buyP2Char) btn.buyP2Char.addEventListener("click", () => buySelectedCharacter(2));
btn.restart.addEventListener("click", resetGame);
btn.openShop.addEventListener("click", () => toggleShop());
btn.openShopMenu.addEventListener("click", () => { closeIntro(); el.shop.classList.remove("hidden"); updateShop(); });
btn.closeShop.addEventListener("click", () => {
  if (state === "playing") toggleShop(false);
  else el.shop.classList.add("hidden");
});

if (btn.miniGameBtn) btn.miniGameBtn.addEventListener("click", () => {
  const lastPlayed = Number(localStorage.getItem(MINIGAME_COOLDOWN_KEY) || 0);
  const now = Date.now();
  if (now - lastPlayed < MINIGAME_COOLDOWN_MS) {
    const remainMs = MINIGAME_COOLDOWN_MS - (now - lastPlayed);
    const remainM = Math.floor(remainMs / 60000);
    const remainS = Math.floor((remainMs % 60000) / 1000);
    toast(`Chờ ${remainM} phút ${remainS} giây để quay tiếp!`);
    return;
  }
  
  miniGameOpen = true;
  if (state === "playing" && !paused) paused = true;
  
  el.miniGameScreen.classList.remove("hidden");
  el.miniGameScreen.style.display = "flex";

  if (Math.random() < 0.5) {
    currentMiniGame = "slot";
    el.miniGameSlot.style.display = "block";
    el.miniGameTiming.style.display = "none";
    el.slot1.textContent = "?"; el.slot2.textContent = "?"; el.slot3.textContent = "?";
    el.slot1.style.background = "#1e293b"; el.slot2.style.background = "#1e293b"; el.slot3.style.background = "#1e293b";
    btn.spinBtn.disabled = false;
    btn.spinBtn.textContent = "QUAY SỐ";
    btn.spinBtn.style.background = "#22c55e";
  } else {
    currentMiniGame = "timing";
    el.miniGameSlot.style.display = "none";
    el.miniGameTiming.style.display = "block";
    timingPos = 0; timingDir = 1;
    el.timingCursor.style.left = "0px";
    el.timingCursor.style.background = "#ef4444";
    const zoneLeft = 20 + Math.random() * 240;
    el.timingZone.style.left = zoneLeft + "px";
    btn.timingBtn.disabled = false;
    btn.timingBtn.textContent = "DỪNG LẠI";
    btn.timingBtn.style.background = "#22c55e";
    isTimingActive = true;
    timingInterval = setInterval(() => {
      timingPos += timingDir * 5;
      if (timingPos > 340) { timingPos = 340; timingDir = -1; }
      if (timingPos < 0) { timingPos = 0; timingDir = 1; }
      el.timingCursor.style.left = timingPos + "px";
    }, 20);
  }
});

if (btn.closeMiniGameBtn) btn.closeMiniGameBtn.addEventListener("click", () => {
  miniGameOpen = false;
  el.miniGameScreen.classList.add("hidden");
  el.miniGameScreen.style.display = "none";
  if (isSpinning) { clearInterval(spinInterval); isSpinning = false; }
  if (isTimingActive) { clearInterval(timingInterval); isTimingActive = false; }
});

if (btn.spinBtn) btn.spinBtn.addEventListener("click", () => {
  if (isSpinning) return;
  isSpinning = true;
  btn.spinBtn.disabled = true;
  btn.spinBtn.textContent = "ĐANG QUAY...";
  btn.spinBtn.style.background = "#64748b";
  
  let ticks = 0;
  spinInterval = setInterval(() => {
    el.slot1.textContent = Math.floor(Math.random() * 7);
    el.slot2.textContent = Math.floor(Math.random() * 7);
    el.slot3.textContent = Math.floor(Math.random() * 7);
    ticks++;
    if (ticks >= 40) {
      clearInterval(spinInterval);
      isSpinning = false;
      const v1 = el.slot1.textContent; const v2 = el.slot2.textContent; const v3 = el.slot3.textContent;
      let reward = 0;
      if (v1 === v2 && v2 === v3) { reward = 50; el.slot1.style.background = "#16a34a"; el.slot2.style.background = "#16a34a"; el.slot3.style.background = "#16a34a"; }
      else if (v1 === v2 || v2 === v3 || v1 === v3) {
        reward = 15;
        if (v1 === v2) { el.slot1.style.background = "#ca8a04"; el.slot2.style.background = "#ca8a04"; }
        else if (v2 === v3) { el.slot2.style.background = "#ca8a04"; el.slot3.style.background = "#ca8a04"; }
        else { el.slot1.style.background = "#ca8a04"; el.slot3.style.background = "#ca8a04"; }
      } else { reward = 5; }
      
      localStorage.setItem(MINIGAME_COOLDOWN_KEY, Date.now());
      awardDollars(reward, "Mini Game");
      btn.spinBtn.textContent = "NHẬN " + reward + "$";
    }
  }, 50);
});

if (btn.timingBtn) btn.timingBtn.addEventListener("click", () => {
  if (!isTimingActive) return;
  isTimingActive = false;
  clearInterval(timingInterval);
  btn.timingBtn.disabled = true;
  
  const zoneLeft = parseFloat(el.timingZone.style.left);
  const zoneRight = zoneLeft + 60;
  
  let reward = 0;
  if (timingPos >= zoneLeft - 3 && timingPos <= zoneRight + 3) {
    reward = 30;
    btn.timingBtn.textContent = "TUYỆT VỜI! NHẬN " + reward + "$";
    el.timingCursor.style.background = "#fde047";
  } else {
    reward = 5;
    btn.timingBtn.textContent = "TRƯỢT RỒI! NHẬN " + reward + "$";
    btn.timingBtn.style.background = "#ef4444";
  }
  
  localStorage.setItem(MINIGAME_COOLDOWN_KEY, Date.now());
  awardDollars(reward, "Phản Xạ");
});

// --- NETWORK LOGIC ---
if (typeof io !== 'undefined') {
  socket = io();
  
  socket.on('room_created', (data) => {
    currentRoomCode = data.room_code;
    isHost = true;
    myPlayerId = data.player_id;
    el.roomStatus.textContent = "Mã Phòng: " + currentRoomCode + " (Chờ người chơi...)";
    el.roomStatus.style.color = "#4ade80";
    btn.btnStartOnline.style.display = "block";
    setPlayerMode(1); // Host represents 1 client initially
  });
  
  socket.on('room_joined', (data) => {
    currentRoomCode = data.room_code;
    isHost = false;
    myPlayerId = data.player_id;
    el.roomStatus.textContent = "Đã vào phòng: " + currentRoomCode + " (Bạn là P" + myPlayerId + ")";
    el.roomStatus.style.color = "#4ade80";
    setPlayerMode(myPlayerId); 
  });
  
  socket.on('player_joined', (data) => {
    toast("Player " + data.player_id + " đã tham gia!");
    setPlayerMode(Math.max(playerMode, data.player_id));
  });
  
  socket.on('player_left', (data) => {
    toast("Player " + data.player_id + " đã thoát!");
  });
  
  socket.on('host_left', () => {
    toast("Host đã đóng phòng!");
    state = "network";
    el.networkScreen.style.display = "flex";
  });
  
  socket.on('error', (data) => {
    alert(data.msg);
    el.roomStatus.textContent = data.msg;
    el.roomStatus.style.color = "#ef4444";
  });
  
  socket.on('game_started', () => {
    if (!isHost) {
      el.networkScreen.style.display = 'none';
      el.intro.classList.remove("hidden");
      state = 'menu';
    }
  });
  
  socket.on('remote_input', (data) => {
    if (!isHost) return;
    // Host will process guest inputs
    const pId = data.player_id;
    const remoteKeys = data.keys || {};
    const remoteShoot = data.shoot;
    const p = players.find(x => x.id === pId);
    if (p && p.alive) {
      if (remoteKeys['ArrowLeft'] || remoteKeys['a'] || remoteKeys['A']) move(p, -p.speed, 0);
      if (remoteKeys['ArrowRight'] || remoteKeys['d'] || remoteKeys['D']) move(p, p.speed, 0);
      if (remoteKeys['ArrowUp'] || remoteKeys['w'] || remoteKeys['W']) move(p, 0, -p.speed);
      if (remoteKeys['ArrowDown'] || remoteKeys['s'] || remoteKeys['S']) move(p, 0, p.speed);
      
      if (data.dir) p.lastDir = data.dir;
      if (remoteShoot) shoot(p);
      if (data.skill) useSkill(p);
      if (data.bomb) throwBomb(p);
    }
  });
  
  socket.on('game_state', (gameState) => {
    if (isHost || state !== "playing") return;
    // Guest updates state directly from Host
    players = gameState.players || [];
    zombies = gameState.zombies || [];
    bullets = gameState.bullets || [];
    enemyBullets = gameState.enemyBullets || [];
    bombs = gameState.bombs || [];
    mines = gameState.mines || [];
    blackHoles = gameState.blackHoles || [];
    pickups = gameState.pickups || [];
    coins = gameState.coins || [];
    chests = gameState.chests || [];
    turrets = gameState.turrets || [];
    drones = gameState.drones || [];
    pets = gameState.pets || [];
    level = gameState.level;
    combo = gameState.combo;
    timeOfDay = gameState.timeOfDay;
    weatherType = gameState.weatherType;
    bossMiniGame = gameState.bossMiniGame;
  });
}

if (btn.btnPlayOffline) {
  btn.btnPlayOffline.addEventListener('click', () => {
    if (!loggedInUser) {
      toast("Vui lòng đăng nhập hoặc đăng ký để chơi!");
      if (btn.btnLoginModal) btn.btnLoginModal.click();
      return;
    }
    isOnline = false;
    el.networkScreen.style.display = 'none';
    el.intro.classList.remove("hidden");
    state = 'menu';
  });
  
  btn.btnPlayOnline.addEventListener('click', () => {
    if (!loggedInUser) {
      toast("Vui lòng đăng nhập hoặc đăng ký để chơi!");
      if (btn.btnLoginModal) btn.btnLoginModal.click();
      return;
    }
    isOnline = true;
    el.onlinePanel.style.display = 'block';
  });
  
  btn.btnCreateRoom.addEventListener('click', () => {
    if (socket) socket.emit('create_room');
  });
  
  btn.btnJoinRoom.addEventListener('click', () => {
    const code = el.roomCodeInput.value.trim();
    if (code.length === 4 && socket) {
      socket.emit('join_room', { room_code: code });
    } else {
      alert("Mã phòng phải có 4 ký tự!");
    }
  });
  
  btn.btnStartOnline.addEventListener('click', () => {
    if (isHost) {
      if (socket) socket.emit('start_game', { room_code: currentRoomCode });
      el.networkScreen.style.display = 'none';
      el.intro.classList.remove("hidden");
      state = 'menu';
    }
  });
}

initSelects();
updateAutoSkipUI();
updateShop();

if (state === "network") {
  el.networkScreen.style.display = "flex";
  el.intro.classList.add("hidden");
  el.menu.classList.add("hidden");
}

// --- AUTHENTICATION LOGIC ---

async function checkLoginStatus() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.logged_in) {
      loggedInUser = data.user;
      applyUserData(loggedInUser);
    } else {
      loggedInUser = null;
    }
    updateAuthUI();
  } catch (e) {
    console.error("Auth check failed:", e);
  }
}

function applyUserData(user) {
  dollarBalance = user.dollars || 0;
  highScore = user.high_score || 0;
  if (user.unlocked_characters) {
    unlockedCharacters = new Set(user.unlocked_characters);
    unlockedCharacters.add("soldier");
  }
  autoSkipEnabled = user.auto_skip === 1;
  localStorage.setItem(autoSkipKey, autoSkipEnabled ? "1" : "0");
  localStorage.setItem(highScoreKey, String(highScore));
  localStorage.setItem(dollarKey, String(dollarBalance));
  localStorage.setItem(unlockedCharactersKey, JSON.stringify([...unlockedCharacters]));
  
  updateAutoSkipUI();
  updateCharacterUI();
}

function updateAuthUI() {
  if (loggedInUser) {
    el.userInfo.style.display = 'flex';
    el.authButtons.style.display = 'none';
    el.userNameDisplay.textContent = loggedInUser.username;
  } else {
    el.userInfo.style.display = 'none';
    el.authButtons.style.display = 'flex';
  }
}

async function apiSave(payload) {
  try {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Failed to save to server:", e);
  }
}

if (btn.btnLoginModal) {
  btn.btnLoginModal.addEventListener('click', () => {
    isRegisterMode = false;
    el.authTitle.textContent = "ĐĂNG NHẬP";
    el.authError.style.display = 'none';
    el.authModal.classList.remove('hidden');
    el.authModal.style.display = 'flex';
  });
  
  btn.btnRegisterModal.addEventListener('click', () => {
    isRegisterMode = true;
    el.authTitle.textContent = "ĐĂNG KÝ";
    el.authError.style.display = 'none';
    el.authModal.classList.remove('hidden');
    el.authModal.style.display = 'flex';
  });
  
  btn.btnCloseAuth.addEventListener('click', () => {
    el.authModal.classList.add('hidden');
    el.authModal.style.display = 'none';
  });
  
  btn.btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      loggedInUser = null;
      updateAuthUI();
      toast("Đã đăng xuất!");
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      console.error(e);
    }
  });
  
  btn.btnSubmitAuth.addEventListener('click', async () => {
    const username = el.authUsername.value.trim();
    const password = el.authPassword.value.trim();
    if (!username || !password) {
      el.authError.textContent = "Vui lòng nhập tài khoản và mật khẩu";
      el.authError.style.display = 'block';
      return;
    }
    
    const endpoint = isRegisterMode ? '/api/register' : '/api/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        el.authError.textContent = data.error || "Đã xảy ra lỗi";
        el.authError.style.display = 'block';
      } else {
        el.authModal.classList.add('hidden');
        el.authModal.style.display = 'none';
        el.authUsername.value = '';
        el.authPassword.value = '';
        
        if (isRegisterMode) {
          toast("Đăng ký thành công! Vui lòng đăng nhập.");
        } else {
          toast("Đăng nhập thành công!");
          loggedInUser = data.user;
          applyUserData(loggedInUser);
          updateAuthUI();
        }
      }
    } catch (e) {
      el.authError.textContent = "Lỗi kết nối máy chủ";
      el.authError.style.display = 'block';
    }
  });
}

// Check login status on page load
checkLoginStatus();

loop();