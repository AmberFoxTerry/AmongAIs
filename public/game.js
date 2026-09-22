const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const newGameButton = document.getElementById("newGame");

let game = null;

const WORLD = {
    width: 3200,
    height: 1900
};

const camera = {
    x: 1600,
    y: 950,
    zoom: 0.62
};

let dragging = false;
let dragX = 0;
let dragY = 0;
let startCameraX = 0;
let startCameraY = 0;

let lastTime = performance.now();


// ============================================================
// CANVAS
// ============================================================

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();


// ============================================================
// CAMERA
// ============================================================

function screenToWorld(x, y) {
    return {
        x: camera.x + (x - window.innerWidth / 2) / camera.zoom,
        y: camera.y + (y - window.innerHeight / 2) / camera.zoom
    };
}

function worldToScreen(x, y) {
    return {
        x: (x - camera.x) * camera.zoom + window.innerWidth / 2,
        y: (y - camera.y) * camera.zoom + window.innerHeight / 2
    };
}

function clampCamera() {
    const halfW = window.innerWidth / camera.zoom / 2;
    const halfH = window.innerHeight / camera.zoom / 2;

    camera.x = Math.max(
        halfW,
        Math.min(WORLD.width - halfW, camera.x)
    );

    camera.y = Math.max(
        halfH,
        Math.min(WORLD.height - halfH, camera.y)
    );
}


// ============================================================
// CAMERA CONTROLS
// ============================================================

canvas.addEventListener("pointerdown", e => {
    dragging = true;

    dragX = e.clientX;
    dragY = e.clientY;

    startCameraX = camera.x;
    startCameraY = camera.y;

    canvas.classList.add("dragging");

    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", e => {
    if (!dragging) return;

    camera.x =
        startCameraX -
        (e.clientX - dragX) / camera.zoom;

    camera.y =
        startCameraY -
        (e.clientY - dragY) / camera.zoom;

    clampCamera();
});

canvas.addEventListener("pointerup", e => {
    dragging = false;

    canvas.classList.remove("dragging");

    try {
        canvas.releasePointerCapture(e.pointerId);
    } catch {}
});

canvas.addEventListener("pointercancel", () => {
    dragging = false;
    canvas.classList.remove("dragging");
});

canvas.addEventListener("wheel", e => {
    e.preventDefault();

    const before = screenToWorld(
        e.clientX,
        e.clientY
    );

    camera.zoom *= e.deltaY < 0 ? 1.12 : 0.89;

    camera.zoom = Math.max(
        0.30,
        Math.min(2.5, camera.zoom)
    );

    const after = screenToWorld(
        e.clientX,
        e.clientY
    );

    camera.x += before.x - after.x;
    camera.y += before.y - after.y;

    clampCamera();
}, {
    passive: false
});


// ============================================================
// SKELD-LIKE MAP GEOMETRY
// ============================================================
//
// Room positions follow the recognizable Skeld arrangement:
//
//                 CAFETERIA
//          MEDBAY       WEAPONS
//
//   UPPER ENGINE                 NAVIGATION
//
//   REACTOR       SECURITY       O2
//
//   LOWER ENGINE  ELECTRICAL     SHIELDS
//
//                 STORAGE
//                     |
//                   ADMIN
//
// ============================================================

const rooms = {

    cafeteria: {
        x: 1050,
        y: 470,
        w: 700,
        h: 500
    },

    medbay: {
        x: 430,
        y: 250,
        w: 420,
        h: 360
    },

    weapons: {
        x: 1870,
        y: 250,
        w: 470,
        h: 390
    },

    upperEngine: {
        x: 250,
        y: 650,
        w: 500,
        h: 330
    },

    security: {
        x: 820,
        y: 1050,
        w: 360,
        h: 310
    },

    reactor: {
        x: 220,
        y: 1080,
        w: 500,
        h: 430
    },

    lowerEngine: {
        x: 250,
        y: 1500,
        w: 500,
        h: 300
    },

    electrical: {
        x: 820,
        y: 1450,
        w: 400,
        h: 350
    },

    storage: {
        x: 1120,
        y: 1030,
        w: 500,
        h: 500
    },

    admin: {
        x: 1510,
        y: 1420,
        w: 410,
        h: 340
    },

    o2: {
        x: 2200,
        y: 700,
        w: 400,
        h: 350
    },

    navigation: {
        x: 2390,
        y: 260,
        w: 500,
        h: 430
    },

    shields: {
        x: 2260,
        y: 1250,
        w: 480,
        h: 420
    }
};


