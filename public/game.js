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
let dragStartX = 0;
let dragStartY = 0;
let cameraStartX = 0;
let cameraStartY = 0;

const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 800;

/*
    THE SKELD

    Coordinate system is based on the real Skeld layout:

                 UPPER ENGINE     CAFETERIA      WEAPONS
                       \              |              \
                        MEDBAY        |              O2
                         |            |               |
                      SECURITY        |          NAVIGATION
                         |            |               \
                    ELECTRICAL     STORAGE          SHIELDS
                         |             |
                    LOWER ENGINE      ADMIN
                         |             |
                      REACTOR     COMMUNICATIONS

    The map is intentionally drawn as vector geometry so
    no copyrighted game texture files are required.
*/

const rooms = {

    upperEngine: {
        name: "Upper Engine",
        polygon: [
            [65, 150],
            [65, 75],
            [125, 45],
            [225, 45],
            [255, 75],
            [255, 150],
            [225, 180],
            [100, 180]
        ]
    },

    reactor: {
        name: "Reactor",
        polygon: [
            [65, 285],
            [65, 215],
            [100, 185],
            [225, 185],
            [255, 215],
            [255, 330],
            [225, 360],
            [100, 360]
        ]
    },

    lowerEngine: {
        name: "Lower Engine",
        polygon: [
            [65, 455],
            [65, 385],
            [100, 355],
            [225, 355],
            [255, 385],
            [255, 470],
            [225, 500],
            [100, 500]
        ]
    },

    medbay: {
        name: "MedBay",
        polygon: [
            [275, 105],
            [275, 55],
            [350, 55],
            [395, 95],
            [395, 165],
            [350, 190],
            [285, 190],
            [255, 165],
            [255, 125]
        ]
    },

    security: {
        name: "Security",
        polygon: [
            [275, 205],
            [275, 165],
            [325, 145],
            [390, 145],
            [410, 175],
            [410, 245],
            [380, 270],
            [300, 270],
            [275, 245]
        ]
    },

    electrical: {
        name: "Electrical",
        polygon: [
            [275, 300],
            [275, 265],
            [320, 245],
            [400, 245],
            [425, 275],
            [425, 350],
            [390, 380],
            [305, 380],
            [275, 350]
        ]
    },

    cafeteria: {
        name: "Cafeteria",
        polygon: [
            [430, 70],
            [475, 30],
            [650, 30],
            [700, 70],
            [700, 230],
            [650, 275],
            [475, 275],
            [425, 230],
            [425, 115]
        ]
    },

    weapons: {
        name: "Weapons",
        polygon: [
            [725, 65],
            [725, 35],
            [790, 15],
            [875, 35],
            [895, 75],
            [895, 145],
            [850, 175],
            [770, 175],
            [725, 140]
        ]
    },

    navigation: {
        name: "Navigation",
        polygon: [
            [930, 100],
            [930, 65],
            [1010, 40],
            [1110, 70],
            [1145, 115],
            [1145, 205],
            [1100, 245],
            [1010, 245],
            [960, 215],
            [930, 175]
        ]
    },

    o2: {
        name: "O2",
        polygon: [
            [810, 230],
            [810, 190],
            [865, 170],
            [935, 190],
            [960, 230],
            [960, 300],
            [920, 330],
            [850, 330],
            [810, 295]
        ]
    },

    admin: {
        name: "Admin",
        polygon: [
            [570, 350],
            [570, 315],
            [625, 285],
            [715, 285],
            [760, 320],
            [760, 395],
            [715, 430],
            [625, 430],
            [570, 400]
        ]
    },

    storage: {
        name: "Storage",
        polygon: [
            [430, 350],
            [430, 300],
            [475, 275],
            [565, 275],
            [600, 310],
            [600, 470],
            [565, 505],
            [475, 505],
            [430, 470]
        ]
    },

    communications: {
        name: "Communications",
        polygon: [
            [570, 490],
            [570, 455],
            [625, 430],
            [715, 430],
            [755, 465],
            [755, 540],
            [715, 570],
            [625, 570],
            [570, 535]
        ]
    },

    shields: {
        name: "Shields",
        polygon: [
            [800, 430],
            [800, 395],
            [850, 360],
            [930, 360],
            [975, 395],
            [975, 475],
            [930, 515],
            [850, 515],
            [800, 480]
        ]
    }
};

