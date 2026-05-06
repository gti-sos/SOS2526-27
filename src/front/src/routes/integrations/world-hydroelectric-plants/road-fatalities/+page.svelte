<script>
    import { onMount } from 'svelte';
    import ApexCharts from 'apexcharts';

    let chart;

    async function loadIntegration() {
        // 1. Fetch manual a ambas APIs
        const resMy = await fetch('/api/v1/world-hydroelectric-plants');
        const resOther = await fetch('https://sos2526-11.onrender.com/api/v2/road-fatalities');

        if (resMy.ok && resOther.ok) {
            const myData = await resMy.json();
            const otherData = await resOther.json();

            // 2. Procesamiento para cruzar datos por País/Nación
            // Filtramos para obtener solo los países que están en AMBAS APIs
            const commonData = myData.reduce((acc, plant) => {
                const roadStat = otherData.find(r => 
                    r.nation.toLowerCase().trim() === plant.country.toLowerCase().trim()
                );
                
                if (roadStat) {
                    acc.push({
                        x: plant.capacity_mw,      // Eje X: Tu capacidad hidroeléctrica
                        y: roadStat.total_death,   // Eje Y: Sus muertes totales
                        country: plant.country
                    });
                }
                return acc;
            }, []);

            // 3. Configuración del Widget (ApexCharts - Scatter)
            const options = {
                chart: {
                    type: 'scatter', // NO ES LINE
                    height: 500,
                    zoom: { enabled: true, type: 'xy' }
                },
                title: {
                    text: 'Relación: Capacidad Hidroeléctrica vs Muertes en Tráfico',
                    align: 'center'
                },
                series: [{
                    name: "Países coincidentes",
                    data: commonData.map(d => ({ x: d.x, y: d.y }))
                }],
                xaxis: {
                    title: { text: 'Capacidad Hidroeléctrica (MW)' },
                    labels: { formatter: (val) => parseFloat(val).toFixed(0) }
                },
                yaxis: {
                    title: { text: 'Total Muertes Tráfico' }
                },
                tooltip: {
                    custom: function({dataPointIndex}) {
                        const d = commonData[dataPointIndex];
                        return `<div style="padding:10px;">
                            <b>${d.country.toUpperCase()}</b><br/>
                            Capacidad: ${d.x} MW<br/>
                            Muertes: ${d.y}
                        </div>`;
                    }
                }
            };

            chart = new ApexCharts(document.querySelector("#chart-road"), options);
            chart.render();
        }
    }

    onMount(loadIntegration);
</script>

<main class="container">
    <header class="header">
        <h1>Integración SOS: Road Fatalities (G11)</h1>
        <button class="btn-back" onclick={() => window.history.back()}>⬅ Volver</button>
    </header>

    <div id="chart-road"></div>
    
    <div class="info">
        <p>📊 <strong>Lógica de integración:</strong> Se comparan los países comunes en ambas bases de datos. El eje horizontal muestra la potencia hidroeléctrica (nuestros datos) y el eje vertical las muertes totales por tráfico (Grupo 11).</p>
    </div>
</main>

<style>
    .container { padding: 30px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    #chart-road { 
        background: white; 
        padding: 20px; 
        border-radius: 12px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
    }
    .btn-back { padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .info { margin-top: 20px; color: #555; line-height: 1.5; background: #f8f9fa; padding: 15px; border-radius: 8px; }
</style>