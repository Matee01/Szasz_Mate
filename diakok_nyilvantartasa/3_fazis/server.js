const express = require("express");
const pool = require("./db");
const app = express();
app.use(express.json());
app.get("/osztalyok", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM osztalyok"
        );

        res.status(200).json(rows);

    } catch (err) {
        res.status(500).json({
            hiba: err.message
        });
    }
});
app.post("/osztalyok", async (req, res) => {
    try {
        const { nev, szak, evfolyam } = req.body;

        if (!nev || !szak || !evfolyam) {
            return res.status(400).json({
                hiba: "Hiányzó adatok!"
            });
        }

        await pool.query(
            "INSERT INTO osztalyok (nev, szak, evfolyam) VALUES (?, ?, ?)",
            [nev, szak, evfolyam]
        );

        res.status(201).json({
            uzenet: "Osztály létrehozva"
        });

    } catch (err) {
        res.status(500).json({
            hiba: err.message
        });
    }
});
app.delete("/osztalyok/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const [diakok] = await pool.query(
            "SELECT * FROM diakok WHERE osztaly_id = ?",
            [id]
        );

        if (diakok.length > 0) {
            return res.status(409).json({
                hiba: "Az osztály nem üres!"
            });
        }

        await pool.query(
            "DELETE FROM osztalyok WHERE id = ?",
            [id]
        );

        res.status(204).send();

    } catch (err) {
        res.status(500).json({
            hiba: err.message
        });
    }
});
app.get("/osztalyok/:id/diakok", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM diakok WHERE osztaly_id = ?",
            [req.params.id]
        );

        res.status(200).json(rows);

    } catch (err) {
        res.status(500).json({
            hiba: err.message
        });
    }
});
app.get("/diakok", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                d.id,
                d.nev,
                d.email,
                d.osztaly_id,
                o.nev AS osztaly_nev
            FROM diakok d
            INNER JOIN osztalyok o
            ON d.osztaly_id = o.id
        `);

        res.status(200).json(rows);

    } catch (err) {
        res.status(500).json({
            hiba: err.message
        });
    }
});
app.post("/diakok", async (req, res) => {
    try {
        const { nev, email, osztaly_id } = req.body;

        if (!nev || !email || !osztaly_id) {
            return res.status(400).json({
                hiba: "Hiányzó adatok!"
            });
        }

        const [osztaly] = await pool.query(
            "SELECT * FROM osztalyok WHERE id = ?",
            [osztaly_id]
        );

        if (osztaly.length === 0) {
            return res.status(400).json({
                hiba: "Nem létező osztály!"
            });
        }

        await pool.query(
            "INSERT INTO diakok (nev, email, osztaly_id) VALUES (?, ?, ?)",
            [nev, email, osztaly_id]
        );

        res.status(201).json({
            uzenet: "Diák létrehozva"
        });

    } catch (err) {
        res.status(500).json({
            hiba: err.message
        });
    }
});
app.listen(3000, () => {
    console.log("A szerver fut a 3000-es porton");
});