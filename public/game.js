const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const WORLD_W = 220;
const WORLD_H = 150;

const PLAYER_RADIUS = 1.7;
const PLAYER_SPEED = 0.18;

let cameraX = 110;
let cameraY = 75;
const ZOOM = 5;

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (
        ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(
            e.key.toLowerCase()
        )
    ) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();


// ============================================================
// PLAYER
// ============================================================

const player = {
    x: 110,
    y: 75,
    color: "#d94b4b",
    facing: 0
};


// ============================================================
// MAP
// ============================================================

const rooms = [
    {
        name: "CAFETERIA",
        x: 78,
        y: 56,
        w: 64,
        h: 38
    },

    {
        name: "UPPER ENGINE",
        x: 15,
        y: 10,
        w: 42,
        h: 30
    },

    {
        name: "MEDBAY",
        x: 60,
        y: 10,
        w: 30,
        h: 30
    },

    {
        name: "WEAPONS",
        x: 150,
        y: 10,
        w: 38,
        h: 30
    },

    {
        name: "REACTOR",
        x: 8,
        y: 60,
        w: 35,
        h: 32
    },

    {
        name: "ELECTRICAL",
        x: 45,
        y: 60,
        w: 28,
        h: 30
    },

    {
        name: "ADMIN",
        x: 145,
        y: 60,
        w: 32,
        h: 30
    },

    {
        name: "NAVIGATION",
        x: 192,
        y: 52,
        w: 24,
        h: 38
    },

    {
        name: "LOWER ENGINE",
        x: 15,
        y: 108,
        w: 42,
        h: 30
    },

    {
        name: "SECURITY",
        x: 60,
        y: 108,
        w: 30,
        h: 30
    },

    {
        name: "STORAGE",
        x: 94,
        y: 105,
        w: 44,
        h: 33
    },

    {
        name: "O2",
        x: 145,
        y: 105,
        w: 30,
        h: 33
    },

    {
        name: "COMMUNICATIONS",
        x: 184,
        y: 105,
        w: 32,
        h: 33
    }
];


// ============================================================
// CORRIDORS
// ============================================================

const corridors = [
    // Main horizontal corridor
    { x: 43, y: 67, w: 35, h: 14 },
    { x: 142, y: 67, w: 50, h: 14 },

    // Left vertical corridor
    { x: 30, y: 40, w: 14, h: 68 },

    // Center vertical corridor
    { x: 84, y: 40, w: 14, h: 68 },

    // Right vertical corridor
    { x: 177, y: 40, w: 14, h: 70 },

    // Bottom horizontal corridor
    { x: 43, y: 117, w: 51, h: 14 },
    { x: 138, y: 117, w: 46, h: 14 },

    // Top horizontal corridor
    { x: 43, y: 24, w: 107, h: 12 }
];


// ============================================================
// COLLISION WALLS
// ============================================================

const walls = [];

function wall(x, y, w, h) {
    walls.push({ x, y, w, h });
}


// ------------------------------------------------------------
// OUTER BOUNDARY
// ------------------------------------------------------------

wall(0, 0, WORLD_W, 4);
wall(0, WORLD_H - 4, WORLD_W, 4);
wall(0, 0, 4, WORLD_H);
wall(WORLD_W - 4, 0, 4, WORLD_H);


// ------------------------------------------------------------
// UPPER ENGINE
// door on bottom
// ------------------------------------------------------------

wall(15, 10, 42, 2);
wall(15, 10, 2, 30);
wall(55, 10, 2, 30);

wall(15, 38, 13, 2);
wall(44, 38, 13, 2);


// ------------------------------------------------------------
// MEDBAY
// door on bottom
// ------------------------------------------------------------

wall(60, 10, 30, 2);
wall(60, 10, 2, 30);
wall(88, 10, 2, 30);

wall(60, 38, 10, 2);
wall(80, 38, 10, 2);


// ------------------------------------------------------------
// WEAPONS
// door on bottom
// ------------------------------------------------------------

wall(150, 10, 38, 2);
wall(150, 10, 2, 30);
wall(186, 10, 2, 30);

wall(150, 38, 14, 2);
wall(176, 38, 12, 2);


// ------------------------------------------------------------
// CAFETERIA
// multiple doors
// ------------------------------------------------------------

// Top wall
wall(78, 56, 25, 2);
wall(117, 56, 25, 2);

// Left wall
wall(78, 56, 2, 12);
wall(78, 82, 2, 12);

// Right wall
wall(140, 56, 2, 12);
wall(140, 82, 2, 12);

// Bottom wall
wall(78, 92, 18, 2);
wall(124, 92, 18, 2);


// ------------------------------------------------------------
// REACTOR
// door on right
// ------------------------------------------------------------

