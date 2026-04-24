<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';
    
    const API = '/api/v1/world-hydroelectric-plants';
    let plants = [];

    async function loadChart() {
        const res = await fetch(API);
        if (res.ok) {
            plants = await res.json();
            
            const sortedPlants = plants.sort((a, b) => a.year - b.year);
            
            const categories = sortedPlants.map(p => `${p.name} (${p.year})`);
            const capacityData = sortedPlants.map(p => p.capacity_mw);
            const headData = sortedPlants.map(p => p.head_m);

            Highcharts.chart('chart-container', {
                chart: {
                    type: 'area' 
                },
                title: {
                    text: 'Análisis de Capacidad y Salto de Agua'
                },
                subtitle: {
                    text: 'Fuente: API World Hydroelectric Plants'
                },
                xAxis: {
                    categories: categories,
                    tickmarkPlacement: 'on',
                    title: { enabled: false }
                },
                yAxis: {
                    title: { text: 'Valores' }
                },
                tooltip: {
                    split: true,
                    valueSuffix: ' unidades'
                },
                plotOptions: {
                    area: {
                        stacking: 'normal',
                        lineColor: '#666666',
                        lineWidth: 1,
                        marker: {
                            lineWidth: 1,
                            lineColor: '#666666'
                        }
                    }
                },
                series: [{
                    name: 'Capacidad (MW)',
                    data: capacityData
                }, {
                    name: 'Salto de agua (m)',
                    data: headData
                }]
            });
        }
    }

    onMount(loadChart);
</script>

<main class="container">
    <h1>Visualización de Centrales Hidroeléctricas</h1>
    <div id="chart-container"></div>
    
    <div class="actions">
        <button class="btn-back" onclick={() => window.location.href = '/world-hydroelectric-plants'}>
            Volver al listado
        </button>
    </div>
</main>

<style>
    .container { padding: 20px; }
    #chart-container {
        width: 100%;
        height: 500px;
        margin-top: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
    }
    .actions { margin-top: 20px; text-align: center; }
    .btn-back { padding: 10px 20px; cursor: pointer; }
</style>