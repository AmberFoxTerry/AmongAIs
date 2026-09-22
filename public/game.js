const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const statusElement = document.getElementById("status");
const crewElement = document.getElementById("crew");
const eventsElement = document.getElementById("events");
const gameInfoElement = document.getElementById("gameInfo");
const newGameButton = document.getElementById("newGame");

let game = null;

const camera = {
    x: 500,
    y: 300,
    zoom: 1
};

let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

const ROOMS = {
    Cafeteria: {
        x: 500,
        y: 300,
        width: 220,
        height: 150
    },

    MedBay: {
        x: 250,
        y: 150,
        width: 180,
        height: 130
    },

    Electrical: {
        x: 150,
        y: 450,
        width: 180,
        height: 130
    },

    Storage: {
        x: 350,
        y: 500,
        width: 200,
        height: 130
    },

    Security: {
        x: 700,
        y: 150,
        width: 180,
        height: 130
    },

    Reactor: {
        x: 850,
        y: 450,
        width: 190,
        height: 140
    },

    Navigation: {
        x: 850,
        y: 250,
        width: 190,
        height: 130
    },

    Admin: {
        x: 500,
        y: 500,
        width: 180,
        height: 130
    }
};

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    ctx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0
    );

    draw();
}

window.addEventListener("resize", resizeCanvas);

function worldToScreen(x, y) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    return {
        x: (x - camera.x) * camera.zoom + width / 2,
        y: (y - camera.y) * camera.zoom + height / 2
    };
}

function screenToWorld(x, y) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    return {
        x: (x - width / 2) / camera.zoom + camera.x,
        y: (y - height / 2) / camera.zoom + camera.y
    };
}

function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    drawGrid();
    drawRooms();
    drawConnections();

    if (game) {
        drawPlayers();
    }
}

