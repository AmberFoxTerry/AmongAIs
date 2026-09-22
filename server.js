const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const TICK = 100;
const PLAYER_SPEED = 0.95;
const KILL_RANGE = 1.2;
const KILL_COOLDOWN = 18_000;
const TASK_TIME = 4_000;
const MEETING_TIME = 25_000;
const DISCUSSION_TIME = 8_000;
const VOTE_TIME = 8_000;

const WORLD_W = 60;
const WORLD_H = 40;

/*
    Skeld-style layout.

    Coordinates match public/game.js.

    Rooms:
      Upper Engine   Reactor
      Lower Engine   Security
      MedBay         Cafeteria
      Weapons        Navigation
      O2             Storage
      Admin          Communications
      Shields        Electrical
*/

const ROOMS = {
    "Upper Engine": {
        x: 2, y: 3, w: 10, h: 7,
        center: { x: 7, y: 6 }
    },

    Reactor: {
        x: 2, y: 13, w: 10, h: 9,
        center: { x: 7, y: 17 }
    },

    "Lower Engine": {
        x: 2, y: 25, w: 10, h: 7,
        center: { x: 7, y: 28 }
    },

    Security: {
        x: 14, y: 24, w: 8, h: 7,
        center: { x: 18, y: 27 }
    },

    MedBay: {
        x: 14, y: 3, w: 8, h: 7,
        center: { x: 18, y: 6 }
    },

    Cafeteria: {
        x: 25, y: 10, w: 12, h: 11,
        center: { x: 31, y: 15 }
    },

    Weapons: {
        x: 40, y: 3, w: 9, h: 8,
        center: { x: 44.5, y: 7 }
    },

    Navigation: {
        x: 48, y: 13, w: 10, h: 8,
        center: { x: 53, y: 17 }
    },

    O2: {
        x: 40, y: 23, w: 8, h: 7,
        center: { x: 44, y: 26.5 }
    },

    Storage: {
        x: 25, y: 24, w: 11, h: 8,
        center: { x: 30.5, y: 28 }
    },

    Admin: {
        x: 39, y: 14, w: 8, h: 7,
        center: { x: 43, y: 17.5 }
    },

    Communications: {
        x: 39, y: 32, w: 9, h: 5,
        center: { x: 43.5, y: 34.5 }
    },

    Shields: {
        x: 49, y: 24, w: 9, h: 8,
        center: { x: 53.5, y: 28 }
    },

    Electrical: {
        x: 14, y: 33, w: 10, h: 5,
        center: { x: 19, y: 35.5 }
    }
};

const CORRIDORS = [
    // left vertical
    [[7, 6], [7, 17]],
    [[7, 17], [7, 28]],

    // upper engine -> medbay
    [[7, 6], [18, 6]],

    // lower engine -> security
    [[7, 28], [18, 28]],

    // medbay -> cafeteria
    [[18, 6], [25, 15]],

    // cafeteria -> weapons
    [[37, 15], [44, 7]],

    // cafeteria -> storage
    [[31, 21], [31, 24]],

    // cafeteria -> admin
    [[37, 15], [43, 17.5]],

    // storage -> electrical
    [[25, 28], [19, 33]],

    // storage -> communications
    [[36, 28], [43.5, 32]],

    // admin -> navigation
    [[47, 17.5], [53, 17]],

    // admin -> O2
    [[43, 21], [44, 23]],

    // O2 -> shields
    [[48, 26.5], [49, 28]],

    // navigation -> shields
    [[53, 21], [53.5, 24]],

    // security -> electrical
    [[18, 31], [19, 33]],

    // cafeteria vertical
    [[31, 15], [31, 24]]
];

