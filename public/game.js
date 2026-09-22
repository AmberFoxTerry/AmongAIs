const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const newGameButton = document.getElementById("newGame");

let game = null;

let camera = {
    x: 30,
    y: 20,
    zoom: 1
};

let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

const WORLD_W = 60;
const WORLD_H = 40;

const COLORS = {
    background: "#101419",
    floor: "#30363d",
    floor2: "#272d33",
    wall: "#59616a",
    wallDark: "#20252b",
    corridor: "#292f35",
    white: "#f1f3f5",
    muted: "#9da5ad",
    red: "#e34b4b",
    green: "#53c76b",
    yellow: "#e0c34b",
    blue: "#4e91d9",
    orange: "#db873d"
};

/*
    ============================================================
    SKELD LAYOUT
    ============================================================

    This is deliberately built as separate rooms + corridors.

    No room rectangles overlap.

    Layout:

                    UPPER ENGINE
                         |
              SECURITY - MEDBAY
                         |
    REACTOR ---- CAFETERIA ---- WEAPONS ---- NAVIGATION
       |             |             |             |
    LOWER ENGINE   STORAGE        O2           SHIELDS
       |             |
    ELECTRICAL     ADMIN ---- COMMUNICATIONS
*/

const rooms = {
    upperEngine: {
        name: "Upper Engine",
        x: 3,
        y: 3,
        w: 10,
        h: 8
    },

    reactor: {
        name: "Reactor",
        x: 3,
        y: 13,
        w: 10,
        h: 9
    },

    lowerEngine: {
        name: "Lower Engine",
        x: 3,
        y: 27,
        w: 10,
        h: 8
    },

    security: {
        name: "Security",
        x: 15,
        y: 5,
        w: 7,
        h: 6
    },

    medbay: {
        name: "MedBay",
        x: 22,
        y: 4,
        w: 7,
        h: 7
    },

    cafeteria: {
        name: "Cafeteria",
        x: 21,
        y: 12,
        w: 17,
        h: 11
    },

    weapons: {
        name: "Weapons",
        x: 40,
        y: 5,
        w: 8,
        h: 8
    },

    navigation: {
        name: "Navigation",
        x: 49,
        y: 14,
        w: 9,
        h: 9
    },

    o2: {
        name: "O2",
        x: 40,
        y: 15,
        w: 7,
        h: 7
    },

    storage: {
        name: "Storage",
        x: 21,
        y: 24,
        w: 12,
        h: 10
    },

    admin: {
        name: "Admin",
        x: 34,
        y: 25,
        w: 8,
        h: 8
    },

    communications: {
        name: "Communications",
        x: 34,
        y: 34,
        w: 9,
        h: 4
    },

    shields: {
        name: "Shields",
        x: 47,
        y: 27,
        w: 10,
        h: 9
    },

    electrical: {
        name: "Electrical",
        x: 14,
        y: 27,
        w: 8,
        h: 8
    }
};

/*
    ============================================================
    CORRIDORS
    ============================================================
*/

const corridors = [
    // Cafeteria -> MedBay
    {
        x: 27,
        y: 10,
        w: 4,
        h: 4
    },

    // MedBay -> Security
    {
        x: 18,
        y: 9,
        w: 8,
        h: 3
    },

    // Security -> Upper Engine
    {
        x: 12,
        y: 7,
        w: 7,
        h: 3
    },

    // Upper Engine -> Reactor
    {
        x: 7,
        y: 10,
        w: 4,
        h: 5
    },

    // Reactor -> Lower Engine
    {
        x: 7,
        y: 21,
        w: 4,
        h: 8
    },

    // Reactor -> Electrical
    {
        x: 10,
        y: 20,
        w: 7,
        h: 4
    },

    // Electrical -> Storage
    {
        x: 17,
        y: 31,
        w: 7,
        h: 4
    },

    // Cafeteria -> Storage
    {
        x: 27,
        y: 21,
        w: 4,
        h: 6
    },

    // Cafeteria -> Weapons
    {
        x: 36,
        y: 15,
        w: 7,
        h: 4
    },

    // Weapons -> Navigation
    {
        x: 46,
        y: 9,
        w: 6,
        h: 4
    },

    // Navigation -> O2
    {
        x: 45,
        y: 18,
        w: 6,
        h: 4
    },

    // Navigation -> Shields
    {
        x: 52,
        y: 22,
        w: 4,
        h: 8
    },

    // O2 -> Admin
    {
        x: 38,
        y: 20,
        w: 5,
        h: 8
    },

    // Storage -> Admin
    {
        x: 31,
        y: 29,
        w: 6,
        h: 4
    },

    // Admin -> Communications
    {
        x: 37,
        y: 32,
        w: 4,
        h: 5
    },

    // Admin -> Shields
    {
        x: 41,
        y: 29,
        w: 9,
        h: 4
    }
];

