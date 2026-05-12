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
// Ruta Proxy para Nobel Stats
app.get("/api/v1/nobel-prize", async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch("https://api.nobelprize.org/v1/laureate.json");
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error en el proxy de Nobel:", error);
        res.status(500).send("Error al obtener datos del Nobel");
    }
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