const PERSONALITIES = [
    {
        name: "Alex",
        color: "#ff4b4b",
        traits: {
            aggression: 0.35,
            suspicion: 0.55,
            bravery: 0.55,
            sociability: 0.60
        }
    },
    {
        name: "Milo",
        color: "#4ba3ff",
        traits: {
            aggression: 0.20,
            suspicion: 0.75,
            bravery: 0.40,
            sociability: 0.70
        }
    },
    {
        name: "Luna",
        color: "#c66cff",
        traits: {
            aggression: 0.45,
            suspicion: 0.50,
            bravery: 0.70,
            sociability: 0.45
        }
    },
    {
        name: "Rex",
        color: "#f0a34b",
        traits: {
            aggression: 0.75,
            suspicion: 0.45,
            bravery: 0.85,
            sociability: 0.35
        }
    },
    {
        name: "Nora",
        color: "#59d98c",
        traits: {
            aggression: 0.25,
            suspicion: 0.80,
            bravery: 0.35,
            sociability: 0.75
        }
    },
    {
        name: "Kai",
        color: "#62e6e6",
        traits: {
            aggression: 0.55,
            suspicion: 0.60,
            bravery: 0.60,
            sociability: 0.50
        }
    },
    {
        name: "Pip",
        color: "#ffd84b",
        traits: {
            aggression: 0.15,
            suspicion: 0.35,
            bravery: 0.25,
            sociability: 0.90
        }
    },
    {
        name: "Vera",
        color: "#ffffff",
        traits: {
            aggression: 0.65,
            suspicion: 0.85,
            bravery: 0.65,
            sociability: 0.25
        }
    }
];

const TASKS = [
    {
        id: "wires",
        name: "Fix Wiring",
        room: "Electrical",
        offset: [-2, 0]
    },
    {
        id: "download",
        name: "Download Data",
        room: "Admin",
        offset: [1, 1]
    },
    {
        id: "upload",
        name: "Upload Data",
        room: "Navigation",
        offset: [-2, 1]
    },
    {
        id: "weapons",
        name: "Clear Asteroids",
        room: "Weapons",
        offset: [1, 0]
    },
    {
        id: "reactor",
        name: "Start Reactor",
        room: "Reactor",
        offset: [1, 1]
    },
    {
        id: "engines",
        name: "Align Engine",
        room: "Upper Engine",
        offset: [1, 0]
    },
    {
        id: "fuel",
        name: "Fuel Engines",
        room: "Lower Engine",
        offset: [1, 1]
    },
    {
        id: "medbay",
        name: "Inspect Sample",
        room: "MedBay",
        offset: [1, 1]
    },
    {
        id: "o2",
        name: "Clean O2",
        room: "O2",
        offset: [0, 1]
    },
    {
        id: "shields",
        name: "Prime Shields",
        room: "Shields",
        offset: [0, 0]
    },
    {
        id: "comms",
        name: "Fix Communications",
        room: "Communications",
        offset: [0, 0]
    }
];

let game = null;

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function choice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function now() {
    return Date.now();
}

function roomCenter(room) {
    return {
        x: ROOMS[room].center.x,
        y: ROOMS[room].center.y
    };
}

function pointInRoom(point, room) {
    const r = ROOMS[room];

    return (
        point.x >= r.x &&
        point.x <= r.x + r.w &&
        point.y >= r.y &&
        point.y <= r.y + r.h
    );
}

function getRoom(point) {
    for (const [name, room] of Object.entries(ROOMS)) {
        if (
            point.x >= room.x &&
            point.x <= room.x + room.w &&
            point.y >= room.y &&
            point.y <= room.y + room.h
        ) {
            return name;
        }
    }

    return "Hallway";
}

/*
    Instead of letting AIs teleport between rooms,
    routes are made from the actual corridor graph.
*/

function nearestRoom(point) {
    let best = null;
    let bestDistance = Infinity;

    for (const [name, room] of Object.entries(ROOMS)) {
        const d = distance(point, room.center);

        if (d < bestDistance) {
            bestDistance = d;
            best = name;
        }
    }

    return best;
}

const ROOM_CONNECTIONS = {
    "Upper Engine": ["Reactor", "MedBay"],
    "Reactor": ["Upper Engine", "Lower Engine"],
    "Lower Engine": ["Reactor", "Security"],
    "Security": ["Lower Engine", "Electrical"],
    "MedBay": ["Upper Engine", "Cafeteria"],
    "Cafeteria": ["MedBay", "Weapons", "Storage", "Admin"],
    "Weapons": ["Cafeteria"],
    "Navigation": ["Admin", "Shields"],
    "O2": ["Admin", "Shields"],
    "Storage": ["Cafeteria", "Electrical", "Communications"],
    "Admin": ["Cafeteria", "Navigation", "O2"],
    "Communications": ["Storage"],
    "Shields": ["O2", "Navigation"],
    "Electrical": ["Storage", "Security"]
};

