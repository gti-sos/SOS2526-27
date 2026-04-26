<script>
    import { onMount } from 'svelte';

    // Desactivamos SSR para que coincida con la configuración del bubble-chart
    export const ssr = false;

    let chartContainer;

    onMount(async () => {
        try {
            // Importación dinámica (igual que en bubble-chart)
            const HighchartsModule = await import('highcharts');
            const Highcharts = HighchartsModule.default;

            // Obtención de datos
            const res = await fetch('/api/v1/water-dams');
            if (!res.ok) throw new Error('Error al conectar con la API');
            
            const dams = await res.json();
            
            // Preparación de datos (usando Capacidad como medida principal)
            const seriesData = dams.map(d => ({
                name: d.dam_name || 'Sin nombre',
                y: Number(d.cap_mcm || 0)
            }));

            // Renderizado del gráfico de Barras (Column)
            Highcharts.chart(chartContainer, {
                chart: { 
                    type: 'column' 
                },
                title: { 
                    text: 'Análisis: Capacidad de las Presas' 
                },
                xAxis: { 
                    type: 'category',
                    title: { text: 'Presas' }
                },
                yAxis: { 
                    title: { text: 'Capacidad (mcm)' } 
                },
                tooltip: {
                    pointFormat: '<b>{point.name}</b><br>Capacidad: {point.y} mcm'
                },
                series: [{ 
                    name: 'Capacidad',
                    data: seriesData, 
                    color: '#2563eb' // Mismo color azul que en burbujas
                }]
            });
        } catch (error) {
            console.error("Error crítico en el gráfico de barras:", error);
        }
    });
</script>

<main class="container">
    <h1>Gestión de Presas</h1>
    
   <div class="nav-links">
    <a href="/analytics/water-dams/bubble-chart" class="btn-primary">
        🫧 Gráfico de Burbujas
    </a>
    
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