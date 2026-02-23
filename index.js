const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// 1. Datos iniciales
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


app.get("/samples/ACS", (req, res) => {
    const entidad_seleccionada = "Algeria"; 
    const filtrada = drinking_water_services.filter(d => 
        d.entity === entidad_seleccionada && d.wat_bas_pop_residence_urban !== null 
    );
    const media = filtrada.reduce((acumulador, d) => acumulador + d.wat_bas_pop_residence_urban, 0) / filtrada.length;
    
    res.send(`La media de wat_bas_pop_residence_urban en Algeria es ${media}`);
});



app.get("/api/v1/drinking-water-services", (req, res) => {
    let filtrados = [...drinking_water_services];
    const { entity, year, from, to } = req.query;

    if (entity) filtrados = filtrados.filter(d => d.entity.toLowerCase() === entity.toLowerCase());
    if (year) filtrados = filtrados.filter(d => d.year == year);
    if (from && to) filtrados = filtrados.filter(d => d.year >= from && d.year <= to);

    res.status(200).json(filtrados); 
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
        res.sendStatus(201); 
    } else {
        res.status(400).send("Bad Request: El array ya tiene datos.");
    }
});

app.post("/api/v1/drinking-water-services", (req, res) => {
    const newData = req.body;
    if (!newData || !newData.entity || !newData.year || !newData.code) {
        res.status(400).send("Bad Request: Faltan campos.");
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
    res.sendStatus(200); 
});


app.get("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    const { entity, year } = req.params;
    const recurso = drinking_water_services.find(d => d.entity.toLowerCase() === entity.toLowerCase() && d.year == year);
    if (recurso) {
        res.status(200).json(recurso); // Devuelve OBJETO {}
    } else {
        res.status(404).send("Not Found");
    }
});

app.put("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    const { entity, year } = req.params;
    const updatedData = req.body;
    
    if (updatedData.entity !== entity || updatedData.year != year) {
        return res.status(400).send("Bad Request: Los datos no coinciden.");
    }

    const index = drinking_water_services.findIndex(d => d.entity.toLowerCase() === entity.toLowerCase() && d.year == year);
    if (index !== -1) {
        drinking_water_services[index] = updatedData;
        res.sendStatus(200);
    } else {
        res.status(404).send("Not Found");
    }
});

app.delete("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    const { entity, year } = req.params;
    const initialLength = drinking_water_services.length;
    drinking_water_services = drinking_water_services.filter(d => !(d.entity.toLowerCase() === entity.toLowerCase() && d.year == year));
    
    if (drinking_water_services.length < initialLength) {
        res.sendStatus(200);
    } else {
        res.status(404).send("Not Found");
    }
});


app.post("/api/v1/drinking-water-services/:entity/:year", (req, res) => res.sendStatus(405));
app.put("/api/v1/drinking-water-services", (req, res) => res.sendStatus(405));

app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});