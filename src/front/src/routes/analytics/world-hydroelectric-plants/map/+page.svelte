<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts/highmaps';
    import worldMap from '@highcharts/map-collection/custom/world.topo.json';

    const API = '/api/v1/world-hydroelectric-plants';
    let plants = [];

    async function loadMap() {
        const res = await fetch(API);
        if (res.ok) {
            plants = await res.json();

            const dataByCountry = plants.reduce((acc, plant) => {
                const countryName = plant.country;
                if (!acc[countryName]) {
                    acc[countryName] = 0;
                }
                acc[countryName] += Number(plant.capacity_mw);
                return acc;
            }, {});

            const mapData = Object.entries(dataByCountry).map(([country, value]) => ({
                name: country.trim(), 
                value: value
            }));

            Highcharts.mapChart('map-container', {
                chart: { 
                    map: worldMap,
                    backgroundColor: 'transparent' // Para que luzca bien con el fondo del contenedor
                },
                title: { text: 'Capacidad Hidroeléctrica por País' },
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom',
                    width: 600, 
                    symbolWidth: 500 
                },
                colorAxis: {
                    min: 0,
                    minColor: '#EFEFFF',
                    maxColor: '#000022',
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
                        hover: { color: '#a4edba' }
                    },
                    tooltip: { valueSuffix: ' MW' }
                }]
            });
        }
    }

    onMount(loadMap);
</script>

<main class="container">
    <header class="header">
        <h1>Visualización Geoespacial</h1>
        <button class="btn-back" onclick={() => window.location.href = '/world-hydroelectric-plants'}>
            ⬅ Volver al listado
        </button>
    </header>

    <div id="map-container"></div>
    
    <p class="footer-text">
        🌍 El mapa muestra la capacidad/potencia total (MW) generada por las centrales hydroeléctricas en cada país.
    </p>
</main>

<style>
    /* Estilo unificado con la gráfica individual */
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
        box-shadow: 0 4px 15px rgba(0,0,0,0.08); /* Sombra suave */
        border-radius: 12px; /* Bordes redondeados */
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