/*
    ============================================================
    TASK LOCATIONS
    ============================================================
*/

const taskLocations = [
    { x: 24.5, y: 14, name: "Cafeteria" },
    { x: 34, y: 14.5, name: "Cafeteria" },

    { x: 25, y: 7, name: "MedBay" },
    { x: 18, y: 8, name: "Security" },

    { x: 7, y: 6, name: "Upper Engine" },
    { x: 7, y: 18, name: "Reactor" },
    { x: 7, y: 31, name: "Lower Engine" },

    { x: 17, y: 30, name: "Electrical" },

    { x: 25, y: 29, name: "Storage" },

    { x: 37, y: 29, name: "Admin" },

    { x: 38, y: 36, name: "Communications" },

    { x: 43, y: 18, name: "O2" },

    { x: 44, y: 8, name: "Weapons" },

    { x: 53, y: 18, name: "Navigation" },

    { x: 52, y: 32, name: "Shields" }
];

/*
    ============================================================
    UTILITY
    ============================================================
*/

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
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();

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

function screenToWorld(x, y) {
    return {
        x:
            (x - window.innerWidth / 2) /
                camera.zoom +
            camera.x,

        y:
            (y - window.innerHeight / 2) /
                camera.zoom +
            camera.y
    };
}

function roundedRect(
    x,
    y,
    w,
    h,
    r
) {
    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        w,
        h,
        r
    );
}

function drawWorldRect(
    x,
    y,
    w,
    h,
    fill,
    stroke = null,
    lineWidth = 0.2
) {
    const a = worldToScreen(x, y);

    const b = worldToScreen(
        x + w,
        y + h
    );

    ctx.fillStyle = fill;

    ctx.fillRect(
        a.x,
        a.y,
        b.x - a.x,
        b.y - a.y
    );

    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth =
            lineWidth * camera.zoom;

        ctx.strokeRect(
            a.x,
            a.y,
            b.x - a.x,
            b.y - a.y
        );
    }
}

/*
    ============================================================
    BACKGROUND
    ============================================================
*/

function drawBackground() {
    ctx.fillStyle =
        COLORS.background;

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    const topLeft =
        worldToScreen(0, 0);

    const bottomRight =
        worldToScreen(
            WORLD_W,
            WORLD_H
        );

    ctx.fillStyle =
        "#171c21";

    ctx.fillRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
    );
}

/*
    ============================================================
    CORRIDORS
    ============================================================
*/

function drawCorridors() {
    for (const corridor of corridors) {
        drawWorldRect(
            corridor.x,
            corridor.y,
            corridor.w,
            corridor.h,
            COLORS.corridor,
            COLORS.wallDark,
            0.25
        );
    }
}

/*
    ============================================================
    ROOMS
    ============================================================
*/

