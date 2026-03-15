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
const waterDams = require("./api/water-dams"); 
app.use("/api/v1/water-dams", waterDams);
// FIN BLOQUE ACN



app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});

