const Datastore = require("nedb");

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
        res.status(409).send("Conflict: El array ya tiene datos."); // 409 Conflict
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
app.get(BASE_API_URL + "/world-hydroelectric-plants/:name/:year", (req, res) => {
    const name = decodeURIComponent(req.params.name); // Decodifica los %20
    const year = req.params.year;
    
    const recurso = world_hydroelectric_plants.find(d => 
        d.name.trim().toLowerCase() === name.trim().toLowerCase() && d.year == year
    );
    
    if (recurso) {
        res.status(200).json(recurso); // 200 Ok
    } else {
        res.sendStatus(404); // 404 Not Found si no existe
    }
});

// POST Colección
app.post(BASE_API_URL + "/world-hydroelectric-plants", (req, res) => {
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
    const existe = world_hydroelectric_plants.some(d => d.year === newData.year && d.name === newData.name);
    if (existe) {
        res.sendStatus(409); // Conflict 
    } else {
        world_hydroelectric_plants.push(newData);
        res.sendStatus(201); // Created
    }
});

// PUT Recurso concreto
app.put(BASE_API_URL + "/world-hydroelectric-plants/:name/:year", (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const year = Number(req.params.year);
    const updatedData = req.body;

    // FILTRO 1: ¿Están todos los campos esperados? (Regla del 400 por campos)
    const camposEsperados = ["country", "name", "year", "river", "plant_type", "capacity_mw", "head_m", "dam_name", "res_vol_km3"];
    const faltanCampos = camposEsperados.some(campo => !updatedData.hasOwnProperty(campo));
    
    if (faltanCampos) {
        return res.sendStatus(400); // 400 Bad Request
    }

    // FILTRO 2: ¿Coincide el ID de la URL con el del Body? (Regla del 400 por ID)
    if (updatedData.name.trim().toLowerCase() !== name.trim().toLowerCase() || updatedData.year !== year) {
        return res.sendStatus(400); // 400 Bad Request
    }

    // FILTRO 3: ¿Existe el recurso en mi lista? (Regla del 404)
    const index = world_hydroelectric_plants.findIndex(d => 
        d.name.trim().toLowerCase() === name.trim().toLowerCase() && d.year == year
    );

    if (index !== -1) {
        world_hydroelectric_plants[index] = updatedData;
        res.sendStatus(200); // 200 Ok
    } else {
        res.sendStatus(404); // 404 Not Found
    }
});

// DELETE Recurso concreto
app.delete(BASE_API_URL + "/world-hydroelectric-plants/:name/:year", (req, res) => {
    const { name, year } = req.params;
    const inicial = world_hydroelectric_plants.length;
    world_hydroelectric_plants = world_hydroelectric_plants.filter(d => 
        !(d.name.trim().toLowerCase() === name.trim().toLowerCase() && d.year == year)
    );
    if (world_hydroelectric_plants.length < inicial) {
        res.sendStatus(200); // 200 Ok
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
app.post(BASE_API_URL + "/world-hydroelectric-plants/:name/:year", (req, res) => res.sendStatus(405)); // 405 Method not Allowed