function drawRoom(room) {
    drawWorldRect(
        room.x,
        room.y,
        room.w,
        room.h,
        COLORS.floor,
        COLORS.wall,
        0.35
    );

    /*
        Floor panels.
    */

    ctx.save();

    const topLeft =
        worldToScreen(
            room.x,
            room.y
        );

    const bottomRight =
        worldToScreen(
            room.x + room.w,
            room.y + room.h
        );

    ctx.beginPath();

    ctx.rect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
    );

    ctx.clip();

    ctx.strokeStyle =
        "rgba(255,255,255,0.035)";

    ctx.lineWidth = 0.7;

    for (
        let x = Math.ceil(room.x);
        x < room.x + room.w;
        x++
    ) {
        const a =
            worldToScreen(
                x,
                room.y
            );

        const b =
            worldToScreen(
                x,
                room.y + room.h
            );

        ctx.beginPath();

        ctx.moveTo(
            a.x,
            a.y
        );

        ctx.lineTo(
            b.x,
            b.y
        );

        ctx.stroke();
    }

    for (
        let y = Math.ceil(room.y);
        y < room.y + room.h;
        y++
    ) {
        const a =
            worldToScreen(
                room.x,
                y
            );

        const b =
            worldToScreen(
                room.x + room.w,
                y
            );

        ctx.beginPath();

        ctx.moveTo(
            a.x,
            a.y
        );

        ctx.lineTo(
            b.x,
            b.y
        );

        ctx.stroke();
    }

    ctx.restore();

    /*
        Room name.
    */

    const center =
        worldToScreen(
            room.x + room.w / 2,
            room.y + 0.7
        );

    ctx.fillStyle =
        "rgba(255,255,255,0.42)";

    ctx.font =
        `${Math.max(
            8,
            0.65 * camera.zoom
        )}px Arial`;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        room.name.toUpperCase(),
        center.x,
        center.y
    );
}

function drawRooms() {
    for (const room of Object.values(rooms)) {
        drawRoom(room);
    }
}

/*
    ============================================================
    CAFETERIA
    ============================================================
*/