wall(8, 60, 35, 2);
wall(8, 60, 2, 32);
wall(8, 90, 35, 2);

wall(41, 60, 2, 10);
wall(41, 82, 2, 10);


// ------------------------------------------------------------
// ELECTRICAL
// door on right
// ------------------------------------------------------------

wall(45, 60, 28, 2);
wall(45, 60, 2, 30);
wall(45, 88, 28, 2);

wall(71, 60, 2, 10);
wall(71, 82, 2, 8);


// ------------------------------------------------------------
// ADMIN
// doors left + right
// ------------------------------------------------------------

wall(145, 60, 32, 2);
wall(145, 60, 2, 10);
wall(145, 80, 2, 10);
wall(175, 60, 2, 10);
wall(175, 80, 2, 10);
wall(145, 88, 32, 2);


// ------------------------------------------------------------
// NAVIGATION
// door on left
// ------------------------------------------------------------

wall(192, 52, 24, 2);
wall(192, 52, 2, 38);
wall(214, 52, 2, 38);

wall(192, 88, 8, 2);
wall(208, 88, 8, 2);


// ------------------------------------------------------------
// LOWER ENGINE
// door on top
// ------------------------------------------------------------

wall(15, 108, 13, 2);
wall(44, 108, 13, 2);

wall(15, 108, 2, 30);
wall(55, 108, 2, 30);
wall(15, 136, 42, 2);


// ------------------------------------------------------------
// SECURITY
// door on top
// ------------------------------------------------------------

wall(60, 108, 10, 2);
wall(80, 108, 10, 2);

wall(60, 108, 2, 30);
wall(88, 108, 2, 30);
wall(60, 136, 30, 2);


// ------------------------------------------------------------
// STORAGE
// doors top + left + right
// ------------------------------------------------------------

wall(94, 105, 15, 2);
wall(123, 105, 15, 2);

wall(94, 105, 2, 12);
wall(94, 129, 2, 9);

wall(136, 105, 2, 12);
wall(136, 129, 2, 9);

wall(94, 136, 44, 2);


// ------------------------------------------------------------
// O2
// door on left
// ------------------------------------------------------------

wall(145, 105, 30, 2);
wall(145, 105, 2, 10);
wall(145, 127, 2, 11);
wall(173, 105, 2, 33);
wall(145, 136, 30, 2);


// ------------------------------------------------------------
// COMMUNICATIONS
// door on top
// ------------------------------------------------------------

wall(184, 105, 32, 2);
wall(184, 105, 2, 33);
wall(214, 105, 2, 33);

wall(184, 136, 32, 2);


// ============================================================
// TASKS
// ============================================================

const tasks = [
    {
        name: "Fix Wiring",
        x: 54,
        y: 74,
        duration: 2200,
        done: false
    },

    {
        name: "Calibrate Reactor",
        x: 25,
        y: 76,
        duration: 2600,
        done: false
    },

    {
        name: "Inspect MedBay",
        x: 75,
        y: 25,
        duration: 2200,
        done: false
    },

    {
        name: "Align Engine",
        x: 35,
        y: 25,
        duration: 2400,
        done: false
    },

    {
        name: "Fuel Engine",
        x: 35,
        y: 124,
        duration: 2600,
        done: false
    },

    {
        name: "Upload Data",
        x: 160,
        y: 74,
        duration: 2300,
        done: false
    },

    {
        name: "Clear Asteroids",
        x: 169,
        y: 25,
        duration: 2500,
        done: false
    },

    {
        name: "Navigate",
        x: 203,
        y: 70,
        duration: 2300,
        done: false
    },

    {
        name: "Clean O2",
        x: 158,
        y: 121,
        duration: 2200,
        done: false
    },

    {
        name: "Repair Communications",
        x: 200,
        y: 121,
        duration: 2500,
        done: false
    },

    {
        name: "Organize Storage",
        x: 115,
        y: 121,
        duration: 2400,
        done: false
    }
];


// ============================================================
// TASK STATE
// ============================================================

let activeTask = null;
let taskProgress = 0;
let taskStart = 0;


// ============================================================
// COLLISION
// ============================================================

function circleRectCollision(cx, cy, radius, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));

    const dx = cx - closestX;
    const dy = cy - closestY;

    return dx * dx + dy * dy < radius * radius;
}


function canMoveTo(x, y) {
    if (x < PLAYER_RADIUS + 4) return false;
    if (y < PLAYER_RADIUS + 4) return false;
    if (x > WORLD_W - PLAYER_RADIUS - 4) return false;
    if (y > WORLD_H - PLAYER_RADIUS - 4) return false;

    for (const w of walls) {
        if (circleRectCollision(x, y, PLAYER_RADIUS, w)) {
            return false;
        }
    }

    return true;
}


