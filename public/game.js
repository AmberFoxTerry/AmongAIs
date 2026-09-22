const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");


// ============================================================
// WORLD
// ============================================================

const WORLD_W = 320;
const WORLD_H = 220;

const ZOOM = 4.5;

const PLAYER_SPEED = 0.22;
const PLAYER_RADIUS = 2.2;

let cameraX = 160;
let cameraY = 110;

const keys = {};


// ============================================================
// INPUT
// ============================================================

window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    keys[key] = true;

    if (
        [
            "w",
            "a",
            "s",
            "d",
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            " "
        ].includes(key)
    ) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});


// ============================================================
// RESIZE
// ============================================================

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
    x: 160,
    y: 110,

    color: "#c94343",

    facing: 0
};


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
// ============================================================

const paths = [
    // Main east/west path
    {
        x: 30,
        y: 67,
        w: 275,
        h: 16
    },

    // Central north/south path
    {
        x: 151,
        y: 40,
        w: 18,
        h: 145
    },

    // Left vertical path
    {
        x: 72,
        y: 48,
        w: 16,
        h: 130
    },

    // Right vertical path
    {
        x: 244,
        y: 48,
        w: 18,
        h: 145
    },

    // Lower horizontal
    {
        x: 70,
        y: 145,
        w: 205,
        h: 16
    },

    // Reactor connection
    {
        x: 55,
        y: 100,
        w: 30,
        h: 16
    },

    // Admin connection
    {
        x: 230,
        y: 90,
        w: 30,
        h: 16
    },

    // Navigation connection
    {
        x: 250,
        y: 94,
        w: 25,
        h: 16
    }
];


// ============================================================
// COLLISION WALLS
// ============================================================

const walls = [];

function addWall(x, y, w, h) {
    walls.push({ x, y, w, h });
}


// ============================================================
// BUILDING COLLISION
// ============================================================

function addBuildingWalls(building) {
    const { x, y, w, h, door } = building;

    const doorSize = 9;

    if (door === "bottom") {
        addWall(x, y, w, 2);
        addWall(x, y, 2, h);
        addWall(x + w - 2, y, 2, h);
        addWall(x, y + h - 2, (w - doorSize) / 2, 2);
        addWall(
            x + (w + doorSize) / 2,
            y + h - 2,
            (w - doorSize) / 2,
            2
        );
    }

    else if (door === "top") {
        addWall(x, y + h - 2, w, 2);
        addWall(x, y, 2, h);
        addWall(x + w - 2, y, 2, h);

        addWall(
            x,
            y,
            (w - doorSize) / 2,
            2
        );

        addWall(
            x + (w + doorSize) / 2,
            y,
            (w - doorSize) / 2,
            2
        );
    }

    else if (door === "right") {
        addWall(x, y, w, 2);
        addWall(x, y + h - 2, w, 2);
        addWall(x, y, 2, h);

        addWall(
            x + w - 2,
            y,
            2,
            (h - doorSize) / 2
        );

        addWall(
            x + w - 2,
            y + (h + doorSize) / 2,
            2,
            (h - doorSize) / 2
        );
    }

    else if (door === "left") {
        addWall(x, y, w, 2);
        addWall(x, y + h - 2, w, 2);
        addWall(x + w - 2, y, 2, h);

        addWall(
            x,
            y,
            2,
            (h - doorSize) / 2
        );

        addWall(
            x,
            y + (h + doorSize) / 2,
            2,
            (h - doorSize) / 2
        );
    }
}

for (const building of buildings) {
    addBuildingWalls(building);
}


// ============================================================
// WORLD BORDER
// ============================================================

addWall(0, 0, WORLD_W, 4);
addWall(0, WORLD_H - 4, WORLD_W, 4);
addWall(0, 0, 4, WORLD_H);
addWall(WORLD_W - 4, 0, 4, WORLD_H);


// ============================================================
// TASKS
// ============================================================

