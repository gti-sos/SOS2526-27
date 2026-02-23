const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// La variable fuera para que todas las rutas la compartan
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

// --- RUTA DEL ALGORITMO (Tu lógica exacta) ---
app.get("/samples/ACS", (req, res) => {
    const entidad_seleccionada= "Algeria"; 

    const filtrada= drinking_water_services.filter(d => 
        d.entity ===entidad_seleccionada && d.wat_bas_pop_residence_urban!==null 
    );

    const media= filtrada.reduce((acumulador,d) => acumulador +d.wat_bas_pop_residence_urban,0 ) / filtrada.length;

    console.log(`La media de wat_bas_pop_residence_urban en ${entidad_seleccionada} es  ${media} `);

    res.send(`La media de wat_bas_pop_residence_urban en Algeria es ${media}`);
});

// --- API REST: drinking-water-services ---

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
        res.sendStatus(201); 
    } else {
        res.status(400).send("El array ya tiene datos.");
    }
});

app.post("/api/v1/drinking-water-services", (req, res) => {
    const newData = req.body;
    if (!newData.entity || !newData.year || !newData.code) {
        res.status(400).send("Faltan campos obligatorios (entity, code o year)");
    } else {
        drinking_water_services.push(newData);
        res.sendStatus(201); 
    }
});

app.delete("/api/v1/drinking-water-services", (req, res) => {
    drinking_water_services = [];
    res.sendStatus(200); 
});

app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});