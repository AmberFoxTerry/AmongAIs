const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const WORLD_W = 240;
const WORLD_H = 160;

let game = null;

let camera = {
    x: WORLD_W / 2,
    y: WORLD_H / 2,
    zoom: 4
};

let dragging = false;
let dragStart = null;
let cameraStart = null;

const COLORS = {
    background: "#07090c",
    floor: "#161a20",
    floor2: "#1c2128",
    wall: "#59616b",
    wallDark: "#30363d",
    corridor: "#101419",
    corridorEdge: "#3c444d",
    text: "#ffffff",
    muted: "#9aa3ad",
    task: "#f4d35e",
    taskDone: "#5fd17a",
    body: "#d83b3b",
    emergency: "#e33b3b"
};

/*
    BIG SKELD-STYLE MAP

    240 × 160

    Everything has a lot more breathing room.
*/

const ROOMS = {
    "Upper Engine": {
        x: 8,
        y: 12,
        w: 42,
        h: 28
    },

    Reactor: {
        x: 8,
        y: 60,
        w: 42,
        h: 34
    },

    "Lower Engine": {
        x: 8,
        y: 112,
        w: 42,
        h: 30
    },

    MedBay: {
        x: 62,
        y: 12,
        w: 34,
        h: 28
    },

    Security: {
        x: 62,
        y: 112,
        w: 34,
        h: 30
    },

    Cafeteria: {
        x: 103,
        y: 48,
        w: 46,
        h: 42
    },

    Weapons: {
        x: 165,
        y: 10,
        w: 34,
        h: 32
    },

    Navigation: {
        x: 207,
        y: 48,
        w: 28,
        h: 38
    },

    O2: {
        x: 165,
        y: 102,
        w: 34,
        h: 30
    },

    Storage: {
        x: 103,
        y: 102,
        w: 46,
        h: 40
    },

    Admin: {
        x: 165,
        y: 54,
        w: 34,
        h: 30
    },

    Communications: {
        x: 103,
        y: 10,
        w: 38,
        h: 25
    },

    Shields: {
        x: 207,
        y: 104,
        w: 28,
        h: 30
    },

    Electrical: {
        x: 60,
        y: 52,
        w: 36,
        h: 26
    }
};

/*
    Long, deliberate corridors.
*/

const CORRIDORS = [
    // left vertical
    {
        x: 25,
        y: 40,
        w: 12,
        h: 20
    },

    {
        x: 25,
        y: 94,
        w: 12,
        h: 18
    },

    // upper engine -> medbay
    {
        x: 50,
        y: 22,
        w: 12,
        h: 10
    },

    // reactor -> electrical
    {
        x: 50,
        y: 68,
        w: 12,
        h: 10
    },

    // electrical -> cafeteria
    {
        x: 90,
        y: 62,
        w: 18,
        h: 10
    },

    // cafeteria -> storage
    {
        x: 120,
        y: 90,
        w: 12,
        h: 12
    },

    // cafeteria -> admin
    {
        x: 149,
        y: 62,
        w: 16,
        h: 12
    },

    // admin -> navigation
    {
        x: 199,
        y: 62,
        w: 8,
        h: 12
    },

    // weapons -> cafeteria
    {
        x: 149,
        y: 24,
        w: 16,
        h: 12
    },

    {
        x: 157,
        y: 30,
        w: 12,
        h: 30
    },

    // admin -> O2
    {
        x: 178,
        y: 84,
        w: 10,
        h: 18
    },

    // O2 -> shields
    {
        x: 199,
        y: 114,
        w: 8,
        h: 10
    },

    // navigation -> shields
    {
        x: 219,
        y: 86,
        w: 10,
        h: 18
    },

    // storage -> comms
    {
        x: 116,
        y: 35,
        w: 12,
        h: 67
    },

    // storage -> security
    {
        x: 84,
        y: 92,
        w: 12,
        h: 20
    }
];

function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
    );
}

window.addEventListener("resize", resize);
resize();

