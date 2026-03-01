const express = require("express");
const path = require("path"); 
const app = express();
const port = process.env.PORT || 10000;
const cool = require("cool-ascii-faces");

app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));


app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});
// 1. Datos iniciales ACS
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
app.use("/", express.static("public"));


app.get("/samples/ACS", (req, res) => {
    const entidad_seleccionada = "Algeria"; 
    const filtrada = drinking_water_services.filter(d => 
        d.entity === entidad_seleccionada && d.wat_bas_pop_residence_urban !== null 
    );
    const media = filtrada.reduce((acumulador, d) => acumulador + d.wat_bas_pop_residence_urban, 0) / filtrada.length;
    
    res.send(`La media de wat_bas_pop_residence_urban en Algeria es ${media}`);
});

//Aqui empiezan los get

app.get("/api/v1/drinking-water-services", (req, res) => {
    let filtrados = [...drinking_water_services];
    //otra forma posible 
    // let filtrados= drinking_water_services.slice();
    const { entity, year, from, to } = req.query;
    //Es lo mismo que hacer const entity=req.query.entity; etc


    if (entity) filtrados = filtrados.filter(d => d.entity.toLocaleLowerCase()===entity.toLocaleLowerCase());
    if (year) filtrados = filtrados.filter(d => d.year == year);
    if (from && to) filtrados = filtrados.filter(d => d.year >= from && d.year <= to);

    res.status(200).json(filtrados); 
});

app.get("/api/v1/drinking-water-services/loadInitialData", (req, res) => {
    if (drinking_water_services.length === 0) //Es decir no hay ningun elemento
    {
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
    //Comprueba si falta un campo
    if (!newData || !newData.entity || !newData.year || !newData.code) {
        res.status(400).send("Bad Request: Faltan campos.");
    } else {
        //Si no falta un campo 
        const existe = drinking_water_services.some(d => d.entity === newData.entity && d.year === newData.year);
        if (existe) {
            //Si ya existe evita duplicados
            res.status(409).send("Conflicto: El recurso ya existe.");
        } else {
            //Si no existe lo añade
            drinking_water_services.push(newData);
            res.sendStatus(201); 
        }
    }
});

app.delete("/api/v1/drinking-water-services", (req, res) => {
    drinking_water_services = [];//Array vacio 
    res.sendStatus(200); 
});


app.get("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    const { entity, year } = req.params;
    const recurso = drinking_water_services.find(d => d.entity.toLowerCase() === entity.toLowerCase() && d.year == year);
    if (recurso) {
        res.status(200).json(recurso); // Devuelve objeto {}
    } else {
        res.status(404).send("Not Found");
    }
});

app.put("/api/v1/drinking-water-services/:entity/:year", (req, res) => {
    const { entity, year } = req.params;
    const updatedData = req.body;
    
    if (updatedData.entity !== entity || updatedData.year !== Number(year)) {
        //Si los datos no coinciden con los actuales
        return res.status(400).send("Bad Request: Los datos no coinciden.");
    }

    const index = drinking_water_services.findIndex(d => d.entity.toLowerCase() === entity.toLowerCase() && d.year == year);
   //Si existe el elemento
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
    
    //Si el tamaño es distinto que el inicial significa que filtró
    if (drinking_water_services.length < initialLength) {
        res.sendStatus(200);
    } else {
        res.status(404).send("Not Found");
    }
});


app.post("/api/v1/drinking-water-services/:entity/:year", (req, res) => res.sendStatus(405));
app.put("/api/v1/drinking-water-services", (req, res) => res.sendStatus(405));

// BLOQUE APS

// 1. Datos iniciales APS

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

app.get("/samples/APS", (req,res) => {
    const pais = "Afghanistan";

    let filtrar_por_pais = plants.filter(d => 
    d.country===pais && d.capacity_mw!=null);

    let media = filtrar_por_pais.reduce((a,d) =>
    a+d.capacity_mw,0)/filtrar_por_pais.length;

    res.send("La media de capacity_mw en " + pais + " es: " + media);
})

const BASE_API_URL = "/api/v1";
let world_hydroelectric_plants = [];

// Carga de datos iniciales
app.get(BASE_API_URL + "/world-hydroelectric-plants/loadInitialData", (req, res) => {
    if (world_hydroelectric_plants.length === 0) {
        world_hydroelectric_plants = [...plants];
        res.sendStatus(201); // 201 Created
    } else {
        res.status(400).send("Bad Request: El array ya tiene datos."); // 400 Bad Request
    }
});

