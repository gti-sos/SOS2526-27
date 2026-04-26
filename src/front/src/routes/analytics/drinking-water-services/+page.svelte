<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    const API = '/api/v1/drinking-water-services';

    async function loadChart() {
        const res = await fetch(API);
        if (res.ok) {
            const data = await res.json();

            // 1. AGRUPACIÓN: Sumamos la población urbana por entidad
            // Usamos Number(val) || 0 para convertir "-" o vacíos en 0
            const grouped = data.reduce((acc, s) => {
                const entity = s.entity;
                if (!acc[entity]) acc[entity] = 0;
                
                const val = Number(s.wat_bas_pop_residence_urban) || 0;
                acc[entity] += val;
                
                return acc;
            }, {});

            const entities = Object.keys(grouped).sort();
            const seriesData = entities.map(e => grouped[e]);

            Highcharts.chart('final-chart', {
                chart: { 
                    type: 'area', 
                    backgroundColor: '#fdfdfd'
                },
                title: { text: 'Análisis de Población Urbana con Agua Potable' },
                subtitle: { text: 'Datos agregados de población con servicio básico por entidad' },
                xAxis: {
                    categories: entities,
                    crosshair: true,
                    title: { text: 'País / Entidad' }
                },
                yAxis: {
                    title: { text: 'Población total acumulada' }
                },
                tooltip: { 
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y:,.0f}</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                series: [{
                    name: 'Población con servicio',
                    data: seriesData,
                    color: '#3498db'
                }]
            });
        }
    }

    onMount(loadChart);
</script>

<main class="container">
    <header class="header">
        <h1>Análisis de Servicios de Agua</h1>
        <button class="btn-back" onclick={() => window.location.href = '/drinking-water-services'}>
            ⬅ Volver al listado
        </button>
    </header>

    <div id="final-chart"></div>
    
    <p class="footer-text">
        💧 Gráfico comparativo de la población urbana con acceso a servicios básicos, agregada por entidad geográfica.
    </p>
</main>

<style>
    .container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    h1 {
        color: #333;
        margin: 0;
        font-size: 1.8rem;
    }

    #final-chart {
        width: 100%;
        height: 550px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        border-radius: 12px;
        padding: 10px;
        background: white;
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