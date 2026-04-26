<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    const API = '/api/v1/drinking-water-services';
    let data = [];

    async function loadChart() {
        const res = await fetch(API);
        if (res.ok) {
            data = await res.json();
            
            // Procesamos los datos: 
            // Usaremos el nombre de la entidad y el año como categoría
            const categories = data.map(item => `${item.entity} (${item.year})`);
            const seriesData = data.map(item => item.wat_bas_pop_residence_urban);

            Highcharts.chart('chart-container', {
                chart: {
                    type: 'column' // Tipo distinto a 'line' y 'area'
                },
                title: {
                    text: 'Población Urbana con Servicio Básico de Agua'
                },
                subtitle: {
                    text: 'Fuente: API Drinking Water Services'
                },
                xAxis: {
                    categories: categories,
                    title: { text: 'Entidad y Año' },
                    labels: { rotation: -45 } // Rotamos para que se lean bien
                },
                yAxis: {
                    min: 0,
                    title: { text: 'Porcentaje / Población' }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y}</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                series: [{
                    name: 'Población con servicio',
                    data: seriesData,
                    color: '#007bff'
                }]
            });
        } else {
            console.error("Error al cargar los datos de la API");
        }
    }

    onMount(loadChart);
</script>

<main class="container">
    <h1>Analítica: Drinking Water Services</h1>
    <div id="chart-container"></div>
    
    <div class="actions">
        <button class="btn-back" onclick={() => window.location.href = '/drinking-water-services'}>
            Volver al listado
        </button>
    </div>
</main>

<style>
    .container { padding: 20px; font-family: sans-serif; }
    #chart-container {
        width: 100%;
        height: 500px;
        margin-top: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
    }
    .actions { margin-top: 20px; text-align: center; }
    .btn-back { 
        padding: 10px 20px; 
        cursor: pointer; 
        background: #6c757d; 
        color: white; 
        border: none; 
        border-radius: 4px;
    }
</style>