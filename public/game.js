const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const newGameButton = document.getElementById("newGame");

const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = 1600;

// Among Us walking speed is roughly 2.5 world-units/sec.
// The server movement is handled separately; this renderer smoothly
// interpolates the AI between server updates.
const CREWMATE_SPEED = 2.5;

let game = null;

const camera = {
    x: 1300,
    y: 800,
    zoom: 0.65
};

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let cameraStartX = 0;
let cameraStartY = 0;

let lastFrame = performance.now();


// ------------------------------------------------------------
// CANVAS
// ------------------------------------------------------------

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


// ------------------------------------------------------------
// CAMERA
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// CAMERA DRAG
// ------------------------------------------------------------

canvas.addEventListener("pointerdown", event => {
    dragging = true;

    canvas.classList.add("dragging");

    dragStartX = event.clientX;
    dragStartY = event.clientY;

    cameraStartX = camera.x;
    cameraStartY = camera.y;

    canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
    if (!dragging) return;

    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;

    camera.x = cameraStartX - dx / camera.zoom;
    camera.y = cameraStartY - dy / camera.zoom;

    clampCamera();
});

canvas.addEventListener("pointerup", event => {
    dragging = false;
    canvas.classList.remove("dragging");

    try {
        canvas.releasePointerCapture(event.pointerId);
    } catch {}
});

canvas.addEventListener("pointercancel", () => {
    dragging = false;
    canvas.classList.remove("dragging");
});

canvas.addEventListener("wheel", event => {
    event.preventDefault();

    const before = screenToWorld(
        event.clientX,
        event.clientY
    );

    const factor = event.deltaY < 0 ? 1.12 : 0.89;

    camera.zoom *= factor;

    camera.zoom = Math.max(
        0.28,
        Math.min(2.5, camera.zoom)
    );

    const after = screenToWorld(
        event.clientX,
        event.clientY
    );

    camera.x += before.x - after.x;
    camera.y += before.y - after.y;

    clampCamera();
}, { passive: false });


function clampCamera() {
    const halfW = window.innerWidth / camera.zoom / 2;
    const halfH = window.innerHeight / camera.zoom / 2;

    camera.x = Math.max(
        halfW,
        Math.min(WORLD_WIDTH - halfW, camera.x)
    );

    camera.y = Math.max(
        halfH,
        Math.min(WORLD_HEIGHT - halfH, camera.y)
    );
}


// ------------------------------------------------------------
// ORIGINAL SHIP MAP
// ------------------------------------------------------------

const rooms = [
    {
        name: "Cafeteria",
        x: 1000,
        y: 560,
        w: 600,
        h: 400
    },

    {
        name: "Upper Engine",
        x: 360,
        y: 250,
        w: 420,
        h: 300
    },

    {
        name: "Lower Engine",
        x: 360,
        y: 1050,
        w: 420,
        h: 300
    },

    {
        name: "MedBay",
        x: 850,
        y: 180,
        w: 400,
        h: 300
    },

    {
        name: "Security",
        x: 1660,
        y: 180,
        w: 330,
        h: 300
    },

    {
        name: "Electrical",
        x: 1710,
        y: 570,
        w: 390,
        h: 360
    },

    {
        name: "Storage",
        x: 1050,
        y: 1040,
        w: 480,
        h: 360
    },

    {
        name: "Admin",
        x: 1600,
        y: 1030,
        w: 390,
        h: 330
    },

    {
        name: "Reactor",
        x: 420,
        y: 690,
        w: 350,
        h: 280
    },

    {
        name: "Navigation",
        x: 2080,
        y: 570,
        w: 350,
        h: 350
    },

    {
        name: "Shields",
        x: 2070,
        y: 1040,
        w: 370,
        h: 320
    }
];

const corridors = [
    [780, 400, 850, 330],
    [1250, 330, 1660, 330],
    [1600, 760, 1710, 750],
    [1530, 1220, 1600, 1190],
    [1990, 730, 2080, 730],
    [1990, 1200, 2070, 1200],
    [1250, 960, 1280, 1040],
    [780, 820, 1000, 760],
    [780, 1160, 1050, 1200]
];


// ------------------------------------------------------------
// TEXTURE HELPERS
// ------------------------------------------------------------

