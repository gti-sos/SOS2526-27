<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    let worldBankAPI = '/api/v1/drinking-water-services/proxy/worldbank';

    if (dev) {
        worldBankAPI = 'http://localhost:10000' + worldBankAPI;
    }

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let datos = $state([]);
    let resumen = $state(null);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 2
        }).format(value);
    }

    function formatCountryName(name) {
        if (!name) return 'Sin país';

        return name
            .toString()
            .trim()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    async function loadData() {
        try {
            cargando = true;
            mensajeError = '';
            datos = [];
            resumen = null;

            const res = await fetch(worldBankAPI);

            if (!res.ok) {
                mensajeError = 'No se pudo acceder al proxy de World Bank.';
                cargando = false;
                return;
            }

            const responseData = await res.json();

            /*
                La API de World Bank suele devolver:
                [
                    { información de paginación },
                    [ registros ]
                ]
            */
            if (!Array.isArray(responseData) || !Array.isArray(responseData[1])) {
                mensajeError = 'La respuesta de World Bank no tiene el formato esperado.';
                cargando = false;
                return;
            }

            const rawData = responseData[1];

            const cleanData = rawData
                .filter((item) => {
                    return (
                        item.country &&
                        item.country.value &&
                        item.date !== undefined &&
                        item.value !== null &&
                        Number.isFinite(Number(item.value))
                    );
                })
                .map((item) => ({
                    country: formatCountryName(item.country.value),
                    countryCode: item.countryiso3code || item.country.id || '',
                    year: Number(item.date),
                    value: Number(item.value),
                    indicator: item.indicator?.value || 'Indicador World Bank'
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 12);

            if (cleanData.length === 0) {
                mensajeError = 'World Bank respondió correctamente, pero no hay datos válidos para representar.';
                cargando = false;
                return;
            }

            datos = cleanData;

            const total = cleanData.reduce((acc, item) => acc + item.value, 0);
            const average = total / cleanData.length;
            const maxRecord = cleanData[0];
            const minRecord = cleanData[cleanData.length - 1];

            resumen = {
                totalRegistros: cleanData.length,
                average,
                maxRecord,
                minRecord,
                indicator: cleanData[0].indicator
            };

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando World Bank:', error);
            mensajeError = 'Error de conexión o de procesamiento al cargar World Bank.';
            cargando = false;
        }
    }

    async function renderChart() {
        const Chart = (await import('chart.js/auto')).default;

        const ctx = document.getElementById('worldbank-chart');

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.map((item) => `${item.country} (${item.year})`),
                datasets: [
                    {
                        label: 'Recursos internos renovables de agua dulce',
                        data: datos.map((item) => item.value)
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Recursos internos renovables de agua dulce por país'
                    },
                    subtitle: {
                        display: true,
                        text: 'Consumo de World Bank API mediante proxy propio'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Valor: ${formatNumber(context.raw)}`;
                            }
                        }
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 60,
                            minRotation: 45
                        },
                        title: {
                            display: true,
                            text: 'País y año'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Valor del indicador'
                        },
                        ticks: {
                            callback: function (value) {
                                return formatNumber(value);
                            }
                        }
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
    <title>Integración World Bank</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Recursos de agua dulce - World Bank</h1>
            <p class="subtitle">
                Integración externa con <strong>World Bank API</strong> usando proxy propio.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción del uso</h2>
        <p>
            Esta vista consume mediante <strong>fetch</strong> un proxy propio de tu backend:
            <code>/api/v1/drinking-water-services/proxy/worldbank</code>.
            El proxy llama a la API externa de <strong>World Bank</strong>, recibe datos en formato
            <strong> JSON</strong> y los representa mediante una gráfica y una tabla HTML.
        </p>
    </section>

    {#if cargando}
        <p class="loading-msg">Cargando datos desde World Bank mediante proxy...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    {#if resumen}
        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">Registros representados</span>
                <strong>{resumen.totalRegistros}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Media del indicador</span>
                <strong>{formatNumber(resumen.average)}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Mayor valor</span>
                <strong>
                    {resumen.maxRecord.country}
                    ({formatNumber(resumen.maxRecord.value)})
                </strong>
            </article>

            <article class="summary-card">
                <span class="label">Menor valor</span>
                <strong>
                    {resumen.minRecord.country}
                    ({formatNumber(resumen.minRecord.value)})
                </strong>
            </article>
        </section>
    {/if}

    <section class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <canvas id="worldbank-chart"></canvas>
    </section>

    {#if datos.length > 0}
        <section class="table-section">
            <h2>Datos obtenidos de World Bank</h2>

            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Código</th>
                        <th>Año</th>
                        <th>Indicador</th>
                        <th>Valor</th>
                    </tr>
                </thead>

                <tbody>
                    {#each datos as item (`${item.country}-${item.countryCode}-${item.year}-${item.value}`)}
                        <tr>
                            <td>{item.country}</td>
                            <td>{item.countryCode}</td>
                            <td>{item.year}</td>
                            <td>{item.indicator}</td>
                            <td>{formatNumber(item.value)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Visualización realizada con <strong>Chart.js</strong>, tipo <strong>bar</strong>.
        Esta combinación es distinta de las usadas con Highcharts y ApexCharts.
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

    code {
        background: rgba(0, 0, 0, 0.06);
        padding: 2px 6px;
        border-radius: 4px;
    }

    .subtitle {
        margin: 8px 0 0;
        color: #666;
    }

    .info-box {
        background: #eef6ff;
        border: 1px solid #cfe2ff;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #1f456e;
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
    }

    @media (max-width: 600px) {
        .summary-grid {
            grid-template-columns: 1fr;
        }

        .header {
            flex-direction: column;
        }

        .chart-container {
            height: 480px;
        }
    }
</style>