const corridors = [

    // Upper Engine -> MedBay
    [
        [235, 115],
        [275, 115],
        [275, 155],
        [235, 155]
    ],

    // MedBay -> Cafeteria
    [
        [395, 115],
        [430, 115],
        [430, 155],
        [395, 155]
    ],

    // Security -> Cafeteria
    [
        [410, 175],
        [445, 175],
        [445, 215],
        [410, 215]
    ],

    // Electrical -> Storage
    [
        [425, 320],
        [470, 320],
        [470, 360],
        [425, 360]
    ],

    // Cafeteria -> Storage
    [
        [515, 275],
        [555, 275],
        [555, 320],
        [515, 320]
    ],

    // Cafeteria -> Admin
    [
        [650, 275],
        [650, 315],
        [690, 315],
        [690, 275]
    ],

    // Cafeteria -> Weapons
    [
        [700, 110],
        [725, 110],
        [725, 145],
        [700, 145]
    ],

    // Weapons -> Navigation
    [
        [895, 105],
        [960, 105],
        [960, 145],
        [895, 145]
    ],

    // Navigation -> O2
    [
        [925, 170],
        [960, 170],
        [960, 235],
        [925, 235]
    ],

    // O2 -> Shields
    [
        [900, 330],
        [900, 390],
        [930, 390],
        [930, 330]
    ],

    // Storage -> Admin
    [
        [600, 365],
        [625, 365],
        [625, 405],
        [600, 405]
    ],

    // Storage -> Communications
    [
        [530, 470],
        [570, 470],
        [570, 505],
        [530, 505]
    ],

    // Admin -> Communications
    [
        [665, 430],
        [665, 455],
        [700, 455],
        [700, 430]
    ],

    // Communications -> Shields
    [
        [755, 490],
        [800, 490],
        [800, 525],
        [755, 525]
    ],

    // Upper Engine -> Reactor
    [
        [130, 180],
        [170, 180],
        [170, 215],
        [130, 215]
    ],

    // Reactor -> Lower Engine
    [
        [130, 350],
        [170, 350],
        [170, 385],
        [130, 385]
    ],

    // Electrical -> Lower Engine
    [
        [255, 400],
        [275, 400],
        [275, 440],
        [255, 440]
    ]
];

const roomCenters = {
    "Upper Engine": [160, 115],
    "Reactor": [160, 270],
    "Lower Engine": [160, 425],
    "MedBay": [330, 120],
    "Security": [345, 205],
    "Electrical": [350, 315],
    "Cafeteria": [560, 150],
    "Weapons": [810, 100],
    "Navigation": [1035, 145],
    "O2": [880, 250],
    "Admin": [665, 355],
    "Storage": [515, 390],
    "Communications": [665, 500],
    "Shields": [885, 435]
};

const roomColors = {
    "Upper Engine": "#8f5037",
    "Reactor": "#5b5960",
    "Lower Engine": "#8f5037",
    "MedBay": "#587f83",
    "Security": "#4d5963",
    "Electrical": "#615852",
    "Cafeteria": "#b5b6ad",
    "Weapons": "#5c7e88",
    "Navigation": "#4e6872",
    "O2": "#6c817d",
    "Admin": "#866276",
    "Storage": "#8d7f56",
    "Communications": "#486d78",
    "Shields": "#657b7b"
};

const roomMap = {};

for (const room of Object.values(rooms)) {
    roomMap[room.name] = room;
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fitMap();
}

function fitMap() {

    const padding = 50;

    const availableWidth = window.innerWidth - padding * 2;
    const availableHeight = window.innerHeight - padding * 2;

    const zoomX = availableWidth / WORLD_WIDTH;
    const zoomY = availableHeight / WORLD_HEIGHT;

    camera.zoom = Math.min(zoomX, zoomY);

    camera.x =
        (window.innerWidth - WORLD_WIDTH * camera.zoom) / 2;

    camera.y =
        (window.innerHeight - WORLD_HEIGHT * camera.zoom) / 2;
}

function worldToScreen(x, y) {
    return {
        x: camera.x + x * camera.zoom,
        y: camera.y + y * camera.zoom
    };
}

function screenToWorld(x, y) {
    return {
        x: (x - camera.x) / camera.zoom,
        y: (y - camera.y) / camera.zoom
    };
}

function drawPolygon(points, fill, stroke, lineWidth = 4) {

    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {

        const point = worldToScreen(
            points[i][0],
            points[i][1]
        );

        if (i === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    }

    ctx.closePath();

    ctx.fillStyle = fill;
    ctx.fill();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth * camera.zoom;
    ctx.stroke();
}

function drawMapBackground() {

    ctx.fillStyle = "#05070a";
    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );
}