// ============================================================
// MOVEMENT
// ============================================================

function updatePlayer() {
    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;

    if (dx === 0 && dy === 0) return;

    const length = Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    dx *= PLAYER_SPEED;
    dy *= PLAYER_SPEED;

    if (dx !== 0) {
        const nx = player.x + dx;

        if (canMoveTo(nx, player.y)) {
            player.x = nx;
        }
    }

    if (dy !== 0) {
        const ny = player.y + dy;

        if (canMoveTo(player.x, ny)) {
            player.y = ny;
        }
    }

    player.facing = Math.atan2(dy, dx);
}


// ============================================================
// TASK SYSTEM
// ============================================================

function getNearbyTask() {
    let closest = null;
    let closestDistance = Infinity;

    for (const task of tasks) {
        if (task.done) continue;

        const distance = Math.hypot(
            player.x - task.x,
            player.y - task.y
        );

        if (distance < 3.5 && distance < closestDistance) {
            closest = task;
            closestDistance = distance;
        }
    }

    return closest;
}


function updateTask() {
    const nearby = getNearbyTask();

    if (!nearby) {
        activeTask = null;
        taskProgress = 0;
        return;
    }

    if (keys["e"] || keys[" "]) {
        if (activeTask !== nearby) {
            activeTask = nearby;
            taskStart = performance.now();
        }

        const elapsed = performance.now() - taskStart;

        taskProgress = Math.min(
            elapsed / nearby.duration,
            1
        );

        if (taskProgress >= 1) {
            nearby.done = true;
            activeTask = null;
            taskProgress = 0;
        }
    } else {
        activeTask = null;
        taskProgress = 0;
    }
}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {
    cameraX += (player.x - cameraX) * 0.12;
    cameraY += (player.y - cameraY) * 0.12;
}


// ============================================================
// WORLD TO SCREEN
// ============================================================

function worldToScreen(x, y) {
    return {
        x: (x - cameraX) * ZOOM + canvas.width / 2,
        y: (y - cameraY) * ZOOM + canvas.height / 2
    };
}


function screenRect(x, y, w, h) {
    const p = worldToScreen(x, y);

    return {
        x: p.x,
        y: p.y,
        w: w * ZOOM,
        h: h * ZOOM
    };
}


// ============================================================
// DRAW FLOOR
// ============================================================

function drawFloor() {
    ctx.fillStyle = "#15191e";

    const topLeft = worldToScreen(0, 0);

    ctx.fillRect(
        topLeft.x,
        topLeft.y,
        WORLD_W * ZOOM,
        WORLD_H * ZOOM
    );


    // Corridor floors
    ctx.fillStyle = "#252a30";

    for (const c of corridors) {
        const r = screenRect(c.x, c.y, c.w, c.h);

        ctx.fillRect(r.x, r.y, r.w, r.h);
    }


    // Room floors
    for (const room of rooms) {
        const r = screenRect(
            room.x,
            room.y,
            room.w,
            room.h
        );

        ctx.fillStyle = "#20252b";

        ctx.fillRect(
            r.x,
            r.y,
            r.w,
            r.h
        );

        ctx.strokeStyle = "#353b43";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            r.x,
            r.y,
            r.w,
            r.h
        );
    }
}


// ============================================================
// DRAW WALLS
// ============================================================

function drawWalls() {
    for (const w of walls) {
        const r = screenRect(
            w.x,
            w.y,
            w.w,
            w.h
        );

        ctx.fillStyle = "#59616b";

        ctx.fillRect(
            r.x,
            r.y,
            r.w,
            r.h
        );

        ctx.strokeStyle = "#737c87";
        ctx.lineWidth = 1;

        ctx.strokeRect(
            r.x,
            r.y,
            r.w,
            r.h
        );
    }
}


// ============================================================
// ROOM LABELS
// ============================================================

function drawRoomLabels() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const room of rooms) {
        const p = worldToScreen(
            room.x + room.w / 2,
            room.y + room.h / 2
        );

        ctx.font = "bold 13px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.16)";

        ctx.fillText(
            room.name,
            p.x,
            p.y
        );
    }
}


// ============================================================
// CAFETERIA DETAILS
// ============================================================

