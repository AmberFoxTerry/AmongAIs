const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const WORLD_W = 220;
const WORLD_H = 150;

const PLAYER_SPEED = 0.18;

const keys = {};

let player = {
    x: 110,
    y: 75,
    radius: 1.2
};

let camera = {
    x: player.x,
    y: player.y,
    zoom: 5
};

let tasks = [];
let completedTasks = 0;
let activeTask = null;

const walls = [];
const rooms = [];

/* =========================================================
   MAP
   ========================================================= */

function addRoom(name, x, y, w, h) {
    rooms.push({
        name,
        x,
        y,
        w,
        h
    });
}

function addWall(x, y, w, h) {
    walls.push({
        x,
        y,
        w,
        h
    });
}

/*
    Main layout.

    Large central hub with six wings.
*/

addRoom("Cafeteria", 82, 57, 56, 36);

addRoom("Upper Engine", 18, 12, 38, 28);
addRoom("Lower Engine", 18, 110, 38, 28);

addRoom("Reactor", 8, 60, 38, 32);

addRoom("MedBay", 52, 12, 28, 30);
addRoom("Security", 52, 108, 28, 30);

addRoom("Weapons", 150, 12, 36, 30);
addRoom("Navigation", 190, 52, 25, 34);

addRoom("Admin", 142, 57, 32, 28);
addRoom("O2", 145, 105, 30, 30);

addRoom("Storage", 82, 105, 56, 35);

addRoom("Electrical", 45, 57, 30, 30);
addRoom("Communications", 185, 105, 30, 30);

/*
    Corridor walls / boundaries.

    The map is intentionally open in the middle,
    but rooms are separated by solid walls.
*/

/* Upper Engine */
addWall(18, 10, 38, 2);
addWall(18, 40, 38, 2);
addWall(16, 12, 2, 28);
addWall(56, 12, 2, 28);

/* Lower Engine */
addWall(18, 108, 38, 2);
addWall(18, 138, 38, 2);
addWall(16, 110, 2, 28);
addWall(56, 110, 2, 28);

/* Reactor */
addWall(8, 58, 38, 2);
addWall(8, 92, 38, 2);
addWall(6, 60, 2, 32);
addWall(46, 60, 2, 32);

/* MedBay */
addWall(52, 10, 28, 2);
addWall(52, 42, 28, 2);
addWall(50, 12, 2, 30);
addWall(80, 12, 2, 30);

/* Security */
addWall(52, 106, 28, 2);
addWall(52, 138, 28, 2);
addWall(50, 108, 2, 30);
addWall(80, 108, 2, 30);

/* Cafeteria */
addWall(82, 55, 56, 2);
addWall(82, 93, 56, 2);
addWall(80, 57, 2, 36);
addWall(138, 57, 2, 36);

/* Weapons */
addWall(150, 10, 36, 2);
addWall(150, 42, 36, 2);
addWall(148, 12, 2, 30);
addWall(186, 12, 2, 30);

/* Navigation */
addWall(190, 50, 25, 2);
addWall(190, 86, 25, 2);
addWall(188, 52, 2, 34);
addWall(215, 52, 2, 34);

/* Admin */
addWall(142, 55, 32, 2);
addWall(142, 85, 32, 2);
addWall(140, 57, 2, 28);
addWall(174, 57, 2, 28);

/* O2 */
addWall(145, 103, 30, 2);
addWall(145, 137, 30, 2);
addWall(143, 105, 2, 32);
addWall(175, 105, 2, 32);

/* Storage */
addWall(82, 103, 56, 2);
addWall(82, 140, 56, 2);
addWall(80, 105, 2, 35);
addWall(138, 105, 2, 35);

/* Electrical */
addWall(45, 55, 30, 2);
addWall(45, 89, 30, 2);
addWall(43, 57, 2, 32);
addWall(75, 57, 2, 32);

/* Communications */
addWall(185, 103, 30, 2);
addWall(185, 137, 30, 2);
addWall(183, 105, 2, 32);
addWall(215, 105, 2, 32);

/*
    Create openings in walls by not putting walls
    across these corridor entrances.

    The spaces between wall sections are the doors.
*/

/* =========================================================
   TASKS
   ========================================================= */