// ============================================================
// CORRIDORS
// ============================================================

const corridors = [
    // Cafeteria -> MedBay
    [1050, 600, 850, 600],

    // Cafeteria -> Weapons
    [1750, 600, 1870, 600],

    // Cafeteria -> Upper Engine
    [1050, 720, 750, 800],

    // Cafeteria -> Storage
    [1300, 970, 1300, 1030],

    // Cafeteria -> Security
    [1100, 970, 1000, 1050],

    // Cafeteria -> Admin
    [1500, 970, 1700, 1420],

    // Upper Engine -> Reactor
    [500, 980, 500, 1080],

    // Reactor -> Lower Engine
    [500, 1510, 500, 1500],

    // Reactor -> Security
    [720, 1250, 820, 1200],

    // Security -> Electrical
    [1180, 1200, 1250, 1450],

    // Storage -> Electrical
    [1120, 1270, 1220, 1450],

    // Storage -> Admin
    [1620, 1300, 1700, 1420],

    // Weapons -> Navigation
    [2340, 450, 2390, 450],

    // Weapons -> O2
    [2250, 640, 2350, 700],

    // Navigation -> O2
    [2500, 690, 2400, 700],

    // O2 -> Shields
    [2400, 1050, 2420, 1250],

    // Admin -> Shields
    [1920, 1550, 2260, 1450]
];


// ============================================================
// BACKGROUND
// ============================================================

function drawBackground() {
    ctx.fillStyle = "#080a0d";
    ctx.fillRect(
        0,
        0,
        WORLD.width,
        WORLD.height
    );
}


// ============================================================
// SHIP HULL
// ============================================================

function drawHull() {
    ctx.fillStyle = "#15191d";

    ctx.beginPath();

    ctx.moveTo(150, 450);
    ctx.lineTo(400, 180);
    ctx.lineTo(2800, 180);
    ctx.lineTo(3050, 450);
    ctx.lineTo(3050, 1650);
    ctx.lineTo(2800, 1810);
    ctx.lineTo(400, 1810);
    ctx.lineTo(150, 1600);

    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#515960";
    ctx.lineWidth = 25;
    ctx.stroke();
}


// ============================================================
// CORRIDORS
// ============================================================

function drawCorridor(x1, y1, x2, y2) {
    ctx.strokeStyle = "#0c0f12";
    ctx.lineWidth = 150;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = "#353b40";
    ctx.lineWidth = 105;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = "#464d52";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x1, y1 - 48);
    ctx.lineTo(x2, y2 - 48);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1 + 48);
    ctx.lineTo(x2, y2 + 48);
    ctx.stroke();
}


// ============================================================
// FLOOR
// ============================================================

function drawFloor(x, y, w, h) {
    ctx.fillStyle = "#373d42";
    ctx.fillRect(x, y, w, h);

    const size = 32;

    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 2;

    for (
        let xx = x;
        xx <= x + w;
        xx += size
    ) {
        ctx.beginPath();
        ctx.moveTo(xx, y);
        ctx.lineTo(xx, y + h);
        ctx.stroke();
    }

    for (
        let yy = y;
        yy <= y + h;
        yy += size
    ) {
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.025)";

    for (
        let xx = x + 5;
        xx < x + w;
        xx += size
    ) {
        for (
            let yy = y + 5;
            yy < y + h;
            yy += size
        ) {
            ctx.fillRect(
                xx,
                yy,
                size - 10,
                size - 10
            );
        }
    }
}


// ============================================================
// ROOMS
// ============================================================

function drawRoom(room, label) {
    ctx.fillStyle = "#111519";

    ctx.beginPath();

    ctx.roundRect(
        room.x - 15,
        room.y - 15,
        room.w + 30,
        room.h + 30,
        30
    );

    ctx.fill();

    drawFloor(
        room.x,
        room.y,
        room.w,
        room.h
    );

    ctx.strokeStyle = "#626a70";
    ctx.lineWidth = 9;

    ctx.beginPath();

    ctx.roundRect(
        room.x,
        room.y,
        room.w,
        room.h,
        20
    );

    ctx.stroke();

    drawRoomObjects(
        room,
        label
    );
}