function drawCafeteria() {
    const tables = [
        [93, 66],
        [127, 66],
        [93, 84],
        [127, 84]
    ];

    for (const [x, y] of tables) {
        const p = worldToScreen(x, y);

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            4.5 * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#303740";
        ctx.fill();

        ctx.strokeStyle = "#68717c";
        ctx.lineWidth = 1.5;

        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            1.5 * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#444c56";
        ctx.fill();
    }


    // Emergency button table
    const button = worldToScreen(110, 75);

    ctx.beginPath();

    ctx.arc(
        button.x,
        button.y,
        2.5 * ZOOM,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#323941";
    ctx.fill();

    ctx.strokeStyle = "#727b85";
    ctx.lineWidth = 1;

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        button.x,
        button.y,
        1 * ZOOM,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#c73838";
    ctx.fill();
}


// ============================================================
// TASK MARKERS
// ============================================================

function drawTasks() {
    for (const task of tasks) {
        if (task.done) continue;

        const p = worldToScreen(
            task.x,
            task.y
        );

        const pulse =
            1 +
            Math.sin(performance.now() / 250) * 0.12;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            2.2 * ZOOM * pulse,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#f2c94c";
        ctx.fill();

        ctx.strokeStyle = "#fff0a0";
        ctx.lineWidth = 1;

        ctx.stroke();


        if (
            Math.hypot(
                player.x - task.x,
                player.y - task.y
            ) < 3.5
        ) {
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";

            ctx.fillStyle = "#ffffff";

            ctx.fillText(
                "E",
                p.x,
                p.y - 16
            );
        }
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

    const size = PLAYER_RADIUS * ZOOM;

    // Shadow
    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y + size * 0.85,
        size * 0.85,
        size * 0.35,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();


    // Body
    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        size,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = player.color;
    ctx.fill();

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;

    ctx.stroke();


    // Visor
    const visorX =
        p.x +
        Math.cos(player.facing) * size * 0.35;

    const visorY =
        p.y +
        Math.sin(player.facing) * size * 0.35;

    ctx.beginPath();

    ctx.ellipse(
        visorX,
        visorY,
        size * 0.55,
        size * 0.35,
        player.facing,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#bde9ff";
    ctx.fill();

    ctx.strokeStyle = "#18242c";
    ctx.lineWidth = 1.5;

    ctx.stroke();
}


// ============================================================
// TASK UI
// ============================================================

function drawTaskUI() {
    const nearby = getNearbyTask();

    if (!nearby) return;

    const width = 360;
    const height = activeTask ? 70 : 48;

    const x = canvas.width / 2 - width / 2;
    const y = canvas.height - 105;

    ctx.fillStyle = "rgba(8,10,13,0.92)";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.strokeStyle = "#69727d";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );


    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        nearby.name,
        canvas.width / 2,
        y + 18
    );


    if (!activeTask) {
        ctx.font = "13px Arial";
        ctx.fillStyle = "#c8ced4";

        ctx.fillText(
            "Press E to complete",
            canvas.width / 2,
            y + 38
        );

        return;
    }


    // Progress bar
    const barX = x + 25;
    const barY = y + 43;
    const barW = width - 50;
    const barH = 12;

    ctx.fillStyle = "#20252b";

    ctx.fillRect(
        barX,
        barY,
        barW,
        barH
    );

    ctx.fillStyle = "#55d66f";

    ctx.fillRect(
        barX,
        barY,
        barW * taskProgress,
        barH
    );

    ctx.strokeStyle = "#858e99";
    ctx.lineWidth = 1;

    ctx.strokeRect(
        barX,
        barY,
        barW,
        barH
    );
}


// ============================================================
// HUD
// ============================================================

function drawHUD() {
    const completed = tasks.filter(t => t.done).length;

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillStyle = "rgba(8,10,13,0.85)";

    ctx.fillRect(
        16,
        16,
        210,
        74
    );

    ctx.strokeStyle = "#59616b";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        16,
        16,
        210,
        74
    );


    ctx.font = "bold 17px Arial";
    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        "TASKS",
        30,
        29
    );


    ctx.font = "14px Arial";
    ctx.fillStyle = "#bfc6ce";

    ctx.fillText(
        `${completed} / ${tasks.length} completed`,
        30,
        55
    );


    // Controls
    ctx.textAlign = "right";

    ctx.fillStyle = "rgba(8,10,13,0.75)";

    ctx.fillRect(
        canvas.width - 220,
        16,
        204,
        48
    );

    ctx.font = "13px Arial";
    ctx.fillStyle = "#c8ced4";

    ctx.fillText(
        "WASD / ARROWS  •  E = TASK",
        canvas.width - 30,
        34
    );
}


// ============================================================
// UPDATE
// ============================================================

function update() {
    updatePlayer();
    updateTask();
    updateCamera();
}


// ============================================================
// DRAW
// ============================================================

function draw() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    update();

    drawFloor();
    drawWalls();
    drawRoomLabels();
    drawCafeteria();
    drawTasks();
    drawPlayer();

    drawHUD();
    drawTaskUI();

    requestAnimationFrame(draw);
}


// ============================================================
// START
// ============================================================

draw();