function findRoomPath(startRoom, targetRoom) {
    if (startRoom === targetRoom) {
        return [startRoom];
    }

    const queue = [startRoom];
    const previous = {
        [startRoom]: null
    };

    while (queue.length) {
        const current = queue.shift();

        for (const next of ROOM_CONNECTIONS[current] || []) {
            if (previous[next] !== undefined) {
                continue;
            }

            previous[next] = current;

            if (next === targetRoom) {
                const result = [];
                let cursor = next;

                while (cursor !== null) {
                    result.unshift(cursor);
                    cursor = previous[cursor];
                }

                return result;
            }

            queue.push(next);
        }
    }

    return [startRoom];
}

function corridorPoint(fromRoom, toRoom) {
    const pairs = {
        "Upper Engine>Reactor": { x: 7, y: 11 },
        "Reactor>Lower Engine": { x: 7, y: 23 },
        "Upper Engine>MedBay": { x: 11, y: 6 },
        "Lower Engine>Security": { x: 11, y: 28 },
        "MedBay>Cafeteria": { x: 22, y: 10 },
        "Cafeteria>Weapons": { x: 39, y: 11 },
        "Cafeteria>Storage": { x: 31, y: 22.5 },
        "Cafeteria>Admin": { x: 38, y: 16 },
        "Weapons>Cafeteria": { x: 39, y: 11 },
        "Admin>Navigation": { x: 48, y: 17 },
        "Admin>O2": { x: 44, y: 22 },
        "Navigation>Shields": { x: 53, y: 22.5 },
        "O2>Shields": { x: 48.5, y: 28 },
        "Storage>Electrical": { x: 23, y: 31 },
        "Storage>Communications": { x: 38, y: 30 },
        "Security>Electrical": { x: 18, y: 32 },
        "Electrical>Security": { x: 18, y: 32 }
    };

    return (
        pairs[`${fromRoom}>${toRoom}`] ||
        pairs[`${toRoom}>${fromRoom}`] ||
        roomCenter(toRoom)
    );
}

function makeRoute(player, target) {
    const targetRoom = typeof target === "string"
        ? target
        : getRoom(target);

    const currentRoom = getRoom(player);

    if (currentRoom === targetRoom) {
        player.route = [
            {
                x: typeof target === "object" ? target.x : ROOMS[targetRoom].center.x,
                y: typeof target === "object" ? target.y : ROOMS[targetRoom].center.y
            }
        ];

        return;
    }

    const startRoom =
        currentRoom === "Hallway"
            ? nearestRoom(player)
            : currentRoom;

    const path = findRoomPath(startRoom, targetRoom);

    const route = [];

    for (let i = 1; i < path.length; i++) {
        const from = path[i - 1];
        const to = path[i];

        route.push(corridorPoint(from, to));
        route.push(roomCenter(to));
    }

    if (typeof target === "object") {
        route.push({
            x: target.x,
            y: target.y
        });
    }

    player.route = route;
}

function movePlayer(player) {
    if (!player.route || player.route.length === 0) {
        return;
    }

    const target = player.route[0];

    const dx = target.x - player.x;
    const dy = target.y - player.y;

    const d = Math.hypot(dx, dy);

    if (d <= PLAYER_SPEED) {
        player.x = target.x;
        player.y = target.y;
        player.route.shift();

        return;
    }

    player.x += (dx / d) * PLAYER_SPEED;
    player.y += (dy / d) * PLAYER_SPEED;
}

function nearestAlivePlayer(point, filter = () => true) {
    let result = null;
    let best = Infinity;

    for (const player of game.players) {
        if (!player.alive) continue;
        if (!filter(player)) continue;

        const d = distance(point, player);

        if (d < best) {
            best = d;
            result = player;
        }
    }

    return result;
}

