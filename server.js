const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const NAME_POOL = [
    "Bob", "Alice", "Dave", "Terry", "Max",
    "Luna", "Sam", "Alex", "Charlie", "Jack",
    "Milo", "Nova", "Finn", "Ruby", "Kai",
    "Nina", "Leo", "Zoe", "Oscar", "Mia",
    "Ben", "Ivy", "Theo", "Lily", "Ash",
    "Coco", "Felix", "Sophie", "Jake", "Piper"
];

const PERSONALITIES = [
    "paranoid",
    "calm",
    "aggressive",
    "chaotic",
    "logical",
    "friendly",
    "quiet",
    "suspicious",
    "confident",
    "confused",
    "sarcastic",
    "curious",
    "cowardly",
    "brave",
    "dramatic"
];

const COLORS = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f1c40f",
    "#9b59b6",
    "#e67e22",
    "#1abc9c",
    "#e91e63",
    "#95a5a6",
    "#8e44ad"
];

const ROOMS = {
    Cafeteria: { x: 500, y: 300 },
    MedBay: { x: 250, y: 150 },
    Electrical: { x: 150, y: 450 },
    Storage: { x: 350, y: 500 },
    Security: { x: 700, y: 150 },
    Reactor: { x: 850, y: 450 },
    Navigation: { x: 850, y: 250 },
    Admin: { x: 500, y: 500 }
};

const TASKS = [
    "Fix wiring",
    "Download data",
    "Empty garbage",
    "Calibrate reactor",
    "Inspect samples",
    "Upload data",
    "Clean filters",
    "Align engine",
    "Start reactor",
    "Scan card"
];

let game = null;
let gameLoop = null;

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function createGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
    }

    const names = shuffle(NAME_POOL).slice(0, 10);
    const personalities = shuffle(PERSONALITIES).slice(0, 10);

    const impostorIndex = Math.floor(Math.random() * 10);

    const players = names.map((name, index) => {
        const suspicion = {};

        for (const other of names) {
            if (other !== name) {
                suspicion[other] = 0;
            }
        }

        const room = "Cafeteria";

        return {
            id: crypto.randomUUID(),

            name,
            color: COLORS[index],
            personality: personalities[index],

            role: index === impostorIndex
                ? "impostor"
                : "crewmate",

            alive: true,

            x: ROOMS[room].x + Math.random() * 40 - 20,
            y: ROOMS[room].y + Math.random() * 40 - 20,

            room,

            targetRoom: null,
            targetX: null,
            targetY: null,

            currentTask: null,
            tasksCompleted: 0,
            tasksTotal: 3,

            memory: [],
            suspicion,

            action: "Standing around"
        };
    });

    game = {
        id: crypto.randomUUID(),
        phase: "playing",
        round: 1,
        winner: null,
        players,
        bodies: [],
        events: []
    };

    addEvent("The game has started.");

    for (const player of players) {
        chooseNextAction(player);
    }

    gameLoop = setInterval(updateGame, 1000);

    console.log("New game:", game.id);
    console.log(
        "Impostor:",
        players.find(player => player.role === "impostor").name
    );
}

function chooseNextAction(player) {
    if (!player.alive) {
        return;
    }

    const roomNames = Object.keys(ROOMS);

    player.targetRoom = randomItem(roomNames);

    const target = ROOMS[player.targetRoom];

    player.targetX = target.x + Math.random() * 60 - 30;
    player.targetY = target.y + Math.random() * 60 - 30;

    if (player.role === "impostor") {
        const actions = [
            "Pretending to do a task",
            "Looking for someone alone",
            "Moving suspiciously",
            "Pretending to inspect something"
        ];

        player.action = randomItem(actions);
    } else {
        player.currentTask = randomItem(TASKS);
        player.action = `Doing: ${player.currentTask}`;
    }
}

function updateGame() {
    if (!game || game.phase !== "playing") {
        return;
    }

    for (const player of game.players) {
        if (!player.alive) {
            continue;
        }

        movePlayer(player);

        if (
            player.targetRoom &&
            distance(
                player.x,
                player.y,
                player.targetX,
                player.targetY
            ) < 10
        ) {
            player.room = player.targetRoom;

            if (
                player.role === "crewmate" &&
                Math.random() < 0.35 &&
                player.tasksCompleted < player.tasksTotal
            ) {
                player.tasksCompleted++;

                addEvent(
                    `${player.name} completed a task.`
                );
            }

            chooseNextAction(player);
        }
    }

    game.round++;

    checkWinCondition();
}

function movePlayer(player) {
    if (
        player.targetX === null ||
        player.targetY === null
    ) {
        chooseNextAction(player);
        return;
    }

    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;

    const distanceToTarget = Math.sqrt(
        dx * dx + dy * dy
    );

    if (distanceToTarget < 1) {
        return;
    }

    const speed = 3;

    player.x += (dx / distanceToTarget) * speed;
    player.y += (dy / distanceToTarget) * speed;
}

function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
}

function addEvent(message) {
    if (!game) {
        return;
    }

    game.events.unshift({
        id: crypto.randomUUID(),
        message,
        time: Date.now()
    });

    game.events = game.events.slice(0, 50);
}

function checkWinCondition() {
    const aliveCrew = game.players.filter(
        player =>
            player.alive &&
            player.role === "crewmate"
    );

    const aliveImpostors = game.players.filter(
        player =>
            player.alive &&
            player.role === "impostor"
    );

    if (aliveImpostors.length === 0) {
        game.phase = "ended";
        game.winner = "crewmates";

        addEvent("The Crewmates win!");

        clearInterval(gameLoop);
        gameLoop = null;

        return;
    }

    if (aliveImpostors.length >= aliveCrew.length) {
        game.phase = "ended";
        game.winner = "impostors";

        addEvent("The Impostor wins!");

        clearInterval(gameLoop);
        gameLoop = null;
    }
}

function publicGameState() {
    return {
        id: game.id,
        phase: game.phase,
        round: game.round,
        winner: game.winner,

        players: game.players.map(player => ({
            id: player.id,
            name: player.name,
            color: player.color,
            personality: player.personality,

            alive: player.alive,

            x: player.x,
            y: player.y,
            room: player.room,

            currentTask: player.currentTask,
            tasksCompleted: player.tasksCompleted,
            tasksTotal: player.tasksTotal,

            action: player.action
        })),

        bodies: game.bodies,

        events: game.events
    };
}

app.get("/api/status", (req, res) => {
    res.json({
        status: "online",
        game: "AI Among Us"
    });
});

app.get("/api/game", (req, res) => {
    res.json(publicGameState());
});

app.post("/api/game/new", (req, res) => {
    createGame();

    res.json({
        success: true,
        game: publicGameState()
    });
});

createGame();

app.listen(PORT, () => {
    console.log(
        `AI Among Us running on port ${PORT}`
    );
});
