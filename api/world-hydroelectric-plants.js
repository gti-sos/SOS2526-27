const express = require("express");
const router = express.Router();
const Datastore = require("nedb");

const db = new Datastore({ 
    filename: "./world-hydroelectric-plants.db", 
    autoload: true });

// 1. Datos iniciales

const plants = [
    {country:"Afghanistan", name: "Kajaki Hydroelectric Power Plant Afghanistan", year: 1975, river: "Helmand", plant_type: "STO", capacity_mw: 151, head_m: 90, dam_name: "Kajakai", res_vol_km3: 2.68},
    {country:"Afghanistan", name: "Mahipar Hydroelectric Power Plant Afghanistan", year: 1967, river: "Kabul", plant_type: "STO", capacity_mw: 66, head_m: 334, dam_name: "Mahipar dam", res_vol_km3: 0.0002},
    {country:"Afghanistan", name: "Naghlu Dam Hydroelectric Power Plant Afghanistan", year: 1967, river: "Kabul", plant_type: "ROR", capacity_mw: 100, head_m: 61, dam_name: "Naghlu", res_vol_km3: 0.5},
    {country:"Argentina", name: "NIHUIL II", year: 1968, river: "Atuel", plant_type: "STO", capacity_mw: 133.12, head_m: 179.75, dam_name: "Nihuil II", res_vol_km3: 0.00067},
    {country:"Argentina", name: "NIHUIL III", year: 1972, river: "Rio Atuel", plant_type: "STO", capacity_mw: 52, head_m: 75.75, dam_name: "NIHUIL III", res_vol_km3: 0.0008},
    {country:"Austria", name: "Obervermuntwerk II", year: 2019, river: null, plant_type: "PS", capacity_mw: 360, head_m: 291, dam_name: "Silvrettasee dam", res_vol_km3: 0.00731},
    {country:"Austria", name: "Roßhag Rosshag-KW - Rosshag Pumped Storage Power Plant Austria", year: 1972, river: "Zamser Bach", plant_type: "STO", capacity_mw: 231, head_m: 630, dam_name: "Schlegeis", res_vol_km3: 129},
    {country:"Brazil", name: "Bariri (Álvaro de Souza Lima)", year: 1969, river: "Tiete", plant_type: "ROR", capacity_mw: 136.8, head_m: 24, dam_name: "Bariri", res_vol_km3: 0.96},
    {country:"Brazil", name: "Barra Grande", year: 2005, river: "Petolas", plant_type: "STO", capacity_mw: 698.25, head_m: 154, dam_name: "Barra Grande", res_vol_km3: 5},
    {country:"Canada", name: "Waneta", year: 1954, river: "Pend d'Oreille", plant_type: "ROR", capacity_mw: 493.2, head_m: 63.2, dam_name: "Waneta", res_vol_km3: 0.0376},
    {country:"Canada", name: "Waneta Expansion", year: 2015, river: "Pend d'Oreille", plant_type: "ROR", capacity_mw: 335, head_m: 63.2, dam_name: "Waneta", res_vol_km3: 0.0376},
    
];

let world_hydroelectric_plants = [];

// Carga de datos iniciales
router.get("/loadInitialData", (req, res) => {
    db.count({}, (err,count) => {
        if(count===0){
            db.insert(plants, (err, newDocs) => {
                res.sendStatus(201); // 201 Created
            }); 
        }  else {
        res.status(409).send("Conflict: El array ya tiene datos."); // 409 Conflict
        }
    });
});


// GET Colección y Búsquedas 
router.get("/", (req, res) => {
    
    let query = {};
    let limit = parseInt(req.query.limit);
    let offset = parseInt(req.query.offset);
    const { country, name, year, river, plant_type, 
        capacity_mw, head_m, dam_name, res_vol_km3, from, to} = req.query;

    if (country) query.country = country;
    if (name) query.name = name;
    if (river) query.river = river;
    if (plant_type) query.plant_type = plant_type;
    if (dam_name) query.dam_name = dam_name;
     
    if (year) query.year = Number(year);
    if (capacity_mw) query.capacity_mw = Number(capacity_mw);
    if (head_m) query.head_m = Number(head_m);
    if (res_vol_km3) query.res_vol_km3 = Number(res_vol_km3);
    if (from && to) query.year = { $gte: Number(from), $lte: Number(to) };

    let limitValue = parseInt(limit) || 100; // Por defecto 100 si no se envía
    let offsetValue = parseInt(offset) || 0;

    db.find(query, { _id: 0 }).skip(offsetValue).limit(limitValue).exec((err, plants) => {
        res.status(200).json(plants); // 200 OK
    });
});