// ============================================================
// ROOM OBJECTS
// ============================================================

function drawRoomObjects(room, label) {

    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;

    if (label === "cafeteria") {
        drawTable(cx, cy, 115);

        drawTable(
            room.x + 140,
            room.y + 120,
            65
        );

        drawTable(
            room.x + room.w - 140,
            room.y + room.h - 120,
            65
        );
    }

    if (label === "weapons") {
        drawWeaponConsole(
            cx,
            cy
        );

        drawWeaponConsole(
            cx + 100,
            cy
        );
    }

    if (
        label === "upperEngine" ||
        label === "lowerEngine"
    ) {
        drawEngine(
            cx,
            cy,
            room.w * 0.7,
            room.h * 0.65
        );
    }

    if (label === "medbay") {
        drawBed(
            room.x + 80,
            room.y + 80
        );

        drawBed(
            room.x + 80,
            room.y + 170
        );

        drawScanner(
            cx + 70,
            cy
        );
    }

    if (label === "security") {
        drawConsole(
            room.x + 100,
            room.y + 100
        );

        drawConsole(
            room.x + 200,
            room.y + 100
        );

        drawCameraWall(
            cx,
            room.y + 230
        );
    }

    if (label === "reactor") {
        drawReactor(
            cx,
            cy
        );
    }

    if (label === "electrical") {
        for (let i = 0; i < 4; i++) {
            drawPanel(
                room.x + 50 + i * 80,
                room.y + 80
            );
        }
    }

    if (label === "storage") {
        for (let i = 0; i < 5; i++) {
            drawCrate(
                room.x + 70 + i * 75,
                room.y + 100
            );
        }

        for (let i = 0; i < 4; i++) {
            drawCrate(
                room.x + 100 + i * 75,
                room.y + 250
            );
        }
    }

    if (label === "admin") {
        drawConsole(
            cx - 90,
            cy
        );

        drawConsole(
            cx + 90,
            cy
        );
    }

    if (label === "o2") {
        drawO2Tank(
            cx,
            cy
        );

        drawConsole(
            cx + 90,
            cy
        );
    }

    if (label === "navigation") {
        drawNavigationConsole(
            cx,
            cy
        );

        drawConsole(
            cx + 110,
            cy + 60
        );
    }

    if (label === "shields") {
        drawShieldArray(
            cx,
            cy
        );
    }
}


// ============================================================
// OBJECTS
// ============================================================

