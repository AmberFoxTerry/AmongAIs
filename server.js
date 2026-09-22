const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/*
    AI AMONG US
    Autonomous server-side AI simulation.

    Features:
    - Cafeteria spawning
    - Task movement
    - Wall-safe navigation
    - Impostor kills
    - Body reports
    - Emergency meetings
    - AI chat
    - AI voting
    - Ejections
    - Task victory
    - Impostor victory
*/

const WORLD = {
    width: 60,
    height: 40
};

const PLAYER_SPEED = 2.5;
const KILL_RANGE = 1.25;
const KILL_COOLDOWN = 25;
const MEETING_COOLDOWN = 20;
const MEETING_TIME = 18;
const VOTING_TIME = 12;
const TICK_RATE = 100;
const TASK_TIME = 4;

const COLORS = [
    "#c83b3b",
    "#4b8dcc",
    "#6bcf5b",
    "#d6a638",
    "#a95bd3",
    "#55cfc4",
    "#d8793d",
    "#e8e8e8",
    "#8d5b3e",
    "#e36c9d"
];

const NAMES = [
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
    "Mia"
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

/*
    Approximate Skeld navigation areas.

    These are WALKABLE areas.
    AIs only travel through these areas.
*/

const WALKABLE = [
    // Cafeteria
    { x: 22, y: 13, w: 16, h: 12 },

    // Upper Engine
    { x: 7, y: 4, w: 10, h: 10 },

    // Reactor
    { x: 2, y: 14, w: 10, h: 12 },

    // Lower Engine
    { x: 7, y: 27, w: 10, h: 10 },

    // Security
    { x: 15, y: 6, w: 7, h: 7 },

    // MedBay
    { x: 18, y: 5, w: 9, h: 8 },

    // Electrical
    { x: 14, y: 28, w: 9, h: 8 },

    // Storage
    { x: 22, y: 25, w: 10, h: 12 },

    // Admin
    { x: 31, y: 27, w: 8, h: 8 },

    // Weapons
    { x: 38, y: 8, w: 9, h: 8 },

    // O2
    { x: 39, y: 18, w: 7, h: 7 },

    // Navigation
    { x: 47, y: 18, w: 10, h: 10 },

    // Communications
    { x: 38, y: 29, w: 8, h: 7 },

    // Shields
    { x: 47, y: 29, w: 10, h: 7 },

    // Main corridors
    { x: 12, y: 12, w: 12, h: 4 },
    { x: 36, y: 12, w: 5, h: 4 },
    { x: 26, y: 21, w: 12, h: 5 },
    { x: 12, y: 21, w: 12, h: 5 },
    { x: 36, y: 21, w: 7, h: 5 },
    { x: 43, y: 23, w: 5, h: 5 },
    { x: 32, y: 34, w: 8, h: 4 }
];

/*
    Navigation graph.

    Instead of allowing the AI to draw a straight line through
    walls, it moves through connected waypoints.
*/

const NODES = {
    cafeteria: [30, 19],

    upperEngine: [12, 9],
    reactor: [7, 20],
    lowerEngine: [12, 32],

    security: [18, 9],
    medbay: [22, 9],

    electrical: [18, 32],
    storage: [27, 31],
    admin: [35, 31],

    weapons: [42, 12],
    o2: [43, 21],
    navigation: [52, 23],

    communications: [42, 33],
    shields: [52, 33]
};

const GRAPH = {
    cafeteria: [
        "upperEngine",
        "medbay",
        "weapons",
        "storage",
        "admin"
    ],

    upperEngine: [
        "cafeteria",
        "reactor",
        "security"
    ],

    reactor: [
        "upperEngine",
        "lowerEngine"
    ],

    lowerEngine: [
        "reactor",
        "electrical",
        "storage"
    ],

    security: [
        "upperEngine",
        "medbay"
    ],

    medbay: [
        "cafeteria",
        "security"
    ],

    electrical: [
        "lowerEngine",
        "storage"
    ],

    storage: [
        "cafeteria",
        "lowerEngine",
        "electrical",
        "admin"
    ],

    admin: [
        "storage",
        "o2",
        "communications"
    ],

    weapons: [
        "cafeteria",
        "o2"
    ],

    o2: [
        "weapons",
        "admin",
        "navigation"
    ],

    navigation: [
        "o2",
        "shields"
    ],

    communications: [
        "admin",
        "shields"
    ],

    shields: [
        "navigation",
        "communications"
    ]
};

const TASKS = [
    {
        name: "Fix Wiring",
        room: "Electrical",
        node: "electrical"
    },
    {
        name: "Download Data",
        room: "Admin",
        node: "admin"
    },
    {
        name: "Empty Garbage",
        room: "Storage",
        node: "storage"
    },
    {
        name: "Calibrate Reactor",
        room: "Reactor",
        node: "reactor"
    },
    {
        name: "Inspect Samples",
        room: "MedBay",
        node: "medbay"
    },
    {
        name: "Upload Data",
        room: "Admin",
        node: "admin"
    },
    {
        name: "Clean O2",
        room: "O2",
        node: "o2"
    },
    {
        name: "Align Engine",
        room: "Upper Engine",
        node: "upperEngine"
    },
    {
        name: "Start Reactor",
        room: "Reactor",
        node: "reactor"
    },
    {
        name: "Swipe Card",
        room: "Admin",
        node: "admin"
    },
    {
        name: "Prime Shields",
        room: "Shields",
        node: "shields"
    },
    {
        name: "Chart Course",
        room: "Navigation",
        node: "navigation"
    }
];

let game = null;
let loop = null;

function random(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function addEvent(text) {
    if (!game) return;

    game.events.push({
        id: crypto.randomUUID(),
        text,
        time: Date.now()
    });

    if (game.events.length > 100) {
        game.events.shift();
    }
}

/*
    Find a route through the navigation graph.
*/

function findPath(start, end) {
    if (!GRAPH[start] || !GRAPH[end]) {
        return [start, end];
    }

    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length) {
        const path = queue.shift();
        const current = path[path.length - 1];

        if (current === end) {
            return path;
        }

        for (const next of GRAPH[current]) {
            if (!visited.has(next)) {
                visited.add(next);
                queue.push([...path, next]);
            }
        }
    }

    return [start, end];
}

function setRoute(player, destination) {
    const path = findPath(player.node || "cafeteria", destination);

    player.route = path;
    player.routeIndex = 1;
    player.targetNode = destination;

    if (path.length > 1) {
        const point = NODES[path[1]];

        player.targetX = point[0];
        player.targetY = point[1];
    }
}

function movePlayer(player, dt) {
    if (!player.alive) return;

    if (player.targetX === null || player.targetY === null) {
        return;
    }

    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const length = Math.hypot(dx, dy);

    if (length < 0.05) {
        player.x = player.targetX;
        player.y = player.targetY;

        player.node = player.route[player.routeIndex];

        if (player.routeIndex < player.route.length - 1) {
            player.routeIndex++;

            const nextNode = player.route[player.routeIndex];
            const point = NODES[nextNode];

            player.targetX = point[0];
            player.targetY = point[1];

            return;
        }

        player.targetX = null;
        player.targetY = null;

        onArrive(player);

        return;
    }

    const amount = Math.min(
        PLAYER_SPEED * dt,
        length
    );

    player.x += (dx / length) * amount;
    player.y += (dy / length) * amount;
}

function onArrive(player) {
    if (!game || game.phase !== "playing") return;

    if (player.action === "task") {
        player.taskStartedAt = Date.now();
        player.action = "Doing " + player.currentTask.name;
        return;
    }

    if (player.action === "kill") {
        attemptKill(player);
        return;
    }

    if (player.action === "body") {
        attemptReport(player);
        return;
    }

    chooseAction(player);
}

function createPlayer(name, personality, color, index) {
    const angle =
        (Math.PI * 2 * index) / 10;

    const radius = 3;

    const x =
        30 + Math.cos(angle) * radius;

    const y =
        19 + Math.sin(angle) * radius;

    return {
        id: crypto.randomUUID(),

        name,
        personality,
        color,

        role: "crewmate",

        alive: true,

        x,
        y,

        node: "cafeteria",

        targetX: null,
        targetY: null,

        route: [],
        routeIndex: 0,
        targetNode: null,

        room: "Cafeteria",

        currentTask: null,
        tasksCompleted: 0,
        tasksTotal: 3,
        taskStartedAt: 0,

        action: "Standing around",

        killCooldown: 0,

        emergencyUses: 1,

        lastMeeting: 0,

        suspicion: {},

        memory: [],

        vote: null,

        chat: ""
    };
}

function createGame() {
    if (loop) {
        clearInterval(loop);
        loop = null;
    }

    const shuffledNames = [...NAMES]
        .sort(() => Math.random() - 0.5);

    const shuffledPersonalities = [...PERSONALITIES]
        .sort(() => Math.random() - 0.5);

    const players = [];

    for (let i = 0; i < 10; i++) {
        players.push(
            createPlayer(
                shuffledNames[i],
                shuffledPersonalities[i],
                COLORS[i],
                i
            )
        );
    }

    const impostorCount = Math.random() < 0.2 ? 2 : 1;

    const shuffledPlayers = [...players]
        .sort(() => Math.random() - 0.5);

    for (let i = 0; i < impostorCount; i++) {
        shuffledPlayers[i].role = "impostor";
    }

    for (const player of players) {
        for (const other of players) {
            if (player.id !== other.id) {
                player.suspicion[other.id] = 0;
            }
        }
    }

    game = {
        id: crypto.randomUUID(),

        phase: "playing",

        round: 1,

        winner: null,

        meeting: null,

        players,

        bodies: [],

        events: [],

        totalTasks: players.length * 3
    };

    addEvent("The game has started.");

    addEvent(
        "Everyone is gathering around the Cafeteria table."
    );

    for (const player of players) {
        chooseAction(player);
    }

    loop = setInterval(
        updateGame,
        TICK_RATE
    );

    console.log(
        "NEW GAME"
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

function chooseAction(player) {
    if (!game || game.phase !== "playing") {
        return;
    }

    if (!player.alive) return;

    /*
        Impostor behavior.
    */

    if (player.role === "impostor") {
        const nearbyVictims = game.players.filter(other => {
            if (!other.alive) return false;
            if (other.id === player.id) return false;
            if (other.role === "impostor") return false;

            return distance(player, other) < 12;
        });

        if (
            player.killCooldown <= 0 &&
            nearbyVictims.length > 0 &&
            Math.random() < 0.55
        ) {
            const target = random(nearbyVictims);

            player.action = "kill";
            player.targetPlayer = target.id;

            setRoute(
                player,
                target.node
            );

            return;
        }

        if (Math.random() < 0.35) {
            player.action = "Looking for someone alone";

            setRoute(
                player,
                random([
                    "electrical",
                    "storage",
                    "reactor",
                    "navigation",
                    "communications"
                ])
            );

            return;
        }
    }

    /*
        Crewmate / fake task behavior.
    */

    if (
        player.role === "crewmate" &&
        player.tasksCompleted < player.tasksTotal
    ) {
        const task = random(
            TASKS.filter(t =>
                !player.completedTaskNames ||
                !player.completedTaskNames.includes(t.name)
            )
        );

        player.currentTask = task;
        player.action = "task";

        if (!player.completedTaskNames) {
            player.completedTaskNames = [];
        }

        setRoute(
            player,
            task.node
        );

        return;
    }

    /*
        Wander.
    */

    const destination = random(
        Object.keys(NODES)
    );

    player.action = "Walking around";

    setRoute(
        player,
        destination
    );
}

function completeTask(player) {
    if (
        !player.currentTask ||
        player.tasksCompleted >= player.tasksTotal
    ) {
        chooseAction(player);
        return;
    }

    if (!player.completedTaskNames) {
        player.completedTaskNames = [];
    }

    if (
        !player.completedTaskNames.includes(
            player.currentTask.name
        )
    ) {
        player.completedTaskNames.push(
            player.currentTask.name
        );

        player.tasksCompleted++;

        addEvent(
            `${player.name} completed ${player.currentTask.name}.`
        );
    }

    player.currentTask = null;
    player.taskStartedAt = 0;

    chooseAction(player);

    checkWinCondition();
}

function attemptKill(impostor) {
    if (
        !game ||
        game.phase !== "playing" ||
        !impostor.alive ||
        impostor.role !== "impostor" ||
        impostor.killCooldown > 0
    ) {
        chooseAction(impostor);
        return;
    }

    const target = game.players.find(
        p => p.id === impostor.targetPlayer
    );

    if (
        !target ||
        !target.alive ||
        target.role === "impostor"
    ) {
        chooseAction(impostor);
        return;
    }

    if (distance(impostor, target) > KILL_RANGE) {
        chooseAction(impostor);
        return;
    }

    target.alive = false;

    target.action = "Dead";

    game.bodies.push({
        id: crypto.randomUUID(),
        playerId: target.id,
        name: target.name,
        color: target.color,
        x: target.x,
        y: target.y,
        room: target.room,
        reported: false
    });

    impostor.killCooldown = KILL_COOLDOWN;

    addEvent(
        `${target.name} was killed.`
    );

    /*
        Nearby AIs can notice the body.
    */

    for (const player of game.players) {
        if (
            player.alive &&
            player.id !== target.id &&
            distance(player, target) < 7
        ) {
            player.suspicion[impostor.id] += 1;
            player.memory.push(
                `${target.name} was found dead near ${impostor.name}.`
            );
        }
    }

    chooseAction(impostor);
}

function attemptReport(player) {
    if (!game || game.phase !== "playing") {
        return;
    }

    const body = game.bodies.find(
        body =>
            !body.reported &&
            distance(player, body) < 4
    );

    if (!body) {
        chooseAction(player);
        return;
    }

    body.reported = true;

    startMeeting(
        player,
        "body"
    );
}

function callEmergency(player) {
    if (
        !game ||
        game.phase !== "playing" ||
        !player.alive
    ) {
        return;
    }

    if (player.node !== "cafeteria") {
        return;
    }

    if (player.emergencyUses <= 0) {
        return;
    }

    if (
        Date.now() - player.lastMeeting <
        MEETING_COOLDOWN * 1000
    ) {
        return;
    }

    player.emergencyUses--;

    startMeeting(
        player,
        "emergency"
    );
}

function startMeeting(caller, reason) {
    if (
        !game ||
        game.phase !== "playing"
    ) {
        return;
    }

    game.phase = "meeting";

    game.meeting = {
        reason,
        callerId: caller.id,
        callerName: caller.name,
        startedAt: Date.now(),
        discussionEndsAt:
            Date.now() + MEETING_TIME * 1000,
        votingEndsAt: null,
        votes: {},
        chat: []
    };

    for (const player of game.players) {
        if (!player.alive) continue;

        player.vote = null;

        player.chat = generateChat(
            player,
            reason
        );

        game.meeting.chat.push({
            playerId: player.id,
            name: player.name,
            text: player.chat,
            time: Date.now()
        });
    }

    if (reason === "body") {
        addEvent(
            `${caller.name} reported a body.`
        );
    } else {
        addEvent(
            `${caller.name} called an emergency meeting.`
        );
    }
}

function generateChat(player, reason) {
    const alivePlayers =
        game.players.filter(p => p.alive);

    const suspicious = alivePlayers
        .filter(p => p.id !== player.id)
        .sort(
            (a, b) =>
                (player.suspicion[b.id] || 0) -
                (player.suspicion[a.id] || 0)
        );

    const target = suspicious[0];

    if (reason === "body") {
        if (player.personality === "paranoid") {
            return "Someone is definitely lying. I saw something weird.";
        }

        if (player.personality === "logical") {
            return target
                ? `${target.name} is acting suspicious.`
                : "We need to reconstruct everyone's movements.";
        }

        if (player.personality === "chaotic") {
            return "BRO WHO JUST GOT KILLED 😭";
        }

        if (player.personality === "quiet") {
            return "I didn't see anything.";
        }

        if (player.personality === "aggressive") {
            return target
                ? `I don't trust ${target.name}.`
                : "Someone here is lying.";
        }

        return random([
            "Where was everyone?",
            "I was doing tasks.",
            "Did anyone see the killer?",
            "I saw people near the body.",
            "Who was nearby?"
        ]);
    }

    return random([
        "Why was the meeting called?",
        "Did anyone see something?",
        "Let's figure this out.",
        "I was doing my task.",
        "Anyone acting suspicious?",
        "I have nothing to report."
    ]);
}

function calculateVote(player) {
    const candidates =
        game.players.filter(
            p => p.alive && p.id !== player.id
        );

    if (!candidates.length) {
        return "skip";
    }

    /*
        Actual decision state:
        suspicion + personality + memories.
    */

    let best = null;
    let bestScore = 0;

    for (const candidate of candidates) {
        let score =
            player.suspicion[candidate.id] || 0;

        if (
            player.personality === "paranoid"
        ) {
            score *= 1.4;
        }

        if (
            player.personality === "logical"
        ) {
            score *= 1.2;
        }

        if (
            player.personality === "confused"
        ) {
            score *= 0.7;
        }

        if (
            player.personality === "cowardly"
        ) {
            score *= 0.6;
        }

        score += Math.random() * 1.5;

        if (score > bestScore) {
            bestScore = score;
            best = candidate;
        }
    }

    if (
        best &&
        bestScore >= 1.5
    ) {
        return best.id;
    }

    return "skip";
}

function finishVoting() {
    if (
        !game ||
        game.phase !== "meeting"
    ) {
        return;
    }

    const votes = {};

    for (const player of game.players) {
        if (!player.alive) continue;

        const vote =
            player.vote || calculateVote(player);

        player.vote = vote;

        votes[vote] =
            (votes[vote] || 0) + 1;
    }

    game.meeting.votes = votes;

    let highest = 0;
    let ejected = null;
    let tie = false;

    for (const [id, count] of Object.entries(votes)) {
        if (id === "skip") continue;

        if (count > highest) {
            highest = count;
            ejected = id;
            tie = false;
        } else if (count === highest) {
            tie = true;
        }
    }

    if (tie || !ejected) {
        addEvent(
            "No one was ejected."
        );
    } else {
        const player = game.players.find(
            p => p.id === ejected
        );

        if (player) {
            player.alive = false;

            addEvent(
                `${player.name} was ejected.`
            );

            addEvent(
                player.role === "impostor"
                    ? `${player.name} was an Impostor.`
                    : `${player.name} was not an Impostor.`
            );
        }
    }

    game.phase = "playing";

    game.meeting.votingEndsAt = null;

    for (const player of game.players) {
        player.vote = null;
        player.lastMeeting = Date.now();
    }

    game.round++;

    game.bodies =
        game.bodies.filter(
            body => !body.reported
        );

    for (const player of game.players) {
        if (player.alive) {
            chooseAction(player);
        }
    }

    game.meeting = null;

    checkWinCondition();
}

function updateMeeting() {
    if (!game.meeting) return;

    const now = Date.now();

    if (
        !game.meeting.votingEndsAt &&
        now >= game.meeting.discussionEndsAt
    ) {
        game.meeting.votingEndsAt =
            now + VOTING_TIME * 1000;

        for (const player of game.players) {
            if (!player.alive) continue;

            player.vote =
                calculateVote(player);
        }

        return;
    }

    if (
        game.meeting.votingEndsAt &&
        now >= game.meeting.votingEndsAt
    ) {
        finishVoting();
    }
}

function updateGame() {
    if (!game) return;

    if (game.phase === "meeting") {
        updateMeeting();
        return;
    }

    if (game.phase !== "playing") {
        return;
    }

    const dt = TICK_RATE / 1000;

    for (const player of game.players) {
        if (!player.alive) continue;

        if (player.killCooldown > 0) {
            player.killCooldown =
                Math.max(
                    0,
                    player.killCooldown - dt
                );
        }

        movePlayer(
            player,
            dt
        );

        /*
            Task completion.
        */

        if (
            player.action.startsWith("Doing ") &&
            player.taskStartedAt > 0
        ) {
            if (
                Date.now() -
                player.taskStartedAt >=
                TASK_TIME * 1000
            ) {
                completeTask(player);
            }
        }

        /*
            Body detection.
        */

        if (
            player.action === "Walking around" ||
            player.action === "Standing around"
        ) {
            const nearbyBody =
                game.bodies.find(
                    body =>
                        !body.reported &&
                        distance(player, body) < 4
                );

            if (nearbyBody) {
                attemptReport(player);
            }
        }

        /*
            Emergency meeting chance.
        */

        if (
            player.node === "cafeteria" &&
            player.emergencyUses > 0 &&
            Math.random() < 0.0005
        ) {
            callEmergency(player);
        }
    }

    checkWinCondition();
}

function checkWinCondition() {
    if (!game || game.phase === "ended") {
        return;
    }

    const aliveImpostors =
        game.players.filter(
            p =>
                p.alive &&
                p.role === "impostor"
        );

    const aliveCrew =
        game.players.filter(
            p =>
                p.alive &&
                p.role === "crewmate"
        );

    const remainingTasks =
        game.players.reduce(
            (total, player) =>
                total +
                (player.tasksTotal -
                    player.tasksCompleted),
            0
        );

    if (aliveImpostors.length === 0) {
        endGame("crewmates");
        return;
    }

    if (
        aliveImpostors.length >=
        aliveCrew.length
    ) {
        endGame("impostors");
        return;
    }

    if (remainingTasks <= 0) {
        endGame("crewmates");
    }
}

function endGame(winner) {
    if (!game) return;

    game.phase = "ended";
    game.winner = winner;

    if (loop) {
        clearInterval(loop);
        loop = null;
    }

    if (winner === "crewmates") {
        addEvent(
            "CREWMATES WIN!"
        );
    } else {
        addEvent(
            "IMPOSTORS WIN!"
        );
    }
}

function publicGameState() {
    if (!game) return null;

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

            currentTask:
                player.currentTask
                    ? player.currentTask.name
                    : null,

            tasksCompleted:
                player.tasksCompleted,

            tasksTotal:
                player.tasksTotal,

            action: player.action
        })),

        bodies: game.bodies.map(body => ({
            id: body.id,
            playerId: body.playerId,
            name: body.name,
            color: body.color,
            x: body.x,
            y: body.y,
            room: body.room,
            reported: body.reported
        })),

        meeting: game.meeting
            ? {
                reason: game.meeting.reason,
                callerId: game.meeting.callerId,
                callerName: game.meeting.callerName,
                startedAt: game.meeting.startedAt,
                discussionEndsAt:
                    game.meeting.discussionEndsAt,
                votingEndsAt:
                    game.meeting.votingEndsAt,

                chat:
                    game.meeting.chat.map(message => ({
                        playerId: message.playerId,
                        name: message.name,
                        text: message.text,
                        time: message.time
                    })),

                votes:
                    game.meeting.votes
            }
            : null,

        events:
            game.events.slice(-30)
    };
}

app.get(
    "/api/status",
    (req, res) => {
        res.json({
            online: true,
            gameId: game?.id || null,
            phase: game?.phase || null
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

app.listen(
    PORT,
    () => {
        console.log(
            `AI Among Us running on port ${PORT}`
        );

        createGame();
    }
);