const tasks = [
    {
        name: "Inspect MedBay",
        x: 73,
        y: 43,
        duration: 2300,
        done: false
    },

    {
        name: "Align Engine",
        x: 129,
        y: 35,
        duration: 2500,
        done: false
    },

    {
        name: "Clear Weapons",
        x: 238,
        y: 43,
        duration: 2400,
        done: false
    },

    {
        name: "Calibrate Reactor",
        x: 43,
        y: 106,
        duration: 2600,
        done: false
    },

    {
        name: "Fix Wiring",
        x: 96,
        y: 103,
        duration: 2300,
        done: false
    },

    {
        name: "Upload Data",
        x: 222,
        y: 98,
        duration: 2300,
        done: false
    },

    {
        name: "Navigate",
        x: 285,
        y: 96,
        duration: 2500,
        done: false
    },

    {
        name: "Clean O2",
        x: 265,
        y: 156,
        duration: 2300,
        done: false
    },

    {
        name: "Repair Comms",
        x: 290,
        y: 190,
        duration: 2500,
        done: false
    },

    {
        name: "Fuel Engine",
        x: 134,
        y: 184,
        duration: 2600,
        done: false
    },

    {
        name: "Organize Storage",
        x: 189,
        y: 177,
        duration: 2400,
        done: false
    },

    {
        name: "Check Security",
        x: 72,
        y: 169,
        duration: 2300,
        done: false
    },

    {
        name: "Emergency Button",
        x: 160,
        y: 101,
        duration: 1800,
        done: false
    }
];


// ============================================================
// TREES
// ============================================================

const trees = [
    [15, 25],
    [25, 45],
    [35, 18],
    [110, 70],
    [195, 22],
    [278, 22],
    [300, 50],
    [305, 132],
    [300, 160],
    [226, 190],
    [105, 204],
    [30, 190],
    [15, 150],
    [125, 130],
    [286, 125],
    [105, 75],
    [55, 135],
    [220, 130]
];


// ============================================================
// ROCKS
// ============================================================

const rocks = [
    [23, 70],
    [101, 65],
    [197, 66],
    [290, 70],
    [45, 140],
    [104, 152],
    [228, 150],
    [315, 115],
    [92, 200],
    [220, 207]
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


// ============================================================
// MOVEMENT
// ============================================================

function updatePlayer() {
    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) {
        dy--;
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy++;
    }

    if (keys["a"] || keys["arrowleft"]) {
        dx--;
    }

    if (keys["d"] || keys["arrowright"]) {
        dx++;
    }

    if (dx === 0 && dy === 0) {
        return;
    }

    const length = Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    dx *= PLAYER_SPEED;
    dy *= PLAYER_SPEED;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (canMoveTo(newX, player.y)) {
        player.x = newX;
    }

    if (canMoveTo(player.x, newY)) {
        player.y = newY;
    }

    player.facing = Math.atan2(dy, dx);
}


// ============================================================
// TASKS
// ============================================================

