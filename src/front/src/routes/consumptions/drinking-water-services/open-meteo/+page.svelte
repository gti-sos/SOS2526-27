<script>
    import { onMount } from 'svelte';

    const openMeteoAPI =
        'https://api.open-meteo.com/v1/forecast?latitude=37.3891&longitude=-5.9845&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FMadrid';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let datos = $state([]);
    let resumen = $state(null);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 1
        }).format(value);
    }

    function formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit'
        });
    }

    async function loadData() {
        try {
            cargando = true;
            mensajeError = '';
            datos = [];
            resumen = null;

            const res = await fetch(openMeteoAPI);

            if (!res.ok) {
                mensajeError = 'No se pudo acceder a Open-Meteo.';
                cargando = false;
                return;
            }

            const data = await res.json();

            if (!data.daily || !Array.isArray(data.daily.time)) {
                mensajeError = 'Open-Meteo no ha devuelto el formato esperado.';
                cargando = false;
                return;
            }

            const cleanData = data.daily.time.map((date, index) => ({
                date,
                label: formatDate(date),
                tempMax: Number(data.daily.temperature_2m_max[index]),
                tempMin: Number(data.daily.temperature_2m_min[index]),
                precipitation: Number(data.daily.precipitation_sum[index])
            }));

            datos = cleanData;

            const averageMax =
                cleanData.reduce((acc, item) => acc + item.tempMax, 0) / cleanData.length;

            const averageMin =
                cleanData.reduce((acc, item) => acc + item.tempMin, 0) / cleanData.length;

            const totalPrecipitation = cleanData.reduce(
                (acc, item) => acc + item.precipitation,
                0
            );

            const hottestDay = cleanData.reduce((max, item) => {
                return item.tempMax > max.tempMax ? item : max;
            }, cleanData[0]);

            resumen = {
                averageMax,
                averageMin,
                totalPrecipitation,
                hottestDay,
                timezone: data.timezone || 'Europe/Madrid'
            };

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando Open-Meteo:', error);
            mensajeError = 'Error de conexión o de procesamiento al cargar Open-Meteo.';
            cargando = false;
        }
    }

    async function renderChart() {
        const Chart = (await import('chart.js/auto')).default;

        const ctx = document.getElementById('open-meteo-chart');

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: datos.map((item) => item.label),
                datasets: [
                    {
                        label: 'Temperatura máxima',
                        data: datos.map((item) => item.tempMax)
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Previsión de temperatura máxima en Sevilla'
                    },
                    subtitle: {
                        display: true,
                        text: 'Consumo directo de Open-Meteo API'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const item = datos[context.dataIndex];

                                return [
                                    `Máxima: ${formatNumber(item.tempMax)} ºC`,
                                    `Mínima: ${formatNumber(item.tempMin)} ºC`,
                                    `Precipitación: ${formatNumber(item.precipitation)} mm`
                                ];
                            }
                        }
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    onMount(() => {
        if (typeof window !== 'undefined') {
            loadData();
        }

        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    });
</script>

<svelte:head>
    <title>Consumo Open-Meteo</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Previsión meteorológica en Sevilla</h1>
            <p class="subtitle">
                Consumo directo de la API externa <strong>Open-Meteo</strong>.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción del uso</h2>
        <p>
            Esta vista consume mediante <strong>fetch</strong> una API RESTful externa,
            recibe la previsión meteorológica en formato <strong>JSON</strong> y representa
            la temperatura máxima diaria de Sevilla mediante una gráfica y una tabla HTML.
        </p>
    </section>

    {#if cargando}
        <p class="loading-msg">Cargando datos de Open-Meteo...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    {#if resumen}
        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">Temperatura máxima media</span>
                <strong>{formatNumber(resumen.averageMax)} ºC</strong>
            </article>

            <article class="summary-card">
                <span class="label">Temperatura mínima media</span>
                <strong>{formatNumber(resumen.averageMin)} ºC</strong>
            </article>

            <article class="summary-card">
                <span class="label">Precipitación total</span>
                <strong>{formatNumber(resumen.totalPrecipitation)} mm</strong>
            </article>

            <article class="summary-card">
                <span class="label">Día más cálido</span>
                <strong>{resumen.hottestDay.label}</strong>
            </article>
        </section>
    {/if}

    <section class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <canvas id="open-meteo-chart"></canvas>
    </section>

    {#if datos.length > 0}
        <section class="table-section">
            <h2>Datos obtenidos de Open-Meteo</h2>

            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Temperatura máxima</th>
                        <th>Temperatura mínima</th>
                        <th>Precipitación</th>
                    </tr>
                </thead>

                <tbody>
                    {#each datos as item (`${item.date}-${item.tempMax}-${item.tempMin}`)}
                        <tr>
                            <td>{item.label}</td>
                            <td>{formatNumber(item.tempMax)} ºC</td>
                            <td>{formatNumber(item.tempMin)} ºC</td>
                            <td>{formatNumber(item.precipitation)} mm</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Visualización realizada con <strong>Chart.js</strong>, tipo <strong>polarArea</strong>.
        Los datos se obtienen mediante <strong>fetch</strong>, se procesan como
        <strong>JSON</strong> y se muestran mediante gráfica y tabla HTML.
    </p>
</main>

<style>
    .container {
        padding: 30px;
        max-width: 1200px;
        margin: 0 auto;
        font-family: sans-serif;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 20px;
        border-bottom: 2px solid #eee;
        padding-bottom: 15px;
    }

    h1 {
        color: #333;
        margin: 0;
        font-size: 1.7rem;
    }

    h2 {
        margin-top: 0;
        color: #333;
        font-size: 1.2rem;
    }

    .subtitle {
        margin: 8px 0 0;
        color: #666;
    }

    .info-box {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #9a3412;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 25px;
    }

    .summary-card {
        background: white;
        padding: 18px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
        border: 1px solid #eee;
    }

    .summary-card .label {
        display: block;
        color: #777;
        font-size: 0.85rem;
        margin-bottom: 8px;
    }

    .summary-card strong {
        font-size: 1.05rem;
        color: #333;
    }

    .chart-container {
        width: 100%;
        height: 560px;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        margin-bottom: 25px;
    }

    .btn-back {
        background-color: #6c757d;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        white-space: nowrap;
    }

    .btn-back:hover {
        background-color: #5a6268;
    }

    .loading-msg {
        color: #007bff;
        font-weight: bold;
    }

    .alert {
        padding: 12px;
        border-radius: 4px;
        font-weight: bold;
        margin-bottom: 20px;
    }

    .error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .table-section {
        margin-top: 25px;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
    }

    th,
    td {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        text-align: left;
        font-size: 0.95rem;
    }

    th {
        background: #f5f5f5;
        color: #333;
    }

    tr:hover {
        background: #fafafa;
    }

    .footer-text {
        color: #777;
        font-size: 0.9rem;
        font-style: italic;
        text-align: center;
        margin-top: 20px;
    }

    @media (max-width: 900px) {
        .summary-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .chart-container {
            height: 500px;
        }
    }

    @media (max-width: 600px) {
        .summary-grid {
            grid-template-columns: 1fr;
        }

        .header {
            flex-direction: column;
        }
    }
</style>