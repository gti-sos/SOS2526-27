<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    const API = '/api/v1/world-hydroelectric-plants';

    async function loadChart() {
        const res = await fetch(API);
        if (res.ok) {
            const plants = await res.json();

            // 1. AGRUPACIÓN: Sumamos los valores por país
            const grouped = plants.reduce((acc, p) => {
                const c = p.country;
                if (!acc[c]) acc[c] = { head: 0, cap: 0, vol: 0 };
                acc[c].head += Number(p.head_m || 0);
                acc[c].cap += Number(p.capacity_mw || 0);
                acc[c].vol += Number(p.res_vol_km3 || 0);
                return acc;
            }, {});

            const countries = Object.keys(grouped).sort();

            Highcharts.chart('final-chart', {
                chart: { 
                    type: 'column', // <--- Cambiado a columnas para mejor comparativa
                    backgroundColor: '#fdfdfd'
                },
                title: { text: 'Análisis Comparativo por País' },
                subtitle: { text: 'Datos consolidados de Potencia, Salto y Almacenamiento' },
                xAxis: {
                    categories: countries,
                    crosshair: true,
                    title: { text: 'País' }
                },
                yAxis: [{ // Eje Izquierdo
                    title: { text: 'Potencia (MW) y Salto (m)' },
                }, { // Eje Derecho
                    title: { text: 'Volumen Total (km³)' },
                    opposite: true
                }],
                tooltip: { shared: true },
                series: [{
                    name: 'Salto Total (m)',
                    data: countries.map(c => grouped[c].head),
                    color: '#f1c40f',
                    yAxis: 0
                }, {
                    name: 'Capacidad Total (MW)',
                    data: countries.map(c => grouped[c].cap),
                    color: '#3498db',
                    yAxis: 0
                }, {
                    name: 'Volumen Total (km³)',
                    data: countries.map(c => grouped[c].vol),
                    color: '#e74c3c',
                    yAxis: 1 // Usando el eje derecho para que se vea perfecto
                }]
            });
        }
    }

    onMount(loadChart);
</script>

<main class="container">
    <header class="header">
        <h1>Análisis de Centrales Hidroeléctricas</h1>
        <button class="btn-back" onclick={() => window.location.href = '/world-hydroelectric-plants'}>
            ⬅ Volver al listado
        </button>
    </header>

    <div id="final-chart"></div>
</main>

<style>
    .container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
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
</style>