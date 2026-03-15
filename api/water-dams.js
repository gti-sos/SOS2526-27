// 1. PARCHE DE COMPATIBILIDAD (Añade esto arriba)
const util = require('util');
if (!util.isDate) {
    util.isDate = (obj) => Object.prototype.toString.call(obj) === '[object Date]';
}
if (!util.isRegExp) {
    util.isRegExp = (obj) => Object.prototype.toString.call(obj) === '[object RegExp]';
}
//fff
const express = require("express");
const router = express.Router();
const Datastore = require("nedb");
const path = require("path");

// Configuración de la Base de Datos NeDB
const db = new Datastore({ 
    filename: "./water-dams.db", 
    autoload: true });

// DATOS INICIALES (ACN)
const initial_dams = [
    { grand_id: 1, dam_name: "Terror-Lake", river: "Terror river", country: "United States", year: 1984, dam_hgt: 59, dam_len: 747, area_skm: 4, cap_mcm: 121, depth_m: 33.2, dis_avg_ls: 2608 },
    { grand_id: 2, dam_name: "Mayo", river: "Mayo", country: "Canada", year: 1952, dam_hgt: 11, dam_len: 539, area_skm: 8, cap_mcm: 112, depth_m: 64.8, dis_avg_ls: 15463 },
    { grand_id: 3, dam_name: "Blue-Lake", river: "Sawmill Creek", country: "United States", year: 1961, dam_hgt: 44, dam_len: 784, area_skm: 8, cap_mcm: 179.1, depth_m: 36.8, dis_avg_ls: 8031 },
    { grand_id: 4, dam_name: "Green-Lake", river: "Vodopad River", country: "United States", year: 1982, dam_hgt: 64, dam_len: 141, area_skm: 4, cap_mcm: 115.9, depth_m: 28, dis_avg_ls: 745 },
    { grand_id: 5, dam_name: "Long-Lake-Dam", river: "Long River", country: "United States", year: 1973, dam_hgt: 9, dam_len: 103, area_skm: 5, cap_mcm: 181.3, depth_m: 30.7, dis_avg_ls: 5865 },
    { grand_id: 6, dam_name: "W.A.C.-Bennett", river: "Peace", country: "Canada", year: 1967, dam_hgt: 183, dam_len: 2042, area_skm: 17, cap_mcm: 79743, depth_m: 43.2, dis_avg_ls: 116745 },
    { grand_id: 7, dam_name: "Peace-Canyon", river: "Peace", country: "Canada", year: 1980, dam_hgt: 61, dam_len: 533, area_skm: 8, cap_mcm: 215.9, depth_m: 25.2, dis_avg_ls: 117544 },
    { grand_id: 8, dam_name: "Swan-Lake", river: "Falls Creek", country: "United States", year: 1984, dam_hgt: 53, dam_len: 146, area_skm: 5, cap_mcm: 15, depth_m: 3, dis_avg_ls: 5639 },
    { grand_id: 9, dam_name: "Master-Canyon", river: "Peace", country: "Canada", year: 1988, dam_hgt: 45, dam_len: 241, area_skm: 2, cap_mcm: 5, depth_m: 39, dis_avg_ls: 115831 },
    { grand_id: 10, dam_name: "Spoon-Lake", river: "Miley river", country: "United States", year: 1992, dam_hgt: 37, dam_len: 628, area_skm: 5, cap_mcm: 49, depth_m: 27.2, dis_avg_ls: 25193 }
];

// LOAD INITIAL DATA
router.get("/loadInitialData", (req, res) => {
    console.log("--> Intentando cargar datos...");
    
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).send("Error al limpiar la DB");

        // El truco del JSON.parse/stringify evita que NeDB use funciones problemáticas
        const damsToInsert = JSON.parse(JSON.stringify(initial_dams));

        db.insert(damsToInsert, (err, newDocs) => {
            if (err) {
                console.error("ERROR al insertar:", err);
                return res.status(500).send("Error al insertar datos");
            }
            console.log(`--> ¡ÉXITO! Se han cargado ${newDocs.length} registros.`);
            res.sendStatus(201);
        });
    });
});