/*  GET Búsqueda por país con periodo -> Retorna ARRAY
router.get("/:country", (req, res) => {
    const { country } = req.params;
    const { from, to } = req.query;
    let filtrados = world_hydroelectric_plants.filter(d => d.country.toLowerCase() === country.toLowerCase());

    if (from && to) filtrados = filtrados.filter(d => d.year >= from && d.year <= to);

    res.status(200).json(filtrados); // 200 OK
});*/

// GET Recurso concreto -> Retorna OBJECT
router.get("/:name/:year", (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const year = Number(req.params.year);
    
    db.findOne({ name: name, year: year }, { _id: 0 }, (err, plant) => {
        if (plant) {
            res.status(200).json(plant); // 200 OK
        } else {
            res.sendStatus(404); // 404 Not Found 
        }
    });
});

// POST Colección
router.post("/", (req, res) => {
    const newData = req.body;
    // 1. Campos obligatorios
    const camposObligatorios = ["country", "name", "year", "river", "plant_type", "capacity_mw", "head_m", "dam_name", "res_vol_km3"];
    
    // 2. Comprobar si falta alguno
    const faltanCampos = camposObligatorios.some(campo => !newData.hasOwnProperty(campo));
    
    // 3. Comprobar si sobran campos extra
    const llavesRecibidas = Object.keys(newData);
    const tieneCamposExtra = llavesRecibidas.some(llave => !camposObligatorios.includes(llave));

    if (faltanCampos || tieneCamposExtra) {
        return res.sendStatus(400); // 400 Bad Request
    }
    
    db.findOne({ name: newData.name, year: newData.year }, (err, exist) => {
        if (exist) {
            res.sendStatus(409); // 209 Conflict
        } else {
            db.insert(newData, (err, doc) => {
                res.sendStatus(201); // 201 Created 
            });
        }
    });
});

// PUT Recurso concreto
router.put("/:name/:year", (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const year = Number(req.params.year);
    const updatedData = req.body;

    // FILTRO 1: ¿Están todos los campos esperados? (Regla del 400 por campos)
    const camposEsperados = ["country", "name", "year", "river", "plant_type", "capacity_mw", "head_m", "dam_name", "res_vol_km3"];
    const faltanCampos = camposEsperados.some(campo => !updatedData.hasOwnProperty(campo));
    const llavesRecibidas = Object.keys(updatedData);
    const tieneCamposExtra = llavesRecibidas.some(llave => !camposEsperados.includes(llave));

    if (faltanCampos || tieneCamposExtra) {
        return res.status(400).send("Bad Request: El JSON no tiene la estructura exacta esperada."); // 400 Bad Request
    }

    // FILTRO 2: ¿Coincide el ID de la URL con el del Body? (Regla del 400 por ID)
    if (updatedData.name.trim().toLowerCase() !== name.trim().toLowerCase() || updatedData.year !== year) {
        return res.status(400).send("Bad Request: El ID del recurso no coincide con los datos del cuerpo."); // 400 Bad Request
    }

    // FILTRO 3: ¿Existe el recurso en mi lista? (Regla del 404)
    db.update({ name: name, year: year }, { $set: updatedData }, {}, (err, numReplaced) => {
        if (numReplaced === 0) {
            res.sendStatus(404); // 404 Not Found 
        } else {
            res.sendStatus(200); // 200 OK 
        }
    });
});

// DELETE Recurso concreto
router.delete("/:name/:year", (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const year = Number(req.params.year);
    db.remove({ name: name, year: year }, {}, (err, numRemoved) => {
        if (numRemoved === 0) {
            res.sendStatus(404); // 404 Not Found 
        } else {
            res.sendStatus(200); // 200 OK 
        }
    });
});

// DELETE Colección completa
router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        res.sendStatus(200); // 200 OK 
    });
});

// MÉTODOS PROHIBIDOS (405)
router.put("/", (req, res) => res.sendStatus(405)); // 405 Method not Allowed
router.post("/:name/:year", (req, res) => res.sendStatus(405)); // 405 Method not Allowed

// DOCS
router.get("/docs",(req,res)=>{
    res.redirect("https://documenter.getpostman.com/view/52298948/2sBXigMDpo");
});

// Exportar modulo

module.exports = router;