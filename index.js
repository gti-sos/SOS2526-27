const express = require("express");
const path = require("path"); 
const app = express();
const port = process.env.PORT || 10000;


app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

//BLOQUE ACS
const drinkingWaterServices = require("./api/drinking-water-services");

app.use("/api/v1/drinking-water-services", drinkingWaterServices);

//FIN BLOQUE ACS

// BLOQUE APS

const worldHydroelectricPlants = require("./api/world-hydroelectric-plants");

app.use("/api/v1/world-hydroelectric-plants", worldHydroelectricPlants);

// FIN BLOQUE APS


// BLOQUE ACN

// 1. Datos iniciales ACN (Presas)
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

let water_dams = [];

// Ruta de muestra con el algoritmo
app.get("/samples/ACN", (req, res) => {
    const valorGeografico = "Canada";
    const subconjunto = initial_dams.filter(f => f.country === valorGeografico);
    let suma = 0;
    subconjunto.forEach(f => { suma += f.dam_hgt; });
    const media = suma / subconjunto.length;
    res.send(`La media de la altura de las presas (dam_hgt) en ${valorGeografico} es: ${media.toFixed(2)}`);
});
const ACN_API_URL = "/api/v1/water-dams";

// Load Initial Data ACN
app.get(ACN_API_URL + "/loadInitialData", (req, res) => {
    if (water_dams.length === 0) {
        water_dams = [...initial_dams];
        res.sendStatus(201); // 201 Created
    } else {
        // Cambiamos el 400 por el 409 para ser coherentes con el grupo
        res.status(409).send("Conflict: El array ya tiene datos."); 
    }
});

// GET Colección (con filtros opcionales)
app.get(ACN_API_URL, (req, res) => {
    let filtrados = [...water_dams];
    const { country, year } = req.query;
    if (country) filtrados = filtrados.filter(d => d.country.toLowerCase() === country.toLowerCase());
    if (year) filtrados = filtrados.filter(d => d.year == year);
    res.status(200).json(filtrados);
});

// POST Colección
app.post(ACN_API_URL, (req, res) => {
    const newData = req.body;
    if (!newData || !newData.dam_name || !newData.year || !newData.country) {
        return res.sendStatus(400); // Bad Request
    }
    const existe = water_dams.some(d => d.dam_name === newData.dam_name && d.year === newData.year);
    if (existe) {
        res.sendStatus(409); // Conflict
    } else {
        water_dams.push(newData);
        res.sendStatus(201); // Created
    }
});

// GET Recurso concreto (Nombre y Año)
app.get(ACN_API_URL + "/:dam_name/:year", (req, res) => {
    const { dam_name, year } = req.params;
    const recurso = water_dams.find(d => d.dam_name.toLowerCase() === dam_name.toLowerCase() && d.year == year);
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.sendStatus(404);
    }
});

// PUT Recurso concreto
app.put(ACN_API_URL + "/:dam_name/:year", (req, res) => {
    const { dam_name, year } = req.params;
    const updatedData = req.body;
    if (updatedData.dam_name !== dam_name || updatedData.year !== Number(year)) {
        return res.sendStatus(400);
    }
    const index = water_dams.findIndex(d => d.dam_name.toLowerCase() === dam_name.toLowerCase() && d.year == year);
    if (index !== -1) {
        water_dams[index] = updatedData;
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// DELETE Recurso concreto
app.delete(ACN_API_URL + "/:dam_name/:year", (req, res) => {
    const { dam_name, year } = req.params;
    const longitud = water_dams.length;
    water_dams = water_dams.filter(d => !(d.dam_name.toLowerCase() === dam_name.toLowerCase() && d.year == year));
    if (water_dams.length < longitud) {
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// DELETE Colección completa
app.delete(ACN_API_URL, (req, res) => {
    water_dams = [];
    res.sendStatus(200);
});

// Métodos no permitidos
app.put(ACN_API_URL, (req, res) => res.sendStatus(405));
app.post(ACN_API_URL + "/:dam_name/:year", (req, res) => res.sendStatus(405));

// FIN BLOQUE ACN



app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});