const TASK_DATA = [
    {
        name: "Fix Wiring",
        room: "Electrical",
        x: 54,
        y: 70,
        duration: 2200
    },

    {
        name: "Calibrate Reactor",
        room: "Reactor",
        x: 25,
        y: 76,
        duration: 2800
    },

    {
        name: "Inspect MedBay",
        room: "MedBay",
        x: 65,
        y: 25,
        duration: 2200
    },

    {
        name: "Align Engine",
        room: "Upper Engine",
        x: 35,
        y: 25,
        duration: 2500
    },

    {
        name: "Fuel Engine",
        room: "Lower Engine",
        x: 35,
        y: 125,
        duration: 2500
    },

    {
        name: "Upload Data",
        room: "Admin",
        x: 157,
        y: 70,
        duration: 2500
    },

    {
        name: "Clear Asteroids",
        room: "Weapons",
        x: 168,
        y: 26,
        duration: 3000
    },

    {
        name: "Navigate",
        room: "Navigation",
        x: 203,
        y: 68,
        duration: 2400
    },

    {
        name: "Clean O2",
        room: "O2",
        x: 158,
        y: 120,
        duration: 2300
    },

    {
        name: "Repair Communications",
        room: "Communications",
        x: 199,
        y: 120,
        duration: 2500
    },

    {
        name: "Organize Storage",
        room: "Storage",
        x: 110,
        y: 122,
        duration: 2200
    }
];

tasks = TASK_DATA.map((task, index) => ({
    ...task,
    id: index,
    complete: false
}));

/* =========================================================
   INPUT
   ========================================================= */

window.addEventListener("keydown", event => {
    keys[event.key.toLowerCase()] = true;

    if (
        event.key === " " ||
        event.key === "e"
    ) {
        interact();
    }
});

window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

/* =========================================================
   COLLISION
   ========================================================= */

function circleRectCollision(
    cx,
    cy,
    radius,
    rect
) {
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

    return (
        dx * dx +
        dy * dy <
        radius * radius
    );
}

function collides(x, y) {
    for (const wall of walls) {
        if (
            circleRectCollision(
                x,
                y,
                player.radius,
                wall
            )
        ) {
            return true;
        }
    }

    return false;
}

function movePlayer(dx, dy) {
    /*
        Separate X/Y collision lets the player slide
        along walls instead of getting stuck.
    */

    const nextX =
        player.x + dx;

    if (!collides(nextX, player.y)) {
        player.x = nextX;
    }

    const nextY =
        player.y + dy;

    if (!collides(player.x, nextY)) {
        player.y = nextY;
    }

    player.x = Math.max(
        1,
        Math.min(
            WORLD_W - 1,
            player.x
        )
    );

    player.y = Math.max(
        1,
        Math.min(
            WORLD_H - 1,
            player.y
        )
    );
}

/* =========================================================
   TASK INTERACTION
   ========================================================= */

function nearestTask() {
    let best = null;
    let bestDistance = Infinity;

    for (const task of tasks) {
        if (task.complete) {
            continue;
        }

        const dx =
            player.x - task.x;

        const dy =
            player.y - task.y;

        const d =
            Math.hypot(dx, dy);

        if (d < bestDistance) {
            bestDistance = d;
            best = task;
        }
    }

    if (bestDistance <= 3) {
        return best;
    }

    return null;
}

function interact() {
    if (activeTask) {
        return;
    }

    const task = nearestTask();

    if (!task) {
        return;
    }

    activeTask = {
        task,
        started: performance.now()
    };
}

function updateTask() {
    if (!activeTask) {
        return;
    }

    const elapsed =
        performance.now() -
        activeTask.started;

    const duration =
        activeTask.task.duration;

    if (elapsed >= duration) {
        activeTask.task.complete = true;

        completedTasks++;

        activeTask = null;
    }
}

/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera() {
    /*
        Smooth follow.
    */

    camera.x +=
        (player.x - camera.x) * 0.12;

    camera.y +=
        (player.y - camera.y) * 0.12;

    const halfWidth =
        window.innerWidth /
        camera.zoom /
        2;

    const halfHeight =
        window.innerHeight /
        camera.zoom /
        2;

    camera.x = Math.max(
        halfWidth,
        Math.min(
            WORLD_W - halfWidth,
            camera.x
        )
    );

    camera.y = Math.max(
        halfHeight,
        Math.min(
            WORLD_H - halfHeight,
            camera.y
        )
    );
}