// GET Colección y Búsquedas (from/to, country, year) -> Retorna ARRAY
app.get(BASE_API_URL + "/world-hydroelectric-plants", (req, res) => {
    
    let filtrados = [...world_hydroelectric_plants];
    const { country, year, from, to } = req.query;

    if (country) filtrados = filtrados.filter(d => d.country.toLowerCase() === country.toLowerCase());
    if (year) filtrados = filtrados.filter(d => d.year == year);
    if (from && to) filtrados = filtrados.filter(d => d.year >= from && d.year <= to);

    res.status(200).json(filtrados); // 200 OK
});

// GET Búsqueda por país con periodo -> Retorna ARRAY
app.get(BASE_API_URL + "/world-hydroelectric-plants/:country", (req, res) => {
    const { country } = req.params;
    const { from, to } = req.query;
    let filtrados = world_hydroelectric_plants.filter(d => d.country.toLowerCase() === country.toLowerCase());

    if (from && to) filtrados = filtrados.filter(d => d.year >= from && d.year <= to);

    res.status(200).json(filtrados); // 200 OK
});

// GET Recurso concreto -> Retorna OBJECT
app.get(BASE_API_URL + "/world-hydroelectric-plants/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const recurso = world_hydroelectric_plants.find(d => d.country.toLowerCase() === country.toLowerCase() && d.year == year);
    if (recurso) {
        res.status(200).json(recurso); // 200 OOK
    } else {
        res.sendStatus(404); // 404 NOT FOUND
    }
});

// POST Colección
app.post(BASE_API_URL + "/world-hydroelectric-plants", (req, res) => {
    const newData = req.body;
    if (!newData || !newData.country || !newData.year || !newData.name) {
        return res.sendStatus(400); // Bad Request
    }
    const existe = world_hydroelectric_plants.some(d => d.country === newData.country && d.year === newData.year && d.name === newData.name);
    if (existe) {
        res.sendStatus(409); // Conflict 
    } else {
        world_hydroelectric_plants.push(newData);
        res.sendStatus(201); // Created
    }
});

// PUT Recurso concreto
app.put(BASE_API_URL + "/world-hydroelectric-plants/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const updatedData = req.body;
    if (updatedData.country !== country || updatedData.year !== Number(year)) {
        return res.sendStatus(400); // 400 Bad Request
    }
    const index = world_hydroelectric_plants.findIndex(d => d.country.toLowerCase() === country.toLowerCase() && d.year == year);
    if (index !== -1) {
        world_hydroelectric_plants[index] = updatedData;
        res.sendStatus(200); // 200 OK
    } else {
        res.sendStatus(404); // 404 Not Found
    }
});

// DELETE Recurso concreto
app.delete(BASE_API_URL + "/world-hydroelectric-plants/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const longitud = world_hydroelectric_plants.length;
    world_hydroelectric_plants = world_hydroelectric_plants.filter(d => !(d.country.toLowerCase() === country.toLowerCase() && d.year == year));
    if (world_hydroelectric_plants.length < longitud) {
        res.sendStatus(200); // 200 OK
    } else {
        res.sendStatus(404); // 404 Not Found
    }
});

// DELETE Colección completa
app.delete(BASE_API_URL + "/world-hydroelectric-plants", (req, res) => {
    world_hydroelectric_plants = [];
    res.sendStatus(200); // 200 OK
});

// MÉTODOS PROHIBIDOS (405)
app.put(BASE_API_URL + "/world-hydroelectric-plants", (req, res) => res.sendStatus(405)); // 405 Method not Allowed
app.post(BASE_API_URL + "/world-hydroelectric-plants/:country/:year", (req, res) => res.sendStatus(405)); // 405 Method not Allowed

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

// Load Initial Data
app.get(ACN_API_URL + "/loadInitialData", (req, res) => {
    if (water_dams.length === 0) {
        water_dams = [...initial_dams];
        res.sendStatus(201);
    } else {
        res.status(400).send("El array ya tiene datos.");
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

app.get("/cool", (req, res) => {
    console.log("Nueva petición a /cool");
    res.send(`<html><body><h1>" ${cool()}  "</h1></body></html>`);
});

app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});