function worldToScreen(x, y) {
    return {
        x:
            (x - camera.x) * camera.zoom +
            window.innerWidth / 2,

        y:
            (y - camera.y) * camera.zoom +
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

function rectWorld(rect, fill, stroke = null) {
    const topLeft = worldToScreen(rect.x, rect.y);

    ctx.fillStyle = fill;

    ctx.fillRect(
        topLeft.x,
        topLeft.y,
        rect.w * camera.zoom,
        rect.h * camera.zoom
    );

    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = Math.max(1, camera.zoom);
        ctx.strokeRect(
            topLeft.x,
            topLeft.y,
            rect.w * camera.zoom,
            rect.h * camera.zoom
        );
    }
}

function drawCorridors() {
    for (const corridor of CORRIDORS) {
        rectWorld(
            corridor,
            COLORS.corridor,
            COLORS.corridorEdge
        );
    }
}

function drawRooms() {
    for (const [name, room] of Object.entries(ROOMS)) {
        rectWorld(
            room,
            COLORS.floor,
            COLORS.wall
        );

        /*
            Inner floor.
        */
        rectWorld(
            {
                x: room.x + 2,
                y: room.y + 2,
                w: room.w - 4,
                h: room.h - 4
            },
            COLORS.floor2
        );

        drawRoomName(name, room);
    }
}

function drawRoomName(name, room) {
    const center = worldToScreen(
        room.x + room.w / 2,
        room.y + room.h / 2
    );

    ctx.save();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const size = Math.max(
        9,
        Math.min(20, camera.zoom * 3.2)
    );

    ctx.font = `bold ${size}px Arial`;

    ctx.fillStyle = "rgba(255,255,255,0.35)";

    ctx.fillText(
        name.toUpperCase(),
        center.x,
        center.y
    );

    ctx.restore();
}

function drawCafeteria() {
    const room = ROOMS.Cafeteria;

    /*
        Four large tables.
    */

    const tables = [
        {
            x: room.x + 10,
            y: room.y + 9
        },

        {
            x: room.x + room.w - 10,
            y: room.y + 9
        },

        {
            x: room.x + 10,
            y: room.y + room.h - 9
        },

        {
            x: room.x + room.w - 10,
            y: room.y + room.h - 9
        }
    ];

    for (const table of tables) {
        const p = worldToScreen(
            table.x,
            table.y
        );

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            5 * camera.zoom,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#343b44";
        ctx.fill();

        ctx.strokeStyle = "#66717d";
        ctx.lineWidth = Math.max(1, camera.zoom);
        ctx.stroke();
    }

    /*
        Emergency table.
    */

    const center = worldToScreen(
        room.x + room.w / 2,
        room.y + room.h / 2
    );

    ctx.beginPath();

    ctx.arc(
        center.x,
        center.y,
        6 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#303740";
    ctx.fill();

    ctx.strokeStyle = COLORS.emergency;
    ctx.lineWidth = Math.max(
        2,
        camera.zoom * 0.8
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        center.x,
        center.y,
        1.8 * camera.zoom,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = COLORS.emergency;
    ctx.fill();
}

function drawStorage() {
    const room = ROOMS.Storage;

    for (let y = room.y + 7; y < room.y + room.h - 4; y += 8) {
        for (
            let x = room.x + 7;
            x < room.x + room.w - 4;
            x += 9
        ) {
            rectWorld(
                {
                    x,
                    y,
                    w: 6,
                    h: 5
                },
                "#2d343c",
                "#555e68"
            );
        }
    }
}

function drawElectrical() {
    const room = ROOMS.Electrical;

    for (
        let x = room.x + 5;
        x < room.x + room.w - 3;
        x += 7
    ) {
        rectWorld(
            {
                x,
                y: room.y + 7,
                w: 4,
                h: 12
            },
            "#252c33",
            "#68727c"
        );
    }
}

function drawReactor() {
    const room = ROOMS.Reactor;

    const center = worldToScreen(
        room.x + room.w / 2,
        room.y + room.h / 2
    );

    const radius = 9 * camera.zoom;

    ctx.beginPath();

    ctx.arc(
        center.x,
        center.y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#20262d";
    ctx.fill();

    ctx.strokeStyle = "#727d88";
    ctx.lineWidth = Math.max(2, camera.zoom);

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        center.x,
        center.y,
        radius * 0.55,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle = "#aeb7c0";

    ctx.stroke();
}

function drawWeapons() {
    const room = ROOMS.Weapons;

    const center = worldToScreen(
        room.x + room.w / 2,
        room.y + room.h / 2
    );

    ctx.beginPath();

    ctx.moveTo(
        center.x - 10 * camera.zoom,
        center.y + 5 * camera.zoom
    );

    ctx.lineTo(
        center.x + 12 * camera.zoom,
        center.y
    );

    ctx.lineTo(
        center.x - 10 * camera.zoom,
        center.y - 5 * camera.zoom
    );

    ctx.closePath();

    ctx.fillStyle = "#343c45";
    ctx.fill();

    ctx.strokeStyle = "#737e89";
    ctx.stroke();
}

function drawSecurity() {
    const room = ROOMS.Security;

    for (let i = 0; i < 4; i++) {
        rectWorld(
            {
                x: room.x + 5 + i * 6,
                y: room.y + 8,
                w: 4,
                h: 5
            },
            "#252c34",
            "#66727d"
        );
    }
}

function drawAdmin() {
    const room = ROOMS.Admin;

    rectWorld(
        {
            x: room.x + 8,
            y: room.y + 9,
            w: room.w - 16,
            h: 8
        },
        "#252c34",
        "#69747f"
    );
}

function drawTasks() {
    if (!game) return;

    for (const player of game.players) {
        for (const task of player.tasks || []) {
            if (task.complete) {
                continue;
            }

            const p = worldToScreen(
                task.x,
                task.y
            );

            const pulse =
                Math.sin(Date.now() / 250) * 2;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                (3.5 + pulse) * camera.zoom,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = COLORS.task;
            ctx.globalAlpha = 0.7;

            ctx.fill();

            ctx.globalAlpha = 1;
        }
    }
}

function drawBodies() {
    if (!game) return;

    for (const body of game.bodies) {
        const p = worldToScreen(
            body.x,
            body.y
        );

        const size = 2.5 * camera.zoom;

        ctx.save();

        ctx.translate(p.x, p.y);

        ctx.fillStyle = COLORS.body;

        ctx.beginPath();

        ctx.arc(
            0,
            -size * 0.6,
            size * 0.6,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillRect(
            -size * 0.6,
            0,
            size * 1.2,
            size * 1.5
        );

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(
            1,
            camera.zoom * 0.5
        );

        ctx.stroke();

        ctx.restore();
    }
}

function drawPlayers() {
    if (!game) return;

    for (const player of game.players) {
        const p = worldToScreen(
            player.x,
            player.y
        );

        const radius =
            Math.max(
                4,
                1.5 * camera.zoom
            );

        if (!player.alive) {
            continue;
        }

        /*
            Shadow.
        */

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y + radius * 0.8,
            radius * 0.8,
            radius * 0.35,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fill();

        /*
            Body.
        */

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = player.color;
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(
            1,
            camera.zoom * 0.35
        );

        ctx.stroke();

        /*
            Name.
        */

        if (camera.zoom >= 2.5) {
            ctx.font =
                `${Math.max(
                    9,
                    camera.zoom * 2
                )}px Arial`;

            ctx.textAlign = "center";

            ctx.fillStyle = "#ffffff";

            ctx.fillText(
                player.name,
                p.x,
                p.y - radius - 5
            );
        }
    }
}

function drawTopUI() {
    if (!game) return;

    ctx.save();

    ctx.fillStyle = "rgba(7,9,12,0.86)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        54
    );

    ctx.font = "bold 16px Arial";

    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "left";

    ctx.fillText(
        `TASKS ${game.taskCompleted}/${game.totalTasks}`,
        18,
        33
    );

    ctx.textAlign = "center";

    ctx.fillText(
        game.phase === "playing"
            ? "AI AMONG US"
            : game.phase.toUpperCase(),
        window.innerWidth / 2,
        33
    );

    ctx.restore();
}

function drawMeeting() {
    if (!game || !game.meeting) {
        return;
    }

    const meeting = game.meeting;

    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.82)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    const width = Math.min(
        700,
        window.innerWidth - 40
    );

    const height = Math.min(
        560,
        window.innerHeight - 80
    );

    const x =
        (window.innerWidth - width) / 2;

    const y =
        (window.innerHeight - height) / 2;

    ctx.fillStyle = "#151a20";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.strokeStyle = "#69737e";

    ctx.lineWidth = 2;

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 24px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "MEETING",
        window.innerWidth / 2,
        y + 38
    );

    ctx.font = "14px Arial";

    ctx.fillStyle = "#aeb7c0";

    ctx.fillText(
        meeting.reason,
        window.innerWidth / 2,
        y + 65
    );

    let lineY = y + 105;

    for (const message of meeting.chat || []) {
        ctx.textAlign = "left";

        ctx.fillStyle = "#ffffff";

        ctx.font = "bold 13px Arial";

        ctx.fillText(
            `${message.name}:`,
            x + 25,
            lineY
        );

        ctx.font = "13px Arial";

        ctx.fillStyle = "#c4cbd2";

        ctx.fillText(
            message.text,
            x + 105,
            lineY
        );

        lineY += 27;

        if (lineY > y + height - 90) {
            break;
        }
    }

    if (meeting.result) {
        ctx.textAlign = "center";

        ctx.font = "bold 17px Arial";

        ctx.fillStyle = "#ffffff";

        ctx.fillText(
            meeting.result,
            window.innerWidth / 2,
            y + height - 35
        );
    }

    ctx.restore();
}

function drawEndScreen() {
    if (!game || game.phase !== "ended") {
        return;
    }

    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.7)";

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    ctx.textAlign = "center";

    ctx.font = "bold 48px Arial";

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        game.winner === "crewmates"
            ? "CREWMATES WIN"
            : "IMPOSTORS WIN",
        window.innerWidth / 2,
        window.innerHeight / 2
    );

    ctx.font = "18px Arial";

    ctx.fillStyle = "#b9c1c9";

    ctx.fillText(
        "Press NEW GAME to play again.",
        window.innerWidth / 2,
        window.innerHeight / 2 + 40
    );

    ctx.restore();
}

