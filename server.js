const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (req, res) => {
res.json({
status: "online",
game: "AI Among Us"
});
});

app.listen(PORT, () => {
console.log(`AI Among Us running on port ${PORT}`);
});
