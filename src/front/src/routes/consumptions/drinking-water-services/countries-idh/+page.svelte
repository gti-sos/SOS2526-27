<script>
    import { onMount } from 'svelte';

    const g26API = 'https://sos2526-26.onrender.com/api/v2/countries-idh-per-years';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let datos = $state([]);
    let resumen = $state(null);

    function formatDecimal(value) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }).format(value);
    }

    function normalizeCountryLabel(country) {
        if (!country) return 'Sin país';

        return country
            .replaceAll('-', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    async function loadData() {
        try {
            cargando = true;
            mensajeError = '';
            datos = [];
            resumen = null;

            const res = await fetch(g26API);

            if (!res.ok) {
                mensajeError = 'No se pudo acceder a la API del Grupo 26.';
                cargando = false;
                return;
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                mensajeError = 'La API del Grupo 26 no tiene datos disponibles.';
                cargando = false;
                return;
            }

            const cleanData = data
                .filter((item) => {
                    return (
                        item.country &&
                        item.year !== undefined &&
                        item.hdi_value !== undefined &&
                        Number.isFinite(Number(item.hdi_value))
                    );
                })
                .map((item) => ({
                    country: item.country,
                    countryLabel: normalizeCountryLabel(item.country),
                    year: Number(item.year),
                    hdiValue: Number(item.hdi_value),
                    hdiRank: Number(item.hdi_rank),
                    hdiChange: Number(item.hdi_change)
                }))
                .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.hdiValue - a.hdiValue;
                });

            if (cleanData.length === 0) {
                mensajeError = 'La API respondió correctamente, pero no hay registros válidos para representar.';
                cargando = false;
                return;
            }

            datos = cleanData;

            const latestYear = Math.max(...cleanData.map((item) => item.year));
            const latestData = cleanData
                .filter((item) => item.year === latestYear)
                .sort((a, b) => b.hdiValue - a.hdiValue);

            const averageHdi =
                latestData.reduce((acc, item) => acc + item.hdiValue, 0) / latestData.length;

            const bestCountry = latestData[0];

            resumen = {
                latestYear,
                totalCountries: latestData.length,
                averageHdi,
                bestCountry
            };

            await renderChart(latestData);

            cargando = false;
        } catch (error) {
            console.error('Error cargando datos del Grupo 26:', error);
            mensajeError = 'Error de conexión o de procesamiento al cargar la API del Grupo 26.';
            cargando = false;
        }
    }

    async function renderChart(latestData) {
        const ApexCharts = (await import('apexcharts')).default;

        const categories = latestData.map((item) => item.countryLabel);
        const values = latestData.map((item) => item.hdiValue);

        const options = {
            series: [
                {
                    name: 'Índice de Desarrollo Humano',
                    data: values
                }
            ],
            chart: {
                type: 'radar',
                height: 520,
                toolbar: {
                    show: true
                }
            },
            title: {
                text: `Índice de desarrollo humano por país en ${resumen.latestYear}`,
                align: 'center'
            },
            subtitle: {
                text: 'Consumo directo de la API countries-idh-per-years del Grupo 26',
                align: 'center'
            },
            xaxis: {
                categories
            },
            yaxis: {
                min: 0.5,
                max: 1,
                tickAmount: 5,
                labels: {
                    formatter: function (value) {
                        return Number(value).toFixed(2);
                    }
                }
            },
            markers: {
                size: 4
            },
            tooltip: {
                y: {
                    formatter: function (value) {
                        return `Índice: ${Number(value).toFixed(3)}`;
                    }
                }
            }
        };

        const divChart = document.getElementById('apex-chart');

        if (chart) {
            chart.destroy();
        }

        chart = new ApexCharts(divChart, options);
        chart.render();
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
    <title>Consumo API Grupo 26</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Índice de desarrollo humano por país y año</h1>
            <p class="subtitle">
                Consumo directo de la API <strong>countries-idh-per-years</strong> del Grupo 26.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción del uso</h2>
        <p>
            Esta vista consume mediante <strong>fetch</strong> la API RESTful del Grupo 26,
            recibe los datos en formato <strong>JSON</strong> y representa el índice de desarrollo
            humano de cada país para el año más reciente disponible.
        </p>
    </section>

    {#if cargando}
        <p class="loading-msg">Cargando datos de la API del Grupo 26...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    {#if resumen}
        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">Año representado</span>
                <strong>{resumen.latestYear}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Países incluidos</span>
                <strong>{resumen.totalCountries}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Media del índice</span>
                <strong>{formatDecimal(resumen.averageHdi)}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Mayor índice</span>
                <strong>
                    {resumen.bestCountry.countryLabel}
                    ({formatDecimal(resumen.bestCountry.hdiValue)})
                </strong>
            </article>
        </section>
    {/if}

    <section class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <div id="apex-chart"></div>
    </section>

    {#if datos.length > 0}
        <section class="table-section">
            <h2>Datos obtenidos de la API</h2>

            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Año</th>
                        <th>Índice desarrollo humano</th>
                        <th>Ranking</th>
                        <th>Cambio ranking</th>
                    </tr>
                </thead>

                <tbody>
                    {#each datos as item (`${item.country}-${item.year}-${item.hdiValue}`)}
                        <tr>
                            <td>{item.countryLabel}</td>
                            <td>{item.year}</td>
                            <td>{formatDecimal(item.hdiValue)}</td>
                            <td>{item.hdiRank}</td>
                            <td>{item.hdiChange}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Visualización realizada con <strong>ApexCharts</strong>, tipo <strong>radar</strong>.
        Esta combinación es distinta de <strong>Highcharts + area</strong> y
        <strong>Highcharts + bar</strong>. Los datos se obtienen mediante <strong>fetch</strong>,
        se procesan como <strong>JSON</strong> y se muestran mediante gráfica y tabla HTML.
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
        font-size: 1.15rem;
        color: #333;
    }

    .chart-container {
        width: 100%;
        min-height: 560px;
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
    }
</style>