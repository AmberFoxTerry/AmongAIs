const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const newGameButton = document.getElementById("newGame");

let game = null;

let camera = {
    x: 0,
    y: 0,
    zoom: 1
};

let dragging = false;
let dragStart = { x: 0, y: 0 };
let cameraStart = { x: 0, y: 0 };

const WORLD_WIDTH = 60;
const WORLD_HEIGHT = 40;

/*
    AI AMONG US
    Frontend renderer for the server simulation.

    World coordinates match server.js.
*/

// ============================================================
// ROOM DATA
// ============================================================

const rooms = {
    UpperEngine: {
        name: "Upper Engine",
        x: 2,
        y: 2,
        w: 8,
        h: 8
    },

    Reactor: {
        name: "Reactor",
        x: 2,
        y: 12,
        w: 8,
        h: 10
    },

    LowerEngine: {
        name: "Lower Engine",
        x: 2,
        y: 24,
        w: 8,
        h: 8
    },

    MedBay: {
        name: "MedBay",
        x: 15,
        y: 7,
        w: 8,
        h: 6
    },

    Security: {
        name: "Security",
        x: 11,
        y: 10,
        w: 6,
        h: 6
    },

    Electrical: {
        name: "Electrical",
        x: 13,
        y: 17,
        w: 7,
        h: 6
    },

    Cafeteria: {
        name: "Cafeteria",
        x: 18,
        y: 14,
        w: 12,
        h: 9
    },

    Weapons: {
        name: "Weapons",
        x: 26,
        y: 2,
        w: 9,
        h: 6
    },

    Navigation: {
        name: "Navigation",
        x: 30,
        y: 10,
        w: 8,
        h: 8
    },

    O2: {
        name: "O2",
        x: 34,
        y: 20,
        w: 7,
        h: 6
    },

    Admin: {
        name: "Admin",
        x: 24,
        y: 15,
        w: 7,
        h: 7
    },

    Storage: {
        name: "Storage",
        x: 11,
        y: 23,
        w: 11,
        h: 7
    },

    Communications: {
        name: "Communications",
        x: 21,
        y: 27,
        w: 7,
        h: 5
    },

    Shields: {
        name: "Shields",
        x: 32,
        y: 26,
        w: 7,
        h: 6
    }
};

const roomColors = {
    "Upper Engine": "#75402f",
    "Reactor": "#50565b",
    "Lower Engine": "#75402f",
    "MedBay": "#50757a",
    "Security": "#454d53",
    "Electrical": "#5a5148",
    "Cafeteria": "#9b9d98",
    "Weapons": "#526e78",
    "Navigation": "#475f68",
    "O2": "#5c7773",
    "Admin": "#745569",
    "Storage": "#776b49",
    "Communications": "#405f68",
    "Shields": "#596e6e"
};

// ============================================================
// CANVAS
// ============================================================

function resizeCanvas() {

    const dpr = window.devicePixelRatio || 1;

    canvas.width =
        window.innerWidth * dpr;

    canvas.height =
        window.innerHeight * dpr;

    canvas.style.width =
        window.innerWidth + "px";

    canvas.style.height =
        window.innerHeight + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    fitMap();
}

function fitMap() {

    const padding = 45;

    const scaleX =
        (window.innerWidth - padding * 2) /
        WORLD_WIDTH;

    const scaleY =
        (window.innerHeight - padding * 2) /
        WORLD_HEIGHT;

    camera.zoom =
        Math.min(scaleX, scaleY);

    camera.x =
        (window.innerWidth -
            WORLD_WIDTH * camera.zoom) / 2;

    camera.y =
        (window.innerHeight -
            WORLD_HEIGHT * camera.zoom) / 2;
}

function worldToScreen(x, y) {

    return {
        x:
            camera.x +
            x * camera.zoom,

        y:
            camera.y +
            y * camera.zoom
    };
}

function screenToWorld(x, y) {

    return {
        x:
            (x - camera.x) /
            camera.zoom,

        y:
            (y - camera.y) /
            camera.zoom
    };
}

// ============================================================
// COLORS
// ============================================================

