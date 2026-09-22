const crewContainer = document.getElementById("crew");
const statusElement = document.getElementById("status");

async function loadGame() {
    try {
        const response = await fetch("/api/game");

        if (!response.ok) {
            throw new Error("Failed to load game");
        }

        const game = await response.json();

        renderGame(game);
    } catch (error) {
        console.error(error);

        statusElement.textContent =
            "Could not connect to the game server.";
    }
}

function renderGame(game) {
    statusElement.textContent =
        `Round ${game.round} • ${game.phase}`;

    crewContainer.innerHTML = "";

    for (const player of game.players) {
        const card = document.createElement("div");

        card.className = "crew-member";

        if (!player.alive) {
            card.style.opacity = "0.4";
        }

        card.innerHTML = `
            <div
                class="name"
                style="color: ${player.color}"
            >
                ${player.name}
            </div>

            <div class="info">
                Personality: ${player.personality}
            </div>

            <div class="info">
                Location: ${player.location}
            </div>

            <div class="info">
                Status: ${player.alive ? "Alive" : "Dead"}
            </div>
        `;

        crewContainer.appendChild(card);
    }
}

loadGame();

setInterval(loadGame, 2000);
