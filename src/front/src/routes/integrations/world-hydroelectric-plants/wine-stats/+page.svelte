<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';

    async function loadIntegration() {
        // 1. Fetch manual a ambas APIs
        const resMy = await fetch('/api/v1/world-hydroelectric-plants');
        const resOther = await fetch('https://sos2526-29.onrender.com/api/v1/wine-stats');

        if (resMy.ok && resOther.ok) {
            const myData = await resMy.json();
            const wineData = await resOther.json();

            // 2. Procesamiento: Agrupamos y promediamos precios por país
            // También sumamos tu capacidad por país
            const countries = [...new Set(myData.map(d => d.country.toLowerCase()))]
                .filter(c => wineData.some(w => w.country.toLowerCase() === c));

            const finalData = countries.map(country => {
                const myPlants = myData.filter(d => d.country.toLowerCase() === country);
                const wines = wineData.filter(w => w.country.toLowerCase() === country);
                
                return {
                    country: country.toUpperCase(),
                    capacity: myPlants.reduce((acc, p) => acc + Number(p.capacity_mw), 0),
                    avgPrice: (wines.reduce((acc, w) => acc + Number(w.price), 0) / wines.length).toFixed(2)
                };
            });

            // 3. Configuración del Widget (ECharts)
            const chartDom = document.getElementById('chart-wine');
            const myChart = echarts.init(chartDom);
            
            const option = {
                title: { text: 'Capacidad Energética vs Precio Medio del Vino', left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: ['Capacidad (MW)', 'Precio Vino (€)'], top: '10%' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', boundaryGap: [0, 0.01] },
                yAxis: { type: 'category', data: finalData.map(d => d.country) },
                series: [
                    {
                        name: 'Capacidad (MW)',
                        type: 'bar', // CUMPLE: No es line
                        data: finalData.map(d => d.capacity),
                        itemStyle: { color: '#3498db' }
                    },
                    {
                        name: 'Precio Vino (€)',
                        type: 'bar',
                        data: finalData.map(d => d.avgPrice),
                        itemStyle: { color: '#e67e22' }
                    }
                ]
            };

            myChart.setOption(option);
        }
    }

    onMount(loadIntegration);
</script>

<main class="container">
    <header class="header">
        <h1>Integración SOS: Wine Stats (G29)</h1>
        <button class="btn-back" onclick={() => window.history.back()}>⬅ Volver</button>
    </header>

    <div id="chart-wine"></div>
    
    <div class="info-box">
        <p>🍷 <strong>Análisis de integración:</strong> Cruzamos nuestra base de datos de energía hidroeléctrica con los precios de vinos del Grupo 29. Buscamos correlaciones curiosas entre la infraestructura energética de un país y el coste de sus productos vinícolas.</p>
    </div>
</main>

<style>
    .container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    
    #chart-wine { 
        width: 100%; 
        height: 600px; 
        background: white; 
        border-radius: 12px; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        padding: 20px;
    }

    .btn-back { 
        background: #6c757d; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 6px; 
        cursor: pointer; 
        font-weight: bold;
    }

    .info-box { 
        margin-top: 20px; 
        background: #fff3cd; 
        padding: 15px; 
        border-left: 5px solid #ffc107; 
        border-radius: 4px;
    }
</style>