function aliveCrew() {
    return game.players.filter(
        p => p.alive && p.role === "crewmate"
    );
}

function aliveImpostors() {
    return game.players.filter(
        p => p.alive && p.role === "impostor"
    );
}

function alivePlayers() {
    return game.players.filter(p => p.alive);
}

function randomSpawn() {
    const c = ROOMS.Cafeteria.center;

    return {
        x: c.x + rand(-2.2, 2.2),
        y: c.y + rand(-2.0, 2.0)
    };
}

function createTasks(player) {
    const shuffled = [...TASKS].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, 3).map(template => {
        const room = ROOMS[template.room];

        return {
            id: template.id,
            name: template.name,
            room: template.room,
            x: room.center.x + template.offset[0],
            y: room.center.y + template.offset[1],
            complete: false,
            started: false,
            startedAt: 0,
            duration: TASK_TIME + rand(-700, 900)
        };
    });
}

function createPlayer(index) {
    const personality = PERSONALITIES[index % PERSONALITIES.length];
    const spawn = randomSpawn();

    return {
        id: `player-${index + 1}`,

        name: personality.name,
        color: personality.color,

        x: spawn.x,
        y: spawn.y,

        alive: true,
        role: "crewmate",

        traits: personality.traits,

        tasks: [],
        currentTask: null,

        route: [],

        action: "Standing",

        targetId: null,

        lastThink: 0,
        lastKill: 0,

        suspicion: {},

        memories: [],

        fakeTask: null,

        meetingCooldown: 0,

        vote: null
    };
}

function addMemory(player, text) {
    player.memories.unshift({
        text,
        time: now()
    });

    if (player.memories.length > 25) {
        player.memories.length = 25;
    }
}

function increaseSuspicion(observer, suspectId, amount) {
    if (!observer.suspicion[suspectId]) {
        observer.suspicion[suspectId] = 0;
    }

    observer.suspicion[suspectId] += amount;
}

function suspicionOf(player, suspect) {
    return player.suspicion[suspect.id] || 0;
}

function resetGame() {
    const players = [];

    for (let i = 0; i < 8; i++) {
        players.push(createPlayer(i));
    }

    /*
        2 impostors.
    */
    const impostorIndexes = [];

    while (impostorIndexes.length < 2) {
        const index = Math.floor(Math.random() * players.length);

        if (!impostorIndexes.includes(index)) {
            impostorIndexes.push(index);
        }
    }

    for (const index of impostorIndexes) {
        players[index].role = "impostor";
    }

    for (const player of players) {
        player.tasks = createTasks(player);

        for (const other of players) {
            if (other.id !== player.id) {
                player.suspicion[other.id] = 0;
            }
        }

        addMemory(player, "Game started in Cafeteria.");
    }

    game = {
        startedAt: now(),

        phase: "playing",

        meeting: null,

        players,

        bodies: [],

        taskCompleted: 0,

        totalTasks: players
            .filter(p => p.role === "crewmate")
            .reduce((sum, p) => sum + p.tasks.length, 0),

        emergencyUses: 1,

        winner: null,

        lastTick: now()
    };
}

function beginTask(player, task) {
    if (task.complete) {
        return;
    }

    task.started = true;
    task.startedAt = now();

    player.currentTask = task.id;
    player.action = `Doing ${task.name}`;
}

function finishTask(player, task) {
    if (task.complete) {
        return;
    }

    task.complete = true;
    task.started = false;

    player.currentTask = null;
    player.action = "Task complete";

    game.taskCompleted++;

    addMemory(
        player,
        `Completed ${task.name} in ${task.room}.`
    );
}

function updateTask(player) {
    if (player.role !== "crewmate") {
        return;
    }

    const task = player.tasks.find(t => t.id === player.currentTask);

    if (!task) {
        return;
    }

    if (distance(player, task) > 0.9) {
        task.started = false;
        task.startedAt = 0;
        return;
    }

    if (!task.started) {
        beginTask(player, task);
        return;
    }

    if (now() - task.startedAt >= task.duration) {
        finishTask(player, task);
    }
}