function drawTable(x, y, radius) {
    ctx.fillStyle = "#20262b";

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#666e74";
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.fillStyle = "#111519";

    ctx.beginPath();
    ctx.arc(
        x,
        y,
        radius * 0.7,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawBed(x, y) {
    ctx.fillStyle = "#1b2024";
    ctx.fillRect(x, y, 190, 60);

    ctx.strokeStyle = "#626a70";
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, 190, 60);

    ctx.fillStyle = "#536069";
    ctx.fillRect(
        x + 10,
        y + 10,
        75,
        40
    );
}

function drawScanner(x, y) {
    ctx.fillStyle = "#20262a";

    ctx.beginPath();
    ctx.roundRect(
        x - 55,
        y - 75,
        110,
        150,
        15
    );

    ctx.fill();

    ctx.strokeStyle = "#667077";
    ctx.lineWidth = 6;
    ctx.stroke();
}

function drawEngine(x, y, w, h) {
    ctx.fillStyle = "#181d21";

    ctx.beginPath();
    ctx.ellipse(
        x,
        y,
        w / 2,
        h / 2,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#687177";
    ctx.lineWidth = 9;
    ctx.stroke();

    ctx.strokeStyle = "#41494e";
    ctx.lineWidth = 22;

    ctx.beginPath();
    ctx.moveTo(
        x - w * 0.25,
        y
    );

    ctx.lineTo(
        x + w * 0.25,
        y
    );

    ctx.stroke();
}

function drawConsole(x, y) {
    ctx.fillStyle = "#171c20";

    ctx.fillRect(
        x - 45,
        y - 35,
        90,
        70
    );

    ctx.strokeStyle = "#687177";
    ctx.lineWidth = 5;
    ctx.strokeRect(
        x - 45,
        y - 35,
        90,
        70
    );

    ctx.fillStyle = "#26343b";

    ctx.fillRect(
        x - 30,
        y - 20,
        60,
        30
    );
}

function drawWeaponConsole(x, y) {
    drawConsole(x, y);

    ctx.fillStyle = "#303b42";

    ctx.beginPath();
    ctx.arc(
        x,
        y,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawReactor(x, y) {
    ctx.fillStyle = "#181d21";

    ctx.beginPath();
    ctx.arc(
        x,
        y,
        105,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#697177";
    ctx.lineWidth = 9;
    ctx.stroke();

    ctx.fillStyle = "#30383e";

    ctx.beginPath();
    ctx.arc(
        x,
        y,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawPanel(x, y) {
    ctx.fillStyle = "#1b2024";

    ctx.fillRect(
        x,
        y,
        55,
        120
    );

    ctx.strokeStyle = "#626a70";
    ctx.lineWidth = 4;
    ctx.strokeRect(
        x,
        y,
        55,
        120
    );
}

function drawCrate(x, y) {
    ctx.fillStyle = "#252b30";

    ctx.fillRect(
        x,
        y,
        60,
        60
    );

    ctx.strokeStyle = "#626a70";
    ctx.lineWidth = 4;
    ctx.strokeRect(
        x,
        y,
        60,
        60
    );

    ctx.beginPath();

    ctx.moveTo(x, y);
    ctx.lineTo(x + 60, y + 60);

    ctx.moveTo(x + 60, y);
    ctx.lineTo(x, y + 60);

    ctx.stroke();
}

function drawCameraWall(x, y) {
    for (let i = -1; i <= 1; i++) {
        drawConsole(
            x + i * 100,
            y
        );
    }
}

function drawO2Tank(x, y) {
    ctx.fillStyle = "#252c31";

    ctx.beginPath();

    ctx.roundRect(
        x - 70,
        y - 100,
        140,
        200,
        30
    );

    ctx.fill();

    ctx.strokeStyle = "#697177";
    ctx.lineWidth = 7;
    ctx.stroke();
}

function drawNavigationConsole(x, y) {
    ctx.fillStyle = "#1b2024";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        100,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#697177";
    ctx.lineWidth = 8;
    ctx.stroke();
}

function drawShieldArray(x, y) {
    for (let i = 0; i < 5; i++) {
        const angle =
            (Math.PI * 2 / 5) * i;

        ctx.fillStyle = "#252c31";

        ctx.beginPath();

        ctx.arc(
            x + Math.cos(angle) * 100,
            y + Math.sin(angle) * 100,
            45,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#697177";
        ctx.lineWidth = 5;
        ctx.stroke();
    }
}


// ============================================================
// MAP RENDER
// ============================================================

function drawMap() {
    drawBackground();
    drawHull();

    for (const corridor of corridors) {
        drawCorridor(...corridor);
    }

    for (const [name, room] of Object.entries(rooms)) {
        drawRoom(room, name);
    }
}


// ============================================================
// CREWMATE
// ============================================================

function drawCrewmate(player) {
    const pos = worldToScreen(
        player.renderX ?? player.x,
        player.renderY ?? player.y
    );

    const scale = camera.zoom;

    const w = 44 * scale;
    const h = 62 * scale;

    ctx.save();

    ctx.translate(pos.x, pos.y);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        h * 0.47,
        w * 0.6,
        h * 0.16,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Backpack
    ctx.fillStyle = player.color || "#d32f2f";

    ctx.beginPath();

    ctx.roundRect(
        -w * 0.64,
        -h * 0.2,
        w * 0.42,
        h * 0.55,
        w * 0.12
    );

    ctx.fill();

    // Body
    ctx.beginPath();

    ctx.roundRect(
        -w * 0.42,
        -h * 0.48,
        w * 0.84,
        h * 0.86,
        w * 0.28
    );

    ctx.fill();

    ctx.strokeStyle = "#111";
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.stroke();

    // Visor
    ctx.fillStyle = "#a7e8f5";

    ctx.beginPath();

    ctx.ellipse(
        w * 0.06,
        -h * 0.25,
        w * 0.29,
        h * 0.18,
        -0.08,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#1a282e";
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.stroke();

    // Reflection
    ctx.fillStyle = "rgba(255,255,255,0.7)";

    ctx.beginPath();

    ctx.ellipse(
        -w * 0.01,
        -h * 0.30,
        w * 0.08,
        h * 0.05,
        -0.2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Legs
    ctx.fillStyle = player.color || "#d32f2f";

    ctx.fillRect(
        -w * 0.30,
        h * 0.25,
        w * 0.25,
        h * 0.27
    );

    ctx.fillRect(
        w * 0.05,
        h * 0.25,
        w * 0.25,
        h * 0.27
    );

    // Name
    if (camera.zoom > 0.4) {
        ctx.font =
            `${Math.max(11, 14 * scale)}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.lineWidth = 4;

        ctx.strokeStyle = "#000";

        ctx.strokeText(
            player.name,
            0,
            -h * 0.55
        );

        ctx.fillStyle = "#fff";

        ctx.fillText(
            player.name,
            0,
            -h * 0.55
        );
    }

    ctx.restore();
}


// ============================================================
// SMOOTH MOVEMENT
// ============================================================

function updateMovement(delta) {
    if (!game) return;

    for (const player of game.players) {

        if (typeof player.renderX !== "number") {
            player.renderX = player.x;
            player.renderY = player.y;
        }

        if (typeof player.targetX !== "number") {
            player.targetX = player.x;
            player.targetY = player.y;
        }

        const dx =
            player.targetX -
            player.renderX;

        const dy =
            player.targetY -
            player.renderY;

        const distance =
            Math.hypot(dx, dy);

        if (distance < 0.01) {
            player.renderX =
                player.targetX;

            player.renderY =
                player.targetY;

            continue;
        }

        /*
         * Movement speed is deliberately constant.
         * The AI doesn't teleport between server updates.
         */

        const speed =
            2.5 * delta * 60;

        const amount =
            Math.min(speed, distance);

        player.renderX +=
            dx / distance * amount;

        player.renderY +=
            dy / distance * amount;
    }
}


// ============================================================
// GAME FETCH
// ============================================================

async function fetchGame() {
    try {
        const response =
            await fetch("/api/game", {
                cache: "no-store"
            });

        if (!response.ok) return;

        const next =
            await response.json();

        if (!next.players) return;

        if (!game) {
            game = next;

            for (const player of game.players) {
                player.renderX = player.x;
                player.renderY = player.y;
                player.targetX = player.x;
                player.targetY = player.y;
            }

            return;
        }

        for (const nextPlayer of next.players) {

            const current =
                game.players.find(
                    p => p.id === nextPlayer.id
                );

            if (!current) {
                nextPlayer.renderX =
                    nextPlayer.x;

                nextPlayer.renderY =
                    nextPlayer.y;

                nextPlayer.targetX =
                    nextPlayer.x;

                nextPlayer.targetY =
                    nextPlayer.y;

                game.players.push(nextPlayer);

                continue;
            }

            current.targetX =
                nextPlayer.x;

            current.targetY =
                nextPlayer.y;

            current.name =
                nextPlayer.name;

            current.color =
                nextPlayer.color;

            current.alive =
                nextPlayer.alive;

            current.room =
                nextPlayer.room;

            current.action =
                nextPlayer.action;
        }

        game.phase = next.phase;
        game.round = next.round;
    } catch (error) {
        console.error(error);
    }
}


// ============================================================
// NEW GAME
// ============================================================

newGameButton.addEventListener(
    "click",
    async () => {

        newGameButton.disabled = true;

        try {
            await fetch(
                "/api/game/new",
                {
                    method: "POST"
                }
            );

            game = null;

            camera.x = 1600;
            camera.y = 950;
            camera.zoom = 0.62;

            clampCamera();

            await fetchGame();

        } catch (error) {
            console.error(error);
        }

        newGameButton.disabled = false;
    }
);


// ============================================================
// MAIN LOOP
// ============================================================

function render() {
    const now = performance.now();

    let delta =
        (now - lastTime) / 1000;

    lastTime = now;

    delta = Math.min(delta, 0.05);

    updateMovement(delta);

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    ctx.save();

    ctx.translate(
        window.innerWidth / 2,
        window.innerHeight / 2
    );

    ctx.scale(
        camera.zoom,
        camera.zoom
    );

    ctx.translate(
        -camera.x,
        -camera.y
    );

    drawMap();

    if (game) {
        for (const player of game.players) {
            drawCrewmate(player);
        }
    }

    ctx.restore();

    requestAnimationFrame(render);
}


fetchGame();

setInterval(
    fetchGame,
    500
);

requestAnimationFrame(render);