/* =========================================================
   DRAWING
   ========================================================= */

function worldToScreen(x, y) {
    return {
        x:
            (x - camera.x) *
                camera.zoom +
            window.innerWidth / 2,

        y:
            (y - camera.y) *
                camera.zoom +
            window.innerHeight / 2
    };
}

function drawRect(
    x,
    y,
    w,
    h,
    fill,
    stroke = null
) {
    const p =
        worldToScreen(x, y);

    ctx.fillStyle = fill;

    ctx.fillRect(
        p.x,
        p.y,
        w * camera.zoom,
        h * camera.zoom
    );

    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth =
            Math.max(
                1,
                camera.zoom * 0.35
            );

        ctx.strokeRect(
            p.x,
            p.y,
            w * camera.zoom,
            h * camera.zoom
        );
    }
}

function drawMap() {
    ctx.fillStyle = "#07090c";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    /*
        Floor areas.
    */

    for (const room of rooms) {
        drawRect(
            room.x,
            room.y,
            room.w,
            room.h,
            "#171c22",
            "#69737e"
        );

        drawRect(
            room.x + 2,
            room.y + 2,
            room.w - 4,
            room.h - 4,
            "#1d232a"
        );

        const center =
            worldToScreen(
                room.x + room.w / 2,
                room.y + room.h / 2
            );

        ctx.font =
            `${Math.max(
                10,
                camera.zoom * 2.2
            )}px Arial`;

        ctx.textAlign = "center";

        ctx.fillStyle =
            "rgba(255,255,255,0.25)";

        ctx.fillText(
            room.name.toUpperCase(),
            center.x,
            center.y
        );
    }

    /*
        Corridors are the spaces between rooms,
        giving the map its open ship layout.
    */

    drawRect(
        56,
        20,
        8,
        10,
        "#10151a"
    );

    drawRect(
        76,
        67,
        10,
        10,
        "#10151a"
    );

    drawRect(
        132,
        67,
        12,
        10,
        "#10151a"
    );

    drawRect(
        172,
        65,
        20,
        10,
        "#10151a"
    );

    drawRect(
        130,
        25,
        20,
        10,
        "#10151a"
    );

    drawRect(
        180,
        25,
        14,
        10,
        "#10151a"
    );

    drawRect(
        126,
        85,
        10,
        22,
        "#10151a"
    );

    drawRect(
        55,
        85,
        10,
        25,
        "#10151a"
    );

    drawRect(
        136,
        115,
        12,
        10,
        "#10151a"
    );

    drawRect(
        173,
        115,
        14,
        10,
        "#10151a"
    );

    /*
        Walls.
    */

    for (const wall of walls) {
        drawRect(
            wall.x,
            wall.y,
            wall.w,
            wall.h,
            "#4c5661",
            "#77828e"
        );
    }
}

