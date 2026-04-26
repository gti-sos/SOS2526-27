<script>
    import { onMount } from 'svelte';

    // Esto desactiva el renderizado en servidor para evitar el error de "SeriesRegistry"
    export const ssr = false;

    let chartContainer;

    onMount(async () => {
        try {
            // 1. Importación dinámica (cargamos las librerías solo en el navegador)
            const HighchartsModule = await import('highcharts');
            const Highcharts = HighchartsModule.default;
            
            const MoreModule = await import('highcharts/highcharts-more');
            const addMore = MoreModule.default || MoreModule;
            
            // Inicializar módulo "more" de forma segura
            if (typeof addMore === 'function') {
                addMore(Highcharts);
            }

            // 2. Obtención de datos
            const res = await fetch('/api/v1/water-dams');
            if (!res.ok) throw new Error('Error al conectar con la API');
            
            const dams = await res.json();
            
            // 3. Preparación de datos para burbujas
            const seriesData = dams.map(d => ({
                name: d.dam_name || 'Sin nombre',
                x: Number(d.cap_mcm || 0),
                y: Number(d.dam_hgt || 0),
                z: Number(d.dam_len || 0)
            }));

            // 4. Renderizado del gráfico
            Highcharts.chart(chartContainer, {
                chart: { 
                    type: 'bubble', 
                    plotBorderWidth: 1, 
                    zoomType: 'xy' 
                },
                title: { text: 'Análisis de Presas: Capacidad vs Altura vs Longitud' },
                xAxis: { title: { text: 'Capacidad (mcm)' } },
                yAxis: { title: { text: 'Altura (m)' } },
                tooltip: {
                    useHTML: true,
                    pointFormat: '<b>{point.name}</b><br>Capacidad: {point.x} mcm<br>Altura: {point.y} m<br>Longitud: {point.z} m'
                },
                series: [{ 
                    name: 'Presas',
                    data: seriesData, 
                    color: '#2563eb' 
                }]
            });
        } catch (error) {
            console.error("Error crítico en el gráfico:", error);
        }
    });
</script>

<main class="container">
    <h1>Visualización de Presas</h1>
    
    <div class="nav-links">
        <a href="/analytics/water-dams" class="btn-primary"> 📊Gráfico de Barras</a>

         <a href="/water-dams" class="btn-secondary">
        ⬅ Volver al listado
    </a>
    </div>
    

    <div bind:this={chartContainer} class="chart-box"></div>
</main>

<style>
    /* Estilos existentes de tu página */
    .container { padding: 20px; font-family: sans-serif; }
    .chart-box { width: 100%; height: 500px; margin-top: 20px; border: 1px solid #ddd; border-radius: 8px; }

    /* NUEVO: Estilos para la navegación */
    .nav-links {
        display: flex;
        gap: 15px; 
        margin-bottom: 25px;
        align-items: center;
    }

    /* Estilo común de los botones */
    .nav-links a {
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 600;
        transition: all 0.2s ease;
        display: inline-block;
    }

    /* Botón Principal (Azul intenso) */
    .btn-primary {
        background-color: #2563eb;
        color: white;
        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }

    .btn-primary:hover {
        background-color: #1d4ed8;
        transform: translateY(-1px);
    }

    /* Botón Secundario (Gris con borde) */
    .btn-secondary {
        background-color: transparent;
        color: #64748b;
        border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover {
        background-color: #f1f5f9;
        color: #1e293b;
        border-color: #94a3b8;
    }
</style>