function chooseNextTask(player) {
    const unfinished = player.tasks.filter(t => !t.complete);

    if (!unfinished.length) {
        player.action = "Finished tasks";
        player.route = [];
        return;
    }

    unfinished.sort((a, b) => {
        const da = distance(player, a);
        const db = distance(player, b);

        return da - db;
    });

    const task = unfinished[0];

    player.currentTask = task.id;

    makeRoute(player, {
        x: task.x,
        y: task.y
    });

    player.action = `Going to ${task.name}`;
}

function visibleWitnesses(victim, killer) {
    return game.players.filter(other => {
        if (!other.alive) return false;
        if (other.id === victim.id) return false;
        if (other.id === killer.id) return false;

        return distance(other, victim) < 4.5;
    });
}

function canKill(killer, victim) {
    if (!killer.alive) return false;
    if (!victim.alive) return false;
    if (killer.role !== "impostor") return false;

    if (now() - killer.lastKill < KILL_COOLDOWN) {
        return false;
    }

    if (distance(killer, victim) > KILL_RANGE) {
        return false;
    }

    return true;
}

function kill(killer, victim) {
    if (!canKill(killer, victim)) {
        return false;
    }

    victim.alive = false;
    victim.action = "Dead";

    victim.route = [];

    killer.lastKill = now();
    killer.targetId = null;

    game.bodies.push({
        id: `body-${victim.id}-${now()}`,

        playerId: victim.id,

        x: victim.x,
        y: victim.y,

        room: getRoom(victim),

        reported: false
    });

    addMemory(
        killer,
        `Killed ${victim.name} in ${getRoom(victim)}.`
    );

    for (const observer of game.players) {
        if (!observer.alive || observer.id === killer.id) {
            continue;
        }

        const d = distance(observer, victim);

        if (d < 6) {
            increaseSuspicion(observer, killer.id, 1.5);

            addMemory(
                observer,
                `Saw ${killer.name} near ${victim.name} shortly before the death.`
            );
        }
    }

    // Immediately leave the murder location.
    const rooms = Object.keys(ROOMS).filter(
        room => room !== getRoom(killer)
    );

    const escapeRoom = choice(rooms);

    makeRoute(killer, escapeRoom);

    killer.action = `Leaving ${getRoom(victim)}`;

    return true;
}

function chooseKillTarget(player) {
    const candidates = aliveCrew().filter(
        other => other.id !== player.id
    );

    if (!candidates.length) {
        return null;
    }

    let best = null;
    let bestScore = -Infinity;

    for (const target of candidates) {
        const d = distance(player, target);

        let score = 0;

        /*
            Isolated players are attractive targets.
        */
        const nearby = alivePlayers().filter(
            other =>
                other.id !== player.id &&
                other.id !== target.id &&
                distance(target, other) < 5
        ).length;

        score += Math.max(0, 6 - nearby * 2);

        /*
            Distance matters.
        */
        score += Math.max(0, 8 - d);

        /*
            High-suspicion players can be killed because
            they are dangerous to the impostor.
        */
        score += suspicionOf(target, player) * 0.4;

        /*
            Personality changes risk tolerance.
        */
        score += player.traits.aggression * 3;
        score -= player.traits.bravery < 0.4 ? 2 : 0;

        score += rand(-1.5, 1.5);

        if (score > bestScore) {
            bestScore = score;
            best = target;
        }
    }

    return best;
}

function chooseCrewAction(player) {
    const nearbyBody = game.bodies.find(
        body =>
            !body.reported &&
            distance(player, body) < 2.3
    );

    if (nearbyBody) {
        reportBody(player, nearbyBody);
        return;
    }

    const suspicious = game.players
        .filter(p => p.alive && p.id !== player.id)
        .sort(
            (a, b) =>
                suspicionOf(player, b) -
                suspicionOf(player, a)
        );

    if (
        suspicious.length &&
        suspicionOf(player, suspicious[0]) > 4 &&
        player.traits.suspicion > 0.7 &&
        Math.random() < 0.15
    ) {
        const target = suspicious[0];

        makeRoute(player, target);

        player.action = `Watching ${target.name}`;

        return;
    }

    if (
        player.traits.sociability > 0.75 &&
        Math.random() < 0.03 &&
        distance(player, roomCenter("Cafeteria")) < 4
    ) {
        callEmergency(player);
        return;
    }

    chooseNextTask(player);
}