function drawGrid() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const gridSize = 50 * camera.zoom;

    const offsetX =
        ((-camera.x * camera.zoom + width / 2) % gridSize + gridSize)
        % gridSize;

    const offsetY =
        ((-camera.y * camera.zoom + height / 2) % gridSize + gridSize)
        % gridSize;

    ctx.strokeStyle = "#151820";
    ctx.lineWidth = 1;

    for (
        let x = offsetX;
        x < width;
        x += gridSize
    ) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (
        let y = offsetY;
        y < height;
        y += gridSize
    ) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function drawConnections() {
    const connections = [
        ["Cafeteria", "MedBay"],
        ["Cafeteria", "Security"],
        ["Cafeteria", "Storage"],
        ["Storage", "Electrical"],
        ["Storage", "Admin"],
        ["Storage", "Reactor"],
        ["Security", "Navigation"],
        ["Navigation", "Reactor"]
    ];

    ctx.lineWidth = Math.max(2, 10 * camera.zoom);
    ctx.strokeStyle = "#242934";

    for (const [a, b] of connections) {
        const roomA = ROOMS[a];
        const roomB = ROOMS[b];

        const p1 = worldToScreen(roomA.x, roomA.y);
        const p2 = worldToScreen(roomB.x, roomB.y);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
}

function drawRooms() {
    for (const [name, room] of Object.entries(ROOMS)) {
        const position = worldToScreen(room.x, room.y);

        const width = room.width * camera.zoom;
        const height = room.height * camera.zoom;

        const x = position.x - width / 2;
        const y = position.y - height / 2;

        ctx.fillStyle = "#191c24";
        ctx.strokeStyle = "#3a404d";
        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.roundRect(
            x,
            y,
            width,
            height,
            12 * camera.zoom
        );

        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#737987";

        ctx.font =
            `${Math.max(10, 14 * camera.zoom)}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            name,
            position.x,
            position.y
        );
    }
}

function drawPlayers() {
    for (const player of game.players) {
        const position = worldToScreen(
            player.x,
            player.y
        );

        const radius =
            Math.max(7, 12 * camera.zoom);

        ctx.globalAlpha = player.alive ? 1 : 0.25;

        ctx.fillStyle = player.color;

        ctx.beginPath();
        ctx.arc(
            position.x,
            position.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, 2 * camera.zoom);
        ctx.stroke();

        ctx.globalAlpha = 1;

        const fontSize =
            Math.max(9, 12 * camera.zoom);

        ctx.font =
            `bold ${fontSize}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillStyle = "#ffffff";

        ctx.fillText(
            player.name,
            position.x,
            position.y - radius - 5
        );

        if (!player.alive) {
            ctx.font =
                `${Math.max(10, 16 * camera.zoom)}px Arial`;

            ctx.fillText(
                "☠",
                position.x,
                position.y + radius + 16
            );
        }
    }
}

function renderSidebar() {
    if (!game) {
        return;
    }

    statusElement.textContent =
        `Round ${game.round} · ${game.phase}`;

    gameInfoElement.innerHTML = `
        <div>Phase: ${game.phase}</div>
        <div>Round: ${game.round}</div>
        <div>Players: ${game.players.length}</div>
        <div>Alive: ${game.players.filter(p => p.alive).length}</div>
        ${
            game.winner
                ? `<div>Winner: ${game.winner}</div>`
                : ""
        }
    `;

    crewElement.innerHTML = "";

    for (const player of game.players) {
        const card = document.createElement("div");

        card.className =
            `crew-card ${player.alive ? "" : "dead"}`;

        card.innerHTML = `
            <div
                class="crew-icon"
                style="background:${player.color}"
            ></div>

            <div>
                <div class="crew-name">
                    ${escapeHtml(player.name)}
                </div>

                <div
                    style="
                        color:#737987;
                        font-size:10px;
                    "
                >
                    ${escapeHtml(player.personality)}
                </div>
            </div>

            <div class="crew-details">
                ${escapeHtml(player.room)}
            </div>
        `;

        crewElement.appendChild(card);
    }

    eventsElement.innerHTML = "";

    for (const event of game.events.slice(0, 20)) {
        const element = document.createElement("div");

        element.className = "event";

        element.textContent = event.message;

        eventsElement.appendChild(element);
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function loadGame() {
    try {
        const response = await fetch("/api/game");

        if (!response.ok) {
            throw new Error("Game request failed");
        }

        game = await response.json();

        renderSidebar();
        draw();
    } catch (error) {
        console.error(error);

        statusElement.textContent =
            "Server connection failed.";
    }
}

newGameButton.addEventListener("click", async () => {
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
            throw new Error("Could not start game");
        }

        const data = await response.json();

        game = data.game;

        camera.x = 500;
        camera.y = 300;
        camera.zoom = 1;

        renderSidebar();
        draw();
    } catch (error) {
        console.error(error);
    }

    newGameButton.disabled = false;
});

canvas.addEventListener("pointerdown", event => {
    dragging = true;

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    canvas.classList.add("dragging");

    canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
    if (!dragging) {
        return;
    }

    const dx = event.clientX - lastMouseX;
    const dy = event.clientY - lastMouseY;

    camera.x -= dx / camera.zoom;
    camera.y -= dy / camera.zoom;

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    draw();
});

canvas.addEventListener("pointerup", event => {
    dragging = false;

    canvas.classList.remove("dragging");

    canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointercancel", () => {
    dragging = false;

    canvas.classList.remove("dragging");
});

canvas.addEventListener("wheel", event => {
    event.preventDefault();

    const mouseX = event.offsetX;
    const mouseY = event.offsetY;

    const before = screenToWorld(
        mouseX,
        mouseY
    );

    const zoomFactor =
        event.deltaY < 0 ? 1.1 : 0.9;

    camera.zoom *= zoomFactor;

    camera.zoom = Math.max(
        0.45,
        Math.min(2.5, camera.zoom)
    );

    const after = screenToWorld(
        mouseX,
        mouseY
    );

    camera.x += before.x - after.x;
    camera.y += before.y - after.y;

    draw();
}, { passive: false });

loadGame();

setInterval(loadGame, 500);

resizeCanvas();