function drawCafeteriaDetails() {
    const room =
        rooms.cafeteria;

    /*
        Four normal tables.
    */

    const tables = [
        [25.5, 15.2],
        [34.5, 15.2],
        [25.5, 20],
        [34.5, 20]
    ];

    for (const [x, y] of tables) {
        drawTable(
            x,
            y,
            2.5,
            1.4
        );
    }

    /*
        Emergency table.
    */

    drawTable(
        30,
        17.6,
        3,
        1.7,
        true
    );

    const center =
        worldToScreen(
            31.5,
            18.45
        );

    ctx.fillStyle =
        COLORS.red;

    ctx.beginPath();

    ctx.arc(
        center.x,
        center.y,
        Math.max(
            3,
            0.35 * camera.zoom
        ),
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawTable(
    x,
    y,
    w,
    h,
    emergency = false
) {
    const a =
        worldToScreen(
            x,
            y
        );

    const b =
        worldToScreen(
            x + w,
            y + h
        );

    ctx.fillStyle =
        emergency
            ? "#454b51"
            : "#3e454b";

    ctx.strokeStyle =
        "#686f76";

    ctx.lineWidth =
        0.18 * camera.zoom;

    ctx.beginPath();

    ctx.roundRect(
        a.x,
        a.y,
        b.x - a.x,
        b.y - a.y,
        0.25 * camera.zoom
    );

    ctx.fill();
    ctx.stroke();
}

/*
    ============================================================
    ROOM DETAILS
    ============================================================
*/

function drawRoomDetails() {
    /*
        Storage crates.
    */

    for (
        let x = 24;
        x < 31;
        x += 2
    ) {
        for (
            let y = 27;
            y < 33;
            y += 2
        ) {
            drawWorldRect(
                x,
                y,
                1.4,
                1.2,
                "#42494f",
                "#666d73",
                0.12
            );
        }
    }

    /*
        Reactor core.
    */

    drawWorldRect(
        5.5,
        15,
        5,
        5,
        "#242a30",
        "#70777d",
        0.18
    );

    const reactor =
        worldToScreen(
            8,
            17.5
        );

    ctx.strokeStyle =
        COLORS.red;

    ctx.lineWidth =
        Math.max(
            1,
            camera.zoom * 0.18
        );

    ctx.beginPath();

    ctx.arc(
        reactor.x,
        reactor.y,
        1.4 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    /*
        Weapons cannon.
    */

    drawWorldRect(
        41,
        6,
        6,
        3,
        "#20262b",
        "#656c73",
        0.15
    );

    /*
        Admin table.
    */

    drawWorldRect(
        35.5,
        27,
        5,
        2.5,
        "#242a30",
        "#697177",
        0.15
    );

    /*
        Security monitors.
    */

    for (
        let i = 0;
        i < 3;
        i++
    ) {
        drawWorldRect(
            16,
            6.2 + i * 1.25,
            2,
            0.8,
            "#161b20",
            "#697177",
            0.1
        );
    }

    /*
        Electrical panels.
    */

    for (
        let i = 0;
        i < 3;
        i++
    ) {
        drawWorldRect(
            15,
            28 + i * 2,
            1.2,
            1.3,
            "#171c21",
            "#737a80",
            0.1
        );
    }
}

/*
    ============================================================
    TASKS
    ============================================================
*/

function drawTasks() {
    for (const task of taskLocations) {
        const p =
            worldToScreen(
                task.x,
                task.y
            );

        ctx.fillStyle =
            "#d5b84a";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            Math.max(
                1.8,
                camera.zoom * 0.12
            ),
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

/*
    ============================================================
    BODIES
    ============================================================
*/

function drawBodies() {
    if (!game) return;

    for (const body of game.bodies) {
        if (body.reported) continue;

        const p =
            worldToScreen(
                body.x,
                body.y
            );

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        ctx.rotate(
            -0.25
        );

        /*
            Body.
        */

        ctx.fillStyle =
            body.color || COLORS.red;

        ctx.beginPath();

        ctx.ellipse(
            0,
            0.3 * camera.zoom,
            0.38 * camera.zoom,
            0.62 * camera.zoom,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /*
            Bone.
        */

        ctx.strokeStyle =
            "#e7e7e7";

        ctx.lineWidth =
            Math.max(
                2,
                0.14 * camera.zoom
            );

        ctx.beginPath();

        ctx.moveTo(
            -0.15 * camera.zoom,
            0.15 * camera.zoom
        );

        ctx.lineTo(
            0.35 * camera.zoom,
            -0.4 * camera.zoom
        );

        ctx.stroke();

        ctx.restore();

        /*
            Body marker.
        */

        ctx.fillStyle =
            COLORS.red;

        ctx.font =
            `${Math.max(
                9,
                0.65 * camera.zoom
            )}px Arial`;

        ctx.textAlign =
            "center";

        ctx.fillText(
            "BODY",
            p.x,
            p.y - 1 * camera.zoom
        );
    }
}

/*
    ============================================================
    PLAYERS
    ============================================================
*/

function drawPlayer(player) {
    const p =
        worldToScreen(
            player.x,
            player.y
        );

    const size =
        Math.max(
            5,
            0.55 * camera.zoom
        );

    /*
        Shadow.
    */

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y + size * 0.55,
        size * 0.8,
        size * 0.35,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    if (!player.alive) {
        return;
    }

    /*
        Body.
    */

    ctx.fillStyle =
        player.color;

    ctx.beginPath();

    ctx.roundRect(
        p.x - size * 0.48,
        p.y - size * 0.35,
        size * 0.7,
        size * 1.15,
        size * 0.2
    );

    ctx.fill();

    /*
        Backpack.
    */

    ctx.fillRect(
        p.x - size * 0.68,
        p.y - size * 0.15,
        size * 0.22,
        size * 0.62
    );

    /*
        Visor.
    */

    ctx.fillStyle =
        "#b8e7ef";

    ctx.beginPath();

    ctx.ellipse(
        p.x + size * 0.08,
        p.y - size * 0.18,
        size * 0.38,
        size * 0.22,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
        Name.
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        `${Math.max(
            8,
            0.65 * camera.zoom
        )}px Arial`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "bottom";

    ctx.fillText(
        player.name,
        p.x,
        p.y - size * 0.8
    );

    /*
        Task indicator.
    */

    if (player.currentTask) {
        ctx.fillStyle =
            "#d9c052";

        ctx.font =
            `${Math.max(
                6,
                0.45 * camera.zoom
            )}px Arial`;

        ctx.fillText(
            "TASK",
            p.x,
            p.y + size * 1.1
        );
    }
}

function drawPlayers() {
    if (!game) return;

    for (const player of game.players) {
        drawPlayer(player);
    }
}

/*
    ============================================================
    TOP UI
    ============================================================
*/

function drawTopUI() {
    if (!game) return;

    ctx.fillStyle =
        "rgba(10,12,15,0.88)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        56
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 18px Arial";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "AI AMONG US",
        18,
        28
    );

    ctx.fillStyle =
        COLORS.muted;

    ctx.font =
        "13px Arial";

    ctx.fillText(
        `ROUND ${game.round}`,
        165,
        28
    );

    const alive =
        game.players.filter(
            p => p.alive
        ).length;

    ctx.fillText(
        `ALIVE ${alive}/${game.players.length}`,
        255,
        28
    );

    if (game.phase === "meeting") {
        ctx.fillStyle =
            COLORS.red;

        ctx.font =
            "bold 15px Arial";

        ctx.textAlign =
            "right";

        ctx.fillText(
            "MEETING",
            window.innerWidth - 20,
            28
        );
    }

    if (game.phase === "ended") {
        ctx.fillStyle =
            game.winner === "crewmates"
                ? COLORS.green
                : COLORS.red;

        ctx.font =
            "bold 15px Arial";

        ctx.textAlign =
            "right";

        ctx.fillText(
            game.winner === "crewmates"
                ? "CREWMATES WIN"
                : "IMPOSTORS WIN",
            window.innerWidth - 20,
            28
        );
    }
}

/*
    ============================================================
    MEETING UI
    ============================================================
*/

function drawMeeting() {
    if (
        !game ||
        game.phase !== "meeting" ||
        !game.meeting
    ) {
        return;
    }

    ctx.fillStyle =
        "rgba(5,7,9,0.82)";

    ctx.fillRect(
        0,
        56,
        window.innerWidth,
        window.innerHeight - 56
    );

    const panelW =
        Math.min(
            760,
            window.innerWidth - 40
        );

    const panelH =
        Math.min(
            620,
            window.innerHeight - 90
        );

    const x =
        (window.innerWidth - panelW) / 2;

    const y =
        70;

    ctx.fillStyle =
        "#1c2228";

    ctx.strokeStyle =
        "#697178";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        panelW,
        panelH,
        12
    );

    ctx.fill();
    ctx.stroke();

    /*
        Header.
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 24px Arial";

    ctx.textAlign =
        "left";

    ctx.fillText(
        game.meeting.reason === "body"
            ? "BODY REPORTED"
            : "EMERGENCY MEETING",
        x + 25,
        y + 38
    );

    ctx.fillStyle =
        COLORS.muted;

    ctx.font =
        "13px Arial";

    ctx.fillText(
        `Called by ${game.meeting.callerName}`,
        x + 25,
        y + 62
    );

    /*
        Chat.
    */

    const chatX =
        x + 25;

    const chatY =
        y + 92;

    const chatW =
        panelW * 0.57;

    const chatH =
        panelH - 120;

    ctx.fillStyle =
        "#12171c";

    ctx.fillRect(
        chatX,
        chatY,
        chatW,
        chatH
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 14px Arial";

    ctx.fillText(
        "DISCUSSION",
        chatX + 12,
        chatY + 22
    );

    const messages =
        game.meeting.chat || [];

    let lineY =
        chatY + 48;

    for (const message of messages) {
        if (
            lineY >
            chatY + chatH - 30
        ) {
            break;
        }

        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 12px Arial";

        ctx.fillText(
            message.name,
            chatX + 12,
            lineY
        );

        lineY += 16;

        ctx.fillStyle =
            "#c3c8cd";

        ctx.font =
            "12px Arial";

        const words =
            message.text.split(" ");

        let line = "";

        for (const word of words) {
            const test =
                line +
                (line ? " " : "") +
                word;

            if (
                ctx.measureText(test).width >
                chatW - 24
            ) {
                ctx.fillText(
                    line,
                    chatX + 12,
                    lineY
                );

                lineY += 15;
                line = word;
            } else {
                line = test;
            }
        }

        if (line) {
            ctx.fillText(
                line,
                chatX + 12,
                lineY
            );

            lineY += 15;
        }

        lineY += 10;
    }

    /*
        Voting panel.
    */

    const voteX =
        chatX + chatW + 20;

    const voteW =
        panelW - chatW - 70;

    ctx.fillStyle =
        "#12171c";

    ctx.fillRect(
        voteX,
        chatY,
        voteW,
        chatH
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 14px Arial";

    ctx.fillText(
        game.meeting.votingEndsAt
            ? "VOTES"
            : "THINKING...",
        voteX + 12,
        chatY + 22
    );

    let voteY =
        chatY + 52;

    const votes =
        game.meeting.votes || {};

    for (const player of game.players) {
        if (!player.alive) continue;

        const count =
            votes[player.id] || 0;

        ctx.fillStyle =
            player.color;

        ctx.beginPath();

        ctx.arc(
            voteX + 20,
            voteY - 4,
            6,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "12px Arial";

        ctx.textAlign =
            "left";

        ctx.fillText(
            player.name,
            voteX + 32,
            voteY
        );

        if (count > 0) {
            ctx.fillStyle =
                COLORS.yellow;

            ctx.fillText(
                `${count}`,
                voteX + voteW - 28,
                voteY
            );
        }

        voteY += 25;
    }
}

/*
    ============================================================
    END SCREEN
    ============================================================
*/

function drawEndScreen() {
    if (
        !game ||
        game.phase !== "ended"
    ) {
        return;
    }

    ctx.fillStyle =
        "rgba(0,0,0,0.65)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    const text =
        game.winner === "crewmates"
            ? "CREWMATES WIN"
            : "IMPOSTORS WIN";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        game.winner === "crewmates"
            ? COLORS.green
            : COLORS.red;

    ctx.font =
        "bold 52px Arial";

    ctx.fillText(
        text,
        window.innerWidth / 2,
        window.innerHeight / 2 - 20
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "18px Arial";

    ctx.fillText(
        "Press NEW GAME to play again",
        window.innerWidth / 2,
        window.innerHeight / 2 + 35
    );
}

/*
    ============================================================
    RENDER
    ============================================================
*/

function render() {
    drawBackground();

    drawCorridors();

    drawRooms();

    drawRoomDetails();

    drawCafeteriaDetails();

    drawTasks();

    drawBodies();

    drawPlayers();

    drawTopUI();

    drawMeeting();

    drawEndScreen();

    requestAnimationFrame(
        render
    );
}

/*
    ============================================================
    CAMERA
    ============================================================
*/

canvas.addEventListener(
    "mousedown",
    event => {
        dragging = true;

        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;

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
        if (!dragging) return;

        const dx =
            event.clientX -
            lastMouseX;

        const dy =
            event.clientY -
            lastMouseY;

        camera.x -=
            dx / camera.zoom;

        camera.y -=
            dy / camera.zoom;

        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;
    }
);

canvas.addEventListener(
    "wheel",
    event => {
        event.preventDefault();

        const before =
            screenToWorld(
                event.clientX,
                event.clientY
            );

        const factor =
            event.deltaY < 0
                ? 1.12
                : 0.89;

        camera.zoom =
            Math.max(
                0.55,
                Math.min(
                    3.5,
                    camera.zoom * factor
                )
            );

        const after =
            screenToWorld(
                event.clientX,
                event.clientY
            );

        camera.x +=
            before.x -
            after.x;

        camera.y +=
            before.y -
            after.y;
    },
    {
        passive: false
    }
);

/*
    ============================================================
    SERVER
    ============================================================
*/

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
            "Unable to load game:",
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

        camera.x = 30;
        camera.y = 20;
        camera.zoom = 1;
    } catch (error) {
        console.error(
            "Unable to start new game:",
            error
        );
    }

    newGameButton.disabled = false;
}

newGameButton.addEventListener(
    "click",
    newGame
);

/*
    Poll server.
*/

setInterval(
    loadGame,
    250
);

loadGame();

render();