function draw() {
    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    ctx.fillStyle = COLORS.background;

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    /*
        World background.
    */

    rectWorld(
        {
            x: 0,
            y: 0,
            w: WORLD_W,
            h: WORLD_H
        },
        "#0a0d11"
    );

    drawCorridors();
    drawRooms();

    drawCafeteria();
    drawStorage();
    drawElectrical();
    drawReactor();
    drawWeapons();
    drawSecurity();
    drawAdmin();

    drawTasks();
    drawBodies();
    drawPlayers();

    drawTopUI();

    if (game && game.phase === "meeting") {
        drawMeeting();
    }

    drawEndScreen();

    requestAnimationFrame(draw);
}

async function fetchGame() {
    try {
        const response =
            await fetch("/api/game", {
                cache: "no-store"
            });

        if (!response.ok) {
            return;
        }

        game = await response.json();
    } catch (error) {
        console.error(
            "Game update failed:",
            error
        );
    }
}

document
    .getElementById("newGame")
    .addEventListener(
        "click",
        async () => {
            try {
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

                await fetchGame();

                camera.x = WORLD_W / 2;
                camera.y = WORLD_H / 2;
                camera.zoom = 4;
            } catch (error) {
                console.error(error);
            }
        }
    );

canvas.addEventListener(
    "mousedown",
    event => {
        dragging = true;

        canvas.classList.add("dragging");

        dragStart = {
            x: event.clientX,
            y: event.clientY
        };

        cameraStart = {
            x: camera.x,
            y: camera.y
        };
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

        const dx =
            event.clientX -
            dragStart.x;

        const dy =
            event.clientY -
            dragStart.y;

        camera.x =
            cameraStart.x -
            dx / camera.zoom;

        camera.y =
            cameraStart.y -
            dy / camera.zoom;

        camera.x = Math.max(
            0,
            Math.min(
                WORLD_W,
                camera.x
            )
        );

        camera.y = Math.max(
            0,
            Math.min(
                WORLD_H,
                camera.y
            )
        );
    }
);

canvas.addEventListener(
    "wheel",
    event => {
        event.preventDefault();

        const mouseBefore =
            screenToWorld(
                event.clientX,
                event.clientY
            );

        const factor =
            event.deltaY < 0
                ? 1.12
                : 0.89;

        camera.zoom *= factor;

        camera.zoom = Math.max(
            1.5,
            Math.min(
                10,
                camera.zoom
            )
        );

        const mouseAfter =
            screenToWorld(
                event.clientX,
                event.clientY
            );

        camera.x +=
            mouseBefore.x -
            mouseAfter.x;

        camera.y +=
            mouseBefore.y -
            mouseAfter.y;
    },
    {
        passive: false
    }
);

setInterval(
    fetchGame,
    500
);

fetchGame();

draw();
