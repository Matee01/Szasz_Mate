const express = require("express");
const fs = require("fs/promises");
const pool = require("./db");
const app = express();
app.use(express.json());
app.get("/teszt", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS teszt");
        res.json(rows);
    } catch (err) {
        res.status(500).json(err);
    }
});

const FILE = "./adatok.json";
async function readData() {
    const data = await fs.readFile(FILE, "utf8");
    return JSON.parse(data);
}
async function writeData(data) {
    await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}
app.get("/osztalyok", async (req, res) => {
    const data = await readData();
    res.json(data.osztalyok);
});
app.post("/osztalyok", async (req, res) => {
    const data = await readData();

    const ujOsztaly = {
        id: data.osztalyok.length > 0
            ? Math.max(...data.osztalyok.map(o => o.id)) + 1
            : 1,
        nev: req.body.nev,
        szak: req.body.szak,
        evfolyam: req.body.evfolyam
    };

    data.osztalyok.push(ujOsztaly);

    await writeData(data);

    res.status(201).json(ujOsztaly);
});
app.get("/osztalyok/:id/diakok", async (req, res) => {
    const data = await readData();

    const id = Number(req.params.id);

    const diakok = data.diakok.filter(
        d => d.osztaly_id === id
    );

    res.json(diakok);
});
app.get("/diakok", async (req, res) => {
    const data = await readData();

    const result = data.diakok.map(diak => {
        const osztaly = data.osztalyok.find(
            o => o.id === diak.osztaly_id
        );

        return {
            ...diak,
            osztaly_nev: osztaly ? osztaly.nev : null
        };
    });

    res.json(result);
});
app.post("/diakok", async (req, res) => {
    const data = await readData();

    const osztaly = data.osztalyok.find(
        o => o.id === req.body.osztaly_id
    );

    if (!osztaly) {
        return res.status(400).json({
            hiba: "Nem létező osztály!"
        });
    }

    const ujDiak = {
        id: data.diakok.length > 0
            ? Math.max(...data.diakok.map(d => d.id)) + 1
            : 1,
        nev: req.body.nev,
        email: req.body.email,
        osztaly_id: req.body.osztaly_id
    };

    data.diakok.push(ujDiak);

    await writeData(data);

    res.status(201).json(ujDiak);
});
app.delete("/diakok/:id", async (req, res) => {
    const data = await readData();

    const id = Number(req.params.id);

    data.diakok = data.diakok.filter(
        d => d.id !== id
    );

    await writeData(data);

    res.json({
        uzenet: "Diák törölve"
    });
});
app.delete("/osztalyok/:id", async (req, res) => {
    const data = await readData();

    const id = Number(req.params.id);

    const vanDiak = data.diakok.some(
        d => d.osztaly_id === id
    );

    if (vanDiak) {
        return res.status(400).json({
            hiba: "Az osztályhoz tartozik diák!"
        });
    }

    data.osztalyok = data.osztalyok.filter(
        o => o.id !== id
    );

    await writeData(data);

    res.json({
        uzenet: "Osztály törölve"
    });
});

app.listen(3000, () => {
    console.log("A szerver fut a 3000-es porton");
});