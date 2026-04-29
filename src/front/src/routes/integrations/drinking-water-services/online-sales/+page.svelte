<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';
    import Chart from 'chart.js/auto';

    // Tu API local
    let myAPI = '/api/v1/drinking-water-services';
    if (dev) {
        myAPI = 'http://localhost:10000' + myAPI;
    }

    // La API del G23
    const g23API = 'https://sos2526-23.onrender.com/api/v1/online-sales-popular-marketplaces';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);

    async function loadIntegration() {
        try {
            const [resMine, resG23] = await Promise.all([
                fetch(myAPI),
                fetch(g23API)
            ]);

            if (!resMine.ok || !resG23.ok) {
                throw new Error("No se pudieron descargar los datos.");
            }

            const myData = await resMine.json();
            const g23Data = await resG23.json();

            if (myData.length === 0 || g23Data.length === 0) {
                mensajeError = "Faltan datos. Asegúrate de cargar los datos iniciales en ambas APIs.";
                cargando = false;
                return;
            }

            // 1. Procesamos TUS datos (con la adaptación de Americas)
            let myProcessedData = {};
            myData.forEach(d => {
                let nombreEntidad = d.entity;
                
                // Adaptación: Convertimos Americas (WHO) en North America para que cruce con el G23
                if (nombreEntidad === "Americas (WHO)") {
                    nombreEntidad = "North America";
                }

                if(!myProcessedData[nombreEntidad]) myProcessedData[nombreEntidad] = 0;
                myProcessedData[nombreEntidad] += Number(d.wat_bas_pop_residence_urban) || 0;
            });

            // 2. Procesamos los datos del G23
            let g23ProcessedData = {};
            g23Data.forEach(d => {
                if(!g23ProcessedData[d.region]) g23ProcessedData[d.region] = 0;
                g23ProcessedData[d.region] += Number(d.total) || 0;
            });

            // 3. Juntamos las etiquetas (solo las que tienen datos en al menos una de las dos)
            const misEtiquetas = Object.keys(myProcessedData);
            const susEtiquetas = Object.keys(g23ProcessedData);
            const labels = [...new Set([...misEtiquetas, ...susEtiquetas])];

            const mySeries = labels.map(l => myProcessedData[l] || 0);
            const g23Series = labels.map(l => g23ProcessedData[l] || 0);

            // 4. Dibujar la gráfica
            const ctx = document.getElementById('integration-chart');
            if (chart) chart.destroy();

            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Población Urbana con Agua (Mis datos)',
                            data: mySeries,
                            backgroundColor: 'rgba(52, 152, 219, 0.8)',
                            yAxisID: 'y'
                        },
                        {
                            label: 'Ventas Totales $ (G23)',
                            data: g23Series,
                            backgroundColor: 'rgba(231, 76, 60, 0.8)',
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Nº Habitantes' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            title: { display: true, text: 'Total Ingresos ($)' }
                        }
                    }
                }
            });

            cargando = false;

        } catch (error) {
            console.error(error);
            mensajeError = "Error al cargar la integración. Verifica las conexiones de red.";
            cargando = false;
        }
    }

    onMount(loadIntegration);
</script>

<svelte:head>
    <title>Integración con G23</title>
</svelte:head>

<main class="container">
    <header class="header">
        <h1>Integración: Agua Potable vs Ventas Online (G23)</h1>
        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver a Integraciones
        </button>
    </header>

    {#if cargando}
        <p class="loading-msg">Haciendo fetch a las APIs y procesando datos...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    <div class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <canvas id="integration-chart"></canvas>
    </div>
    
    <p class="footer-text">
        Gráfica de barras usando <strong>Chart.js</strong>. Compara la población total con acceso a agua frente al total facturado en ventas online del G23.
    </p>
</main>

<style>
    .container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #eee;
        padding-bottom: 15px;
    }

    h1 { color: #333; margin: 0; font-size: 1.5rem; }

    .chart-container {
        width: 100%;
        height: 500px;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        margin-bottom: 20px;
    }

    .btn-back {
        background-color: #6c757d;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
    }

    .btn-back:hover { background-color: #5a6268; }
    
    .loading-msg { color: #007bff; font-weight: bold; }
    
    .alert { padding: 12px; border-radius: 4px; font-weight: bold; margin-bottom: 20px; }
    .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    
    .footer-text { color: #777; font-size: 0.9rem; font-style: italic; text-align: center; }
</style>