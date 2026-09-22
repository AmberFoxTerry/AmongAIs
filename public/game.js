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

const BORDER = 5;

// Camera is deliberately close.
const ZOOM = 10;

const PLAYER_SPEED = 0.075;
const PLAYER_RADIUS = 1.8;

const player = {
    x: 160,
    y: 110,

    facing: 1,

    moving: false,
    walkTime: 0,
    idleTime: 0
};

const camera = {
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

    if (
        e.key.toLowerCase() === "e" ||
        e.key === " "
    ) {
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
// ============================================================

const paths = [
    {
        x: 30,
        y: 67,
        w: 275,
        h: 16
    },

    {
        x: 151,
        y: 40,
        w: 18,
        h: 145
    },

    {
        x: 72,
        y: 43,
        w: 16,
        h: 135
    },

    {
        x: 244,
        y: 48,
        w: 18,
        h: 145
    },

    {
        x: 70,
        y: 145,
        w: 205,
        h: 16
    },

    {
        x: 50,
        y: 96,
        w: 34,
        h: 16
    },

    {
        x: 108,
        y: 95,
        w: 35,
        h: 16
    },

    {
        x: 230,
        y: 91,
        w: 30,
        h: 16
    },

    {
        x: 248,
        y: 91,
        w: 28,
        h: 16
    },

    {
        x: 257,
        y: 110,
        w: 16,
        h: 35
    },

    {
        x: 270,
        y: 150,
        w: 16,
        h: 40
    },

    {
        x: 180,
        y: 145,
        w: 18,
        h: 25
    },

    {
        x: 125,
        y: 145,
        w: 18,
        h: 28
    },

    {
        x: 64,
        y: 145,
        w: 18,
        h: 20
    },

    {
        x: 151,
        y: 116,
        w: 18,
        h: 29
    },

    {
        x: 67,
        y: 57,
        w: 12,
        h: 26
    },

    {
        x: 124,
        y: 50,
        w: 12,
        h: 33
    },

    {
        x: 232,
        y: 57,
        w: 12,
        h: 26
    }
];


// ============================================================
// WALLS
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

    if (b.door === "top") {
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

    if (b.door === "left") {
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

    if (b.door === "right") {
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

for (const building of buildings) {
    makeBuildingWalls(building);
}


// ============================================================
// HARD WORLD BARRIER
// ============================================================

addWall(
    0,
    0,
    WORLD_W,
    BORDER
);

addWall(
    0,
    WORLD_H - BORDER,
    WORLD_W,
    BORDER
);

addWall(
    0,
    0,
    BORDER,
    WORLD_H
);

addWall(
    WORLD_W - BORDER,
    0,
    BORDER,
    WORLD_H
);


// ============================================================
// TASKS
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

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}

function selectTasks(pool, count) {
    return shuffle(pool)
        .slice(0, count)
        .map(task => ({
            ...task,
            completed: false,
            active: false
        }));
}

let selectedTasks = [];

function generateTasks() {
    selectedTasks = [
        ...selectTasks(shortTasks, 3),
        ...selectTasks(mediumTasks, 3),
        ...selectTasks(longTasks, 1)
    ];

    selectedTasks =
        shuffle(selectedTasks);
}

generateTasks();

let currentTask = null;
let taskProgress = 0;


// ============================================================
// COLLISION
// ============================================================

function circleRectCollision(
    cx,
    cy,
    radius,
    rect
) {
    const closestX = Math.max(
        rect.x,
        Math.min(
            cx,
            rect.x + rect.w
        )
    );

    const closestY = Math.max(
        rect.y,
        Math.min(
            cy,
            rect.y + rect.h
        )
    );

    const dx = cx - closestX;
    const dy = cy - closestY;

    return (
        dx * dx +
        dy * dy <
        radius * radius
    );
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
// SMOOTH MOVEMENT
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

    const moving =
        dx !== 0 ||
        dy !== 0;

    player.moving = moving;

    if (!moving) {
        player.idleTime += dt / 1000;
        return;
    }

    player.idleTime = 0;

    const length =
        Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    if (dx !== 0) {
        player.facing =
            dx > 0 ? 1 : -1;
    }

    // Smooth continuous movement.
    const speed =
        PLAYER_SPEED * dt;

    const moveX =
        dx * speed;

    const moveY =
        dy * speed;

    // X and Y are checked independently.
    // This lets the player slide against walls.
    if (
        canMoveTo(
            player.x + moveX,
            player.y
        )
    ) {
        player.x += moveX;
    }

    if (
        canMoveTo(
            player.x,
            player.y + moveY
        )
    ) {
        player.y += moveY;
    }

    player.walkTime +=
        dt / 1000;
}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {
    // Strong following = player stays near center.
    const smooth = 0.18;

    camera.x +=
        (player.x - camera.x) *
        smooth;

    camera.y +=
        (player.y - camera.y) *
        smooth;

    // Never allow camera to expose the outside.
    const halfW =
        W / (2 * ZOOM);

    const halfH =
        H / (2 * ZOOM);

    const minX = halfW;
    const maxX = WORLD_W - halfW;

    const minY = halfH;
    const maxY = WORLD_H - halfH;

    if (minX < maxX) {
        camera.x =
            Math.max(
                minX,
                Math.min(
                    maxX,
                    camera.x
                )
            );
    }

    if (minY < maxY) {
        camera.y =
            Math.max(
                minY,
                Math.min(
                    maxY,
                    camera.y
                )
            );
    }
}

function worldToScreen(x, y) {
    return {
        x:
            (x - camera.x) *
            ZOOM +
            W / 2,

        y:
            (y - camera.y) *
            ZOOM +
            H / 2
    };
}


// ============================================================
// SPACE
// ============================================================

function drawSpace() {
    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            0,
            W / 2,
            H / 2,
            Math.max(W, H)
        );

    gradient.addColorStop(
        0,
        "#182438"
    );

    gradient.addColorStop(
        0.55,
        "#080d18"
    );

    gradient.addColorStop(
        1,
        "#020306"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    for (let i = 0; i < 130; i++) {
        const x =
            (i * 173.31) % W;

        const y =
            (i * 97.71) % H;

        const alpha =
            0.25 +
            Math.sin(
                gameTime * 2 + i
            ) * 0.12;

        ctx.globalAlpha =
            Math.max(
                0.05,
                alpha
            );

        ctx.fillStyle =
            "#ffffff";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            i % 6 === 0
                ? 1.3
                : 0.65,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}


// ============================================================
// GROUND
// ============================================================

function drawGround() {
    const a =
        worldToScreen(0, 0);

    const b =
        worldToScreen(
            WORLD_W,
            WORLD_H
        );

    ctx.fillStyle =
        "#344c39";

    ctx.fillRect(
        a.x,
        a.y,
        b.x - a.x,
        b.y - a.y
    );

    // Ground texture.
    ctx.save();

    ctx.globalAlpha = 0.12;

    for (
        let x = 0;
        x < WORLD_W;
        x += 4
    ) {
        for (
            let y = 0;
            y < WORLD_H;
            y += 4
        ) {
            const n =
                Math.sin(
                    x * 9.17 +
                    y * 4.73
                );

            if (n > 0.25) {
                const p =
                    worldToScreen(
                        x,
                        y
                    );

                ctx.fillStyle =
                    n > 0.7
                        ? "#9aaa65"
                        : "#22352a";

                ctx.fillRect(
                    p.x,
                    p.y,
                    ZOOM * 0.4,
                    ZOOM * 0.4
                );
            }
        }
    }

    ctx.restore();
}


// ============================================================
// PATHS
// ============================================================

function drawPaths() {
    for (const path of paths) {
        const p =
            worldToScreen(
                path.x,
                path.y
            );

        ctx.fillStyle =
            "#70797d";

        ctx.fillRect(
            p.x,
            p.y,
            path.w * ZOOM,
            path.h * ZOOM
        );

        ctx.fillStyle =
            "rgba(255,255,255,0.07)";

        ctx.fillRect(
            p.x,
            p.y,
            path.w * ZOOM,
            1 * ZOOM
        );

        ctx.strokeStyle =
            "rgba(20,25,28,0.2)";

        ctx.lineWidth =
            0.5 * ZOOM;

        for (
            let x = path.x;
            x < path.x + path.w;
            x += 8
        ) {
            const a =
                worldToScreen(
                    x,
                    path.y +
                    path.h / 2
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
}


// ============================================================
// BUILDINGS
// ============================================================

function drawBuildings() {
    for (const b of buildings) {
        const p =
            worldToScreen(
                b.x,
                b.y
            );

        // Shadow
        ctx.fillStyle =
            "rgba(0,0,0,0.35)";

        ctx.fillRect(
            p.x + 2 * ZOOM,
            p.y + 3 * ZOOM,
            b.w * ZOOM,
            b.h * ZOOM
        );

        // Shell
        ctx.fillStyle =
            "#394349";

        ctx.fillRect(
            p.x,
            p.y,
            b.w * ZOOM,
            b.h * ZOOM
        );

        // Floor
        ctx.fillStyle =
            "#242b30";

        ctx.fillRect(
            p.x + 2 * ZOOM,
            p.y + 2 * ZOOM,
            (b.w - 4) * ZOOM,
            (b.h - 4) * ZOOM
        );

        // Floor panels
        ctx.strokeStyle =
            "rgba(255,255,255,0.04)";

        ctx.lineWidth =
            0.5 * ZOOM;

        for (
            let x = b.x + 6;
            x < b.x + b.w;
            x += 6
        ) {
            const a =
                worldToScreen(
                    x,
                    b.y + 2
                );

            const c =
                worldToScreen(
                    x,
                    b.y + b.h - 2
                );

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(c.x, c.y);
            ctx.stroke();
        }

        drawFurniture(b);
        drawDoor(b);

        // Building roof rim
        ctx.fillStyle =
            "#59636a";

        ctx.fillRect(
            p.x,
            p.y,
            b.w * ZOOM,
            2.5 * ZOOM
        );

        // Name
        ctx.font =
            `bold ${Math.max(
                8,
                2.2 * ZOOM
            )}px Arial`;

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "bottom";

        ctx.fillStyle =
            "rgba(255,255,255,0.75)";

        ctx.fillText(
            b.name,
            p.x +
                b.w *
                ZOOM /
                2,
            p.y - 1 * ZOOM
        );
    }
}


function drawDoor(b) {
    let x;
    let y;

    const size = 9;

    if (b.door === "bottom") {
        x =
            b.x +
            b.w / 2 -
            size / 2;

        y =
            b.y +
            b.h -
            2;
    }

    if (b.door === "top") {
        x =
            b.x +
            b.w / 2 -
            size / 2;

        y =
            b.y - 1;
    }

    if (b.door === "left") {
        x =
            b.x - 1;

        y =
            b.y +
            b.h / 2 -
            size / 2;
    }

    if (b.door === "right") {
        x =
            b.x +
            b.w -
            2;

        y =
            b.y +
            b.h / 2 -
            size / 2;
    }

    const p =
        worldToScreen(
            x,
            y
        );

    ctx.fillStyle =
        "#80d8c2";

    if (
        b.door === "top" ||
        b.door === "bottom"
    ) {
        ctx.fillRect(
            p.x,
            p.y,
            size * ZOOM,
            3 * ZOOM
        );
    } else {
        ctx.fillRect(
            p.x,
            p.y,
            3 * ZOOM,
            size * ZOOM
        );
    }
}


function drawFurniture(b) {
    const p =
        worldToScreen(
            b.x,
            b.y
        );

    function rect(
        x,
        y,
        w,
        h,
        color
    ) {
        ctx.fillStyle = color;

        ctx.fillRect(
            p.x + x * ZOOM,
            p.y + y * ZOOM,
            w * ZOOM,
            h * ZOOM
        );
    }

    function circle(
        x,
        y,
        r,
        color
    ) {
        ctx.fillStyle = color;

        ctx.beginPath();

        ctx.arc(
            p.x + x * ZOOM,
            p.y + y * ZOOM,
            r * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    if (b.name === "CAFETERIA") {
        circle(
            28,
            19,
            8,
            "#465157"
        );

        circle(
            28,
            19,
            6,
            "#59656a"
        );

        for (const pos of [
            [10, 9],
            [45, 9],
            [10, 28],
            [45, 28]
        ]) {
            circle(
                pos[0],
                pos[1],
                2.5,
                "#566168"
            );
        }
    }

    if (b.name === "MEDBAY") {
        rect(
            5,
            6,
            13,
            5,
            "#9ba8aa"
        );

        rect(
            24,
            6,
            13,
            5,
            "#9ba8aa"
        );

        circle(
            21,
            16,
            3,
            "#57a89f"
        );
    }

    if (
        b.name === "UPPER ENGINE" ||
        b.name === "LOWER ENGINE"
    ) {
        for (let i = 0; i < 3; i++) {
            rect(
                6 + i * 11,
                6,
                8,
                18,
                "#414b50"
            );

            circle(
                10 + i * 11,
                15,
                2.2,
                "#72959a"
            );
        }
    }

    if (b.name === "WEAPONS") {
        rect(
            5,
            7,
            33,
            6,
            "#455157"
        );

        circle(
            22,
            20,
            4,
            "#57909b"
        );
    }

    if (b.name === "REACTOR") {
        circle(
            23,
            18,
            10,
            "#39464b"
        );

        circle(
            23,
            18,
            6,
            "#527e84"
        );

        circle(
            23,
            18,
            2.5,
            "#9ce0d5"
        );
    }

    if (b.name === "ELECTRICAL") {
        for (let i = 0; i < 3; i++) {
            rect(
                5 + i * 11,
                7,
                8,
                19,
                "#424b50"
            );

            circle(
                9 + i * 11,
                12,
                1.4,
                "#b4c96c"
            );

            circle(
                9 + i * 11,
                20,
                1.4,
                "#c78d61"
            );
        }
    }

    if (b.name === "SECURITY") {
        for (let i = 0; i < 3; i++) {
            rect(
                5 + i * 12,
                7,
                9,
                7,
                "#1b3038"
            );
        }

        rect(
            8,
            19,
            27,
            5,
            "#465157"
        );
    }

    if (b.name === "STORAGE") {
        for (
            let y = 6;
            y < 30;
            y += 8
        ) {
            for (
                let x = 5;
                x < 43;
                x += 10
            ) {
                rect(
                    x,
                    y,
                    7,
                    6,
                    "#675b47"
                );
            }
        }
    }

    if (b.name === "ADMIN") {
        rect(
            6,
            7,
            28,
            7,
            "#3d4a4f"
        );

        rect(
            10,
            20,
            20,
            5,
            "#4c595e"
        );
    }

    if (b.name === "NAVIGATION") {
        rect(
            5,
            7,
            32,
            8,
            "#263e46"
        );

        circle(
            21,
            11,
            4,
            "#70aab3"
        );
    }

    if (b.name === "O2") {
        for (let i = 0; i < 3; i++) {
            circle(
                10 + i * 9,
                17,
                4,
                "#4c6769"
            );
        }
    }

    if (
        b.name === "COMMUNICATIONS"
    ) {
        rect(
            6,
            8,
            28,
            6,
            "#3c494e"
        );

        rect(
            10,
            19,
            20,
            5,
            "#4b585d"
        );
    }
}


// ============================================================
// TASK MARKERS
// ============================================================

function drawTaskMarkers() {
    for (const task of selectedTasks) {
        if (task.completed) {
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
                gameTime * 4 +
                task.x
            ) * 0.12;

        const near =
            Math.hypot(
                player.x - task.x,
                player.y - task.y
            ) < 6;

        ctx.save();

        ctx.globalAlpha =
            near ? 1 : 0.65;

        ctx.fillStyle =
            task.time <= 2.5
                ? "#62ff86"
                : task.time <= 5
                    ? "#ffd85a"
                    : "#ff705c";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            2 * ZOOM * pulse,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#ffffff";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            0.55 * ZOOM,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}


// ============================================================
// ANIMATED PLAYER
// ============================================================

function drawPlayer() {
    const p =
        worldToScreen(
            player.x,
            player.y
        );

    const s = ZOOM;

    const walking =
        player.moving;

    // Walking animation
    const walk =
        walking
            ? Math.sin(
                player.walkTime * 18
            )
            : 0;

    // Body bob
    const bob =
        walking
            ? Math.abs(walk) * 0.35
            : Math.sin(
                player.idleTime * 2
            ) * 0.12;

    // Idle breathing
    const breathe =
        walking
            ? 0
            : Math.sin(
                player.idleTime * 2.2
            ) * 0.04;

    ctx.save();

    ctx.translate(
        p.x,
        p.y -
        bob * s
    );

    ctx.scale(
        1 + breathe,
        1 - breathe
    );


    // Shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        3 * s,
        2.5 * s,
        0.75 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Legs
    const legA =
        walk * 0.5;

    const legB =
        -walk * 0.5;

    ctx.fillStyle =
        "#921f29";

    ctx.beginPath();

    ctx.roundRect(
        -1.45 * s +
            legA * s,
        0.8 * s,
        1.25 * s,
        2.2 * s,
        0.55 * s
    );

    ctx.fill();

    ctx.beginPath();

    ctx.roundRect(
        0.2 * s +
            legB * s,
        0.8 * s,
        1.25 * s,
        2.2 * s,
        0.55 * s
    );

    ctx.fill();


    // Backpack
    ctx.fillStyle =
        "#9f252e";

    ctx.beginPath();

    ctx.roundRect(
        -2.65 * s,
        -2.3 * s,
        1.7 * s,
        4.5 * s,
        0.7 * s
    );

    ctx.fill();


    // Body
    ctx.fillStyle =
        "#d93845";

    ctx.beginPath();

    ctx.roundRect(
        -2 * s,
        -3.4 * s,
        4 * s,
        5.9 * s,
        1.65 * s
    );

    ctx.fill();


    // Body highlight
    ctx.fillStyle =
        "rgba(255,255,255,0.1)";

    ctx.beginPath();

    ctx.roundRect(
        -1.55 * s,
        -2.8 * s,
        0.65 * s,
        3.5 * s,
        0.3 * s
    );

    ctx.fill();


    // Visor
    const visorX =
        player.facing *
        0.35;

    ctx.fillStyle =
        "#112b38";

    ctx.beginPath();

    ctx.ellipse(
        visorX * s,
        -1.8 * s,
        1.65 * s,
        1.05 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Visor reflection
    ctx.fillStyle =
        "#8ce0f2";

    ctx.beginPath();

    ctx.ellipse(
        (visorX + player.facing * 0.32) * s,
        -2.02 * s,
        0.95 * s,
        0.43 * s,
        -0.12,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Moving visor shine
    const shine =
        Math.sin(
            gameTime * 2
        ) * 0.12;

    ctx.fillStyle =
        `rgba(255,255,255,${0.35 + shine})`;

    ctx.beginPath();

    ctx.ellipse(
        (visorX +
            player.facing * 0.62) * s,
        -2.15 * s,
        0.28 * s,
        0.12 * s,
        -0.12,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


// ============================================================
// BARRIER
// ============================================================

function drawBarrier() {
    const a =
        worldToScreen(
            0,
            0
        );

    const b =
        worldToScreen(
            WORLD_W,
            WORLD_H
        );

    const pulse =
        Math.sin(
            gameTime * 3
        ) *
        0.25 +
        0.75;

    ctx.save();

    ctx.strokeStyle =
        `rgba(85,220,255,${pulse})`;

    ctx.lineWidth =
        1.5 * ZOOM;

    ctx.shadowColor =
        "#42dfff";

    ctx.shadowBlur =
        12;

    ctx.strokeRect(
        a.x,
        a.y,
        b.x - a.x,
        b.y - a.y
    );

    ctx.shadowBlur = 0;

    ctx.restore();
}


// ============================================================
// TASK INTERACTION
// ============================================================

function interact() {
    if (currentTask) {
        currentTask.active = false;
        currentTask = null;
        taskProgress = 0;
        return;
    }

    let closest = null;
    let closestDistance = Infinity;

    for (const task of selectedTasks) {
        if (task.completed) {
            continue;
        }

        const d =
            Math.hypot(
                player.x - task.x,
                player.y - task.y
            );

        if (
            d < closestDistance
        ) {
            closest =
                task;

            closestDistance =
                d;
        }
    }

    if (
        closest &&
        closestDistance < 6
    ) {
        currentTask =
            closest;

        currentTask.active =
            true;

        taskProgress = 0;
    }
}

function updateTask(dt) {
    if (!currentTask) {
        return;
    }

    taskProgress +=
        dt / 1000;

    if (
        taskProgress >=
        currentTask.time
    ) {
        currentTask.completed =
            true;

        currentTask.active =
            false;

        currentTask =
            null;

        taskProgress =
            0;
    }
}


// ============================================================
// UI
// ============================================================

function drawUI() {
    const completed =
        selectedTasks.filter(
            task =>
                task.completed
        ).length;

    const total =
        selectedTasks.length;

    ctx.save();

    ctx.fillStyle =
        "rgba(7,11,15,0.85)";

    ctx.beginPath();

    ctx.roundRect(
        16,
        16,
        245,
        68,
        10
    );

    ctx.fill();

    ctx.font =
        "bold 15px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.textAlign =
        "left";

    ctx.fillText(
        "TASKS",
        30,
        38
    );

    ctx.font =
        "13px Arial";

    ctx.fillStyle =
        "#aab4ba";

    ctx.fillText(
        `${completed} / ${total}`,
        30,
        59
    );

    ctx.fillStyle =
        "rgba(255,255,255,0.1)";

    ctx.fillRect(
        85,
        52,
        155,
        8
    );

    ctx.fillStyle =
        "#63dc87";

    ctx.fillRect(
        85,
        52,
        155 *
            (completed / total),
        8
    );

    ctx.restore();


    // Interaction
    if (currentTask) {
        drawTaskWindow();
    } else {
        drawInteractionPrompt();
    }


    // Victory
    if (
        selectedTasks.every(
            task =>
                task.completed
        )
    ) {
        drawVictory();
    }
}


function drawInteractionPrompt() {
    let closest = null;
    let closestDistance =
        Infinity;

    for (const task of selectedTasks) {
        if (task.completed) {
            continue;
        }

        const d =
            Math.hypot(
                player.x - task.x,
                player.y - task.y
            );

        if (
            d <
            closestDistance
        ) {
            closest =
                task;

            closestDistance =
                d;
        }
    }

    if (
        !closest ||
        closestDistance >= 6
    ) {
        return;
    }

    const w = 280;
    const h = 46;

    const x =
        W / 2 -
        w / 2;

    const y =
        H - 72;

    ctx.save();

    ctx.fillStyle =
        "rgba(7,11,15,0.92)";

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        w,
        h,
        10
    );

    ctx.fill();

    ctx.font =
        "bold 14px Arial";

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        `E  —  ${closest.name}`,
        W / 2,
        y + 29
    );

    ctx.restore();
}


function drawTaskWindow() {
    const w = 360;
    const h = 105;

    const x =
        W / 2 -
        w / 2;

    const y =
        H / 2 -
        h / 2;

    ctx.save();

    ctx.fillStyle =
        "rgba(6,9,13,0.96)";

    ctx.strokeStyle =
        "rgba(255,255,255,0.2)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        w,
        h,
        13
    );

    ctx.fill();
    ctx.stroke();

    ctx.font =
        "bold 18px Arial";

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        currentTask.name,
        W / 2,
        y + 32
    );

    ctx.font =
        "12px Arial";

    ctx.fillStyle =
        "#aeb7bd";

    ctx.fillText(
        "Completing task...",
        W / 2,
        y + 52
    );

    ctx.fillStyle =
        "rgba(255,255,255,0.1)";

    ctx.fillRect(
        x + 30,
        y + 67,
        w - 60,
        12
    );

    ctx.fillStyle =
        currentTask.time <= 2.5
            ? "#5cff83"
            : currentTask.time <= 5
                ? "#ffd75c"
                : "#ff705c";

    ctx.fillRect(
        x + 30,
        y + 67,
        (w - 60) *
            Math.min(
                1,
                taskProgress /
                currentTask.time
            ),
        12
    );

    ctx.font =
        "11px Arial";

    ctx.fillStyle =
        "#879197";

    ctx.fillText(
        "Press E to cancel",
        W / 2,
        y + 96
    );

    ctx.restore();
}


function drawVictory() {
    ctx.save();

    ctx.fillStyle =
        "rgba(0,0,0,0.6)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.textAlign =
        "center";

    ctx.font =
        "bold 40px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        "TASKS COMPLETE",
        W / 2,
        H / 2 - 20
    );

    ctx.font =
        "17px Arial";

    ctx.fillStyle =
        "#66dd88";

    ctx.fillText(
        "You survived the planet.",
        W / 2,
        H / 2 + 20
    );

    ctx.restore();
}


// ============================================================
// LOOP
// ============================================================

let lastTime =
    performance.now();

function loop(now) {
    const dt =
        Math.min(
            50,
            now - lastTime
        );

    lastTime = now;

    gameTime +=
        dt / 1000;

    updatePlayer(dt);
    updateTask(dt);
    updateCamera();

    drawSpace();
    drawGround();
    drawPaths();
    drawBuildings();
    drawBarrier();
    drawTaskMarkers();
    drawPlayer();
    drawUI();

    requestAnimationFrame(
        loop
    );
}

requestAnimationFrame(
    loop
);