function getNearbyTask() {
    let closest = null;
    let closestDistance = Infinity;

    for (const task of tasks) {
        if (task.done) {
            continue;
        }

        const distance = Math.hypot(
            player.x - task.x,
            player.y - task.y
        );

        if (
            distance < 4 &&
            distance < closestDistance
        ) {
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

        const elapsed =
            performance.now() - taskStart;

        taskProgress = Math.min(
            elapsed / nearby.duration,
            1
        );

        if (taskProgress >= 1) {
            nearby.done = true;
            activeTask = null;
            taskProgress = 0;
        }
    }
    else {
        activeTask = null;
        taskProgress = 0;
    }
}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {
    cameraX +=
        (player.x - cameraX) * 0.1;

    cameraY +=
        (player.y - cameraY) * 0.1;
}


function worldToScreen(x, y) {
    return {
        x:
            (x - cameraX) * ZOOM +
            canvas.width / 2,

        y:
            (y - cameraY) * ZOOM +
            canvas.height / 2
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
// DRAW GROUND
// ============================================================

function drawGround() {
    ctx.fillStyle = "#3b7a45";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Subtle grass pattern
    ctx.strokeStyle = "rgba(20,60,30,0.15)";
    ctx.lineWidth = 1;

    const startX =
        Math.floor(cameraX - canvas.width / ZOOM / 2);

    const startY =
        Math.floor(cameraY - canvas.height / ZOOM / 2);

    const endX =
        cameraX + canvas.width / ZOOM / 2;

    const endY =
        cameraY + canvas.height / ZOOM / 2;

    for (
        let x = startX;
        x < endX;
        x += 5
    ) {
        for (
            let y = startY;
            y < endY;
            y += 5
        ) {
            const p = worldToScreen(x, y);

            ctx.beginPath();

            ctx.moveTo(
                p.x,
                p.y
            );

            ctx.lineTo(
                p.x + 2,
                p.y - 2
            );

            ctx.stroke();
        }
    }
}


// ============================================================
// PATHS
// ============================================================

function drawPaths() {
    for (const path of paths) {
        const r = screenRect(
            path.x,
            path.y,
            path.w,
            path.h
        );

        ctx.fillStyle = "#777d7d";

        ctx.fillRect(
            r.x,
            r.y,
            r.w,
            r.h
        );

        ctx.strokeStyle = "#929898";
        ctx.lineWidth = 1;

        ctx.strokeRect(
            r.x,
            r.y,
            r.w,
            r.h
        );


        // Path cracks / tiles
        ctx.strokeStyle =
            "rgba(50,55,55,0.35)";

        const tile = 8;

        for (
            let tx = path.x;
            tx < path.x + path.w;
            tx += tile
        ) {
            const p1 =
                worldToScreen(tx, path.y);

            const p2 =
                worldToScreen(
                    tx,
                    path.y + path.h
                );

            ctx.beginPath();

            ctx.moveTo(
                p1.x,
                p1.y
            );

            ctx.lineTo(
                p2.x,
                p2.y
            );

            ctx.stroke();
        }
    }
}


// ============================================================
// BUILDINGS
// ============================================================

function drawBuildings() {
    for (const building of buildings) {
        const r = screenRect(
            building.x,
            building.y,
            building.w,
            building.h
        );


        // Shadow
        ctx.fillStyle =
            "rgba(0,0,0,0.25)";

        ctx.fillRect(
            r.x + 3 * ZOOM,
            r.y + 4 * ZOOM,
            r.w,
            r.h
        );


        // Building body
        ctx.fillStyle = "#b8bdc0";

        ctx.fillRect(
            r.x,
            r.y,
            r.w,
            r.h
        );


        // Roof
        ctx.fillStyle = "#687078";

        ctx.fillRect(
            r.x,
            r.y,
            r.w,
            5 * ZOOM
        );


        // Windows
        ctx.fillStyle = "#75b8d0";

        const windowSize = 3;

        if (building.w >= 38) {
            const positions = [
                8,
                building.w / 2 - 1.5,
                building.w - 11
            ];

            for (const offset of positions) {
                const wx =
                    building.x + offset;

                const wy =
                    building.y + 9;

                const p =
                    worldToScreen(wx, wy);

                ctx.fillRect(
                    p.x,
                    p.y,
                    windowSize * ZOOM,
                    5 * ZOOM
                );
            }
        }


        // Door
        drawBuildingDoor(building);


        // Name
        const label =
            worldToScreen(
                building.x + building.w / 2,
                building.y - 4
            );

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.font =
            "bold 11px Arial";

        ctx.fillStyle =
            "rgba(255,255,255,0.8)";

        ctx.fillText(
            building.name,
            label.x,
            label.y
        );
    }
}


function drawBuildingDoor(building) {
    let x;
    let y;

    if (building.door === "bottom") {
        x =
            building.x +
            building.w / 2;

        y =
            building.y +
            building.h;
    }

    else if (building.door === "top") {
        x =
            building.x +
            building.w / 2;

        y =
            building.y;
    }

    else if (building.door === "left") {
        x = building.x;
        y =
            building.y +
            building.h / 2;
    }

    else {
        x =
            building.x +
            building.w;

        y =
            building.y +
            building.h / 2;
    }

    const p =
        worldToScreen(x, y);

    ctx.fillStyle = "#252a2d";

    if (
        building.door === "top" ||
        building.door === "bottom"
    ) {
        ctx.fillRect(
            p.x - 4 * ZOOM,
            p.y - 1 * ZOOM,
            8 * ZOOM,
            3 * ZOOM
        );
    }
    else {
        ctx.fillRect(
            p.x - 1 * ZOOM,
            p.y - 4 * ZOOM,
            3 * ZOOM,
            8 * ZOOM
        );
    }
}


// ============================================================
// TREES
// ============================================================

function drawTrees() {
    for (const [x, y] of trees) {
        const p =
            worldToScreen(x, y);

        // Shadow
        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y + 5 * ZOOM,
            5 * ZOOM,
            2 * ZOOM,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.25)";

        ctx.fill();


        // Trunk
        ctx.fillStyle = "#68442d";

        ctx.fillRect(
            p.x - 1.5 * ZOOM,
            p.y,
            3 * ZOOM,
            7 * ZOOM
        );


        // Leaves
        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y - 2 * ZOOM,
            6 * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#245b32";
        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            p.x - 3 * ZOOM,
            p.y + 1 * ZOOM,
            4 * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#2e7040";
        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            p.x + 3 * ZOOM,
            p.y + 1 * ZOOM,
            4 * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#347b46";
        ctx.fill();
    }
}


// ============================================================
// ROCKS
// ============================================================

function drawRocks() {
    for (const [x, y] of rocks) {
        const p =
            worldToScreen(x, y);

        ctx.beginPath();

        ctx.moveTo(
            p.x - 4 * ZOOM,
            p.y + 3 * ZOOM
        );

        ctx.lineTo(
            p.x - 2 * ZOOM,
            p.y - 3 * ZOOM
        );

        ctx.lineTo(
            p.x + 4 * ZOOM,
            p.y - 2 * ZOOM
        );

        ctx.lineTo(
            p.x + 5 * ZOOM,
            p.y + 3 * ZOOM
        );

        ctx.closePath();

        ctx.fillStyle = "#707879";
        ctx.fill();

        ctx.strokeStyle = "#555d5e";
        ctx.lineWidth = 1;

        ctx.stroke();
    }
}


// ============================================================
// TASK MARKERS
// ============================================================

function drawTasks() {
    for (const task of tasks) {
        if (task.done) {
            continue;
        }

        const p =
            worldToScreen(
                task.x,
                task.y
            );

        const pulse =
            1 +
            Math.sin(
                performance.now() / 250
            ) * 0.12;


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            2.5 * ZOOM * pulse,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#f4c542";
        ctx.fill();

        ctx.strokeStyle = "#fff3a8";
        ctx.lineWidth = 1;

        ctx.stroke();


        if (
            Math.hypot(
                player.x - task.x,
                player.y - task.y
            ) < 4
        ) {
            ctx.font =
                "bold 13px Arial";

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
// AMONG US PLAYER
// ============================================================

function drawPlayer() {
    const p =
        worldToScreen(
            player.x,
            player.y
        );

    const s =
        PLAYER_RADIUS * ZOOM;


    // Shadow
    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y + s * 0.85,
        s * 0.85,
        s * 0.3,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.3)";

    ctx.fill();


    // ========================================================
    // AMONG US BODY
    // ========================================================

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );


    // Backpack
    ctx.fillStyle = "#9f3035";

    ctx.beginPath();

    ctx.roundRect(
        -s * 1.05,
        -s * 0.1,
        s * 0.45,
        s * 1.15,
        s * 0.18
    );

    ctx.fill();


    // Main body
    ctx.fillStyle =
        player.color;

    ctx.beginPath();

    ctx.moveTo(
        -s * 0.75,
        s * 0.9
    );

    ctx.lineTo(
        -s * 0.75,
        -s * 0.35
    );

    ctx.quadraticCurveTo(
        -s * 0.75,
        -s * 1.15,
        0,
        -s * 1.2
    );

    ctx.quadraticCurveTo(
        s * 0.8,
        -s * 1.2,
        s * 0.85,
        -s * 0.35
    );

    ctx.lineTo(
        s * 0.85,
        s * 0.85
    );

    ctx.quadraticCurveTo(
        s * 0.85,
        s * 1.15,
        s * 0.45,
        s * 1.15
    );

    ctx.lineTo(
        s * 0.1,
        s * 1.15
    );

    ctx.lineTo(
        s * 0.1,
        s * 0.55
    );

    ctx.lineTo(
        -s * 0.1,
        s * 0.55
    );

    ctx.lineTo(
        -s * 0.1,
        s * 1.15
    );

    ctx.lineTo(
        -s * 0.5,
        s * 1.15
    );

    ctx.quadraticCurveTo(
        -s * 0.75,
        s * 1.15,
        -s * 0.75,
        s * 0.9
    );

    ctx.closePath();

    ctx.fill();

    ctx.strokeStyle =
        "#6e2024";

    ctx.lineWidth = 2;

    ctx.stroke();


    // ========================================================
    // VISOR
    // ========================================================

    const visorDirection =
        player.facing || 0;

    ctx.save();

    ctx.rotate(visorDirection);

    ctx.beginPath();

    ctx.ellipse(
        s * 0.35,
        -s * 0.38,
        s * 0.62,
        s * 0.4,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#bceeff";

    ctx.fill();

    ctx.strokeStyle =
        "#557f91";

    ctx.lineWidth = 2;

    ctx.stroke();


    // visor highlight
    ctx.beginPath();

    ctx.ellipse(
        s * 0.55,
        -s * 0.51,
        s * 0.18,
        s * 0.09,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(255,255,255,0.8)";

    ctx.fill();

    ctx.restore();


    ctx.restore();
}


// ============================================================
// CAFETERIA DETAILS
// ============================================================

function drawCafeteriaDetails() {
    const tables = [
        [147, 94],
        [173, 94],
        [147, 108],
        [173, 108]
    ];

    for (const [x, y] of tables) {
        const p =
            worldToScreen(x, y);

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            4 * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#555d64";
        ctx.fill();

        ctx.strokeStyle = "#252a2e";
        ctx.lineWidth = 2;

        ctx.stroke();
    }


    // Emergency button
    const p =
        worldToScreen(160, 101);

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        2.2 * ZOOM,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#343a40";
    ctx.fill();

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;

    ctx.stroke();


    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        0.9 * ZOOM,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#e33d3d";
    ctx.fill();
}


// ============================================================
// TASK UI
// ============================================================

function drawTaskUI() {
    const nearby =
        getNearbyTask();

    if (!nearby) {
        return;
    }


    const width = 370;

    const height =
        activeTask ? 75 : 48;

    const x =
        canvas.width / 2 -
        width / 2;

    const y =
        canvas.height - 105;


    ctx.fillStyle =
        "rgba(10,12,14,0.92)";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );


    ctx.strokeStyle =
        "#858c91";

    ctx.lineWidth = 2;

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );


    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font =
        "bold 16px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        nearby.name,
        canvas.width / 2,
        y + 18
    );


    if (!activeTask) {
        ctx.font =
            "13px Arial";

        ctx.fillStyle =
            "#cbd0d2";

        ctx.fillText(
            "Press E to complete",
            canvas.width / 2,
            y + 37
        );

        return;
    }


    const barX =
        x + 25;

    const barY =
        y + 45;

    const barW =
        width - 50;

    const barH = 12;


    ctx.fillStyle =
        "#24292d";

    ctx.fillRect(
        barX,
        barY,
        barW,
        barH
    );


    ctx.fillStyle =
        "#53d46a";

    ctx.fillRect(
        barX,
        barY,
        barW * taskProgress,
        barH
    );


    ctx.strokeStyle =
        "#899196";

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
    const completed =
        tasks.filter(
            task => task.done
        ).length;


    // Task counter
    ctx.fillStyle =
        "rgba(8,10,12,0.85)";

    ctx.fillRect(
        16,
        16,
        215,
        72
    );


    ctx.strokeStyle =
        "#687176";

    ctx.lineWidth = 2;

    ctx.strokeRect(
        16,
        16,
        215,
        72
    );


    ctx.textAlign = "left";
    ctx.textBaseline = "top";


    ctx.font =
        "bold 17px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        "TASKS",
        30,
        29
    );


    ctx.font =
        "14px Arial";

    ctx.fillStyle =
        "#c5cbce";

    ctx.fillText(
        `${completed} / ${tasks.length} completed`,
        30,
        55
    );


    // Controls
    ctx.textAlign = "right";

    ctx.font =
        "13px Arial";

    ctx.fillStyle =
        "rgba(8,10,12,0.8)";

    ctx.fillRect(
        canvas.width - 230,
        16,
        214,
        45
    );


    ctx.fillStyle =
        "#d0d5d7";

    ctx.fillText(
        "WASD / ARROWS  •  E = TASK",
        canvas.width - 30,
        32
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


    drawGround();
    drawPaths();
    drawTrees();
    drawRocks();
    drawBuildings();
    drawCafeteriaDetails();
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