function chooseImpostorAction(player) {
    const target = chooseKillTarget(player);

    if (!target) {
        player.action = "Waiting";
        return;
    }

    /*
        Chase the target's CURRENT position.

        This is the important fix: the impostor does not
        navigate to the room where the target used to be.
    */
    player.targetId = target.id;

    makeRoute(player, {
        x: target.x,
        y: target.y
    });

    player.action = `Hunting ${target.name}`;
}

function think(player) {
    if (!player.alive) {
        return;
    }

    if (game.phase !== "playing") {
        return;
    }

    /*
        Impostors continuously reevaluate their target.
    */
    if (player.role === "impostor") {
        const target = game.players.find(
            p => p.id === player.targetId
        );

        if (
            !target ||
            !target.alive ||
            now() - player.lastKill > KILL_COOLDOWN / 2
        ) {
            chooseImpostorAction(player);
        }

        return;
    }

    /*
        Crew members don't constantly change tasks.
    */
    if (
        player.currentTask &&
        player.tasks.some(
            t =>
                t.id === player.currentTask &&
                !t.complete
        )
    ) {
        return;
    }

    chooseCrewAction(player);
}

function updateImpostor(player) {
    if (!player.alive || player.role !== "impostor") {
        return;
    }

    const target = game.players.find(
        p => p.id === player.targetId
    );

    if (!target || !target.alive) {
        player.targetId = null;
        chooseImpostorAction(player);
        return;
    }

    /*
        Constantly update the route to the target.
        This prevents the old "walk to where they WERE" bug.
    */
    if (
        now() - player.lastThink > 500 ||
        !player.route.length
    ) {
        makeRoute(player, {
            x: target.x,
            y: target.y
        });

        player.lastThink = now();
    }

    if (canKill(player, target)) {
        const witnesses = visibleWitnesses(target, player);

        /*
            Usually avoid killing directly in front of people.
            Aggressive personalities accept more risk.
        */
        const witnessRisk =
            witnesses.length *
            (1.2 - player.traits.aggression);

        if (
            witnessRisk < 1.8 ||
            Math.random() < player.traits.aggression * 0.15
        ) {
            kill(player, target);
        }
    }
}

function reportBody(player, body) {
    if (game.phase !== "playing") {
        return;
    }

    body.reported = true;

    addMemory(
        player,
        `Reported ${body.playerId} in ${body.room}.`
    );

    for (const observer of game.players) {
        if (!observer.alive) continue;

        if (observer.id !== player.id) {
            increaseSuspicion(
                observer,
                player.id,
                0.2
            );
        }
    }

    startMeeting(
        player,
        `Body of ${body.playerId} reported in ${body.room}`
    );
}

function callEmergency(player) {
    if (game.phase !== "playing") {
        return false;
    }

    if (game.emergencyUses <= 0) {
        return false;
    }

    if (
        distance(
            player,
            roomCenter("Cafeteria")
        ) > 5
    ) {
        return false;
    }

    if (
        now() - player.meetingCooldown < 30_000
    ) {
        return false;
    }

    game.emergencyUses--;

    player.meetingCooldown = now();

    startMeeting(
        player,
        `${player.name} called an emergency meeting`
    );

    return true;
}

function startMeeting(caller, reason) {
    if (game.phase !== "playing") {
        return;
    }

    game.phase = "meeting";

    game.meeting = {
        reason,

        callerId: caller ? caller.id : null,

        startedAt: now(),

        discussionEndsAt: now() + DISCUSSION_TIME,

        voteStartsAt: now() + DISCUSSION_TIME,

        voteEndsAt:
            now() +
            DISCUSSION_TIME +
            VOTE_TIME,

        chat: [],

        votes: {},

        ejectedId: null,

        result: null
    };

    for (const player of game.players) {
        if (!player.alive) continue;

        player.route = [];
        player.action = "In meeting";
        player.vote = null;
    }

    generateMeetingChat();

    setTimeout(() => {
        if (
            game &&
            game.phase === "meeting" &&
            game.meeting
        ) {
            performVotes();
        }
    }, DISCUSSION_TIME + 50);
}

