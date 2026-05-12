import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url'; 
import { dirname } from 'path';  
import {handler} from './src/front/build/handler.js';
import request from 'request';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

app.use(express.json());


//BLOQUE ACS
import drinkingWaterServicesV1 from './src/back/drinking-water-services-v1.js';

app.use("/api/v1/drinking-water-services", drinkingWaterServicesV1);


//FIN BLOQUE ACS

// BLOQUE APS

import worldHydroelectricPlants from './src/back/world-hydroelectric-plants.js';

app.use("/api/v1/world-hydroelectric-plants", worldHydroelectricPlants);

// PROXY
// Ruta Proxy para Nobel Prize
app.get("/api/v1/nobel-prize", (req, res) => {
    fetch("https://api.nobelprize.org/v1/laureate.json")
        .then(response => response.json())
        .then(data => {
            res.json(data);
        })
        .catch(error => {
            res.status(500).send("Error en el proxy");
        });
});
// FIN PROXY

// FIN BLOQUE APS


// BLOQUE ACN
import waterDams from './src/back/water-dams.js'; 
app.use("/api/v1/water-dams", waterDams);
// FIN BLOQUE ACN


app.use(handler);

app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});

