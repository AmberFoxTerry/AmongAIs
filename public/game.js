const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let dpr = 1;

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();


// ============================================================
// WORLD
// ============================================================

const WORLD_W = 320;
const WORLD_H = 220;

const ZOOM = 6.5;

const PLAYER_SPEED = 0.22;
const PLAYER_RADIUS = 2.2;

const player = {
    x: 160,
    y: 110,

    vx: 0,
    vy: 0,

    facing: 1,

    walkTime: 0,
    moving: false
};

let camera = {
    x: player.x,
    y: player.y
};

let gameTime = 0;


// ============================================================
// INPUT
// ============================================================

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (
        e.key === " " ||
        e.key.toLowerCase() === "e"
    ) {
        e.preventDefault();
    }

    if (e.key.toLowerCase() === "e" || e.key === " ") {
        interact();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});


// ============================================================
// BUILDINGS
// ============================================================

const buildings = [
    {
        name: "CAFETERIA",
        x: 132,
        y: 82,
        w: 56,
        h: 38,
        door: "bottom"
    },

    {
        name: "MEDBAY",
        x: 52,
        y: 28,
        w: 42,
        h: 30,
        door: "bottom"
    },

    {
        name: "UPPER ENGINE",
        x: 108,
        y: 20,
        w: 42,
        h: 30,
        door: "bottom"
    },

    {
        name: "WEAPONS",
        x: 216,
        y: 28,
        w: 44,
        h: 32,
        door: "bottom"
    },

    {
        name: "REACTOR",
        x: 20,
        y: 88,
        w: 46,
        h: 36,
        door: "right"
    },

    {
        name: "ELECTRICAL",
        x: 76,
        y: 86,
        w: 40,
        h: 34,
        door: "right"
    },

    {
        name: "SECURITY",
        x: 50,
        y: 154,
        w: 44,
        h: 32,
        door: "top"
    },

    {
        name: "LOWER ENGINE",
        x: 112,
        y: 170,
        w: 44,
        h: 30,
        door: "top"
    },

    {
        name: "STORAGE",
        x: 164,
        y: 160,
        w: 50,
        h: 36,
        door: "top"
    },

    {
        name: "ADMIN",
        x: 204,
        y: 82,
        w: 40,
        h: 34,
        door: "left"
    },

    {
        name: "NAVIGATION",
        x: 264,
        y: 76,
        w: 42,
        h: 38,
        door: "left"
    },

    {
        name: "O2",
        x: 246,
        y: 140,
        w: 38,
        h: 32,
        door: "top"
    },

    {
        name: "COMMUNICATIONS",
        x: 270,
        y: 176,
        w: 40,
        h: 28,
        door: "top"
    }
];


// ============================================================
// PATHS
//
// These are deliberately connected directly to the building
// doors rather than just passing vaguely near them.
// ============================================================

const paths = [
    // Main horizontal road
    {
        x: 30,
        y: 67,
        w: 275,
        h: 16
    },

    // Main vertical road
    {
        x: 151,
        y: 40,
        w: 18,
        h: 145
    },

    // Left road
    {
        x: 72,
        y: 43,
        w: 16,
        h: 135
    },

    // Right road
    {
        x: 244,
        y: 48,
        w: 18,
        h: 145
    },

    // Lower horizontal road
    {
        x: 70,
        y: 145,
        w: 205,
        h: 16
    },

    // Reactor door connection
    {
        x: 50,
        y: 96,
        w: 34,
        h: 16
    },

    // Electrical door connection
    {
        x: 108,
        y: 95,
        w: 35,
        h: 16
    },

    // Admin door connection
    {
        x: 230,
        y: 91,
        w: 30,
        h: 16
    },

    // Navigation door connection
    {
        x: 248,
        y: 91,
        w: 28,
        h: 16
    },

    // O2 connection
    {
        x: 257,
        y: 110,
        w: 16,
        h: 35
    },

    // Communications connection
    {
        x: 270,
        y: 150,
        w: 16,
        h: 40
    },

    // Storage connection
    {
        x: 180,
        y: 145,
        w: 18,
        h: 25
    },

    // Lower Engine connection
    {
        x: 125,
        y: 145,
        w: 18,
        h: 28
    },

    // Security connection
    {
        x: 64,
        y: 145,
        w: 18,
        h: 20
    },

    // Cafeteria direct bottom connection
    {
        x: 151,
        y: 116,
        w: 18,
        h: 29
    },

    // MedBay direct bottom connection
    {
        x: 67,
        y: 57,
        w: 12,
        h: 26
    },

    // Upper Engine direct bottom connection
    {
        x: 124,
        y: 50,
        w: 12,
        h: 33
    },

    // Weapons direct bottom connection
    {
        x: 232,
        y: 57,
        w: 12,
        h: 26
    }
];


// ============================================================
// COLLISION WALLS
// ============================================================

const walls = [];

function addWall(x, y, w, h) {
    walls.push({ x, y, w, h });
}