function darken(hex, amount) {

    hex =
        hex.replace("#", "");

    if (hex.length !== 6) {
        return "#000000";
    }

    const r =
        Math.floor(
            parseInt(
                hex.substring(0, 2),
                16
            ) * amount
        );

    const g =
        Math.floor(
            parseInt(
                hex.substring(2, 4),
                16
            ) * amount
        );

    const b =
        Math.floor(
            parseInt(
                hex.substring(4, 6),
                16
            ) * amount
        );

    return `rgb(${r},${g},${b})`;
}

// ============================================================
// SHIP
// ============================================================

function shipOutline() {

    return [
        [0.5, 9],
        [1.5, 6],
        [4, 3],
        [9, 1],
        [18, 1],
        [21, 2],
        [25, 1],
        [34, 1],
        [38, 3],
        [43, 1],
        [51, 2],
        [56, 5],
        [59, 9],
        [59, 16],
        [57, 18],
        [52, 18],
        [51, 22],
        [53, 26],
        [52, 32],
        [49, 35],
        [40, 36],
        [38, 38],
        [29, 38],
        [26, 35],
        [21, 35],
        [18, 36],
        [8, 36],
        [3, 34],
        [1, 30]
    ];
}

function drawShip() {

    const points =
        shipOutline();

    ctx.beginPath();

    points.forEach(
        ([x, y], index) => {

            const p =
                worldToScreen(x, y);

            if (index === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }
    );

    ctx.closePath();

    ctx.fillStyle = "#11171b";
    ctx.fill();

    ctx.strokeStyle = "#30383e";
    ctx.lineWidth =
        0.35 * camera.zoom;

    ctx.stroke();
}

// ============================================================
// ROOMS
// ============================================================

function drawRoom(room) {

    const p1 =
        worldToScreen(
            room.x,
            room.y
        );

    const p2 =
        worldToScreen(
            room.x + room.w,
            room.y + room.h
        );

    ctx.fillStyle =
        roomColors[room.name] ||
        "#555";

    ctx.fillRect(
        p1.x,
        p1.y,
        p2.x - p1.x,
        p2.y - p1.y
    );

    ctx.strokeStyle = "#20272c";

    ctx.lineWidth =
        0.35 * camera.zoom;

    ctx.strokeRect(
        p1.x,
        p1.y,
        p2.x - p1.x,
        p2.y - p1.y
    );

    // Inner floor
    ctx.strokeStyle =
        "rgba(255,255,255,0.07)";

    ctx.lineWidth =
        0.08 * camera.zoom;

    ctx.strokeRect(
        p1.x + 0.5 * camera.zoom,
        p1.y + 0.5 * camera.zoom,
        p2.x - p1.x - camera.zoom,
        p2.y - p1.y - camera.zoom
    );
}

function drawRooms() {

    for (
        const room of Object.values(rooms)
    ) {
        drawRoom(room);
    }
}

// ============================================================
// CORRIDORS
// ============================================================

const corridors = [
    [10, 8, 5, 2],
    [14, 11, 2, 4],
    [16, 12, 4, 2],
    [29, 6, 4, 2],
    [27, 22, 2, 3],
    [19, 22, 3, 4],
    [18, 20, 3, 4],
    [8, 27, 5, 2],
    [6, 21, 2, 5],
    [8, 15, 5, 2],
    [27, 25, 2, 4],
    [30, 21, 5, 2],
    [37, 15, 3, 7],
    [34, 7, 3, 5],
    [37, 24, 3, 4],
    [28, 29, 6, 2]
];

function drawCorridors() {

    for (const corridor of corridors) {

        const [
            x,
            y,
            w,
            h
        ] = corridor;

        const p =
            worldToScreen(x, y);

        ctx.fillStyle = "#62696d";

        ctx.fillRect(
            p.x,
            p.y,
            w * camera.zoom,
            h * camera.zoom
        );

        ctx.strokeStyle =
            "#242a2e";

        ctx.lineWidth =
            0.25 * camera.zoom;

        ctx.strokeRect(
            p.x,
            p.y,
            w * camera.zoom,
            h * camera.zoom
        );

        // Corridor center strip
        ctx.fillStyle =
            "rgba(255,255,255,0.07)";

        ctx.fillRect(
            p.x,
            p.y +
                h * camera.zoom * 0.42,
            w * camera.zoom,
            h * camera.zoom * 0.16
        );
    }
}

// ============================================================
// CAFETERIA
// ============================================================

function drawTable(x, y, radius = 1.1) {

    const p =
        worldToScreen(x, y);

    const r =
        radius * camera.zoom;

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#4a7382";
    ctx.fill();

    ctx.strokeStyle = "#253f48";

    ctx.lineWidth =
        0.2 * camera.zoom;

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        r * 0.58,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#6e9ba5";
    ctx.fill();

    ctx.strokeStyle = "#34535c";
    ctx.stroke();
}

function drawCafeteria() {

    // Actual five-table arrangement.
    drawTable(21.7, 16.8);
    drawTable(27.2, 16.8);
    drawTable(21.7, 20.3);
    drawTable(27.2, 20.3);

    // Emergency table
    const center =
        worldToScreen(
            24.45,
            18.55
        );

    ctx.beginPath();

    ctx.arc(
        center.x,
        center.y,
        1.3 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#486e7d";
    ctx.fill();

    ctx.strokeStyle = "#233e47";

    ctx.lineWidth =
        0.25 * camera.zoom;

    ctx.stroke();

    // Emergency button
    ctx.beginPath();

    ctx.arc(
        center.x,
        center.y - 0.05 * camera.zoom,
        0.32 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#d73535";
    ctx.fill();

    ctx.strokeStyle = "#8d1f1f";
    ctx.stroke();
}

// ============================================================
// ROOM DETAILS
// ============================================================

function drawEngine(room) {

    const x =
        room === "UpperEngine"
            ? 6
            : 6;

    const y =
        room === "UpperEngine"
            ? 6
            : 28;

    const p =
        worldToScreen(x, y);

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    ctx.rotate(-0.15);

    ctx.fillStyle = "#30373b";

    ctx.fillRect(
        -1.2 * camera.zoom,
        -2.5 * camera.zoom,
        2.4 * camera.zoom,
        5 * camera.zoom
    );

    ctx.fillStyle = "#ad5d38";

    ctx.fillRect(
        -0.65 * camera.zoom,
        -1.8 * camera.zoom,
        1.3 * camera.zoom,
        3.6 * camera.zoom
    );

    ctx.restore();
}

function drawReactor() {

    const p =
        worldToScreen(
            6,
            17
        );

    ctx.strokeStyle = "#aeb4b6";

    ctx.lineWidth =
        0.25 * camera.zoom;

    for (let i = -1; i <= 1; i++) {

        ctx.beginPath();

        ctx.moveTo(
            p.x +
                i * 1.1 * camera.zoom,
            p.y -
                2.5 * camera.zoom
        );

        ctx.lineTo(
            p.x +
                i * 1.1 * camera.zoom,
            p.y +
                2.5 * camera.zoom
        );

        ctx.stroke();
    }

    ctx.fillStyle = "#43889a";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        0.8 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawMedBay() {

    const beds = [
        [17, 8.5],
        [20, 8.5],
        [17, 11],
        [20, 11]
    ];

    for (
        const [x, y] of beds
    ) {

        const p =
            worldToScreen(x, y);

        ctx.fillStyle = "#d2d5d3";

        ctx.fillRect(
            p.x,
            p.y,
            1.8 * camera.zoom,
            0.7 * camera.zoom
        );

        ctx.fillStyle = "#83a6aa";

        ctx.fillRect(
            p.x,
            p.y,
            0.45 * camera.zoom,
            0.7 * camera.zoom
        );
    }
}

function drawSecurity() {

    const monitors = [
        [12.3, 11.2],
        [14, 11.2],
        [15.7, 11.2]
    ];

    for (
        const [x, y] of monitors
    ) {

        const p =
            worldToScreen(x, y);

        ctx.fillStyle = "#151b1e";

        ctx.fillRect(
            p.x,
            p.y,
            1.2 * camera.zoom,
            0.9 * camera.zoom
        );

        ctx.fillStyle = "#648d9a";

        ctx.fillRect(
            p.x + 0.15 * camera.zoom,
            p.y + 0.15 * camera.zoom,
            0.9 * camera.zoom,
            0.55 * camera.zoom
        );
    }
}

function drawElectrical() {

    const panels = [
        [14, 18],
        [16, 18],
        [18, 18],
        [14, 20],
        [16, 20],
        [18, 20]
    ];

    for (
        const [x, y] of panels
    ) {

        const p =
            worldToScreen(x, y);

        ctx.fillStyle = "#282e30";

        ctx.fillRect(
            p.x,
            p.y,
            0.9 * camera.zoom,
            1.1 * camera.zoom
        );

        ctx.fillStyle = "#c3a73d";

        ctx.fillRect(
            p.x + 0.2 * camera.zoom,
            p.y + 0.2 * camera.zoom,
            0.5 * camera.zoom,
            0.08 * camera.zoom
        );
    }
}

function drawStorage() {

    const crates = [
        [12, 24],
        [14, 24],
        [16, 24],
        [18, 24],
        [12, 26],
        [14, 26],
        [16, 26],
        [18, 26]
    ];

    for (
        const [x, y] of crates
    ) {

        const p =
            worldToScreen(x, y);

        ctx.fillStyle = "#625b42";

        ctx.fillRect(
            p.x,
            p.y,
            1.3 * camera.zoom,
            1.1 * camera.zoom
        );

        ctx.strokeStyle = "#373326";

        ctx.lineWidth =
            0.12 * camera.zoom;

        ctx.strokeRect(
            p.x,
            p.y,
            1.3 * camera.zoom,
            1.1 * camera.zoom
        );
    }
}

function drawAdmin() {

    const p =
        worldToScreen(
            27.5,
            18
        );

    ctx.fillStyle = "#282f32";

    ctx.fillRect(
        p.x - 1.5 * camera.zoom,
        p.y - 0.8 * camera.zoom,
        3 * camera.zoom,
        1.6 * camera.zoom
    );

    ctx.fillStyle = "#6c8d92";

    ctx.fillRect(
        p.x - 1 * camera.zoom,
        p.y - 0.35 * camera.zoom,
        2 * camera.zoom,
        0.7 * camera.zoom
    );
}

function drawNavigation() {

    const p =
        worldToScreen(
            34,
            14
        );

    ctx.fillStyle = "#263237";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        1.8 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#718b92";

    ctx.lineWidth =
        0.2 * camera.zoom;

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        1 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.stroke();
}

function drawWeapons() {

    const p =
        worldToScreen(
            30.5,
            5
        );

    ctx.fillStyle = "#252d30";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        1.5 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#80989d";

    ctx.lineWidth =
        0.25 * camera.zoom;

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        0.9 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.stroke();
}

function drawO2() {

    const p =
        worldToScreen(
            37.5,
            22.5
        );

    ctx.fillStyle = "#324b4b";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        1.1 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#7da59e";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        0.45 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawCommunications() {

    const p =
        worldToScreen(
            24.5,
            29.5
        );

    ctx.fillStyle = "#29363b";

    ctx.fillRect(
        p.x - 1.4 * camera.zoom,
        p.y - 0.8 * camera.zoom,
        2.8 * camera.zoom,
        1.6 * camera.zoom
    );

    ctx.fillStyle = "#a0a65a";

    ctx.fillRect(
        p.x - 0.8 * camera.zoom,
        p.y - 0.25 * camera.zoom,
        1.6 * camera.zoom,
        0.5 * camera.zoom
    );
}

function drawShields() {

    const p =
        worldToScreen(
            35.5,
            29
        );

    ctx.strokeStyle = "#8b9999";

    ctx.lineWidth =
        0.3 * camera.zoom;

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        2 * camera.zoom,
        Math.PI,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle = "#5f9097";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        0.7 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// ============================================================
// VENTS
// ============================================================

const vents = [
    [7, 5],
    [7, 28],
    [16, 19],
    [14, 13],
    [27, 18],
    [31, 5],
    [34, 14],
    [38, 23],
    [35, 29],
    [24, 29]
];

function drawVents() {

    for (
        const [x, y] of vents
    ) {

        const p =
            worldToScreen(x, y);

        ctx.fillStyle = "#171c1f";

        ctx.beginPath();

        ctx.roundRect(
            p.x - 0.55 * camera.zoom,
            p.y - 0.3 * camera.zoom,
            1.1 * camera.zoom,
            0.6 * camera.zoom,
            0.12 * camera.zoom
        );

        ctx.fill();

        ctx.strokeStyle = "#080a0c";

        ctx.lineWidth =
            0.1 * camera.zoom;

        ctx.stroke();
    }
}

// ============================================================
// TASKS
// ============================================================

function drawTasks() {

    if (!game || !game.players) {
        return;
    }

    const tasks = [];

    for (
        const player of game.players
    ) {

        for (
            const task of
            player.tasks || []
        ) {

            if (!task.completed) {
                tasks.push(task);
            }
        }
    }

    const unique = new Map();

    for (const task of tasks) {
        unique.set(
            task.id,
            task
        );
    }

    for (
        const task of unique.values()
    ) {

        const p =
            worldToScreen(
                task.x,
                task.y
            );

        ctx.fillStyle = "#d6b63c";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            0.35 * camera.zoom,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
            "rgba(0,0,0,0.5)";

        ctx.lineWidth =
            0.08 * camera.zoom;

        ctx.stroke();
    }
}

// ============================================================
// PLAYERS
// ============================================================

function drawPlayer(player) {

    if (!player.alive) {
        return;
    }

    const p =
        worldToScreen(
            player.x,
            player.y
        );

    const s =
        Math.max(
            10,
            0.85 * camera.zoom
        );

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    // Shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        s * 0.8,
        s * 0.75,
        s * 0.3,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Backpack
    ctx.fillStyle =
        darken(
            player.color,
            0.62
        );

    ctx.beginPath();

    ctx.roundRect(
        -s * 0.9,
        -s * 0.05,
        s * 0.35,
        s * 1.05,
        s * 0.12
    );

    ctx.fill();

    // Body
    ctx.fillStyle =
        player.color;

    ctx.beginPath();

    ctx.roundRect(
        -s * 0.48,
        -s,
        s * 0.96,
        s * 1.7,
        s * 0.35
    );

    ctx.fill();

    // Visor
    ctx.fillStyle = "#bce7ed";

    ctx.beginPath();

    ctx.ellipse(
        s * 0.08,
        -s * 0.47,
        s * 0.39,
        s * 0.25,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "rgba(255,255,255,0.42)";

    ctx.beginPath();

    ctx.ellipse(
        s * 0.19,
        -s * 0.56,
        s * 0.13,
        s * 0.08,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Name
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    ctx.font =
        `bold ${Math.max(
            9,
            0.62 * camera.zoom
        )}px Arial`;

    ctx.fillStyle = "#ffffff";

    ctx.strokeStyle =
        "rgba(0,0,0,0.85)";

    ctx.lineWidth = 3;

    ctx.strokeText(
        player.name,
        p.x,
        p.y - 1.25 * camera.zoom
    );

    ctx.fillText(
        player.name,
        p.x,
        p.y - 1.25 * camera.zoom
    );
}

// ============================================================
// BODIES
// ============================================================

function drawBodies() {

    if (!game || !game.bodies) {
        return;
    }

    for (
        const body of game.bodies
    ) {

        const p =
            worldToScreen(
                body.x,
                body.y
            );

        const s =
            Math.max(
                8,
                0.9 * camera.zoom
            );

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        ctx.rotate(-0.3);

        // Lower body
        ctx.fillStyle = "#d83232";

        ctx.beginPath();

        ctx.ellipse(
            0,
            0,
            s * 0.8,
            s * 0.45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Bone
        ctx.strokeStyle = "#eeeeee";

        ctx.lineWidth =
            s * 0.25;

        ctx.beginPath();

        ctx.moveTo(
            -s * 0.25,
            -s * 0.05
        );

        ctx.lineTo(
            s * 0.55,
            -s * 0.55
        );

        ctx.stroke();

        ctx.restore();
    }
}

// ============================================================
// CHAT
// ============================================================

function drawChat() {

    if (
        !game ||
        !game.chat ||
        game.chat.length === 0
    ) {
        return;
    }

    const width = 320;

    const lineHeight = 20;

    const visible =
        game.chat.slice(-9);

    const height =
        visible.length *
            lineHeight +
        22;

    const x = 15;

    const y =
        window.innerHeight -
        height -
        15;

    ctx.fillStyle =
        "rgba(5,7,10,0.88)";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.strokeStyle =
        "rgba(255,255,255,0.15)";

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    visible.forEach(
        (message, index) => {

            const yy =
                y +
                13 +
                index * lineHeight;

            ctx.font =
                "bold 12px Arial";

            ctx.fillStyle =
                message.color ||
                "#ffffff";

            ctx.fillText(
                message.name + ":",
                x + 8,
                yy
            );

            ctx.font =
                "12px Arial";

            ctx.fillStyle = "#ffffff";

            ctx.fillText(
                message.text,
                x + 72,
                yy
            );
        }
    );
}

// ============================================================
// TOP BAR
// ============================================================

function drawTopBar() {

    ctx.fillStyle =
        "rgba(5,7,10,0.9)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        48
    );

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.font =
        "bold 17px Arial";

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        "AI AMONG US",
        18,
        24
    );

    if (!game) {
        return;
    }

    ctx.font =
        "12px Arial";

    ctx.fillStyle = "#aab1b6";

    ctx.fillText(
        `ROUND ${game.round}`,
        155,
        24
    );

    ctx.fillText(
        game.phase.toUpperCase(),
        240,
        24
    );
}

// ============================================================
// MEETING SCREEN
// ============================================================

function drawMeetingOverlay() {

    if (
        !game ||
        (
            game.phase !== "discussion" &&
            game.phase !== "voting"
        )
    ) {
        return;
    }

    ctx.fillStyle =
        "rgba(0,0,0,0.72)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    const width =
        Math.min(
            760,
            window.innerWidth - 40
        );

    const height =
        Math.min(
            620,
            window.innerHeight - 80
        );

    const x =
        (window.innerWidth -
            width) / 2;

    const y =
        (window.innerHeight -
            height) / 2;

    ctx.fillStyle = "#151a1e";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.strokeStyle = "#56616a";

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
        "bold 28px Arial";

    ctx.fillStyle = "#ffffff";

    if (game.phase === "discussion") {

        ctx.fillText(
            game.lastMeeting?.type ===
                "emergency"
                ? "EMERGENCY MEETING"
                : "BODY REPORTED",
            x + width / 2,
            y + 35
        );

    } else {

        ctx.fillText(
            "VOTING",
            x + width / 2,
            y + 35
        );
    }

    ctx.font =
        "bold 18px Arial";

    ctx.fillStyle = "#d8dce0";

    ctx.fillText(
        `${Math.ceil(
            game.meetingTimer
        )}s`,
        x + width / 2,
        y + 72
    );

    drawMeetingChat(
        x,
        y,
        width,
        height
    );

    if (game.phase === "voting") {

        drawVoteList(
            x,
            y,
            width,
            height
        );
    }
}

function drawMeetingChat(
    x,
    y,
    width,
    height
) {

    const chat =
        game.chat.slice(-8);

    ctx.textAlign = "left";

    chat.forEach(
        (message, index) => {

            const yy =
                y +
                115 +
                index * 30;

            ctx.font =
                "bold 13px Arial";

            ctx.fillStyle =
                message.color ||
                "#ffffff";

            ctx.fillText(
                message.name,
                x + 25,
                yy
            );

            ctx.font =
                "13px Arial";

            ctx.fillStyle = "#ffffff";

            ctx.fillText(
                message.text,
                x + 120,
                yy
            );
        }
    );
}

function drawVoteList(
    x,
    y,
    width,
    height
) {

    if (!game.players) {
        return;
    }

    const startX =
        x + width - 250;

    const startY =
        y + 110;

    const alive =
        game.players.filter(
            p => p.alive
        );

    ctx.textAlign = "left";

    ctx.font =
        "bold 13px Arial";

    alive.forEach(
        (player, index) => {

            const yy =
                startY +
                index * 38;

            ctx.fillStyle =
                player.color;

            ctx.fillText(
                player.name,
                startX,
                yy
            );

            ctx.fillStyle =
                "#9da5aa";

            let voteCount = 0;

            if (game.votes) {

                for (
                    const vote
                    of Object.values(
                        game.votes
                    )
                ) {

                    if (
                        vote ===
                        player.id
                    ) {
                        voteCount++;
                    }
                }
            }

            ctx.fillText(
                voteCount > 0
                    ? `${voteCount} vote${voteCount === 1 ? "" : "s"}`
                    : "",
                startX + 110,
                yy
            );
        }
    );
}

// ============================================================
// GAME END
// ============================================================

function drawGameEnd() {

    if (
        !game ||
        game.phase !== "ended"
    ) {
        return;
    }

    ctx.fillStyle =
        "rgba(0,0,0,0.78)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const winnerText =
        game.winner === "impostors"
            ? "IMPOSTORS WIN"
            : "CREWMATES WIN";

    const winnerColor =
        game.winner === "impostors"
            ? "#d83b3b"
            : "#54b96b";

    ctx.font =
        "900 54px Arial";

    ctx.fillStyle =
        winnerColor;

    ctx.fillText(
        winnerText,
        window.innerWidth / 2,
        window.innerHeight / 2 - 55
    );

    ctx.font =
        "18px Arial";

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        game.winReason || "",
        window.innerWidth / 2,
        window.innerHeight / 2 + 5
    );

    ctx.font =
        "14px Arial";

    ctx.fillStyle = "#9da5aa";

    ctx.fillText(
        "Press NEW GAME to play again",
        window.innerWidth / 2,
        window.innerHeight / 2 + 45
    );
}

// ============================================================
// MAIN RENDER
// ============================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    // Background
    ctx.fillStyle = "#06080a";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    drawShip();

    drawCorridors();

    drawRooms();

    drawCafeteria();

    drawEngine("UpperEngine");
    drawEngine("LowerEngine");

    drawReactor();
    drawMedBay();
    drawSecurity();
    drawElectrical();
    drawStorage();
    drawAdmin();
    drawNavigation();
    drawWeapons();
    drawO2();
    drawCommunications();
    drawShields();

    drawVents();

    drawTasks();

    drawBodies();

    if (
        game &&
        game.players
    ) {

        for (
            const player of game.players
        ) {
            drawPlayer(player);
        }
    }

    drawTopBar();

    drawChat();

    drawMeetingOverlay();

    drawGameEnd();

    requestAnimationFrame(draw);
}

// ============================================================
// SERVER
// ============================================================

async function loadGame() {

    try {

        const response =
            await fetch(
                "/api/game",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Game request failed"
            );
        }

        game =
            await response.json();

    } catch (error) {

        console.error(
            "Could not load game:",
            error
        );
    }
}

async function newGame() {

    newGameButton.disabled = true;

    try {

        const response =
            await fetch(
                "/api/game/new",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                "New game failed"
            );
        }

        game =
            await response.json();

        fitMap();

    } catch (error) {

        console.error(
            "Could not create game:",
            error
        );

    } finally {

        newGameButton.disabled = false;
    }
}

newGameButton.addEventListener(
    "click",
    newGame
);

// ============================================================
// CAMERA
// ============================================================

canvas.addEventListener(
    "mousedown",
    event => {

        dragging = true;

        dragStart.x =
            event.clientX;

        dragStart.y =
            event.clientY;

        cameraStart.x =
            camera.x;

        cameraStart.y =
            camera.y;

        canvas.classList.add(
            "dragging"
        );
    }
);

window.addEventListener(
    "mouseup",
    () => {

        dragging = false;

        canvas.classList.remove(
            "dragging"
        );
    }
);

window.addEventListener(
    "mousemove",
    event => {

        if (!dragging) {
            return;
        }

        camera.x =
            cameraStart.x +
            (
                event.clientX -
                dragStart.x
            );

        camera.y =
            cameraStart.y +
            (
                event.clientY -
                dragStart.y
            );
    }
);

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();

        const mouse =
            screenToWorld(
                event.clientX,
                event.clientY
            );

        const factor =
            event.deltaY < 0
                ? 1.1
                : 0.9;

        camera.zoom *= factor;

        camera.zoom =
            Math.max(
                8,
                Math.min(
                    45,
                    camera.zoom
                )
            );

        const after =
            worldToScreen(
                mouse.x,
                mouse.y
            );

        camera.x +=
            event.clientX -
            after.x;

        camera.y +=
            event.clientY -
            after.y;
    },
    {
        passive: false
    }
);

// ============================================================
// START
// ============================================================

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();

loadGame();

setInterval(
    loadGame,
    250
);

requestAnimationFrame(draw);
