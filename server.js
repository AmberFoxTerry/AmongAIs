const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// ============================================================
// GAME SETTINGS
// ============================================================

const PLAYER_COUNT = 10;
const IMPOSTOR_COUNT = 2;

// Among Us default movement speed is approximately
// 2.5 game-units/sec at 1.0x speed.
// Our map uses 60 x 40 game units.
const PLAYER_SPEED = 2.5;

const KILL_COOLDOWN = 30;
const KILL_DISTANCE = 1.15;

const TASK_TIME = 5;

const DISCUSSION_TIME = 25;
const VOTING_TIME = 20;

const EMERGENCY_COOLDOWN = 20;

const TICK_MS = 100;

const names = [
    "Bob",
    "Alice",
    "Dave",
    "Terry",
    "Max",
    "Luna",
    "Sam",
    "Alex",
    "Charlie",
    "Jack",
    "Milo",
    "Nova",
    "Finn",
    "Ruby",
    "Kai",
    "Nina",
    "Leo",
    "Zoe",
    "Oscar",
    "Mia",
    "Ben",
    "Ivy",
    "Theo",
    "Lily",
    "Ash",
    "Coco",
    "Felix",
    "Sophie",
    "Jake",
    "Piper"
];

const personalities = [
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

const colors = [
    "#c72f2f",
    "#3b82c4",
    "#4aa564",
    "#c87527",
    "#8f4cc2",
    "#d99b25",
    "#45a8a1",
    "#b83c91",
    "#6e7680",
    "#ffffff"
];

// ============================================================
// THE SKELD
// 60 x 40 coordinate system
// ============================================================

const WORLD = {
    width: 60,
    height: 40
};

// Rooms are intentionally rectangular collision regions.
// Corridors connect their entrances.
//
// Layout:
//
//                  UPPER ENGINE     CAFETERIA      WEAPONS
//                       |                |             |
//                    MEDBAY             |             |
//                       |                |          NAVIGATION
//                    SECURITY            |             |
//                       |                |             |
//                  ELECTRICAL         STORAGE          O2
//                       |                |             |
//                    LOWER ENGINE      ADMIN         SHIELDS
//                       |                |
//                    REACTOR       COMMUNICATIONS
//

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

// ============================================================
// WALKABLE MAP
// ============================================================

const walkableRects = [
    // Rooms
    ...Object.values(rooms).map(r => ({
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h
    })),

    // Main corridors

    // Upper Engine -> MedBay
    {
        x: 10,
        y: 8,
        w: 5,
        h: 2
    },

    // MedBay -> Security
    {
        x: 14,
        y: 11,
        w: 2,
        h: 4
    },

    // Security -> Cafeteria
    {
        x: 16,
        y: 12,
        w: 4,
        h: 2
    },

    // Cafeteria -> Weapons
    {
        x: 29,
        y: 6,
        w: 4,
        h: 2
    },

    // Cafeteria -> Admin
    {
        x: 27,
        y: 22,
        w: 2,
        h: 3
    },

    // Cafeteria -> Storage
    {
        x: 19,
        y: 22,
        w: 3,
        h: 4
    },

    // Storage -> Electrical
    {
        x: 18,
        y: 20,
        w: 3,
        h: 4
    },

    // Storage -> Lower Engine
    {
        x: 8,
        y: 27,
        w: 5,
        h: 2
    },

    // Lower Engine -> Reactor
    {
        x: 6,
        y: 21,
        w: 2,
        h: 5
    },

    // Reactor -> Security/Electrical corridor
    {
        x: 8,
        y: 15,
        w: 5,
        h: 2
    },

    // Admin -> Communications
    {
        x: 27,
        y: 25,
        w: 2,
        h: 4
    },

    // Admin -> O2
    {
        x: 30,
        y: 21,
        w: 5,
        h: 2
    },

    // O2 -> Navigation
    {
        x: 37,
        y: 15,
        w: 3,
        h: 7
    },

    // Navigation -> Weapons
    {
        x: 34,
        y: 7,
        w: 3,
        h: 5
    },

    // O2 -> Shields
    {
        x: 37,
        y: 24,
        w: 3,
        h: 4
    },

    // Communications -> Shields
    {
        x: 28,
        y: 29,
        w: 6,
        h: 2
    }
];

// ============================================================
// TASKS
// ============================================================

const taskDefinitions = [
    {
        id: "cafeteria_garbage",
        name: "Empty Garbage",
        room: "Cafeteria",
        x: 19,
        y: 15
    },

    {
        id: "cafeteria_download",
        name: "Download Data",
        room: "Cafeteria",
        x: 28,
        y: 16
    },

    {
        id: "cafeteria_wires",
        name: "Fix Wiring",
        room: "Cafeteria",
        x: 28,
        y: 20
    },

    {
        id: "weapons_asteroids",
        name: "Clear Asteroids",
        room: "Weapons",
        x: 31,
        y: 4
    },

    {
        id: "weapons_download",
        name: "Download Data",
        room: "Weapons",
        x: 27,
        y: 5
    },

    {
        id: "navigation_chart",
        name: "Chart Course",
        room: "Navigation",
        x: 32,
        y: 12
    },

    {
        id: "navigation_steering",
        name: "Stabilize Steering",
        room: "Navigation",
        x: 36,
        y: 15
    },

    {
        id: "navigation_upload",
        name: "Upload Data",
        room: "Navigation",
        x: 32,
        y: 16
    },

    {
        id: "navigation_wires",
        name: "Fix Wiring",
        room: "Navigation",
        x: 37,
        y: 11
    },

    {
        id: "o2_filter",
        name: "Clean O2 Filter",
        room: "O2",
        x: 37,
        y: 22
    },

    {
        id: "o2_garbage",
        name: "Empty Chute",
        room: "O2",
        x: 39,
        y: 25
    },

    {
        id: "shields_prime",
        name: "Prime Shields",
        room: "Shields",
        x: 35,
        y: 30
    },

    {
        id: "communications_download",
        name: "Download Data",
        room: "Communications",
        x: 24,
        y: 29
    },

    {
        id: "communications_fix",
        name: "Fix Communications",
        room: "Communications",
        x: 26,
        y: 30
    },

    {
        id: "storage_fuel",
        name: "Fuel Engines",
        room: "Storage",
        x: 16,
        y: 26
    },

    {
        id: "storage_wires",
        name: "Fix Wiring",
        room: "Storage",
        x: 19,
        y: 28
    },

    {
        id: "admin_card",
        name: "Swipe Card",
        room: "Admin",
        x: 26,
        y: 18
    },

    {
        id: "admin_upload",
        name: "Upload Data",
        room: "Admin",
        x: 28,
        y: 20
    },

    {
        id: "electrical_power",
        name: "Divert Power",
        room: "Electrical",
        x: 17,
        y: 19
    },

    {
        id: "electrical_wires",
        name: "Fix Wiring",
        room: "Electrical",
        x: 15,
        y: 21
    },

    {
        id: "electrical_calibrate",
        name: "Calibrate Distributor",
        room: "Electrical",
        x: 19,
        y: 18
    },

    {
        id: "lower_engine_align",
        name: "Align Engine Output",
        room: "LowerEngine",
        x: 6,
        y: 28
    },

    {
        id: "lower_engine_fuel",
        name: "Fuel Engines",
        room: "LowerEngine",
        x: 8,
        y: 30
    },

    {
        id: "upper_engine_align",
        name: "Align Engine Output",
        room: "UpperEngine",
        x: 6,
        y: 6
    },

    {
        id: "upper_engine_fuel",
        name: "Fuel Engines",
        room: "UpperEngine",
        x: 8,
        y: 8
    },

    {
        id: "security_power",
        name: "Accept Diverted Power",
        room: "Security",
        x: 13,
        y: 13
    },

    {
        id: "security_wires",
        name: "Fix Wiring",
        room: "Security",
        x: 15,
        y: 14
    },

    {
        id: "reactor_start",
        name: "Start Reactor",
        room: "Reactor",
        x: 5,
        y: 16
    },

    {
        id: "reactor_manifolds",
        name: "Unlock Manifolds",
        room: "Reactor",
        x: 8,
        y: 18
    },

    {
        id: "medbay_scan",
        name: "Submit Scan",
        room: "MedBay",
        x: 19,
        y: 10
    },

    {
        id: "medbay_sample",
        name: "Inspect Sample",
        room: "MedBay",
        x: 17,
        y: 9
    }
];

// ============================================================
// GAME STATE
// ============================================================

let game = null;
let gameLoop = null;

// ============================================================
// HELPERS
// ============================================================

function random(array) {
    return array[
        Math.floor(Math.random() * array.length)
    ];
}

function randomFloat(min, max) {
    return min + Math.random() * (max - min);
}

function distance(a, b) {
    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function shuffle(array) {
    return [...array].sort(
        () => Math.random() - 0.5
    );
}

function getRoomAt(x, y) {

    for (const room of Object.values(rooms)) {

        if (
            x >= room.x &&
            x <= room.x + room.w &&
            y >= room.y &&
            y <= room.y + room.h
        ) {
            return room.name;
        }
    }

    return "Hallway";
}

// ============================================================
// COLLISION
// ============================================================

function pointWalkable(x, y, radius = 0.22) {

    if (
        x < 0 ||
        y < 0 ||
        x > WORLD.width ||
        y > WORLD.height
    ) {
        return false;
    }

    const testPoints = [
        [x, y],
        [x + radius, y],
        [x - radius, y],
        [x, y + radius],
        [x, y - radius],
        [x + radius, y + radius],
        [x - radius, y - radius],
        [x + radius, y - radius],
        [x - radius, y + radius]
    ];

    return testPoints.every(([px, py]) => {

        return walkableRects.some(rect => {

            return (
                px >= rect.x &&
                px <= rect.x + rect.w &&
                py >= rect.y &&
                py <= rect.y + rect.h
            );
        });
    });
}

function movePlayer(player, dx, dy) {

    const nextX = player.x + dx;
    const nextY = player.y + dy;

    // Full movement
    if (pointWalkable(nextX, nextY)) {

        player.x = nextX;
        player.y = nextY;

        return;
    }

    // Slide horizontally
    if (pointWalkable(nextX, player.y)) {
        player.x = nextX;
    }

    // Slide vertically
    if (pointWalkable(player.x, nextY)) {
        player.y = nextY;
    }
}

// ============================================================
// SIMPLE PATHFINDING
// ============================================================

function nearestWalkablePoint(x, y) {

    if (pointWalkable(x, y)) {
        return { x, y };
    }

    for (let radius = 0.25; radius <= 5; radius += 0.25) {

        const attempts = 24;

        for (let i = 0; i < attempts; i++) {

            const angle =
                Math.random() * Math.PI * 2;

            const px =
                x + Math.cos(angle) * radius;

            const py =
                y + Math.sin(angle) * radius;

            if (pointWalkable(px, py)) {
                return {
                    x: px,
                    y: py
                };
            }
        }
    }

    return {
        x,
        y
    };
}

function buildPath(startX, startY, targetX, targetY) {

    const start = nearestWalkablePoint(
        startX,
        startY
    );

    const target = nearestWalkablePoint(
        targetX,
        targetY
    );

    const step = 0.5;

    const startNode = {
        x: Math.round(start.x / step),
        y: Math.round(start.y / step)
    };

    const targetNode = {
        x: Math.round(target.x / step),
        y: Math.round(target.y / step)
    };

    const key = (x, y) => `${x},${y}`;

    const open = [startNode];

    const cameFrom = new Map();

    const gScore = new Map();

    const fScore = new Map();

    gScore.set(
        key(startNode.x, startNode.y),
        0
    );

    fScore.set(
        key(startNode.x, startNode.y),
        heuristic(
            startNode,
            targetNode
        )
    );

    const maxIterations = 5000;

    let iterations = 0;

    while (
        open.length &&
        iterations < maxIterations
    ) {

        iterations++;

        let bestIndex = 0;

        for (let i = 1; i < open.length; i++) {

            const a =
                fScore.get(
                    key(
                        open[i].x,
                        open[i].y
                    )
                ) ?? Infinity;

            const b =
                fScore.get(
                    key(
                        open[bestIndex].x,
                        open[bestIndex].y
                    )
                ) ?? Infinity;

            if (a < b) {
                bestIndex = i;
            }
        }

        const current =
            open.splice(bestIndex, 1)[0];

        if (
            current.x === targetNode.x &&
            current.y === targetNode.y
        ) {

            return reconstructPath(
                cameFrom,
                current,
                step
            );
        }

        const neighbors = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [-1, -1],
            [1, -1],
            [-1, 1]
        ];

        for (const [dx, dy] of neighbors) {

            const nx = current.x + dx;
            const ny = current.y + dy;

            const wx = nx * step;
            const wy = ny * step;

            if (!pointWalkable(wx, wy)) {
                continue;
            }

            // Prevent diagonal corner cutting.
            if (
                dx !== 0 &&
                dy !== 0 &&
                (
                    !pointWalkable(
                        current.x * step + dx * step,
                        current.y * step
                    ) ||
                    !pointWalkable(
                        current.x * step,
                        current.y * step + dy * step
                    )
                )
            ) {
                continue;
            }

            const currentKey =
                key(current.x, current.y);

            const neighborKey =
                key(nx, ny);

            const currentG =
                gScore.get(currentKey) ?? Infinity;

            const movementCost =
                dx !== 0 && dy !== 0
                    ? 1.414
                    : 1;

            const tentative =
                currentG + movementCost;

            if (
                tentative <
                (gScore.get(neighborKey) ?? Infinity)
            ) {

                cameFrom.set(
                    neighborKey,
                    currentKey
                );

                gScore.set(
                    neighborKey,
                    tentative
                );

                fScore.set(
                    neighborKey,
                    tentative +
                    heuristic(
                        {
                            x: nx,
                            y: ny
                        },
                        targetNode
                    )
                );

                if (
                    !open.some(
                        node =>
                            node.x === nx &&
                            node.y === ny
                    )
                ) {
                    open.push({
                        x: nx,
                        y: ny
                    });
                }
            }
        }
    }

    return [
        {
            x: target.x,
            y: target.y
        }
    ];
}

function heuristic(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}

function reconstructPath(
    cameFrom,
    current,
    step
) {

    const path = [];

    let currentKey =
        `${current.x},${current.y}`;

    while (currentKey) {

        const [x, y] =
            currentKey
                .split(",")
                .map(Number);

        path.unshift({
            x: x * step,
            y: y * step
        });

        currentKey =
            cameFrom.get(currentKey);
    }

    return path;
}

// ============================================================
// TARGETING
// ============================================================

function setTarget(player, x, y) {

    const target =
        nearestWalkablePoint(x, y);

    player.target = {
        x: target.x,
        y: target.y
    };

    player.path =
        buildPath(
            player.x,
            player.y,
            target.x,
            target.y
        );

    player.pathIndex = 0;
}

function setTargetRoom(player, roomName) {

    const room = rooms[roomName];

    if (!room) {
        return;
    }

    const x =
        room.x +
        randomFloat(1, room.w - 1);

    const y =
        room.y +
        randomFloat(1, room.h - 1);

    setTarget(
        player,
        x,
        y
    );
}

// ============================================================
// CHAT
// ============================================================

function say(player, text) {

    if (!text) {
        return;
    }

    game.chat.push({
        id: crypto.randomUUID(),
        playerId: player.id,
        name: player.name,
        color: player.color,
        text,
        time: Date.now()
    });

    if (game.chat.length > 80) {
        game.chat.shift();
    }
}

function randomAlivePlayer(excludeId) {

    const alive =
        game.players.filter(
            p =>
                p.alive &&
                p.id !== excludeId
        );

    return random(alive);
}

// ============================================================
// AI PERSONALITY
// ============================================================

function personalitySpeech(player) {

    switch (player.personality) {

        case "paranoid":
            return [
                "I don't trust anyone.",
                "Someone is acting weird.",
                "Why is everyone splitting up?",
                "I think someone is following me."
            ];

        case "calm":
            return [
                "Let's just finish tasks.",
                "Nothing suspicious so far.",
                "We should look at the evidence.",
                "Let's not rush the vote."
            ];

        case "aggressive":
            return [
                "WHO WAS THERE?",
                "That looks suspicious.",
                "I'm voting someone.",
                "Stop wasting time."
            ];

        case "logical":
            return [
                "Let's reconstruct the timeline.",
                "Where was everyone?",
                "We need actual evidence.",
                "Who could have reached the body?"
            ];

        case "chaotic":
            return [
                "LOL WHAT JUST HAPPENED",
                "I HAVE NO IDEA",
                "EVERYONE SUS",
                "this ship is doomed"
            ];

        case "friendly":
            return [
                "Let's stick together!",
                "I was doing tasks.",
                "Anyone want to group up?",
                "We can figure this out."
            ];

        case "quiet":
            return [
                "I was in a task.",
                "Nothing happened.",
                "I don't know.",
                "I was alone."
            ];

        case "suspicious":
            return [
                "I saw someone near there.",
                "That timing is suspicious.",
                "I have a bad feeling about this.",
                "We should watch them."
            ];

        case "confident":
            return [
                "I know where I was.",
                "My route makes sense.",
                "I'm fairly sure who did it.",
                "Trust me on this."
            ];

        case "confused":
            return [
                "Wait, where was I?",
                "I literally just got here.",
                "What happened?",
                "I don't understand."
            ];

        case "sarcastic":
            return [
                "Great. Another dead body.",
                "Yeah, that's totally normal.",
                "Very convincing.",
                "Amazing detective work."
            ];

        case "curious":
            return [
                "Who found the body?",
                "Where exactly was it?",
                "What were you doing?",
                "Who was nearby?"
            ];

        case "cowardly":
            return [
                "I was nowhere near that.",
                "I'm staying with people.",
                "I don't want to die.",
                "Someone please protect me."
            ];

        case "brave":
            return [
                "I'll check the area.",
                "I saw someone suspicious.",
                "We need to act.",
                "I'll go with someone."
            ];

        case "dramatic":
            return [
                "WE ARE ALL GOING TO DIE.",
                "THE IMPOSTOR IS AMONG US.",
                "THIS IS A DISASTER.",
                "I KNEW THIS WOULD HAPPEN."
            ];

        default:
            return [
                "I was doing tasks."
            ];
    }
}

// ============================================================
// SUSPICION
// ============================================================

function addSuspicion(observer, targetId, amount) {

    if (
        !observer.suspicion ||
        !observer.suspicion[targetId]
    ) {
        return;
    }

    observer.suspicion[targetId] =
        clamp(
            observer.suspicion[targetId] + amount,
            0,
            100
        );
}

function updateSuspicionFromSight(observer) {

    if (!observer.alive) {
        return;
    }

    for (const other of game.players) {

        if (
            !other.alive ||
            other.id === observer.id
        ) {
            continue;
        }

        const d =
            distance(
                observer,
                other
            );

        if (d < 2.5) {

            if (
                other.lastRoom &&
                observer.lastRoom &&
                other.lastRoom !== observer.lastRoom
            ) {
                addSuspicion(
                    observer,
                    other.id,
                    0.05
                );
            }
        }
    }
}

// ============================================================
// TASKS
// ============================================================

function assignTasks(player) {

    const shuffled =
        shuffle(taskDefinitions);

    player.tasks =
        shuffled
            .slice(0, 3)
            .map(task => ({
                id: task.id,
                name: task.name,
                room: task.room,
                x: task.x,
                y: task.y,
                completed: false
            }));
}

function startTask(player, task) {

    player.currentTask = task;

    player.state = "doing_task";

    player.taskStartedAt = Date.now();

    player.action =
        `Doing ${task.name}`;
}

function finishTask(player) {

    if (!player.currentTask) {
        return;
    }

    player.currentTask.completed = true;

    player.tasksCompleted++;

    player.currentTask = null;

    player.taskStartedAt = null;

    if (
        player.tasksCompleted >=
        player.tasksTotal
    ) {

        player.action =
            "Finished all tasks";

    } else {

        player.action =
            "Looking for a task";
    }
}

// ============================================================
// IMPOSTOR
// ============================================================

function canKill(impostor) {

    return (
        impostor.alive &&
        impostor.role === "impostor" &&
        impostor.killCooldown <= 0 &&
        game.phase === "playing"
    );
}

function findKillTarget(impostor) {

    const candidates =
        game.players.filter(
            p =>
                p.alive &&
                p.id !== impostor.id &&
                distance(impostor, p) <=
                    KILL_DISTANCE
        );

    if (!candidates.length) {
        return null;
    }

    // Prefer players with lower suspicion
    // toward this impostor.
    candidates.sort(
        (a, b) => {

            const aSuspicion =
                a.suspicion?.[impostor.id] ?? 0;

            const bSuspicion =
                b.suspicion?.[impostor.id] ?? 0;

            return aSuspicion - bSuspicion;
        }
    );

    return candidates[0];
}

function kill(impostor, victim) {

    victim.alive = false;

    victim.state = "dead";

    victim.action = "Dead";

    victim.target = null;

    victim.path = [];

    victim.currentTask = null;

    victim.deathTime = Date.now();

    game.bodies.push({
        id: crypto.randomUUID(),
        victimId: victim.id,
        x: victim.x,
        y: victim.y,
        room: getRoomAt(
            victim.x,
            victim.y
        )
    });

    impostor.killCooldown =
        KILL_COOLDOWN;

    impostor.action =
        "Killed someone";

    game.events.push({
        type: "kill",
        text: `${victim.name} was killed.`
    });

    // Nearby witnesses gain suspicion.
    for (const observer of game.players) {

        if (
            !observer.alive ||
            observer.id === victim.id ||
            observer.id === impostor.id
        ) {
            continue;
        }

        const d =
            distance(
                observer,
                victim
            );

        if (d < 4) {

            addSuspicion(
                observer,
                impostor.id,
                20
            );

            say(
                observer,
                `I saw ${impostor.name} near ${victim.name}.`
            );
        }
    }
}

// ============================================================
// REPORT
// ============================================================

function findReportableBody(player) {

    let closest = null;
    let closestDistance = Infinity;

    for (const body of game.bodies) {

        const d =
            Math.hypot(
                player.x - body.x,
                player.y - body.y
            );

        if (
            d < 1.6 &&
            d < closestDistance
        ) {
            closest = body;
            closestDistance = d;
        }
    }

    return closest;
}

function reportBody(player, body) {

    if (
        game.phase !== "playing" ||
        !body
    ) {
        return;
    }

    const victim =
        game.players.find(
            p => p.id === body.victimId
        );

    game.lastMeeting = {
        type: "report",
        callerId: player.id,
        callerName: player.name,
        victimId: body.victimId,
        victimName: victim?.name || "Unknown"
    };

    say(
        player,
        `I found ${victim?.name || "a body"}!`
    );

    startMeeting();
}

// ============================================================
// EMERGENCY
// ============================================================

function canEmergency(player) {

    return (
        game.phase === "playing" &&
        player.alive &&
        !game.emergencyUsed[player.id] &&
        game.emergencyCooldown <= 0
    );
}

function callEmergency(player) {

    if (!canEmergency(player)) {
        return false;
    }

    game.emergencyUsed[player.id] = true;

    game.emergencyCooldown =
        EMERGENCY_COOLDOWN;

    game.lastMeeting = {
        type: "emergency",
        callerId: player.id,
        callerName: player.name
    };

    say(
        player,
        "Emergency meeting!"
    );

    startMeeting();

    return true;
}

// ============================================================
// MEETINGS
// ============================================================

function startMeeting() {

    if (game.phase !== "playing") {
        return;
    }

    game.phase = "discussion";

    game.meetingTimer =
        DISCUSSION_TIME;

    game.votes = {};

    // Everyone goes back to Cafeteria.
    for (const player of game.players) {

        if (!player.alive) {
            continue;
        }

        const angle =
            Math.random() * Math.PI * 2;

        const radius =
            randomFloat(1.7, 3.0);

        player.x =
            24 +
            Math.cos(angle) * radius;

        player.y =
            18.5 +
            Math.sin(angle) * radius;

        player.state = "meeting";

        player.target = null;
        player.path = [];

        player.currentTask = null;

        player.action =
            "Discussing";
    }

    game.events.push({
        type: "meeting",
        text: "Emergency meeting called."
    });

    // Dead bodies disappear during meetings.
    game.bodies = [];

    scheduleMeetingChat();
}

function scheduleMeetingChat() {

    const alive =
        game.players.filter(
            p => p.alive
        );

    for (const player of alive) {

        const delay =
            1500 +
            Math.random() * 8000;

        setTimeout(() => {

            if (
                !game ||
                game.phase !== "discussion" ||
                !player.alive
            ) {
                return;
            }

            let message;

            const suspicious =
                getMostSuspicious(
                    player
                );

            if (
                suspicious &&
                Math.random() < 0.65
            ) {

                message =
                    `${suspicious.name} seems suspicious.`;
            } else {

                message =
                    random(
                        personalitySpeech(player)
                    );
            }

            say(
                player,
                message
            );

        }, delay);
    }
}

function getMostSuspicious(player) {

    let best = null;
    let bestValue = 0;

    for (const other of game.players) {

        if (
            !other.alive ||
            other.id === player.id
        ) {
            continue;
        }

        const value =
            player.suspicion?.[other.id] ?? 0;

        if (value > bestValue) {

            bestValue = value;
            best = other;
        }
    }

    return best;
}

function startVoting() {

    if (game.phase !== "discussion") {
        return;
    }

    game.phase = "voting";

    game.meetingTimer =
        VOTING_TIME;

    game.votes = {};

    for (const player of game.players) {

        if (!player.alive) {
            continue;
        }

        setTimeout(() => {

            if (
                game.phase !== "voting" ||
                !player.alive
            ) {
                return;
            }

            makeAIVote(player);

        }, randomFloat(500, 5000));
    }
}

function makeAIVote(player) {

    const candidates =
        game.players.filter(
            p =>
                p.alive &&
                p.id !== player.id
        );

    if (!candidates.length) {
        return;
    }

    let selected = null;
    let highest = -Infinity;

    for (const candidate of candidates) {

        let score =
            player.suspicion?.[candidate.id] ?? 0;

        // Impostors avoid voting their fellow impostor.
        if (
            player.role === "impostor" &&
            candidate.role === "impostor"
        ) {
            score -= 100;
        }

        // Paranoid players vote more aggressively.
        if (
            player.personality === "paranoid"
        ) {
            score += randomFloat(0, 15);
        }

        // Logical players rely more heavily on evidence.
        if (
            player.personality === "logical"
        ) {
            score *= 1.25;
        }

        // Confused players can randomly vote.
        if (
            player.personality === "confused" &&
            Math.random() < 0.35
        ) {
            score =
                randomFloat(0, 100);
        }

        if (score > highest) {

            highest = score;
            selected = candidate;
        }
    }

    if (
        selected &&
        highest >= 20
    ) {

        game.votes[player.id] =
            selected.id;

        say(
            player,
            `I vote ${selected.name}.`
        );

    } else {

        game.votes[player.id] =
            "skip";

        say(
            player,
            "I'm skipping."
        );
    }
}

function finishVoting() {

    if (game.phase !== "voting") {
        return;
    }

    const counts = {};

    let skipVotes = 0;

    for (const vote of Object.values(game.votes)) {

        if (vote === "skip") {
            skipVotes++;
            continue;
        }

        counts[vote] =
            (counts[vote] || 0) + 1;
    }

    let highest = 0;
    let winnerId = null;
    let tie = false;

    for (const [id, count] of Object.entries(counts)) {

        if (count > highest) {

            highest = count;
            winnerId = id;
            tie = false;

        } else if (
            count === highest &&
            count > 0
        ) {

            tie = true;
        }
    }

    if (
        !winnerId ||
        tie ||
        skipVotes >= highest
    ) {

        game.events.push({
            type: "vote",
            text: "No one was ejected."
        });

        for (const player of game.players) {

            if (player.alive) {
                player.action = "No one was ejected";
            }
        }

    } else {

        const ejected =
            game.players.find(
                p => p.id === winnerId
            );

        if (ejected) {

            ejected.alive = false;

            ejected.state = "dead";

            ejected.action =
                "Ejected";

            game.events.push({
                type: "vote",
                text: `${ejected.name} was ejected.`
            });

            say(
                ejected,
                ejected.role === "impostor"
                    ? "..."
                    : "Wait, what?!"
            );
        }
    }

    checkWinCondition();

    if (game.phase === "voting") {

        game.phase = "playing";

        game.meetingTimer = 0;

        for (const player of game.players) {

            if (!player.alive) {
                continue;
            }

            player.state = "moving";

            player.action =
                "Returning to tasks";

            chooseNextAction(player);
        }
    }
}

// ============================================================
// AI MOVEMENT / BEHAVIOUR
// ============================================================

function chooseNextAction(player) {

    if (
        !player.alive ||
        game.phase !== "playing"
    ) {
        return;
    }

    player.state = "moving";

    // IMPOSTOR
    if (player.role === "impostor") {

        const target =
            findKillTarget(player);

        if (
            target &&
            player.killCooldown <= 0 &&
            Math.random() < 0.55
        ) {

            player.behaviour =
                "hunt";

            player.action =
                `Following ${target.name}`;

            setTarget(
                player,
                target.x,
                target.y
            );

            return;
        }

        // Sometimes fake a task.
        const fakeTask =
            random(taskDefinitions);

        player.behaviour =
            "fake_task";

        player.action =
            `Pretending to do ${fakeTask.name}`;

        setTarget(
            player,
            fakeTask.x,
            fakeTask.y
        );

        return;
    }

    // CREWMATE
    const unfinished =
        player.tasks.filter(
            task => !task.completed
        );

    if (!unfinished.length) {

        player.action =
            "Wandering";

        const room =
            random(
                Object.keys(rooms)
            );

        setTargetRoom(
            player,
            room
        );

        return;
    }

    const task =
        random(unfinished);

    player.behaviour =
        "task";

    player.action =
        `Going to ${task.name}`;

    setTarget(
        player,
        task.x,
        task.y
    );
}

function updatePlayer(player, deltaSeconds) {

    if (
        !player.alive ||
        game.phase !== "playing"
    ) {
        return;
    }

    if (player.killCooldown > 0) {

        player.killCooldown =
            Math.max(
                0,
                player.killCooldown -
                    deltaSeconds
            );
    }

    updateSuspicionFromSight(player);

    // FOLLOWING TARGET
    if (
        player.behaviour === "hunt" &&
        player.target
    ) {

        const target =
            game.players.find(
                p =>
                    p.alive &&
                    p.id !== player.id &&
                    distance(player, p) <
                        15
            );

        if (target) {

            setTarget(
                player,
                target.x,
                target.y
            );
        }
    }

    // Move along path.
    if (
        player.path &&
        player.pathIndex <
            player.path.length
    ) {

        const next =
            player.path[player.pathIndex];

        const dx =
            next.x - player.x;

        const dy =
            next.y - player.y;

        const d =
            Math.hypot(dx, dy);

        if (d < 0.08) {

            player.pathIndex++;

        } else {

            const amount =
                Math.min(
                    PLAYER_SPEED *
                        deltaSeconds,
                    d
                );

            movePlayer(
                player,
                (dx / d) * amount,
                (dy / d) * amount
            );
        }
    }

    player.room =
        getRoomAt(
            player.x,
            player.y
        );

    if (
        player.room !== player.lastRoom
    ) {

        player.lastRoom =
            player.room;
    }

    // Arrived at target.
    if (
        player.target &&
        distance(
            player,
            player.target
        ) < 0.25
    ) {

        handleArrival(player);
    }

    // Kill attempt.
    if (
        player.role === "impostor" &&
        player.behaviour === "hunt"
    ) {

        const victim =
            findKillTarget(player);

        if (victim) {
            kill(
                player,
                victim
            );

            chooseNextAction(player);

            return;
        }
    }

    // Report body.
    const body =
        findReportableBody(player);

    if (
        body &&
        Math.random() < 0.004
    ) {

        reportBody(
            player,
            body
        );

        return;
    }

    // Random emergency call.
    if (
        player.room === "Cafeteria" &&
        Math.random() < 0.0008
    ) {

        callEmergency(player);
    }
}

function handleArrival(player) {

    player.target = null;
    player.path = [];
    player.pathIndex = 0;

    if (
        player.behaviour === "task" &&
        player.role === "crewmate"
    ) {

        const task =
            player.tasks.find(
                t =>
                    !t.completed &&
                    distance(
                        player,
                        t
                    ) < 1.5
            );

        if (task) {

            startTask(
                player,
                task
            );

            return;
        }
    }

    if (
        player.behaviour === "fake_task"
    ) {

        player.action =
            "Pretending to do a task";

        player.fakeTaskUntil =
            Date.now() +
            randomFloat(
                3000,
                8000
            );

        return;
    }

    chooseNextAction(player);
}

function updateTasks(player) {

    if (
        player.state !== "doing_task" ||
        !player.currentTask
    ) {
        return;
    }

    if (
        Date.now() -
        player.taskStartedAt >=
        TASK_TIME * 1000
    ) {

        finishTask(player);

        chooseNextAction(player);
    }
}

// ============================================================
// WIN CONDITIONS
// ============================================================

function checkWinCondition() {

    if (!game) {
        return;
    }

    const aliveCrew =
        game.players.filter(
            p =>
                p.alive &&
                p.role === "crewmate"
        ).length;

    const aliveImpostors =
        game.players.filter(
            p =>
                p.alive &&
                p.role === "impostor"
        ).length;

    const unfinishedTasks =
        game.players.reduce(
            (sum, p) =>
                sum +
                p.tasks.filter(
                    t => !t.completed
                ).length,
            0
        );

    if (aliveImpostors <= 0) {

        endGame(
            "crewmates",
            "All impostors were ejected."
        );

        return;
    }

    if (aliveImpostors >= aliveCrew) {

        endGame(
            "impostors",
            "The impostors have taken control."
        );

        return;
    }

    if (unfinishedTasks === 0) {

        endGame(
            "crewmates",
            "All tasks were completed."
        );
    }
}

function endGame(winner, reason) {

    if (
        game.phase === "ended"
    ) {
        return;
    }

    game.phase = "ended";

    game.winner = winner;

    game.winReason = reason;

    game.events.push({
        type: "game_end",
        text: reason
    });

    for (const player of game.players) {

        player.target = null;
        player.path = [];

        if (winner === "crewmates") {

            player.action =
                player.role === "crewmate"
                    ? "Crewmates win!"
                    : "Impostors lose!";

        } else {

            player.action =
                player.role === "impostor"
                    ? "Impostors win!"
                    : "Crewmates lose!";
        }
    }

    if (gameLoop) {

        clearInterval(gameLoop);

        gameLoop = null;
    }
}

// ============================================================
// GAME CREATION
// ============================================================

function createGame() {

    if (gameLoop) {

        clearInterval(gameLoop);

        gameLoop = null;
    }

    const selectedNames =
        shuffle(names)
            .slice(0, PLAYER_COUNT);

    const selectedColors =
        shuffle(colors);

    const selectedPersonalities =
        shuffle(personalities);

    const impostorIndexes =
        shuffle(
            [...Array(PLAYER_COUNT).keys()]
        ).slice(
            0,
            IMPOSTOR_COUNT
        );

    const players = [];

    for (let i = 0; i < PLAYER_COUNT; i++) {

        const id =
            crypto.randomUUID();

        const isImpostor =
            impostorIndexes.includes(i);

        const angle =
            (Math.PI * 2 * i) /
            PLAYER_COUNT;

        // Spawn around the central cafeteria table.
        const radius =
            randomFloat(2.1, 3.0);

        const x =
            24 +
            Math.cos(angle) * radius;

        const y =
            18.5 +
            Math.sin(angle) * radius;

        const player = {

            id,

            name: selectedNames[i],

            color:
                selectedColors[
                    i % selectedColors.length
                ],

            personality:
                selectedPersonalities[
                    i % selectedPersonalities.length
                ],

            role:
                isImpostor
                    ? "impostor"
                    : "crewmate",

            alive: true,

            x,
            y,

            room: "Cafeteria",

            lastRoom: "Cafeteria",

            state: "moving",

            behaviour: null,

            target: null,

            path: [],

            pathIndex: 0,

            action:
                isImpostor
                    ? "Pretending to be innocent"
                    : "Looking for a task",

            tasks: [],

            tasksCompleted: 0,

            tasksTotal: 3,

            currentTask: null,

            taskStartedAt: null,

            fakeTaskUntil: null,

            killCooldown:
                isImpostor
                    ? randomFloat(5, 12)
                    : 0,

            suspicion: {},

            deathTime: null
        };

        players.push(player);
    }

    // Everyone gets a suspicion score for everyone else.
    for (const player of players) {

        for (const other of players) {

            if (player.id !== other.id) {

                player.suspicion[other.id] =
                    randomFloat(0, 8);
            }
        }
    }

    // Give crew tasks.
    for (const player of players) {

        if (player.role === "crewmate") {
            assignTasks(player);
        } else {

            // Impostors receive fake tasks for believable movement.
            player.tasks =
                shuffle(taskDefinitions)
                    .slice(0, 3)
                    .map(task => ({
                        id: task.id,
                        name: task.name,
                        room: task.room,
                        x: task.x,
                        y: task.y,
                        completed: false
                    }));
        }
    }

    game = {

        id: crypto.randomUUID(),

        phase: "playing",

        round: 1,

        winner: null,

        winReason: null,

        players,

        bodies: [],

        events: [],

        chat: [],

        votes: {},

        meetingTimer: 0,

        emergencyCooldown: 0,

        emergencyUsed: {},

        lastMeeting: null,

        startedAt: Date.now()
    };

    game.events.push({
        type: "start",
        text: "The game has started."
    });

    for (const player of players) {

        chooseNextAction(player);
    }

    // Force everyone to initially gather around the table.
    for (const player of players) {

        const angle =
            Math.random() * Math.PI * 2;

        const radius =
            randomFloat(2.0, 2.8);

        player.x =
            24 +
            Math.cos(angle) * radius;

        player.y =
            18.5 +
            Math.sin(angle) * radius;

        player.room =
            "Cafeteria";

        player.lastRoom =
            "Cafeteria";
    }

    gameLoop =
        setInterval(
            updateGame,
            TICK_MS
        );

    console.log(
        "New AI Among Us game started."
    );

    console.log(
        "Impostors:",
        players
            .filter(p => p.role === "impostor")
            .map(p => p.name)
            .join(", ")
    );

    return game;
}

// ============================================================
// MAIN LOOP
// ============================================================

let lastTick = Date.now();

function updateGame() {

    if (!game) {
        return;
    }

    const now = Date.now();

    const delta =
        Math.min(
            0.25,
            (now - lastTick) / 1000
        );

    lastTick = now;

    if (game.phase === "playing") {

        game.round++;

        game.emergencyCooldown =
            Math.max(
                0,
                game.emergencyCooldown -
                    delta
            );

        for (const player of game.players) {

            updatePlayer(
                player,
                delta
            );

            updateTasks(player);
        }

        checkWinCondition();

    } else if (
        game.phase === "discussion" ||
        game.phase === "voting"
    ) {

        game.meetingTimer -= delta;

        if (
            game.phase === "discussion" &&
            game.meetingTimer <= 0
        ) {

            startVoting();
        }

        if (
            game.phase === "voting" &&
            game.meetingTimer <= 0
        ) {

            finishVoting();
        }
    }
}

// ============================================================
// PUBLIC STATE
// ============================================================

function publicGameState() {

    if (!game) {
        return null;
    }

    return {

        id: game.id,

        phase: game.phase,

        round: game.round,

        winner: game.winner,

        winReason: game.winReason,

        meetingTimer:
            Math.max(
                0,
                game.meetingTimer
            ),

        lastMeeting:
            game.lastMeeting,

        bodies:
            game.bodies.map(body => ({
                id: body.id,
                victimId: body.victimId,
                x: body.x,
                y: body.y,
                room: body.room
            })),

        events:
            game.events.slice(-20),

        chat:
            game.chat.slice(-40),

        players:
            game.players.map(player => ({

                id: player.id,

                name: player.name,

                color: player.color,

                personality:
                    player.personality,

                alive: player.alive,

                x: player.x,

                y: player.y,

                room: player.room,

                action: player.action,

                state: player.state,

                tasksCompleted:
                    player.tasksCompleted,

                tasksTotal:
                    player.tasksTotal,

                tasks:
                    player.tasks.map(task => ({
                        id: task.id,
                        name: task.name,
                        room: task.room,
                        x: task.x,
                        y: task.y,
                        completed:
                            task.completed
                    }))
            }))
    };
}

// ============================================================
// API
// ============================================================

app.get(
    "/api/status",
    (req, res) => {

        res.json({
            online: true,
            game: game
                ? game.id
                : null
        });
    }
);

app.get(
    "/api/game",
    (req, res) => {

        res.json(
            publicGameState()
        );
    }
);

app.post(
    "/api/game/new",
    (req, res) => {

        createGame();

        res.json(
            publicGameState()
        );
    }
);

// Debug endpoint.
// Does NOT expose roles publicly.
app.get(
    "/api/map",
    (req, res) => {

        res.json({
            world: WORLD,
            rooms,
            tasks: taskDefinitions
        });
    }
);

// ============================================================
// START
// ============================================================

createGame();

app.listen(
    PORT,
    () => {

        console.log(
            `AI Among Us running on port ${PORT}`
        );
    }
);