function makeBuildingWalls(b) {
    const gap = 9;

    if (b.door === "bottom") {
        addWall(b.x, b.y, b.w, 2);
        addWall(b.x, b.y, 2, b.h);
        addWall(b.x + b.w - 2, b.y, 2, b.h);

        const doorX = b.x + b.w / 2;

        addWall(
            b.x,
            b.y + b.h - 2,
            doorX - gap / 2 - b.x,
            2
        );

        addWall(
            doorX + gap / 2,
            b.y + b.h - 2,
            b.x + b.w - doorX - gap / 2,
            2
        );
    }

    else if (b.door === "top") {
        addWall(b.x, b.y + b.h - 2, b.w, 2);
        addWall(b.x, b.y, 2, b.h);
        addWall(b.x + b.w - 2, b.y, 2, b.h);

        const doorX = b.x + b.w / 2;

        addWall(
            b.x,
            b.y,
            doorX - gap / 2 - b.x,
            2
        );

        addWall(
            doorX + gap / 2,
            b.y,
            b.x + b.w - doorX - gap / 2,
            2
        );
    }

    else if (b.door === "left") {
        addWall(b.x, b.y, b.w, 2);
        addWall(b.x, b.y + b.h - 2, b.w, 2);
        addWall(b.x + b.w - 2, b.y, 2, b.h);

        const doorY = b.y + b.h / 2;

        addWall(
            b.x,
            b.y,
            2,
            doorY - gap / 2 - b.y
        );

        addWall(
            b.x,
            doorY + gap / 2,
            2,
            b.y + b.h - doorY - gap / 2
        );
    }

    else if (b.door === "right") {
        addWall(b.x, b.y, b.w, 2);
        addWall(b.x, b.y + b.h - 2, b.w, 2);
        addWall(b.x, b.y, 2, b.h);

        const doorY = b.y + b.h / 2;

        addWall(
            b.x + b.w - 2,
            b.y,
            2,
            doorY - gap / 2 - b.y
        );

        addWall(
            b.x + b.w - 2,
            doorY + gap / 2,
            2,
            b.y + b.h - doorY - gap / 2
        );
    }
}

for (const b of buildings) {
    makeBuildingWalls(b);
}


// ============================================================
// WORLD BORDER
// ============================================================

const BORDER = 5;

addWall(0, 0, WORLD_W, BORDER);
addWall(0, WORLD_H - BORDER, WORLD_W, BORDER);
addWall(0, 0, BORDER, WORLD_H);
addWall(WORLD_W - BORDER, 0, BORDER, WORLD_H);


// ============================================================
// TASK POOLS
// ============================================================

const shortTasks = [
    {
        name: "Swipe Card",
        room: "ADMIN",
        x: 219,
        y: 99,
        time: 2.5
    },

    {
        name: "Inspect Sample",
        room: "MEDBAY",
        x: 73,
        y: 43,
        time: 2.5
    },

    {
        name: "Clean Vent",
        room: "ELECTRICAL",
        x: 94,
        y: 103,
        time: 2.5
    },

    {
        name: "Align Antenna",
        room: "COMMUNICATIONS",
        x: 290,
        y: 190,
        time: 2.5
    },

    {
        name: "Check Monitor",
        room: "SECURITY",
        x: 72,
        y: 169,
        time: 2.5
    },

    {
        name: "Press Button",
        room: "CAFETERIA",
        x: 160,
        y: 101,
        time: 2.5
    },

    {
        name: "Check Oxygen",
        room: "O2",
        x: 265,
        y: 156,
        time: 2.5
    },

    {
        name: "Sort Crates",
        room: "STORAGE",
        x: 189,
        y: 177,
        time: 2.5
    },

    {
        name: "Calibrate Radar",
        room: "NAVIGATION",
        x: 285,
        y: 96,
        time: 2.5
    }
];

const mediumTasks = [
    {
        name: "Fix Wiring",
        room: "ELECTRICAL",
        x: 96,
        y: 103,
        time: 5
    },

    {
        name: "Clear Weapons",
        room: "WEAPONS",
        x: 238,
        y: 43,
        time: 5
    },

    {
        name: "Fuel Engine",
        room: "LOWER ENGINE",
        x: 134,
        y: 184,
        time: 5
    },

    {
        name: "Stabilize Reactor",
        room: "REACTOR",
        x: 43,
        y: 106,
        time: 5
    },

    {
        name: "Upload Data",
        room: "ADMIN",
        x: 222,
        y: 98,
        time: 5
    },

    {
        name: "Tune Navigation",
        room: "NAVIGATION",
        x: 285,
        y: 96,
        time: 5
    }
];

const longTasks = [
    {
        name: "Repair Communications",
        room: "COMMUNICATIONS",
        x: 290,
        y: 190,
        time: 10
    },

    {
        name: "Start Engine",
        room: "UPPER ENGINE",
        x: 129,
        y: 35,
        time: 10
    },

    {
        name: "Reboot Reactor",
        room: "REACTOR",
        x: 43,
        y: 106,
        time: 10
    }
];


// ============================================================
// RANDOM TASK SELECTION
// ============================================================

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] =
            [result[j], result[i]];
    }

    return result;
}

function chooseTasks(pool, amount) {
    return shuffle(pool)
        .slice(0, amount)
        .map(task => ({
            ...task,
            completed: false,
            progress: 0,
            active: false
        }));
}

let selectedTasks = [];

function generateTasks() {
    const shorts = chooseTasks(shortTasks, 3);
    const mediums = chooseTasks(mediumTasks, 3);
    const longs = chooseTasks(longTasks, 1);

    selectedTasks = [
        ...shorts,
        ...mediums,
        ...longs
    ];

    shuffle(selectedTasks);
}

