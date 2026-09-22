const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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
    "confused"
];

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
    "Jack"
];

const colors = [
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

let game = null;

function createGame() {
    const impostorIndex = Math.floor(Math.random() * names.length);

    const players = names.map((name, index) => {
        const suspicion = {};

        for (const otherName of names) {
            if (otherName !== name) {
                suspicion[otherName] = 0;
            }
        }

        return {
            id: index,
            name,
            color: colors[index],
            personality: personalities[index],

            role: index === impostorIndex
                ? "impostor"
                : "crewmate",

            alive: true,
            location: "Cafeteria",

            memory: [],
            suspicion
        };
    });

    game = {
        id: crypto.randomUUID(),
        phase: "playing",
        players,
        round: 1,
        winner: null
    };

    console.log("New game started.");
    console.log(
        "Impostor:",
        players[impostorIndex].name
    );
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
            location: player.location
        }))
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
    console.log(`AI Among Us running on port ${PORT}`);
});