function generateMeetingChat() {
    if (!game.meeting) return;

    const alive = alivePlayers();

    for (const player of alive) {
        let text = "";

        const mostSuspicious = alive
            .filter(p => p.id !== player.id)
            .sort(
                (a, b) =>
                    suspicionOf(player, b) -
                    suspicionOf(player, a)
            )[0];

        if (
            mostSuspicious &&
            suspicionOf(player, mostSuspicious) > 2
        ) {
            text =
                `I am suspicious of ${mostSuspicious.name}. ` +
                `I've noticed strange behavior.`;
        } else if (player.role === "impostor") {
            const alternatives = alive.filter(
                p => p.id !== player.id
            );

            const target = choice(alternatives);

            text =
                target
                    ? `I don't know. ${target.name} was moving around a lot.`
                    : "I didn't see anything.";
        } else if (player.traits.sociability > 0.7) {
            text =
                "I was doing my tasks. Did anyone see anything?";
        } else if (player.traits.suspicion > 0.7) {
            text =
                "We need to look at where everyone was.";
        } else {
            text =
                "I don't have enough information yet.";
        }

        game.meeting.chat.push({
            playerId: player.id,
            name: player.name,
            text,
            time: now()
        });
    }
}

function performVotes() {
    if (!game.meeting || game.phase !== "meeting") {
        return;
    }

    const alive = alivePlayers();

    const votes = {};

    for (const player of alive) {
        let candidates = alive.filter(
            p => p.id !== player.id
        );

        if (!candidates.length) {
            continue;
        }

        candidates.sort(
            (a, b) =>
                suspicionOf(player, b) -
                suspicionOf(player, a)
        );

        const top = candidates[0];

        /*
            Impostors never vote themselves or another impostor.
        */
        if (
            player.role === "impostor"
        ) {
            const crew = candidates.filter(
                p => p.role === "crewmate"
            );

            if (crew.length) {
                candidates = crew;
            }
        }

        let vote = candidates[0];

        /*
            Low-confidence crew may skip.
        */
        if (
            player.role === "crewmate" &&
            suspicionOf(player, vote) < 2 &&
            Math.random() < 0.35
        ) {
            vote = null;
        }

        player.vote = vote ? vote.id : "skip";

        if (!votes[player.vote]) {
            votes[player.vote] = 0;
        }

        votes[player.vote]++;
    }

    game.meeting.votes = votes;

    let highest = 0;
    let winner = null;
    let tied = false;

    for (const [id, count] of Object.entries(votes)) {
        if (count > highest) {
            highest = count;
            winner = id;
            tied = false;
        } else if (count === highest) {
            tied = true;
        }
    }

    if (
        !winner ||
        winner === "skip" ||
        tied
    ) {
        game.meeting.result = "No one was ejected.";
    } else {
        const ejected = game.players.find(
            p => p.id === winner
        );

        if (ejected) {
            ejected.alive = false;
            ejected.route = [];
            ejected.action = "Ejected";

            game.meeting.ejectedId = ejected.id;

            game.meeting.result =
                `${ejected.name} was ejected. ` +
                `They were ${ejected.role}.`;

            addMemory(
                ejected,
                "I was ejected during a meeting."
            );
        }
    }

    checkWin();

    if (game.phase === "meeting") {
        game.phase = "playing";

        for (const player of game.players) {
            if (player.alive) {
                player.action = "Standing";
                player.vote = null;
            }
        }

        game.meeting.finishedAt = now();
    }
}

function checkWin() {
    const crew = aliveCrew().length;
    const impostors = aliveImpostors().length;

    if (impostors === 0) {
        game.phase = "ended";
        game.winner = "crewmates";
        return;
    }

    if (crew === 0 || impostors >= crew) {
        game.phase = "ended";
        game.winner = "impostors";
        return;
    }

    const unfinished = game.players
        .filter(p => p.role === "crewmate")
        .flatMap(p => p.tasks)
        .filter(task => !task.complete);

    if (unfinished.length === 0) {
        game.phase = "ended";
        game.winner = "crewmates";
    }
}