// GET COLECCIÓN + FILTROS + PAGINACIÓN
router.get("/", (req, res) => {
    let query = {};

    // Filtros por campos
    if (req.query.country) query.country = req.query.country;
    if (req.query.dam_name) query.dam_name = req.query.dam_name;
    if (req.query.year) query.year = Number(req.query.year);
    if (req.query.grand_id) query.grand_id = Number(req.query.grand_id);

    // Filtro por rango de años
    if (req.query.from && req.query.to) {
        query.year = {
            $gte: Number(req.query.from),
            $lte: Number(req.query.to)
        };
    }

    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);

    let cursor = db.find(query, { _id: 0 });

    if (limit) cursor = cursor.limit(limit);
    if (offset) cursor = cursor.skip(offset);

    cursor.exec((err, docs) => {
        res.status(200).json(docs);
    });
});

// GET RECURSO CONCRETO
router.get("/:dam_name/:year", (req, res) => {
    const dam_name = req.params.dam_name;
    const year = Number(req.params.year);

    db.findOne({ dam_name: dam_name, year: year }, { _id: 0 }, (err, doc) => {
        if (doc) {
            res.status(200).json(doc);
        } else {
            res.sendStatus(404);
        }
    });
});

// POST COLECCIÓN
router.post("/", (req, res) => {
    const newData = req.body;
    const campos = [
        "grand_id", "dam_name", "river", "country", "year",
        "dam_hgt", "dam_len", "area_skm", "cap_mcm", "depth_m", "dis_avg_ls"
    ];

    if (!newData) return res.sendStatus(400);

    // Verificación de estructura estricta (Requisito F06)
    const faltan = campos.some(c => !newData.hasOwnProperty(c));
    const extra = Object.keys(newData).some(c => !campos.includes(c));

    if (faltan || extra) return res.sendStatus(400);

    db.findOne({ dam_name: newData.dam_name, year: newData.year }, (err, doc) => {
        if (doc) {
            res.sendStatus(409);
        } else {
            db.insert(newData);
            res.sendStatus(201);
        }
    });
});

// PUT RECURSO
router.put("/:dam_name/:year", (req, res) => {
    const dam_name = req.params.dam_name;
    const year = Number(req.params.year);
    const updated = req.body;
    
    const campos = [
        "grand_id", "dam_name", "river", "country", "year",
        "dam_hgt", "dam_len", "area_skm", "cap_mcm", "depth_m", "dis_avg_ls"
    ];

    const faltan = campos.some(c => !updated.hasOwnProperty(c));

    if (faltan) return res.sendStatus(400);

    // Consistencia de identificadores
    if (updated.dam_name !== dam_name || updated.year !== year) {
        return res.sendStatus(400);
    }

    db.update({ dam_name: dam_name, year: year }, updated, {}, (err, numUpdated) => {
        if (numUpdated === 0) {
            res.sendStatus(404);
        } else {
            res.sendStatus(200);
        }
    });
});

// DELETE RECURSO
router.delete("/:dam_name/:year", (req, res) => {
    const dam_name = req.params.dam_name;
    const year = Number(req.params.year);

    db.remove({ dam_name: dam_name, year: year }, {}, (err, numRemoved) => {
        if (numRemoved === 0) {
            res.sendStatus(404);
        } else {
            res.sendStatus(200);
        }
    });
});

// DELETE COLECCIÓN
router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, () => {
        res.sendStatus(200);
    });
});

// MÉTODOS PROHIBIDOS
router.put("/", (req, res) => res.sendStatus(405));
router.post("/:dam_name/:year", (req, res) => res.sendStatus(405));

// DOCS (Debes poner aquí tu URL pública de Postman)
router.get("/docs", (req, res) => {
    res.redirect("https://alecamsan-2184820.postman.co/workspace/7ab012a8-1c1d-4f9e-8bd7-af0bfec1f825/collection/52243900-87162e18-1763-4e4b-810c-8929c77b04a3?action=share&source=copy-link&creator=52243900");
});

// EXPORTAR MÓDULO
module.exports = router;