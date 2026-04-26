<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts/highmaps';
    import worldMap from '@highcharts/map-collection/custom/world.topo.json';

    const API = '/api/v1/drinking-water-services';
    let services = [];

    async function loadMap() {
        const res = await fetch(API);
        if (res.ok) {
            services = await res.json();

            // 1. Diccionario de mapeo: "Nombre del API" -> "Nombre que reconoce Highcharts"
            const nameMap = {
                "Americas (WHO)": "United States", // Mapeo solicitado para normalización
                // Puedes añadir más aquí si detectas nombres que no se pintan
            };

            // Lista de entidades a ignorar (no son países físicos)
            const invalidEntities = ["Europe", "Asia", "Total", "World"];

            // 2. AGRUPACIÓN:
            const dataByCountry = services.reduce((acc, s) => {
                // Obtenemos el nombre mapeado o el original
                let countryName = nameMap[s.entity] || s.entity;

                // Si está en la lista negra, lo ignoramos
                if (invalidEntities.includes(countryName)) return acc;

                if (!acc[countryName]) {
                    acc[countryName] = 0;
                }
                
                // Sumamos valor, asegurando que sea número
                acc[countryName] += Number(s.wat_bas_pop_residence_urban) || 0;
                return acc;
            }, {});

            const mapData = Object.entries(dataByCountry).map(([country, value]) => ({
                name: country.trim(), 
                value: value
            }));

            Highcharts.mapChart('map-container', {
                chart: { 
                    map: worldMap,
                    backgroundColor: 'transparent'
                },
                title: { text: 'Población Urbana con Agua Potable' },
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom',
                    width: 600, 
                    symbolWidth: 500 
                },
                colorAxis: {
                    min: 0,
                    minColor: '#e0f7fa',
                    maxColor: '#006064',
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
                    name: 'Población con servicio',
                    joinBy: ['name', 'name'], 
                    states: {
                        hover: { color: '#81d4fa' }
                    },
                    tooltip: { valueSuffix: ' hab.' }
                }]
            });
        }
    }

    onMount(loadMap);
</script>

<main class="container">
    <header class="header">
        <h1>Visualización Geoespacial</h1>
        <button class="btn-back" onclick={() => window.location.href = '/drinking-water-services'}>
            ⬅ Volver al listado
        </button>
    </header>

    <div id="map-container"></div>
    
    <p class="footer-text">
        💧 El mapa muestra la población urbana con acceso a servicios básicos de agua potable, agrupada por país.<br>
        <em>Nota: Los datos de 'Americas (WHO)' han sido mapeados a 'United States' para su representación geoespacial.</em>
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