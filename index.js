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
const drinkingWaterServicesV1 = require("./api/drinking-water-services-v1");

app.use("/api/v1/drinking-water-services", drinkingWaterServicesV1);
const drinkingWaterServicesV2 = require("./api/drinking-water-services-v2");

app.use("/api/v2/drinking-water-services", drinkingWaterServicesV2);

//FIN BLOQUE ACS

// BLOQUE APS

const worldHydroelectricPlants = require("./api/world-hydroelectric-plants");

app.use("/api/v1/world-hydroelectric-plants", worldHydroelectricPlants);

// FIN BLOQUE APS


// BLOQUE ACN
const waterDams = require("./api/water-dams"); 
app.use("/api/v1/water-dams", waterDams);
// FIN BLOQUE ACN



app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});