function drawShipShadow() {

    const ship = [
        [40, 120],
        [80, 70],
        [150, 35],
        [350, 35],
        [420, 55],
        [475, 25],
        [650, 25],
        [710, 55],
        [790, 10],
        [900, 30],
        [970, 55],
        [1040, 30],
        [1130, 60],
        [1170, 110],
        [1170, 250],
        [1135, 280],
        [990, 280],
        [990, 350],
        [1010, 400],
        [1000, 500],
        [950, 545],
        [780, 555],
        [760, 590],
        [600, 590],
        [550, 530],
        [430, 530],
        [380, 520],
        [240, 520],
        [210, 535],
        [80, 525],
        [40, 475]
    ];

    drawPolygon(
        ship,
        "#14191d",
        "#090b0e",
        20
    );
}

function drawCorridors() {

    for (const corridor of corridors) {

        drawPolygon(
            corridor,
            "#596066",
            "#24292e",
            5
        );

        drawPolygon(
            corridor.map(([x, y]) => [
                x + 5,
                y + 5
            ]),
            "#6b7378",
            "rgba(0,0,0,0)",
            0
        );
    }
}

function drawRooms() {

    for (const room of Object.values(rooms)) {

        drawPolygon(
            room.polygon,
            roomColors[room.name] || "#777",
            "#20262b",
            6
        );

        drawRoomDetails(room.name, room.polygon);
    }
}

function drawRoomDetails(name, polygon) {

    const center = getPolygonCenter(polygon);
    const p = worldToScreen(center.x, center.y);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font =
        `${Math.max(10, 15 * camera.zoom)}px Arial`;

    ctx.fillStyle = "rgba(255,255,255,0.72)";

    ctx.fillText(
        name.toUpperCase(),
        p.x,
        p.y
    );

    if (name === "Cafeteria") {
        drawCafeteria();
    }

    if (name === "Storage") {
        drawStorage();
    }

    if (name === "Admin") {
        drawAdmin();
    }

    if (name === "Electrical") {
        drawElectrical();
    }

    if (name === "Security") {
        drawSecurity();
    }

    if (name === "MedBay") {
        drawMedBay();
    }

    if (
        name === "Upper Engine" ||
        name === "Lower Engine"
    ) {
        drawEngine(name);
    }

    if (name === "Reactor") {
        drawReactor();
    }

    if (name === "Weapons") {
        drawWeapons();
    }

    if (name === "Navigation") {
        drawNavigation();
    }

    if (name === "O2") {
        drawO2();
    }

    if (name === "Communications") {
        drawCommunications();
    }

    if (name === "Shields") {
        drawShields();
    }
}

function getPolygonCenter(points) {

    let x = 0;
    let y = 0;

    for (const point of points) {
        x += point[0];
        y += point[1];
    }

    return {
        x: x / points.length,
        y: y / points.length
    };
}