function hash(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function drawFloorTexture(x, y, w, h) {
    ctx.save();

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.fillStyle = "#34393e";
    ctx.fillRect(x, y, w, h);

    const tile = 32;

    for (let yy = Math.floor(y / tile) * tile; yy < y + h; yy += tile) {
        for (let xx = Math.floor(x / tile) * tile; xx < x + w; xx += tile) {

            const variation = hash(
                Math.floor(xx / tile),
                Math.floor(yy / tile)
            );

            if (variation > 0.55) {
                ctx.fillStyle = "rgba(255,255,255,0.018)";
            } else {
                ctx.fillStyle = "rgba(0,0,0,0.025)";
            }

            ctx.fillRect(
                xx + 1,
                yy + 1,
                tile - 2,
                tile - 2
            );
        }
    }

    ctx.strokeStyle = "rgba(0,0,0,0.16)";
    ctx.lineWidth = 2;

    for (let xx = x; xx <= x + w; xx += tile) {
        ctx.beginPath();
        ctx.moveTo(xx, y);
        ctx.lineTo(xx, y + h);
        ctx.stroke();
    }

    for (let yy = y; yy <= y + h; yy += tile) {
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
    }

    ctx.restore();
}


// ------------------------------------------------------------
// MAP
// ------------------------------------------------------------

function drawShip() {
    ctx.fillStyle = "#111418";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Outer ship shadow
    ctx.fillStyle = "#050607";

    ctx.beginPath();
    ctx.roundRect(
        220,
        100,
        2200,
        1400,
        100
    );
    ctx.fill();

    // Main hull
    ctx.fillStyle = "#1d2227";

    ctx.beginPath();
    ctx.roundRect(
        250,
        130,
        2140,
        1340,
        90
    );
    ctx.fill();

    // Hull highlights
    ctx.strokeStyle = "#4b5258";
    ctx.lineWidth = 18;

    ctx.beginPath();
    ctx.roundRect(
        250,
        130,
        2140,
        1340,
        90
    );
    ctx.stroke();

    // Corridors
    for (const corridor of corridors) {
        drawCorridor(...corridor);
    }

    // Rooms
    for (const room of rooms) {
        drawRoom(room);
    }

    drawShipDetails();
}


function drawCorridor(x1, y1, x2, y2) {
    const width = 105;

    ctx.strokeStyle = "#14181c";
    ctx.lineWidth = width + 26;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = "#343a3f";
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x1, y1 - width / 2 + 8);
    ctx.lineTo(x2, y2 - width / 2 + 8);
    ctx.stroke();
}


function drawRoom(room) {
    ctx.fillStyle = "#101418";

    ctx.beginPath();
    ctx.roundRect(
        room.x - 14,
        room.y - 14,
        room.w + 28,
        room.h + 28,
        32
    );
    ctx.fill();

    drawFloorTexture(
        room.x,
        room.y,
        room.w,
        room.h
    );

    ctx.strokeStyle = "#596168";
    ctx.lineWidth = 9;

    ctx.beginPath();
    ctx.roundRect(
        room.x,
        room.y,
        room.w,
        room.h,
        22
    );
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(
        room.x + 8,
        room.y + 8,
        room.w - 16,
        room.h - 16,
        17
    );
    ctx.stroke();

    drawRoomFurniture(room);
}


function drawRoomFurniture(room) {
    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;

    ctx.fillStyle = "rgba(8,10,12,0.55)";

    if (room.name === "Cafeteria") {
        drawTable(cx, cy);

        drawTable(
            room.x + 150,
            room.y + 110,
            65
        );

        drawTable(
            room.x + room.w - 150,
            room.y + room.h - 110,
            65
        );
    }

    if (room.name === "MedBay") {
        drawBed(
            room.x + 70,
            room.y + 80
        );

        drawBed(
            room.x + 70,
            room.y + 175
        );

        drawScanner(
            cx + 70,
            cy
        );
    }

    if (
        room.name === "Upper Engine" ||
        room.name === "Lower Engine"
    ) {
        drawEngine(
            cx,
            cy,
            room.w * 0.72,
            room.h * 0.62
        );
    }

    if (room.name === "Reactor") {
        drawReactor(cx, cy);
    }

    if (room.name === "Security") {
        drawConsole(cx, cy);
        drawConsole(cx + 80, cy);
    }

    if (room.name === "Electrical") {
        for (let i = 0; i < 4; i++) {
            drawElectricalPanel(
                room.x + 70 + i * 75,
                room.y + 100
            );
        }
    }

    if (room.name === "Storage") {
        for (let i = 0; i < 5; i++) {
            drawCrate(
                room.x + 70 + i * 75,
                room.y + 100
            );
        }
    }

    if (room.name === "Admin") {
        drawConsole(cx, cy);
        drawConsole(cx + 100, cy);
    }

    if (
        room.name === "Navigation" ||
        room.name === "Shields"
    ) {
        drawConsole(cx, cy);
        drawConsole(cx, cy + 80);
    }
}


// ------------------------------------------------------------
// FURNITURE
// ------------------------------------------------------------

function drawTable(x, y, radius = 95) {
    ctx.fillStyle = "#20262b";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#626970";
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.fillStyle = "#111519";
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.72, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#3c444a";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#3d454b";
    ctx.fillRect(
        x - 25,
        y - 25,
        50,
        50
    );
}


