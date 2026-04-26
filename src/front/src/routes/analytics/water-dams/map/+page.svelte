<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts/highmaps';
    import worldMap from '@highcharts/map-collection/custom/world.topo.json';

    const API = '/api/v1/water-dams';
    let dams = [];

    async function loadMap() {
        const res = await fetch(API);
        if (res.ok) {
            dams = await res.json();

            // 1. DICCIONARIO DE MAPEO (IMPORTANTE)
            // Highcharts es estricto con los nombres. Si tu API dice "United States" 
            // y Highcharts espera "United States of America", añade aquí el cambio:
            const nameMap = {
    "United States": "United States of America", // <--- AÑADE ESTA LÍNEA
    "Americas (WHO)": "United States of America" // Mantén esta si la tenías
};

            // 2. AGRUPACIÓN Y SUMA:
            // Sumamos la capacidad (cap_mcm) por cada país
            const dataByCountry = dams.reduce((acc, d) => {
                let countryName = nameMap[d.country] || d.country;

                if (!acc[countryName]) {
                    acc[countryName] = 0;
                }
                
                acc[countryName] += Number(d.cap_mcm) || 0;
                return acc;
            }, {});

            const mapData = Object.entries(dataByCountry).map(([country, value]) => ({
                name: country.trim(), 
                value: value
            }));

            // 3. CONFIGURACIÓN DEL MAPA
            Highcharts.mapChart('map-container', {
                chart: { 
                    map: worldMap,
                    backgroundColor: 'transparent'
                },
                title: { text: 'Capacidad de Presas por País (mcm)' },
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom',
                    width: 600, 
                    symbolWidth: 500 
                },
                colorAxis: {
                    min: 0,
                    minColor: '#e1f5fe', // Azul claro
                    maxColor: '#01579b', // Azul oscuro
                    labels: {
                        formatter: function () {
                            return this.axis.defaultLabelFormatter.call(this);
                        },
                        style: { textOverflow: 'none' }
                    }
                },
                plotOptions: {
                    map: {
                        allAreas: true, 
                        dataLabels: { enabled: false }
                    }
                },
                series: [{
                    data: mapData,
                    name: 'Capacidad Total',
                    joinBy: ['name', 'name'], 
                    states: {
                        hover: { color: '#81d4fa' }
                    },
                    tooltip: { valueSuffix: ' mcm' }
                }]
            });
        }
    }

    onMount(loadMap);
</script>

<main class="container">
    <header class="header">
        <h1>Mapa de Presas</h1>
        <button class="btn-back" onclick={() => window.location.href = '/water-dams'}>
            ⬅ Volver al listado
        </button>
    </header>

    <div id="map-container"></div>
    
    <p class="footer-text">
        🌍 El mapa muestra la capacidad total (mcm) de las presas por país.
    </p>
</main>

<style>
    .container { 
        padding: 30px; 
        max-width: 1200px; 
        margin: 0 auto; 
        font-family: sans-serif; 
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
    }

    h1 {
        color: #333;
        margin: 0;
        font-size: 1.8rem;
    }

    #map-container {
        width: 100%;
        height: 600px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        border-radius: 12px;
        border: 1px solid #ddd;
        background: #fdfdfd;
        padding: 10px;
    }

    .btn-back {
        background-color: #6c757d;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.3s;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .btn-back:hover {
        background-color: #5a6268;
    }

    .footer-text {
        margin-top: 15px;
        color: #777;
        font-size: 0.9rem;
        font-style: italic;
    }
</style>