function drawCafeteria() {

    const tables = [
        [505, 100],
        [615, 100],
        [505, 205],
        [615, 205]
    ];

    for (const [x, y] of tables) {

        const p = worldToScreen(x, y);

        ctx.beginPath();
        ctx.arc(
            p.x,
            p.y,
            24 * camera.zoom,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#42728c";
        ctx.fill();

        ctx.strokeStyle = "#263f4c";
        ctx.lineWidth = 4 * camera.zoom;
        ctx.stroke();
    }

    const center = worldToScreen(560, 153);

    ctx.beginPath();

    ctx.arc(
        center.x,
        center.y,
        30 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#426f82";
    ctx.fill();

    ctx.strokeStyle = "#263f4c";
    ctx.lineWidth = 5 * camera.zoom;
    ctx.stroke();

    ctx.fillStyle = "#d83232";

    ctx.fillRect(
        center.x - 9 * camera.zoom,
        center.y - 7 * camera.zoom,
        18 * camera.zoom,
        14 * camera.zoom
    );
}

function drawStorage() {

    const crates = [
        [470, 350],
        [500, 350],
        [530, 350],
        [470, 380],
        [505, 380]
    ];

    for (const [x, y] of crates) {

        const p = worldToScreen(x, y);

        ctx.fillStyle = "#6c684d";

        ctx.fillRect(
            p.x,
            p.y,
            25 * camera.zoom,
            25 * camera.zoom
        );

        ctx.strokeStyle = "#3d3a2d";
        ctx.lineWidth = 2 * camera.zoom;
        ctx.strokeRect(
            p.x,
            p.y,
            25 * camera.zoom,
            25 * camera.zoom
        );
    }
}

function drawAdmin() {

    const p = worldToScreen(665, 355);

    ctx.fillStyle = "#30363a";

    ctx.fillRect(
        p.x - 40 * camera.zoom,
        p.y - 20 * camera.zoom,
        80 * camera.zoom,
        40 * camera.zoom
    );

    ctx.strokeStyle = "#15191c";
    ctx.lineWidth = 3 * camera.zoom;

    ctx.strokeRect(
        p.x - 40 * camera.zoom,
        p.y - 20 * camera.zoom,
        80 * camera.zoom,
        40 * camera.zoom
    );
}

function drawElectrical() {

    const panels = [
        [315, 275],
        [350, 275],
        [385, 275],
        [315, 335],
        [350, 335],
        [385, 335]
    ];

    for (const [x, y] of panels) {

        const p = worldToScreen(x, y);

        ctx.fillStyle = "#303437";

        ctx.fillRect(
            p.x,
            p.y,
            20 * camera.zoom,
            30 * camera.zoom
        );

        ctx.fillStyle = "#b5a33e";

        ctx.fillRect(
            p.x + 5 * camera.zoom,
            p.y + 6 * camera.zoom,
            10 * camera.zoom,
            3 * camera.zoom
        );
    }
}

function drawSecurity() {

    const p = worldToScreen(345, 210);

    ctx.fillStyle = "#242b2f";

    ctx.fillRect(
        p.x - 30 * camera.zoom,
        p.y - 20 * camera.zoom,
        60 * camera.zoom,
        40 * camera.zoom
    );

    for (let i = 0; i < 3; i++) {

        ctx.fillStyle = "#15191b";

        ctx.fillRect(
            p.x - 23 * camera.zoom + i * 17 * camera.zoom,
            p.y - 12 * camera.zoom,
            13 * camera.zoom,
            16 * camera.zoom
        );
    }
}

function drawMedBay() {

    const beds = [
        [300, 85],
        [300, 130]
    ];

    for (const [x, y] of beds) {

        const p = worldToScreen(x, y);

        ctx.fillStyle = "#d7d9d6";

        ctx.fillRect(
            p.x,
            p.y,
            50 * camera.zoom,
            15 * camera.zoom
        );

        ctx.fillStyle = "#7fa4a8";

        ctx.fillRect(
            p.x,
            p.y,
            12 * camera.zoom,
            15 * camera.zoom
        );
    }
}

function drawEngine(name) {

    const center =
        name === "Upper Engine"
            ? [160, 115]
            : [160, 425];

    const p = worldToScreen(
        center[0],
        center[1]
    );

    ctx.save();

    ctx.translate(p.x, p.y);

    ctx.rotate(-0.2);

    ctx.fillStyle = "#31383b";

    ctx.fillRect(
        -25 * camera.zoom,
        -55 * camera.zoom,
        50 * camera.zoom,
        110 * camera.zoom
    );

    ctx.fillStyle = "#ba6539";

    ctx.fillRect(
        -14 * camera.zoom,
        -38 * camera.zoom,
        28 * camera.zoom,
        76 * camera.zoom
    );

    ctx.restore();
}

function drawReactor() {

    const p = worldToScreen(160, 270);

    ctx.strokeStyle = "#9fa4a5";
    ctx.lineWidth = 5 * camera.zoom;

    ctx.beginPath();

    ctx.moveTo(
        p.x - 30 * camera.zoom,
        p.y - 45 * camera.zoom
    );

    ctx.lineTo(
        p.x - 30 * camera.zoom,
        p.y + 45 * camera.zoom
    );

    ctx.moveTo(
        p.x,
        p.y - 45 * camera.zoom
    );

    ctx.lineTo(
        p.x,
        p.y + 45 * camera.zoom
    );

    ctx.moveTo(
        p.x + 30 * camera.zoom,
        p.y - 45 * camera.zoom
    );

    ctx.lineTo(
        p.x + 30 * camera.zoom,
        p.y + 45 * camera.zoom
    );

    ctx.stroke();

    ctx.fillStyle = "#4b8da0";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        14 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawWeapons() {

    const p = worldToScreen(810, 100);

    ctx.fillStyle = "#252d31";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        28 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#83969b";
    ctx.lineWidth = 5 * camera.zoom;

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        18 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.stroke();
}

function drawNavigation() {

    const p = worldToScreen(1035, 145);

    ctx.fillStyle = "#29363b";

    ctx.fillRect(
        p.x - 25 * camera.zoom,
        p.y - 20 * camera.zoom,
        50 * camera.zoom,
        40 * camera.zoom
    );

    ctx.strokeStyle = "#6c8992";
    ctx.lineWidth = 3 * camera.zoom;

    ctx.strokeRect(
        p.x - 25 * camera.zoom,
        p.y - 20 * camera.zoom,
        50 * camera.zoom,
        40 * camera.zoom
    );
}

function drawO2() {

    const p = worldToScreen(880, 250);

    ctx.fillStyle = "#334b4b";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        22 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#83aaa2";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        10 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawCommunications() {

    const p = worldToScreen(665, 500);

    ctx.fillStyle = "#28343a";

    ctx.fillRect(
        p.x - 30 * camera.zoom,
        p.y - 22 * camera.zoom,
        60 * camera.zoom,
        44 * camera.zoom
    );

    ctx.strokeStyle = "#82959a";
    ctx.lineWidth = 3 * camera.zoom;

    ctx.strokeRect(
        p.x - 30 * camera.zoom,
        p.y - 22 * camera.zoom,
        60 * camera.zoom,
        44 * camera.zoom
    );

    ctx.fillStyle = "#a4a85c";

    ctx.fillRect(
        p.x - 20 * camera.zoom,
        p.y - 8 * camera.zoom,
        40 * camera.zoom,
        16 * camera.zoom
    );
}

function drawShields() {

    const p = worldToScreen(885, 435);

    ctx.strokeStyle = "#8c9998";
    ctx.lineWidth = 6 * camera.zoom;

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        35 * camera.zoom,
        Math.PI,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle = "#5f8d94";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        12 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawMapBorder() {

    const border = [
        [40, 120],
        [80, 70],
        [150, 35],
        [350, 35],
        [420, 55],
        [475, 25],
        [650, 25],
        [710, 55],
        [790, 10],
        [900, 30],
        [970, 55],
        [1040, 30],
        [1130, 60],
        [1170, 110],
        [1170, 250],
        [1135, 280],
        [990, 280],
        [990, 350],
        [1010, 400],
        [1000, 500],
        [950, 545],
        [780, 555],
        [760, 590],
        [600, 590],
        [550, 530],
        [430, 530],
        [380, 520],
        [240, 520],
        [210, 535],
        [80, 525],
        [40, 475]
    ];

    drawPolygon(
        border,
        "rgba(0,0,0,0)",
        "#30373c",
        8
    );
}

function drawVents() {

    const vents = [
        [665, 315],
        [855, 125],
        [1030, 210],
        [885, 420],
        [350, 300],
        [350, 190],
        [160, 270],
        [160, 115],
        [160, 425]
    ];

    for (const [x, y] of vents) {

        const p = worldToScreen(x, y);

        ctx.save();

        ctx.translate(p.x, p.y);

        ctx.fillStyle = "#171b1e";

        ctx.beginPath();

        ctx.roundRect(
            -10 * camera.zoom,
            -6 * camera.zoom,
            20 * camera.zoom,
            12 * camera.zoom,
            3 * camera.zoom
        );

        ctx.fill();

        ctx.strokeStyle = "#080a0c";
        ctx.lineWidth = 2 * camera.zoom;
        ctx.stroke();

        ctx.restore();
    }
}

function drawGrid() {

    const gridSize = 25;

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;

    for (let x = 0; x < WORLD_WIDTH; x += gridSize) {

        const a = worldToScreen(x, 0);
        const b = worldToScreen(x, WORLD_HEIGHT);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }

    for (let y = 0; y < WORLD_HEIGHT; y += gridSize) {

        const a = worldToScreen(0, y);
        const b = worldToScreen(WORLD_WIDTH, y);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
}

function drawPlayer(player) {

    if (!player || !player.alive) {
        return;
    }

    const p = worldToScreen(
        player.x,
        player.y
    );

    const size = 16 * camera.zoom;

    ctx.save();

    ctx.translate(p.x, p.y);

    // Backpack
    ctx.fillStyle = darken(player.color, 0.65);

    ctx.beginPath();

    ctx.roundRect(
        -size * 0.72,
        -size * 0.05,
        size * 0.35,
        size * 0.9,
        size * 0.12
    );

    ctx.fill();

    // Body
    ctx.fillStyle = player.color;

    ctx.beginPath();

    ctx.roundRect(
        -size * 0.48,
        -size,
        size * 0.95,
        size * 1.65,
        size * 0.38
    );

    ctx.fill();

    // Visor
    ctx.fillStyle = "#bce8ef";

    ctx.beginPath();

    ctx.ellipse(
        size * 0.08,
        -size * 0.48,
        size * 0.38,
        size * 0.24,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        size * 0.17,
        -size * 0.56,
        size * 0.12,
        size * 0.07,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Name
    ctx.font =
        `${Math.max(9, 12 * camera.zoom)}px Arial`;

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        player.name,
        p.x,
        p.y - 20 * camera.zoom
    );
}

function darken(color, amount) {

    const hex = color.replace("#", "");

    if (hex.length !== 6) {
        return color;
    }

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.floor(r * amount);
    g = Math.floor(g * amount);
    b = Math.floor(b * amount);

    return `rgb(${r}, ${g}, ${b})`;
}

function drawBodies() {

    if (!game || !game.bodies) {
        return;
    }

    for (const body of game.bodies) {

        const p = worldToScreen(
            body.x,
            body.y
        );

        ctx.save();

        ctx.translate(p.x, p.y);

        ctx.rotate(-0.35);

        ctx.fillStyle = "#d83b3b";

        ctx.beginPath();

        ctx.ellipse(
            0,
            0,
            13 * camera.zoom,
            8 * camera.zoom,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#ffffff";

        ctx.font =
            `${Math.max(9, 10 * camera.zoom)}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "X",
            0,
            0
        );

        ctx.restore();
    }
}

function drawTopBar() {

    if (!game) {
        return;
    }

    ctx.fillStyle = "rgba(7, 9, 12, 0.88)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        52
    );

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 17px Arial";

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "AI AMONG US",
        20,
        26
    );

    ctx.font = "13px Arial";

    ctx.fillStyle = "#aeb5ba";

    ctx.fillText(
        `Round ${game.round || 1}`,
        160,
        26
    );
}

function draw() {

    drawMapBackground();

    drawShipShadow();

    drawGrid();

    drawCorridors();

    drawRooms();

    drawMapBorder();

    drawVents();

    drawBodies();

    if (game && game.players) {

        for (const player of game.players) {
            drawPlayer(player);
        }
    }

    drawTopBar();

    requestAnimationFrame(draw);
}

async function loadGame() {

    try {

        const response =
            await fetch("/api/game", {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error("Failed to load game");
        }

        game = await response.json();

    } catch (error) {

        console.error(
            "Could not load game:",
            error
        );
    }
}

async function createNewGame() {

    newGameButton.disabled = true;

    try {

        const response =
            await fetch("/api/game/new", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

        if (!response.ok) {
            throw new Error("Failed to create game");
        }

        game = await response.json();

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
    createNewGame
);

canvas.addEventListener(
    "mousedown",
    event => {

        dragging = true;

        canvas.classList.add("dragging");

        dragStartX = event.clientX;
        dragStartY = event.clientY;

        cameraStartX = camera.x;
        cameraStartY = camera.y;
    }
);

window.addEventListener(
    "mouseup",
    () => {

        dragging = false;

        canvas.classList.remove("dragging");
    }
);

window.addEventListener(
    "mousemove",
    event => {

        if (!dragging) {
            return;
        }

        camera.x =
            cameraStartX +
            (event.clientX - dragStartX);

        camera.y =
            cameraStartY +
            (event.clientY - dragStartY);
    }
);

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();

        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const before =
            screenToWorld(mouseX, mouseY);

        const zoomFactor =
            event.deltaY < 0
                ? 1.1
                : 0.9;

        camera.zoom *= zoomFactor;

        camera.zoom =
            Math.max(
                0.35,
                Math.min(3.5, camera.zoom)
            );

        const after =
            screenToWorld(mouseX, mouseY);

        camera.x +=
            (after.x - before.x) *
            camera.zoom;

        camera.y +=
            (after.y - before.y) *
            camera.zoom;
    },
    { passive: false }
);

window.addEventListener(
    "resize",
    resizeCanvas
);

setInterval(
    loadGame,
    500
);

resizeCanvas();

loadGame();

requestAnimationFrame(draw);