function drawBed(x, y) {
    ctx.fillStyle = "#171c20";
    ctx.fillRect(x, y, 190, 60);

    ctx.strokeStyle = "#626970";
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, 190, 60);

    ctx.fillStyle = "#53616a";
    ctx.fillRect(
        x + 12,
        y + 10,
        75,
        40
    );
}


function drawScanner(x, y) {
    ctx.fillStyle = "#1b2025";
    ctx.fillRect(
        x - 55,
        y - 70,
        110,
        140
    );

    ctx.strokeStyle = "#687177";
    ctx.lineWidth = 6;
    ctx.strokeRect(
        x - 55,
        y - 70,
        110,
        140
    );
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

    ctx.strokeStyle = "#697178";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.strokeStyle = "#41494f";
    ctx.lineWidth = 18;

    ctx.beginPath();
    ctx.moveTo(x - w * 0.25, y);
    ctx.lineTo(x + w * 0.25, y);
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


function drawReactor(x, y) {
    ctx.fillStyle = "#181d21";

    ctx.beginPath();
    ctx.arc(x, y, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#6b7379";
    ctx.lineWidth = 9;
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;

        ctx.fillStyle = "#30373d";

        ctx.fillRect(
            x + Math.cos(a) * 55 - 10,
            y + Math.sin(a) * 55 - 10,
            20,
            20
        );
    }
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

    ctx.fillStyle = "#29353b";

    ctx.fillRect(
        x - 30,
        y - 20,
        60,
        30
    );
}


function drawElectricalPanel(x, y) {
    ctx.fillStyle = "#191e22";

    ctx.fillRect(
        x,
        y,
        55,
        100
    );

    ctx.strokeStyle = "#626970";
    ctx.lineWidth = 4;
    ctx.strokeRect(
        x,
        y,
        55,
        100
    );

    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = "#30383e";

        ctx.fillRect(
            x + 10,
            y + 15 + i * 25,
            35,
            12
        );
    }
}


function drawCrate(x, y) {
    ctx.fillStyle = "#242a2f";
    ctx.fillRect(x, y, 55, 55);

    ctx.strokeStyle = "#60686e";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, 55, 55);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 55, y + 55);
    ctx.moveTo(x + 55, y);
    ctx.lineTo(x, y + 55);
    ctx.stroke();
}


function drawShipDetails() {
    // Small vents
    const vents = [
        [940, 720],
        [1560, 730],
        [1840, 830],
        [1450, 1180],
        [680, 820],
        [2140, 850]
    ];

    for (const [x, y] of vents) {
        drawVent(x, y);
    }
}


function drawVent(x, y) {
    ctx.fillStyle = "#101316";

    ctx.beginPath();
    ctx.roundRect(
        x - 35,
        y - 20,
        70,
        40,
        8
    );
    ctx.fill();

    ctx.strokeStyle = "#555d63";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "#30383e";
    ctx.lineWidth = 5;

    for (let i = -20; i <= 20; i += 10) {
        ctx.beginPath();
        ctx.moveTo(x + i, y - 13);
        ctx.lineTo(x + i, y + 13);
        ctx.stroke();
    }
}


// ------------------------------------------------------------
// CREWMATE
// ------------------------------------------------------------

