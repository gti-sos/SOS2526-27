const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// 1. Datos (Variable global con let para permitir borrado/carga)
let drinking_water_services = [
    { entity: "Afghanistan", code: "AFG", year: 2000, wat_bas_pop_residence_urban: 1564933.9 },
    { entity: "Afghanistan", code: "AFG", year: 2001, wat_bas_pop_residence_urban: 1583404 },
    { entity: "Americas (WHO)", code: "WHO_AMR", year: 2003, wat_bas_pop_residence_urban: 72906260 },
    { entity: "Americas (WHO)", code: "WHO_AMR", year: 2004, wat_bas_pop_residence_urban: 74281944 },
    { entity: "Angola", code: "AGO", year: 2007, wat_bas_pop_residence_urban: null },
    { entity: "Angola", code: "AGO", year: 2008, wat_bas_pop_residence_urban: null },
    { entity: "Algeria", code: "DZA", year: 2019, wat_bas_pop_residence_urban: 6242828 },
    { entity: "Algeria", code: "DZA", year: 2020, wat_bas_pop_residence_urban: 6882381.5 },
    { entity: "Antigua and Barbuda", code: "ATG", year: 2020, wat_bas_pop_residence_urban: null },
    { entity: "Antigua and Barbuda", code: "ATG", year: 2021, wat_bas_pop_residence_urban: null },
    { entity: "Antigua and Barbuda", code: "ATG", year: 2022, wat_bas_pop_residence_urban: null }
];

// --- RUTA DEL ALGORITMO (Tu forma de hacer la media intacta) ---
app.get("/samples/ACS", (req, res) => {
    const entidad_seleccionada = "Algeria"; 
    const filtrada = drinking_water_services.filter(d => 
        d.entity === entidad_seleccionada && d.wat_bas_pop_residence_urban !== null 
    );
    const media = filtrada.reduce((acumulador, d) => acumulador + d.wat_bas_pop_residence_urban, 0) / filtrada.length;
    
    res.send(`La media de wat_bas_pop_residence_urban en Algeria es ${media}`);
});

// --- API REST: MÉTODOS SOBRE LA LISTA COMPLETA ---

app.get("/api/v1/drinking-water-services", (req, res) => {
    res.status(200).json(drinking_water_services);
});

app.get("/api/v1/drinking-water-services/loadInitialData", (req, res) => {
    if (drinking_water_services.length === 0) {
        drinking_water_services = [
            { entity: "Afghanistan", code: "AFG", year: 2000, wat_bas_pop_residence_urban: 1564933.9 },
            { entity: "Afghanistan", code: "AFG", year: 2001, wat_bas_pop_residence_urban: 1583404 },
            { entity: "Americas (WHO)", code: "WHO_AMR", year: 2003, wat_bas_pop_residence_urban: 72906260 },
            { entity: "Americas (WHO)", code: "WHO_AMR", year: 2004, wat_bas_pop_residence_urban: 74281944 },
            { entity: "Angola", code: "AGO", year: 2007, wat_bas_pop_residence_urban: null },
            { entity: "Angola", code: "AGO", year: 2008, wat_bas_pop_residence_urban: null },
            { entity: "Algeria", code: "DZA", year: 2019, wat_bas_pop_residence_urban: 6242828 },
            { entity: "Algeria", code: "DZA", year: 2020, wat_bas_pop_residence_urban: 6882381.5 },
            { entity: "Antigua and Barbuda", code: "ATG", year: 2020, wat_bas_pop_residence_urban: null },
            { entity: "Antigua and Barbuda", code: "ATG", year: 2021, wat_bas_pop_residence_urban: null }
        ];
        res.sendStatus(201); // 201 Created
    } else {
        res.status(400).send("Bad Request: El array no está vacío.");
    }
});

app.post("/api/v1/drinking-water-services", (req, res) => {
    const newData = req.body;
    if (!newData.entity || !newData.year || !newData.code || newData.wat_bas_pop_residence_urban === undefined) {
        res.status(400).send("Bad Request: Faltan campos en el objeto.");
    } else {
        const existe = drinking_water_services.some(d => d.entity === newData.entity && d.year === newData.year);
        if (existe) {
            res.status(409).send("Conflict: El recurso ya existe.");
        } else {
            drinking_water_services.push(newData);
            res.sendStatus(201);
        }
    }
});

app.delete("/api/v1/drinking-water-services", (req, res) => {
    drinking_water_services = [];
    res.sendStatus(200); // OK
});

// --- API REST: MÉTODOS SOBRE UN RECURSO CONCRETO (Tabla Azul) ---

app.get("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    const { entity, year } = req.params;
    const recurso = drinking_water_services.find(d => d.entity.toLowerCase() === entity.toLowerCase() && d.year == year);
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).send("Not Found: El recurso no existe.");
    }
});

app.put("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    const { entity, year } = req.params;
    const updatedData = req.body;
    
    // El ID (entidad/año) del cuerpo debe coincidir con el de la URL
    if (updatedData.entity !== entity || updatedData.year != year) {
        res.status(400).send("Bad Request: Los datos no coinciden con la URL.");
        return;
    }

    const index = drinking_water_services.findIndex(d => d.entity.toLowerCase() === entity.toLowerCase() && d.year == year);
    if (index !== -1) {
        drinking_water_services[index] = updatedData;
        res.sendStatus(200);
    } else {
        res.status(404).send("Not Found: El recurso no existe.");
    }
});

app.delete("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    const { entity, year } = req.params;
    const initialLength = drinking_water_services.length;
    drinking_water_services = drinking_water_services.filter(d => !(d.entity.toLowerCase() === entity.toLowerCase() && d.year == year));
    
    if (drinking_water_services.length < initialLength) {
        res.sendStatus(200);
    } else {
        res.status(404).send("Not Found: No se encontró para borrar.");
    }
});

// --- MANEJO DE MÉTODOS NO PERMITIDOS ---
app.post("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    res.status(405).send("Method Not Allowed");
});
app.put("/api/v1/drinking-water-services", (req, res) => {
    res.status(405).send("Method Not Allowed");
});

app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});