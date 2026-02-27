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

const datos_aps = [
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

    let filtrar_por_pais = datos_aps.filter(d => 
    d.country===pais && d.capacity_mw!=null);

    let media = filtrar_por_pais.reduce((a,d) =>
    a+d.capacity_mw,0)/filtrar_por_pais.length;

    res.send("La media de capacity_mw en " + pais + " es: " + media);
})

// FIN BLOQUE APS

app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});

app.get("/cool", (req, res) => {
    console.log("Nueva petición a /cool");
    res.send(`<html><body><h1>" ${cool()}  "</h1></body></html>`);
});