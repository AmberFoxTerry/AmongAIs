const crew = [
    { name: "Bob", color: "#e74c3c", personality: "paranoid" },
    { name: "Alice", color: "#3498db", personality: "calm" },
    { name: "Dave", color: "#2ecc71", personality: "aggressive" },
    { name: "Terry", color: "#f1c40f", personality: "chaotic" },
    { name: "Max", color: "#9b59b6", personality: "logical" },
    { name: "Luna", color: "#e67e22", personality: "friendly" },
    { name: "Sam", color: "#1abc9c", personality: "quiet" },
    { name: "Alex", color: "#e91e63", personality: "suspicious" },
    { name: "Charlie", color: "#95a5a6", personality: "confident" },
    { name: "Jack", color: "#8e44ad", personality: "confused" }
];

const crewContainer = document.getElementById("crew");

function createCrewUI() {
    crewContainer.innerHTML = "";

    for (const member of crew) {
        const card = document.createElement("div");
        card.className = "crew-member";

        card.innerHTML = `
            <div class="name" style="color: ${member.color}">
                ${member.name}
            </div>
            <div class="info">
                Personality: ${member.personality}
            </div>
        `;

        crewContainer.appendChild(card);
    }
}

createCrewUI();

fetch("/api/status")
    .then(response => response.json())
    .then(data => {
        document.getElementById("status").textContent =
            `Server: ${data.status} | Game: ${data.game}`;
    })
    .catch(() => {
        document.getElementById("status").textContent =
            "Server connection failed.";
    });