function drawCafeteriaDetails() {
    const room =
        rooms.find(
            r => r.name === "Cafeteria"
        );

    const tables = [
        [95, 68],
        [125, 68],
        [95, 83],
        [125, 83]
    ];

    for (const [x, y] of tables) {
        const p =
            worldToScreen(x, y);

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            4 * camera.zoom,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#303943";
        ctx.fill();

        ctx.strokeStyle = "#7a8590";

        ctx.stroke();
    }

    const button =
        worldToScreen(
            room.x + room.w / 2,
            room.y + room.h / 2
        );

    ctx.beginPath();

    ctx.arc(
        button.x,
        button.y,
        3 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#c73737";
    ctx.fill();

    ctx.strokeStyle = "#ffffff";

    ctx.stroke();
}

function drawTasks() {
    for (const task of tasks) {
        if (task.complete) {
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
                performance.now() / 300
            ) *
            0.15;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            2.5 *
                camera.zoom *
                pulse,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#e7c84b";

        ctx.fill();

        ctx.strokeStyle =
            "rgba(255,255,255,0.7)";

        ctx.stroke();
    }
}

function drawPlayer() {
    const p =
        worldToScreen(
            player.x,
            player.y
        );

    const r =
        player.radius *
        camera.zoom;

    /*
        Shadow.
    */

    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y + r * 0.8,
        r * 0.9,
        r * 0.35,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.45)";

    ctx.fill();

    /*
        Body.
    */

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#e8e8e8";

    ctx.fill();

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 1.5;

    ctx.stroke();

    /*
        Visor.
    */

    ctx.beginPath();

    ctx.ellipse(
        p.x + r * 0.25,
        p.y - r * 0.25,
        r * 0.48,
        r * 0.3,
        -0.2,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#4c9bb0";

    ctx.fill();

    ctx.strokeStyle = "#b8f0ff";

    ctx.stroke();
}

function drawUI() {
    /*
        Top-left.
    */

    ctx.fillStyle =
        "rgba(8,10,13,0.9)";

    ctx.fillRect(
        15,
        15,
        230,
        75
    );

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold 18px Arial";

    ctx.textAlign = "left";

    ctx.fillText(
        "TASKS",
        30,
        40
    );

    ctx.font =
        "15px Arial";

    ctx.fillStyle = "#b7c0c8";

    ctx.fillText(
        `${completedTasks} / ${tasks.length}`,
        30,
        64
    );

    /*
        Task prompt.
    */

    const task =
        nearestTask();

    if (
        task &&
        !activeTask
    ) {
        const width = 270;
        const height = 60;

        const x =
            window.innerWidth / 2 -
            width / 2;

        const y =
            window.innerHeight -
            100;

        ctx.fillStyle =
            "rgba(8,10,13,0.92)";

        ctx.fillRect(
            x,
            y,
            width,
            height
        );

        ctx.textAlign = "center";

        ctx.font =
            "bold 17px Arial";

        ctx.fillStyle = "#ffffff";

        ctx.fillText(
            `[ E ]  ${task.name}`,
            window.innerWidth / 2,
            y + 25
        );

        ctx.font =
            "12px Arial";

        ctx.fillStyle = "#9fa8b1";

        ctx.fillText(
            task.room,
            window.innerWidth / 2,
            y + 45
        );
    }

    /*
        Task progress.
    */

    if (activeTask) {
        const elapsed =
            performance.now() -
            activeTask.started;

        const progress =
            Math.min(
                1,
                elapsed /
                    activeTask.task.duration
            );

        const width = 300;

        const x =
            window.innerWidth / 2 -
            width / 2;

        const y =
            window.innerHeight -
            90;

        ctx.fillStyle =
            "rgba(8,10,13,0.95)";

        ctx.fillRect(
            x - 10,
            y - 10,
            width + 20,
            55
        );

        ctx.fillStyle = "#ffffff";

        ctx.textAlign = "center";

        ctx.font =
            "bold 14px Arial";

        ctx.fillText(
            activeTask.task.name,
            window.innerWidth / 2,
            y + 8
        );

        ctx.fillStyle = "#30363d";

        ctx.fillRect(
            x,
            y + 18,
            width,
            8
        );

        ctx.fillStyle = "#e4c94c";

        ctx.fillRect(
            x,
            y + 18,
            width * progress,
            8
        );
    }
}

/* =========================================================
   GAME LOOP
   ========================================================= */

function update() {
    let dx = 0;
    let dy = 0;

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {
        dy -= PLAYER_SPEED;
    }

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {
        dy += PLAYER_SPEED;
    }

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {
        dx -= PLAYER_SPEED;
    }

    if (
        keys["d"] ||
        keys["arrowright"]
    ) {
        dx += PLAYER_SPEED;
    }

    /*
        Normalize diagonal movement.
    */

    if (dx !== 0 && dy !== 0) {
        const length =
            Math.hypot(dx, dy);

        dx /= length;
        dy /= length;

        dx *= PLAYER_SPEED;
        dy *= PLAYER_SPEED;
    }

    movePlayer(dx, dy);

    updateTask();
    updateCamera();
}

function draw() {
    update();

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    drawMap();
    drawCafeteriaDetails();
    drawTasks();
    drawPlayer();
    drawUI();

    requestAnimationFrame(draw);
}

/* =========================================================
   RESIZE
   ========================================================= */

function resize() {
    const dpr =
        window.devicePixelRatio || 1;

    canvas.width =
        window.innerWidth * dpr;

    canvas.height =
        window.innerHeight * dpr;

    canvas.style.width =
        `${window.innerWidth}px`;

    canvas.style.height =
        `${window.innerHeight}px`;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

window.addEventListener(
    "resize",
    resize
);

resize();

draw();
