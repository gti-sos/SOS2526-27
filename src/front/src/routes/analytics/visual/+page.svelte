<script>
    import { onMount } from 'svelte';

    let chartContainer = $state();
    let loading = $state(true);
    let error = $state(null);

    // Función de limpieza de datos: unifica nombres de países
    const normalize = (name) => {
        if (!name) return "Otros";
        let n = name.trim();
        // Regla específica: Americas == United States
        if (["Americas", "Americas (WHO)"].includes(n)) return "United States";
        return n;
    };

    onMount(async () => {
        try {
            // 1. Importación robusta
            const HighchartsModule = await import('highcharts');
            const Highcharts = HighchartsModule.default || HighchartsModule;
            const HeatmapModule = await import('highcharts/modules/heatmap');
            const initHeatmap = HeatmapModule.default || HeatmapModule;
            if (typeof initHeatmap === 'function') initHeatmap(Highcharts);

            // 2. Fetch de datos (URLs locales para las 3 APIs del grupo)
            const endpoints = [
                '/api/v1/water-dams', 
                '/api/v1/drinking-water-services',
                '/api/v1/world-hydroelectric-plants'
            ];

            const responses = await Promise.allSettled(endpoints.map(url => fetch(url)));
            const data = await Promise.all(responses.map(r => r.status === 'fulfilled' && r.value.ok ? r.value.json() : []));
            
            const [dams, water, hydro] = data;

            // 3. Normalización y Matriz
            const allCountries = new Set([
                ...dams.map(d => normalize(d.country)),
                ...water.map(w => normalize(w.entity)),
                ...hydro.map(h => normalize(h.country))
            ]);
            const countries = Array.from(allCountries).filter(c => c !== "Otros").sort();

            const heatmapData = [];

            // Mapeo matricial
            dams.forEach(d => {
                const x = countries.indexOf(normalize(d.country));
                if (x !== -1) heatmapData.push({ x, y: 0, value: Number(d.cap_mcm) || 0 });
            });
            water.forEach(w => {
                const x = countries.indexOf(normalize(w.entity));
                if (x !== -1) heatmapData.push({ x, y: 1, value: Number(w.wat_bas_pop_residence_urban) || 0 });
            });
            hydro.forEach(h => {
                const x = countries.indexOf(normalize(h.country));
                if (x !== -1) heatmapData.push({ x, y: 2, value: Number(h.capacity_mw) || 0 });
            });

            // 4. Renderizado con ESTILO MEJORADO
            Highcharts.chart(chartContainer, {
                chart: { 
                    type: 'heatmap', 
                    marginTop: 60, 
                    marginBottom: 100,
                    plotBackgroundColor: '#fdfdfd',
                    style: { fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }
                },
                title: { 
                    text: 'Matriz de Recursos Integrada', 
                    style: { fontSize: '20px', fontWeight: 'bold', color: '#111' } 
                },
                subtitle: { text: 'Tamaño del recurso normalizado por país (F10 - Integración Grupal)' },
                xAxis: { 
                    categories: countries, 
                    title: { text: 'Países', style: { color: '#666' } },
                    labels: { style: { color: '#333' } }
                },
                yAxis: { 
                    categories: ['Presas', 'Agua (Urb)', 'Hidroeléctrica'], 
                    title: { text: 'Tipo de Recurso', style: { color: '#666' } },
                    labels: { style: { color: '#333', fontWeight: 'bold' } }
                },
                // PALETA DE COLORES MEJORADA (Turquesa profesional)
                colorAxis: { 
                    min: 0, 
                    minColor: '#f0f9fa', 
                    maxColor: '#00838f',
                    stops: [[0, '#f0f9fa'], [0.5, '#4dd0e1'], [1, '#00838f']]
                },
                legend: {
                    align: 'right',
                    layout: 'vertical',
                    margin: 0,
                    verticalAlign: 'top',
                    y: 25,
                    symbolHeight: 280
                },
                tooltip: {
    formatter: function () {
        // Obtenemos el nombre del recurso
        const recurso = this.series.yAxis.categories[this.point.y];
        // Añadimos unidades según el recurso
        let unidad = "";
        if (recurso.includes("Presas")) unidad = " mcm";
        if (recurso.includes("Agua")) unidad = " personas con servicio básico";
        if (recurso.includes("Hidro")) unidad = " MW";

        return `<b>${this.series.xAxis.categories[this.point.x]}</b><br>
                ${recurso}: <b>${Highcharts.numberFormat(this.point.value, 0, ',', '.')} ${unidad}</b>`;
    }
},
                series: [{
                    name: 'Magnitud del Recurso',
                    borderWidth: 1,
                    borderColor: '#fff',
                    data: heatmapData,
                    dataLabels: { 
                        enabled: true, 
                        color: '#fff', 
                        format: '{point.value:.0f}',
                        style: { textOutline: 'none', fontWeight: 'normal', fontSize: '11px' }
                    },
                    // EFECTO HOVER
                    states: {
                        hover: {
                            color: '#00acc1', // Color más intenso al pasar el ratón
                            borderColor: '#006064'
                        }
                    }
                }]
            });

            loading = false;
        } catch (e) {
            console.error(e);
            error = "Error al integrar APIs: " + e.message;
            loading = false;
        }
    });
</script>

<main class="dashboard-container">
    <header class="dashboard-header">
        <h1>Análisis Grupal</h1>
        <a href="/" class="btn-home">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house-door-fill" viewBox="0 0 16 16">
                <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5z"/>
            </svg>
            Volver al Inicio
        </a>
    </header>

    <div class="chart-wrapper">
        {#if error} 
            <div class="error-box">⚠️ {error}</div>
        {/if}
        
        {#if loading} 
            <div class="loading-box">
                <div class="spinner"></div>
                <p>Cargando e integrando datos del grupo...</p>
            </div>
        {/if}
        
        <div bind:this={chartContainer} class="chart-box"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #f4f6f8; margin: 0; }

    .dashboard-container { 
        padding: 40px; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        max-width: 1200px;
        margin: 0 auto;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 10px;
        border-bottom: 2px solid #e0e0e0;
    }

    .dashboard-header h1 { margin: 0; font-size: 28px; color: #333; }

    /* ESTILO DEL BOTÓN MODERN */
    .btn-home {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background-color: #00838f;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        font-size: 14px;
        transition: background-color 0.2s, transform 0.1s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn-home:hover { background-color: #006064; }
    .btn-home:active { transform: translateY(1px); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }

    /* CONTENEDOR DEL GRÁFICO MODERN */
    .chart-wrapper {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.05);
        border: 1px solid #eaeaea;
    }

    .chart-box { width: 100%; height: 600px; }

    /* ESTILOS DE ESTADO (Error y Carga) */
    .error-box { 
        color: #d32f2f; background: #ffcdd2; 
        padding: 15px; border-radius: 8px; 
        margin-bottom: 20px; text-align: center; font-weight: bold;
    }

    .loading-box {
        text-align: center; padding: 100px 0; color: #666;
        display: flex; flex-direction: column; align-items: center; gap: 20px;
    }

    .spinner {
        border: 4px solid #f3f3f3; border-top: 4px solid #00838f;
        border-radius: 50%; width: 40px; height: 40px;
        animation: spin 1s linear infinite;
    }

    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>