function updateGame() {
    if (!game) {
        resetGame();
    }

    if (game.phase !== "playing") {
        return;
    }

    for (const player of game.players) {
        if (!player.alive) continue;

        /*
            Impostors need active pursuit.
        */
        if (player.role === "impostor") {
            updateImpostor(player);
        }

        /*
            Crew task logic.
        */
        if (player.role === "crewmate") {
            updateTask(player);
        }

        /*
            Movement.
        */
        movePlayer(player);

        /*
            Arriving at a task.
        */
        if (
            player.role === "crewmate" &&
            player.currentTask
        ) {
            const task = player.tasks.find(
                t => t.id === player.currentTask
            );

            if (
                task &&
                distance(player, task) <= 0.9
            ) {
                updateTask(player);
            }
        }

        /*
            Dead body detection.
        */
        if (
            player.role === "crewmate" &&
            player.action !== "In meeting"
        ) {
            const body = game.bodies.find(
                b =>
                    !b.reported &&
                    distance(player, b) < 1.8
            );

            if (body) {
                reportBody(player, body);
                break;
            }
        }

        /*
            AI decision timer.
        */
        if (
            now() - player.lastThink > 1800
        ) {
            player.lastThink = now();
            think(player);
        }
    }

    checkWin();
}

function publicPlayer(player) {
    return {
        id: player.id,

        name: player.name,

        color: player.color,

        x: Number(player.x.toFixed(2)),
        y: Number(player.y.toFixed(2)),

        alive: player.alive,

        room: getRoom(player),

        action: player.action,

        currentTask: player.currentTask,

        tasks: player.tasks.map(task => ({
            id: task.id,
            name: task.name,
            room: task.room,
            x: task.x,
            y: task.y,
            complete: task.complete,
            started:
                task.started &&
                player.currentTask === task.id
        })),

        taskCount: player.tasks.length,

        completedTasks:
            player.tasks.filter(t => t.complete).length
    };
}

function publicGameState() {
    return {
        phase: game.phase,

        winner: game.winner,

        taskCompleted: game.taskCompleted,

        totalTasks: game.totalTasks,

        emergencyUses: game.emergencyUses,

        players: game.players.map(publicPlayer),

        bodies: game.bodies
            .filter(b => !b.reported)
            .map(b => ({
                id: b.id,
                x: b.x,
                y: b.y,
                room: b.room
            })),

        meeting: game.meeting
            ? {
                reason: game.meeting.reason,

                callerId: game.meeting.callerId,

                startedAt: game.meeting.startedAt,

                discussionEndsAt:
                    game.meeting.discussionEndsAt,

                voteStartsAt:
                    game.meeting.voteStartsAt,

                voteEndsAt:
                    game.meeting.voteEndsAt,

                chat: game.meeting.chat.map(message => ({
                    playerId: message.playerId,
                    name: message.name,
                    text: message.text
                })),

                votes: game.meeting.votes,

                ejectedId:
                    game.meeting.ejectedId,

                result:
                    game.meeting.result
            }
            : null
    };
}

app.get("/api/game", (req, res) => {
    res.json(publicGameState());
});

app.post("/api/game/new", (req, res) => {
    resetGame();

    res.json(publicGameState());
});

app.post("/api/game/meeting", (req, res) => {
    if (!game || game.phase !== "playing") {
        return res.status(400).json({
            error: "Cannot call a meeting right now."
        });
    }

    const player = game.players.find(
        p => p.id === req.body.playerId
    );

    if (!player || !player.alive) {
        return res.status(400).json({
            error: "Invalid player."
        });
    }

    if (callEmergency(player)) {
        return res.json(publicGameState());
    }

    res.status(400).json({
        error: "Emergency meeting unavailable."
    });
});

setInterval(updateGame, TICK);

resetGame();

app.listen(PORT, () => {
    console.log(`AI Among Us running on port ${PORT}`);
});