generateTasks();


// ============================================================
// TASK STATE
// ============================================================

let currentTask = null;
let taskProgress = 0;

function distance(a, b) {
    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}

function interact() {
    if (currentTask) {
        return;
    }

    let closest = null;
    let closestDistance = Infinity;

    for (const task of selectedTasks) {
        if (task.completed) {
            continue;
        }

        const d = distance(player, task);

        if (d < closestDistance) {
            closest = task;
            closestDistance = d;
        }
    }

    if (closest && closestDistance < 6) {
        currentTask = closest;
        currentTask.active = true;
        taskProgress = 0;
    }
}


// ============================================================
// DECORATION
// ============================================================

const trees = [];
const rocks = [];

function randomDecor() {
    trees.length = 0;
    rocks.length = 0;

    for (let i = 0; i < 130; i++) {
        const x = 8 + Math.random() * (WORLD_W - 16);
        const y = 8 + Math.random() * (WORLD_H - 16);

        let insideBuilding = false;
        let insidePath = false;

        for (const b of buildings) {
            if (
                x > b.x - 5 &&
                x < b.x + b.w + 5 &&
                y > b.y - 5 &&
                y < b.y + b.h + 5
            ) {
                insideBuilding = true;
                break;
            }
        }

        if (!insideBuilding) {
            for (const p of paths) {
                if (
                    x > p.x - 3 &&
                    x < p.x + p.w + 3 &&
                    y > p.y - 3 &&
                    y < p.y + p.h + 3
                ) {
                    insidePath = true;
                    break;
                }
            }
        }

        if (!insideBuilding && !insidePath) {
            trees.push({
                x,
                y,
                size: 1.2 + Math.random() * 1.5,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    for (let i = 0; i < 90; i++) {
        const x = 7 + Math.random() * (WORLD_W - 14);
        const y = 7 + Math.random() * (WORLD_H - 14);

        rocks.push({
            x,
            y,
            size: 0.4 + Math.random() * 1.2,
            rotation: Math.random() * Math.PI
        });
    }
}

randomDecor();


// ============================================================
// COLLISION
// ============================================================

function circleRectCollision(cx, cy, radius, rect) {
    const closestX = Math.max(
        rect.x,
        Math.min(cx, rect.x + rect.w)
    );

    const closestY = Math.max(
        rect.y,
        Math.min(cy, rect.y + rect.h)
    );

    const dx = cx - closestX;
    const dy = cy - closestY;

    return dx * dx + dy * dy < radius * radius;
}

function canMoveTo(x, y) {
    for (const wall of walls) {
        if (
            circleRectCollision(
                x,
                y,
                PLAYER_RADIUS,
                wall
            )
        ) {
            return false;
        }
    }

    return true;
}

function movePlayer(dx, dy) {
    const nextX = player.x + dx;

    if (canMoveTo(nextX, player.y)) {
        player.x = nextX;
    }

    const nextY = player.y + dy;

    if (canMoveTo(player.x, nextY)) {
        player.y = nextY;
    }
}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {
    const targetX = player.x;
    const targetY = player.y;

    camera.x +=
        (targetX - camera.x) * 0.14;

    camera.y +=
        (targetY - camera.y) * 0.14;
}

function worldToScreen(x, y) {
    return {
        x: (x - camera.x) * ZOOM + W / 2,
        y: (y - camera.y) * ZOOM + H / 2
    };
}


// ============================================================
// BACKGROUND / SPACE
// ============================================================

function drawSpace() {
    const gradient = ctx.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        Math.max(W, H)
    );

    gradient.addColorStop(0, "#14192b");
    gradient.addColorStop(0.55, "#090c19");
    gradient.addColorStop(1, "#030409");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // stars
    ctx.save();

    for (let i = 0; i < 100; i++) {
        const sx =
            ((i * 173.31) % W + W) % W;

        const sy =
            ((i * 97.71) % H + H) % H;

        const pulse =
            0.45 +
            Math.sin(gameTime * 1.5 + i) * 0.2;

        ctx.globalAlpha = Math.max(
            0.15,
            pulse
        );

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();
        ctx.arc(
            sx,
            sy,
            i % 5 === 0 ? 1.3 : 0.7,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();

    // Planet atmosphere behind world
    const planet = worldToScreen(
        WORLD_W / 2,
        WORLD_H / 2
    );

    const planetRadius =
        Math.max(W, H) * 0.8;

    const glow = ctx.createRadialGradient(
        planet.x,
        planet.y,
        planetRadius * 0.65,
        planet.x,
        planet.y,
        planetRadius
    );

    glow.addColorStop(0, "rgba(70,130,160,0)");
    glow.addColorStop(0.75, "rgba(70,150,190,0.05)");
    glow.addColorStop(1, "rgba(100,190,220,0.2)");

    ctx.fillStyle = glow;

    ctx.beginPath();
    ctx.arc(
        planet.x,
        planet.y,
        planetRadius,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


// ============================================================
// PLANET GROUND
// ============================================================

function drawGround() {
    const topLeft = worldToScreen(0, 0);
    const bottomRight =
        worldToScreen(WORLD_W, WORLD_H);

    ctx.save();

    ctx.fillStyle = "#334b38";

    ctx.fillRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
    );

    // Ground variation
    ctx.globalAlpha = 0.15;

    for (let x = 0; x < WORLD_W; x += 4) {
        for (let y = 0; y < WORLD_H; y += 4) {
            const noise =
                Math.sin(x * 12.3 + y * 4.7);

            if (noise > 0.2) {
                const p = worldToScreen(x, y);

                ctx.fillStyle =
                    noise > 0.7
                        ? "#8fa35d"
                        : "#263d2d";

                ctx.fillRect(
                    p.x,
                    p.y,
                    ZOOM * 0.5,
                    ZOOM * 0.5
                );
            }
        }
    }

    ctx.globalAlpha = 1;

    ctx.restore();
}


// ============================================================
// PATHS
// ============================================================

function drawPaths() {
    ctx.save();

    for (const p of paths) {
        const s = worldToScreen(p.x, p.y);

        ctx.fillStyle = "#687278";

        ctx.fillRect(
            s.x,
            s.y,
            p.w * ZOOM,
            p.h * ZOOM
        );

        ctx.fillStyle = "#798187";

        ctx.globalAlpha = 0.35;

        ctx.fillRect(
            s.x,
            s.y,
            p.w * ZOOM,
            1.2 * ZOOM
        );

        ctx.globalAlpha = 1;

        // small path markings
        ctx.strokeStyle = "rgba(30,35,38,0.25)";
        ctx.lineWidth = 0.8 * ZOOM;

        for (
            let x = p.x + 4;
            x < p.x + p.w;
            x += 8
        ) {
            const a = worldToScreen(
                x,
                p.y + p.h / 2
            );

            ctx.beginPath();

            ctx.moveTo(
                a.x,
                a.y
            );

            ctx.lineTo(
                a.x + 2 * ZOOM,
                a.y
            );

            ctx.stroke();
        }
    }

    ctx.restore();
}


// ============================================================
// TREES
// ============================================================

function drawTrees() {
    ctx.save();

    for (const tree of trees) {
        const p = worldToScreen(
            tree.x,
            tree.y
        );

        const sway =
            Math.sin(
                gameTime * 1.5 +
                tree.phase
            ) * 1.2;

        const s = tree.size * ZOOM;

        // shadow
        ctx.fillStyle =
            "rgba(0,0,0,0.22)";

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y + s * 0.5,
            s * 0.9,
            s * 0.3,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // trunk
        ctx.fillStyle = "#554331";

        ctx.fillRect(
            p.x - s * 0.12,
            p.y - s * 0.2,
            s * 0.24,
            s * 0.75
        );

        // leaves
        ctx.fillStyle = "#1f5a3b";

        ctx.beginPath();

        ctx.arc(
            p.x + sway,
            p.y - s * 0.35,
            s * 0.55,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#34734b";

        ctx.beginPath();

        ctx.arc(
            p.x - s * 0.25 + sway,
            p.y - s * 0.5,
            s * 0.38,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();
}


// ============================================================
// ROCKS
// ============================================================

function drawRocks() {
    ctx.save();

    for (const rock of rocks) {
        const p = worldToScreen(
            rock.x,
            rock.y
        );

        const s = rock.size * ZOOM;

        ctx.save();

        ctx.translate(p.x, p.y);
        ctx.rotate(rock.rotation);

        ctx.fillStyle = "#4b5550";

        ctx.beginPath();

        ctx.moveTo(-s, 0);
        ctx.lineTo(-s * 0.45, -s * 0.7);
        ctx.lineTo(s * 0.55, -s * 0.6);
        ctx.lineTo(s, s * 0.15);
        ctx.lineTo(s * 0.3, s * 0.7);
        ctx.lineTo(-s * 0.7, s * 0.55);

        ctx.closePath();
        ctx.fill();

        ctx.fillStyle =
            "rgba(255,255,255,0.12)";

        ctx.beginPath();

        ctx.moveTo(
            -s * 0.4,
            -s * 0.35
        );

        ctx.lineTo(
            s * 0.35,
            -s * 0.3
        );

        ctx.lineTo(
            s * 0.1,
            -s * 0.05
        );

        ctx.closePath();

        ctx.fill();

        ctx.restore();
    }

    ctx.restore();
}


// ============================================================
// BUILDINGS
// ============================================================

function drawBuildingInterior(b) {
    const x = b.x;
    const y = b.y;
    const w = b.w;
    const h = b.h;

    const p = worldToScreen(x, y);

    ctx.save();

    // Interior floor
    ctx.fillStyle = "#252b2f";

    ctx.fillRect(
        p.x + 2 * ZOOM,
        p.y + 2 * ZOOM,
        (w - 4) * ZOOM,
        (h - 4) * ZOOM
    );

    // Floor panels
    ctx.strokeStyle =
        "rgba(255,255,255,0.035)";

    ctx.lineWidth = 0.6 * ZOOM;

    for (let xx = x + 5; xx < x + w; xx += 6) {
        const a = worldToScreen(xx, y + 2);
        const c = worldToScreen(xx, y + h - 2);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
    }

    for (let yy = y + 5; yy < y + h; yy += 6) {
        const a = worldToScreen(x + 2, yy);
        const c = worldToScreen(x + w - 2, yy);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
    }

    drawRoomFurniture(b);

    ctx.restore();
}


function drawRoomFurniture(b) {
    const p = worldToScreen(b.x, b.y);

    const sx = ZOOM;

    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;

        ctx.fillRect(
            p.x + x * sx,
            p.y + y * sx,
            w * sx,
            h * sx
        );
    }

    function circle(x, y, r, color) {
        ctx.fillStyle = color;

        ctx.beginPath();

        ctx.arc(
            p.x + x * sx,
            p.y + y * sx,
            r * sx,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    switch (b.name) {

        case "CAFETERIA":
            for (const pos of [
                [10, 9],
                [28, 9],
                [10, 25],
                [28, 25],
                [44, 17]
            ]) {
                circle(
                    pos[0],
                    pos[1],
                    3,
                    "#566068"
                );

                circle(
                    pos[0],
                    pos[1],
                    1.2,
                    "#80898d"
                );
            }

            rect(
                3,
                3,
                50,
                3,
                "#424a4f"
            );

            break;


        case "MEDBAY":
            rect(
                6,
                7,
                12,
                5,
                "#a9b7b8"
            );

            rect(
                24,
                7,
                12,
                5,
                "#a9b7b8"
            );

            rect(
                6,
                21,
                12,
                5,
                "#a9b7b8"
            );

            rect(
                24,
                21,
                12,
                5,
                "#a9b7b8"
            );

            circle(
                20,
                15,
                3,
                "#55a8a0"
            );

            break;


        case "UPPER ENGINE":
        case "LOWER ENGINE":
            for (let i = 0; i < 3; i++) {
                rect(
                    7 + i * 11,
                    6,
                    7,
                    18,
                    "#414a4f"
                );

                circle(
                    10.5 + i * 11,
                    15,
                    2.2,
                    "#6d8c91"
                );
            }

            break;


        case "WEAPONS":
            rect(
                6,
                7,
                30,
                5,
                "#454f54"
            );

            rect(
                12,
                17,
                18,
                7,
                "#30383c"
            );

            circle(
                21,
                20,
                2.5,
                "#68a8b5"
            );

            break;


        case "REACTOR":
            circle(
                23,
                18,
                9,
                "#39464a"
            );

            circle(
                23,
                18,
                6,
                "#507f84"
            );

            circle(
                23,
                18,
                2.5,
                "#a3e3d7"
            );

            break;


        case "ELECTRICAL":
            for (let i = 0; i < 3; i++) {
                rect(
                    5 + i * 11,
                    8,
                    8,
                    18,
                    "#444d50"
                );

                circle(
                    9 + i * 11,
                    13,
                    1.5,
                    "#a8bd72"
                );

                circle(
                    9 + i * 11,
                    20,
                    1.5,
                    "#c28c61"
                );
            }

            break;


        case "SECURITY":
            for (let i = 0; i < 3; i++) {
                rect(
                    5 + i * 12,
                    7,
                    9,
                    7,
                    "#1a3036"
                );
            }

            rect(
                9,
                19,
                25,
                5,
                "#3e484d"
            );

            break;


        case "STORAGE":
            for (let yy = 6; yy < 30; yy += 8) {
                for (let xx = 5; xx < 43; xx += 10) {
                    rect(
                        xx,
                        yy,
                        7,
                        6,
                        "#675c49"
                    );
                }
            }

            break;


        case "ADMIN":
            rect(
                7,
                8,
                26,
                6,
                "#3b484c"
            );

            rect(
                10,
                20,
                20,
                5,
                "#455257"
            );

            break;


        case "NAVIGATION":
            rect(
                5,
                8,
                30,
                8,
                "#243a42"
            );

            circle(
                20,
                12,
                4,
                "#68a5b0"
            );

            rect(
                11,
                23,
                18,
                5,
                "#48555b"
            );

            break;


        case "O2":
            for (let i = 0; i < 3; i++) {
                circle(
                    10 + i * 9,
                    17,
                    4,
                    "#4d6769"
                );

                circle(
                    10 + i * 9,
                    17,
                    2.5,
                    "#709a99"
                );
            }

            break;


        case "COMMUNICATIONS":
            rect(
                6,
                8,
                27,
                6,
                "#39464b"
            );

            rect(
                10,
                19,
                19,
                5,
                "#48555a"
            );

            break;
    }
}


function drawBuildings() {
    for (const b of buildings) {
        const p = worldToScreen(
            b.x,
            b.y
        );

        // Building shadow
        ctx.fillStyle =
            "rgba(0,0,0,0.32)";

        ctx.fillRect(
            p.x + 2 * ZOOM,
            p.y + 3 * ZOOM,
            b.w * ZOOM,
            b.h * ZOOM
        );

        // Building shell
        ctx.fillStyle = "#394247";

        ctx.fillRect(
            p.x,
            p.y,
            b.w * ZOOM,
            b.h * ZOOM
        );

        drawBuildingInterior(b);

        // roof
        ctx.fillStyle = "#566168";

        ctx.fillRect(
            p.x,
            p.y,
            b.w * ZOOM,
            3 * ZOOM
        );

        // roof highlights
        ctx.fillStyle =
            "rgba(255,255,255,0.08)";

        ctx.fillRect(
            p.x,
            p.y,
            b.w * ZOOM,
            0.8 * ZOOM
        );

        // windows
        ctx.fillStyle = "#1c363e";

        for (let wx = b.x + 5; wx < b.x + b.w - 4; wx += 8) {
            const win = worldToScreen(
                wx,
                b.y + 2
            );

            ctx.fillRect(
                win.x,
                win.y,
                4 * ZOOM,
                1.5 * ZOOM
            );
        }

        // door
        drawDoor(b);

        // label
        ctx.save();

        ctx.font =
            `bold ${Math.max(8, 2.3 * ZOOM)}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillStyle =
            "rgba(255,255,255,0.78)";

        ctx.fillText(
            b.name,
            p.x + b.w * ZOOM / 2,
            p.y - 1 * ZOOM
        );

        ctx.restore();
    }
}


function drawDoor(b) {
    let dx = b.x;
    let dy = b.y;

    const dw = 9;
    const dh = 3;

    if (b.door === "bottom") {
        dx = b.x + b.w / 2 - dw / 2;
        dy = b.y + b.h - 2;
    }

    if (b.door === "top") {
        dx = b.x + b.w / 2 - dw / 2;
        dy = b.y - 1;
    }

    if (b.door === "left") {
        dx = b.x - 1;
        dy = b.y + b.h / 2 - dw / 2;
    }

    if (b.door === "right") {
        dx = b.x + b.w - 2;
        dy = b.y + b.h / 2 - dw / 2;
    }

    const p = worldToScreen(dx, dy);

    ctx.fillStyle = "#82d6c2";

    if (
        b.door === "bottom" ||
        b.door === "top"
    ) {
        ctx.fillRect(
            p.x,
            p.y,
            dw * ZOOM,
            dh * ZOOM
        );
    } else {
        ctx.fillRect(
            p.x,
            p.y,
            dh * ZOOM,
            dw * ZOOM
        );
    }

    ctx.fillStyle =
        "rgba(255,255,255,0.35)";

    if (
        b.door === "bottom" ||
        b.door === "top"
    ) {
        ctx.fillRect(
            p.x,
            p.y,
            dw * ZOOM,
            0.5 * ZOOM
        );
    } else {
        ctx.fillRect(
            p.x,
            p.y,
            0.5 * ZOOM,
            dw * ZOOM
        );
    }
}


// ============================================================
// WORLD BARRIER
// ============================================================

function drawBarrier() {
    const top = worldToScreen(0, 0);
    const bottom =
        worldToScreen(WORLD_W, WORLD_H);

    ctx.save();

    ctx.strokeStyle =
        "rgba(85,220,255,0.85)";

    ctx.shadowColor =
        "rgba(60,210,255,0.8)";

    ctx.shadowBlur = 14;

    ctx.lineWidth =
        1.5 * ZOOM;

    ctx.strokeRect(
        top.x,
        top.y,
        bottom.x - top.x,
        bottom.y - top.y
    );

    ctx.shadowBlur = 0;

    ctx.strokeStyle =
        "rgba(150,240,255,0.35)";

    ctx.lineWidth =
        0.6 * ZOOM;

    const pulse =
        Math.sin(gameTime * 3) * 0.5 + 0.5;

    ctx.globalAlpha =
        0.25 + pulse * 0.45;

    ctx.strokeRect(
        top.x + 1.5 * ZOOM,
        top.y + 1.5 * ZOOM,
        bottom.x - top.x - 3 * ZOOM,
        bottom.y - top.y - 3 * ZOOM
    );

    ctx.restore();

    // Barrier warning markings
    ctx.save();

    ctx.fillStyle =
        "rgba(120,220,255,0.7)";

    const spacing = 8;

    for (
        let x = BORDER;
        x < WORLD_W - BORDER;
        x += spacing
    ) {
        const a = worldToScreen(
            x,
            BORDER
        );

        ctx.fillRect(
            a.x,
            a.y,
            2 * ZOOM,
            0.6 * ZOOM
        );

        const b = worldToScreen(
            x,
            WORLD_H - BORDER
        );

        ctx.fillRect(
            b.x,
            b.y,
            2 * ZOOM,
            0.6 * ZOOM
        );
    }

    ctx.restore();
}


// ============================================================
// TASK MARKERS
// ============================================================

function drawTaskMarkers() {
    for (const task of selectedTasks) {
        if (task.completed) {
            continue;
        }

        const p = worldToScreen(
            task.x,
            task.y
        );

        const pulse =
            Math.sin(gameTime * 4 + task.x) *
            0.15 +
            1;

        const nearby =
            distance(player, task) < 6;

        ctx.save();

        ctx.globalAlpha =
            nearby ? 1 : 0.72;

        ctx.fillStyle =
            task.time <= 2.5
                ? "#5cff83"
                : task.time <= 5
                    ? "#ffd75c"
                    : "#ff705c";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            2.1 * ZOOM * pulse,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            0.65 * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fill();

        if (nearby) {
            ctx.font =
                `bold ${2.1 * ZOOM}px Arial`;

            ctx.textAlign = "center";

            ctx.fillStyle = "#ffffff";

            ctx.fillText(
                "E",
                p.x,
                p.y - 3.5 * ZOOM
            );
        }

        ctx.restore();
    }
}


// ============================================================
// PLAYER
// ============================================================

function drawPlayer() {
    const p = worldToScreen(
        player.x,
        player.y
    );

    const moving = player.moving;

    const bob =
        moving
            ? Math.sin(player.walkTime * 12) * 0.7
            : Math.sin(gameTime * 2) * 0.15;

    const leg =
        moving
            ? Math.sin(player.walkTime * 12) * 0.8
            : 0;

    const s = ZOOM;

    ctx.save();

    ctx.translate(
        p.x,
        p.y + bob * s
    );

    // Shadow
    ctx.save();

    ctx.globalAlpha = 0.3;

    ctx.fillStyle = "#000000";

    ctx.beginPath();

    ctx.ellipse(
        0,
        2.9 * s,
        2.5 * s,
        0.8 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();


    // backpack
    ctx.fillStyle = "#a82730";

    ctx.beginPath();

    ctx.roundRect(
        -2.6 * s,
        -2.2 * s,
        1.8 * s,
        4.5 * s,
        0.8 * s
    );

    ctx.fill();


    // legs
    ctx.fillStyle = "#8e2028";

    ctx.beginPath();

    ctx.roundRect(
        -1.5 * s + leg * s * 0.35,
        1.1 * s,
        1.25 * s,
        2.0 * s,
        0.55 * s
    );

    ctx.fill();

    ctx.beginPath();

    ctx.roundRect(
        0.25 * s - leg * s * 0.35,
        1.1 * s,
        1.25 * s,
        2.0 * s,
        0.55 * s
    );

    ctx.fill();


    // body
    ctx.fillStyle = "#d93643";

    ctx.beginPath();

    ctx.roundRect(
        -2.0 * s,
        -3.3 * s,
        4.0 * s,
        5.8 * s,
        1.7 * s
    );

    ctx.fill();


    // body highlight
    ctx.fillStyle =
        "rgba(255,255,255,0.10)";

    ctx.beginPath();

    ctx.roundRect(
        -1.55 * s,
        -2.7 * s,
        0.7 * s,
        3.4 * s,
        0.35 * s
    );

    ctx.fill();


    // visor
    const visorOffset =
        player.facing > 0
            ? 0.35
            : -0.35;

    ctx.fillStyle = "#142e3c";

    ctx.beginPath();

    ctx.ellipse(
        visorOffset * s,
        -1.75 * s,
        1.65 * s,
        1.05 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#8de0f1";

    ctx.beginPath();

    ctx.ellipse(
        (visorOffset + 0.35) * s,
        -2.0 * s,
        0.95 * s,
        0.43 * s,
        -0.15,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // visor shine
    ctx.fillStyle =
        "rgba(255,255,255,0.45)";

    ctx.beginPath();

    ctx.ellipse(
        (visorOffset + 0.65) * s,
        -2.15 * s,
        0.3 * s,
        0.12 * s,
        -0.15,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


// ============================================================
// TASK PANEL
// ============================================================

function drawTaskUI() {
    const completed =
        selectedTasks.filter(t => t.completed).length;

    const total = selectedTasks.length;

    ctx.save();

    // top task counter
    const panelW = 250;
    const panelH = 74;

    ctx.fillStyle =
        "rgba(8,12,16,0.82)";

    ctx.strokeStyle =
        "rgba(255,255,255,0.14)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.roundRect(
        16,
        16,
        panelW,
        panelH,
        10
    );

    ctx.fill();
    ctx.stroke();

    ctx.font =
        "bold 15px Arial";

    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "left";

    ctx.fillText(
        "TASKS",
        30,
        38
    );

    ctx.font =
        "13px Arial";

    ctx.fillStyle =
        "#aeb8bd";

    ctx.fillText(
        `${completed} / ${total} completed`,
        30,
        58
    );

    // progress bar
    ctx.fillStyle =
        "rgba(255,255,255,0.1)";

    ctx.fillRect(
        30,
        64,
        210,
        7
    );

    ctx.fillStyle = "#69d98c";

    ctx.fillRect(
        30,
        64,
        210 * (completed / total),
        7
    );


    // selected tasks list
    let y = 112;

    ctx.font = "12px Arial";

    for (const task of selectedTasks) {
        ctx.fillStyle =
            task.completed
                ? "#69d98c"
                : "#ffffff";

        ctx.fillText(
            task.completed
                ? "✓ " + task.name
                : "• " + task.name,
            20,
            y
        );

        y += 17;
    }

    ctx.restore();
}


// ============================================================
// INTERACTION UI
// ============================================================

function drawInteractionUI() {
    if (currentTask) {
        drawTaskProgress();
        return;
    }

    let closest = null;
    let closestDistance = Infinity;

    for (const task of selectedTasks) {
        if (task.completed) {
            continue;
        }

        const d = distance(player, task);

        if (d < closestDistance) {
            closest = task;
            closestDistance = d;
        }
    }

    if (
        closest &&
        closestDistance < 6
    ) {
        ctx.save();

        const boxW = 270;
        const boxH = 48;

        const x =
            W / 2 - boxW / 2;

        const y =
            H - 82;

        ctx.fillStyle =
            "rgba(8,12,16,0.9)";

        ctx.strokeStyle =
            "rgba(255,255,255,0.2)";

        ctx.beginPath();

        ctx.roundRect(
            x,
            y,
            boxW,
            boxH,
            10
        );

        ctx.fill();
        ctx.stroke();

        ctx.font =
            "bold 14px Arial";

        ctx.fillStyle = "#ffffff";

        ctx.textAlign = "center";

        ctx.fillText(
            `Press E to ${closest.name}`,
            W / 2,
            y + 29
        );

        ctx.restore();
    }
}


function drawTaskProgress() {
    const boxW = 360;
    const boxH = 110;

    const x =
        W / 2 - boxW / 2;

    const y =
        H / 2 - boxH / 2;

    ctx.save();

    ctx.fillStyle =
        "rgba(7,10,14,0.95)";

    ctx.strokeStyle =
        "rgba(255,255,255,0.2)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        boxW,
        boxH,
        14
    );

    ctx.fill();
    ctx.stroke();

    ctx.font =
        "bold 18px Arial";

    ctx.textAlign = "center";

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        currentTask.name,
        W / 2,
        y + 34
    );

    ctx.font =
        "12px Arial";

    ctx.fillStyle =
        "#aeb8bd";

    ctx.fillText(
        "Completing task...",
        W / 2,
        y + 55
    );

    // progress background
    ctx.fillStyle =
        "rgba(255,255,255,0.1)";

    ctx.fillRect(
        x + 35,
        y + 73,
        boxW - 70,
        12
    );

    ctx.fillStyle =
        currentTask.time <= 2.5
            ? "#5cff83"
            : currentTask.time <= 5
                ? "#ffd75c"
                : "#ff705c";

    ctx.fillRect(
        x + 35,
        y + 73,
        (boxW - 70) *
            Math.min(
                1,
                taskProgress /
                currentTask.time
            ),
        12
    );

    ctx.font =
        "11px Arial";

    ctx.fillStyle = "#9aa4a9";

    ctx.fillText(
        "Press E to cancel",
        W / 2,
        y + 101
    );

    ctx.restore();
}


// ============================================================
// MINI COMPASS
// ============================================================

function drawCompass() {
    ctx.save();

    const cx = W - 75;
    const cy = 55;

    ctx.fillStyle =
        "rgba(8,12,16,0.72)";

    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "rgba(255,255,255,0.15)";

    ctx.stroke();

    ctx.font =
        "bold 10px Arial";

    ctx.textAlign = "center";

    ctx.fillStyle = "#aeb8bd";

    ctx.fillText("N", cx, cy - 19);
    ctx.fillText("S", cx, cy + 23);
    ctx.fillText("W", cx - 20, cy + 4);
    ctx.fillText("E", cx + 20, cy + 4);

    ctx.restore();
}


// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(dt) {
    if (currentTask) {
        player.moving = false;
        return;
    }

    let dx = 0;
    let dy = 0;

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {
        dy -= 1;
    }

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {
        dy += 1;
    }

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {
        dx -= 1;
    }

    if (
        keys["d"] ||
        keys["arrowright"]
    ) {
        dx += 1;
    }

    if (dx !== 0 || dy !== 0) {
        const len =
            Math.hypot(dx, dy);

        dx /= len;
        dy /= len;

        player.moving = true;

        if (dx !== 0) {
            player.facing =
                dx > 0 ? 1 : -1;
        }

        movePlayer(
            dx * PLAYER_SPEED * dt,
            dy * PLAYER_SPEED * dt
        );

        player.walkTime +=
            dt / 1000;
    } else {
        player.moving = false;
    }
}


// ============================================================
// TASK UPDATE
// ============================================================

function updateTask(dt) {
    if (!currentTask) {
        return;
    }

    if (
        keys["e"] ||
        keys[" "]
    ) {
        return;
    }

    taskProgress += dt / 1000;

    if (
        taskProgress >=
        currentTask.time
    ) {
        currentTask.progress = 1;
        currentTask.completed = true;
        currentTask.active = false;

        currentTask = null;
        taskProgress = 0;
    }
}


// ============================================================
// VICTORY
// ============================================================

function allTasksComplete() {
    return selectedTasks.every(
        task => task.completed
    );
}

function drawVictory() {
    if (!allTasksComplete()) {
        return;
    }

    ctx.save();

    ctx.fillStyle =
        "rgba(0,0,0,0.62)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.textAlign = "center";

    ctx.font =
        "bold 42px Arial";

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        "ALL TASKS COMPLETE",
        W / 2,
        H / 2 - 25
    );

    ctx.font =
        "18px Arial";

    ctx.fillStyle =
        "#69d98c";

    ctx.fillText(
        "The planet is safe.",
        W / 2,
        H / 2 + 15
    );

    ctx.font =
        "13px Arial";

    ctx.fillStyle =
        "#aeb8bd";

    ctx.fillText(
        "Refresh the page to start a new round.",
        W / 2,
        H / 2 + 50
    );

    ctx.restore();
}


// ============================================================
// MAIN DRAW
// ============================================================

function draw() {
    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawSpace();

    drawGround();

    drawPaths();

    drawTrees();

    drawRocks();

    drawBuildings();

    drawBarrier();

    drawTaskMarkers();

    drawPlayer();

    drawTaskUI();

    drawCompass();

    drawInteractionUI();

    drawVictory();
}


// ============================================================
// GAME LOOP
// ============================================================

let lastTime = performance.now();

function gameLoop(now) {
    const dt = Math.min(
        50,
        now - lastTime
    );

    lastTime = now;

    gameTime += dt / 1000;

    updatePlayer(dt);
    updateTask(dt);
    updateCamera();

    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