function drawCrewmate(player) {
    if (!player.alive) {
        drawBody(player);
        return;
    }

    const p = worldToScreen(
        player.x,
        player.y
    );

    const scale = camera.zoom;

    const width = 42 * scale;
    const height = 58 * scale;

    ctx.save();

    ctx.translate(p.x, p.y);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";

    ctx.beginPath();
    ctx.ellipse(
        0,
        height * 0.48,
        width * 0.55,
        height * 0.16,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Backpack
    ctx.fillStyle = player.color || "#d32f2f";

    ctx.beginPath();
    ctx.roundRect(
        -width * 0.62,
        -height * 0.22,
        width * 0.42,
        height * 0.56,
        width * 0.12
    );
    ctx.fill();

    // Body
    ctx.beginPath();

    ctx.roundRect(
        -width * 0.42,
        -height * 0.48,
        width * 0.84,
        height * 0.86,
        width * 0.28
    );

    ctx.fill();

    // Body outline
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.stroke();

    // Visor
    const visorX = width * 0.05;
    const visorY = -height * 0.25;

    ctx.fillStyle = "#9fe7f5";

    ctx.beginPath();
    ctx.ellipse(
        visorX,
        visorY,
        width * 0.29,
        height * 0.18,
        -0.08,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = "#182329";
    ctx.lineWidth = Math.max(1.5, 3 * scale);
    ctx.stroke();

    // Visor reflection
    ctx.fillStyle = "rgba(255,255,255,0.65)";

    ctx.beginPath();
    ctx.ellipse(
        visorX - width * 0.08,
        visorY - height * 0.04,
        width * 0.08,
        height * 0.045,
        -0.2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Legs
    ctx.fillStyle = player.color || "#d32f2f";

    ctx.fillRect(
        -width * 0.30,
        height * 0.25,
        width * 0.25,
        height * 0.27
    );

    ctx.fillRect(
        width * 0.05,
        height * 0.25,
        width * 0.25,
        height * 0.27
    );

    // Name
    if (camera.zoom > 0.45) {
        ctx.font = `${Math.max(11, 14 * scale)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;

        ctx.strokeText(
            player.name,
            0,
            -height * 0.58
        );

        ctx.fillText(
            player.name,
            0,
            -height * 0.58
        );
    }

    ctx.restore();
}


function drawBody(player) {
    const p = worldToScreen(
        player.x,
        player.y
    );

    const scale = camera.zoom;

    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = player.color || "#d32f2f";

    ctx.beginPath();
    ctx.ellipse(
        0,
        0,
        25 * scale,
        18 * scale,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4 * scale;
    ctx.stroke();

    ctx.fillStyle = "#9fe7f5";

    ctx.beginPath();
    ctx.ellipse(
        7 * scale,
        -4 * scale,
        11 * scale,
        7 * scale,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
}


// ------------------------------------------------------------
// GAME DATA
// ------------------------------------------------------------

async function fetchGame() {
    try {
        const response = await fetch(
            "/api/game",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) return;

        const nextGame = await response.json();

        if (!nextGame || !Array.isArray(nextGame.players)) {
            return;
        }

        if (!game) {
            game = nextGame;

            for (const player of game.players) {
                player.renderX = player.x;
                player.renderY = player.y;
            }

            return;
        }

        for (const nextPlayer of nextGame.players) {
            const oldPlayer = game.players.find(
                p => p.id === nextPlayer.id
            );

            if (oldPlayer) {
                oldPlayer.targetX = nextPlayer.x;
                oldPlayer.targetY = nextPlayer.y;

                Object.assign(
                    oldPlayer,
                    nextPlayer
                );

                oldPlayer.x = oldPlayer.renderX;
                oldPlayer.y = oldPlayer.renderY;
            } else {
                nextPlayer.renderX = nextPlayer.x;
                nextPlayer.renderY = nextPlayer.y;

                game.players.push(nextPlayer);
            }
        }

        game.id = nextGame.id;
        game.phase = nextGame.phase;
        game.round = nextGame.round;
        game.bodies = nextGame.bodies;
        game.events = nextGame.events;
    } catch (error) {
        console.error("Game update failed:", error);
    }
}


// ------------------------------------------------------------
// SMOOTH CREWMATE MOVEMENT
// ------------------------------------------------------------

function updatePlayers(delta) {
    if (!game) return;

    for (const player of game.players) {
        if (typeof player.renderX !== "number") {
            player.renderX = player.x;
            player.renderY = player.y;
        }

        if (typeof player.targetX !== "number") {
            player.targetX = player.x;
        }

        if (typeof player.targetY !== "number") {
            player.targetY = player.y;
        }

        const dx = player.targetX - player.renderX;
        const dy = player.targetY - player.renderY;

        const distance = Math.hypot(dx, dy);

        if (distance < 0.05) {
            player.renderX = player.targetX;
            player.renderY = player.targetY;
            continue;
        }

        // Scale speed to the server's world units.
        // The renderer never teleports the crewmate between updates.
        const speed = CREWMATE_SPEED * delta;

        if (distance <= speed) {
            player.renderX = player.targetX;
            player.renderY = player.targetY;
        } else {
            player.renderX += dx / distance * speed;
            player.renderY += dy / distance * speed;
        }

        player.x = player.renderX;
        player.y = player.renderY;
    }
}


// ------------------------------------------------------------
// RENDER
// ------------------------------------------------------------

function render() {
    const now = performance.now();

    let delta = (now - lastFrame) / 1000;
    lastFrame = now;

    delta = Math.min(delta, 0.05);

    updatePlayers(delta);

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

    drawShip();

    if (game) {
        for (const player of game.players) {
            drawCrewmate(player);
        }
    }

    ctx.restore();

    requestAnimationFrame(render);
}


// ------------------------------------------------------------
// NEW GAME
// ------------------------------------------------------------

newGameButton.addEventListener("click", async () => {
    newGameButton.disabled = true;

    try {
        const response = await fetch(
            "/api/game/new",
            {
                method: "POST"
            }
        );

        if (response.ok) {
            game = null;

            camera.x = 1300;
            camera.y = 800;
            camera.zoom = 0.65;

            clampCamera();

            await fetchGame();
        }
    } catch (error) {
        console.error("Could not start new game:", error);
    }

    newGameButton.disabled = false;
});


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

fetchGame();

setInterval(
    fetchGame,
    500
);

requestAnimationFrame(render);
