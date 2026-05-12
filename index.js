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
app.get('/api/v1/proxy-worldbank', async (req, res) => {
    // URL según pág. 10 de tus apuntes [cite: 110]
    const url = "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=300&date=2022";
    
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            res.json(data); // Enviamos los datos al front-end [cite: 114]
        } else {
            res.status(response.status).send("Error en la API externa");
        }
    } catch (error) {
        res.status(500).send("Error interno del servidor proxy");
    }
});
// FIN PROXY

// FIN BLOQUE APS


// BLOQUE ACN
import waterDams from './src/back/water-dams.js'; 
app.use("/api/v1/water-dams", waterDams);
// PROXY PARA GRUPO 15
app.get('/api/v1/proxy-g15', async (req, res) => {
    // URL de la API del compañero del Grupo 15
    const url = "https://sos2526-15.onrender.com/api/v1/population-densities";
    
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            // Enviamos los datos al front-end como si vinieran de nuestro servidor
            res.json(data); 
        } else {
            res.status(response.status).send("Error al contactar con la API del Grupo 15");
        }
    } catch (error) {
        console.error("Error en Proxy G15:", error);
        res.status(500).send("Error interno en el servidor proxy");
    }
});
// FIN BLOQUE ACN


app.use(handler);

app.listen(port, () => {
    console.log(`Servidor funcionando en puerto ${port}`);
});

