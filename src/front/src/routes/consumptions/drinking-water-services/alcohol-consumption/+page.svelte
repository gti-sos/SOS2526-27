<script>
    import { onMount } from 'svelte';

    const g11API = 'https://sos2526-11.onrender.com/api/v2/alcohol-consumptions-per-capita';

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

    async function loadData() {
        try {
            cargando = true;
            mensajeError = '';
            datos = [];
            resumen = null;

            const res = await fetch(g11API);

            if (!res.ok) {
                mensajeError = 'No se pudo acceder a la API del Grupo 11.';
                cargando = false;
                return;
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                mensajeError = 'La API del Grupo 11 no tiene datos disponibles.';
                cargando = false;
                return;
            }

            const cleanData = data
                .filter((item) => {
                    return (
                        item.nation &&
                        item.date_year !== undefined &&
                        item.alcohol_litre !== undefined &&
                        Number.isFinite(Number(item.alcohol_litre))
                    );
                })
                .map((item) => ({
                    nation: item.nation,
                    year: Number(item.date_year),
                    alcoholLitre: Number(item.alcohol_litre),
                    recordedConsumption: Number(item.recorded_consumption) || 0,
                    unrecordedConsumption: Number(item.unrecorded_consumption) || 0
                }))
                .sort((a, b) => b.alcoholLitre - a.alcoholLitre);

            if (cleanData.length === 0) {
                mensajeError = 'La API respondió correctamente, pero no hay registros válidos para representar.';
                cargando = false;
                return;
            }

            datos = cleanData;

            const totalAlcohol = cleanData.reduce((acc, item) => acc + item.alcoholLitre, 0);
            const averageAlcohol = totalAlcohol / cleanData.length;
            const maxCountry = cleanData[0];
            const minCountry = cleanData[cleanData.length - 1];

            resumen = {
                totalRegistros: cleanData.length,
                averageAlcohol,
                maxCountry,
                minCountry
            };

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando datos del Grupo 11:', error);
            mensajeError = 'Error de conexión o de procesamiento al cargar la API del Grupo 11.';
            cargando = false;
        }
    }

    async function renderChart() {
        const ApexCharts = (await import('apexcharts')).default;

        const chartData = datos.map((item) => ({
            x: `${item.nation} (${item.year})`,
            y: item.alcoholLitre
        }));

        const options = {
            series: [
                {
                    name: 'Litros de alcohol per cápita',
                    data: chartData
                }
            ],
            chart: {
                type: 'treemap',
                height: 520,
                toolbar: {
                    show: true
                }
            },
            title: {
                text: 'Consumo de alcohol per cápita por país',
                align: 'center'
            },
            subtitle: {
                text: 'Consumo directo de la API alcohol-consumptions-per-capita del Grupo 11',
                align: 'center'
            },
            dataLabels: {
                enabled: true,
                formatter: function (text, options) {
                    const value = options.value;
                    return `${text}: ${value} L`;
                },
                style: {
                    fontSize: '12px'
                }
            },
            tooltip: {
                custom: function ({ dataPointIndex }) {
                    const item = datos[dataPointIndex];

                    return `
                        <div style="padding:10px; background:white; border:1px solid #ccc;">
                            <strong>${item.nation} (${item.year})</strong><br>
                            <span>Consumo total: ${formatNumber(item.alcoholLitre)} litros per cápita</span><br>
                            <span>Consumo registrado: ${formatNumber(item.recordedConsumption)} litros</span><br>
                            <span>Consumo no registrado: ${formatNumber(item.unrecordedConsumption)} litros</span>
                        </div>
                    `;
                }
            },
            plotOptions: {
                treemap: {
                    distributed: true,
                    enableShades: true
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
    <title>Consumo API Grupo 11</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Consumo de alcohol per cápita</h1>
            <p class="subtitle">
                Consumo directo de la API <strong>alcohol-consumptions-per-capita</strong> del Grupo 11.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción del uso</h2>
        <p>
            Esta vista consume mediante <strong>fetch</strong> la API RESTful del Grupo 11,
            recibe los datos en formato <strong>JSON</strong> y representa el consumo de alcohol
            per cápita por país mediante una gráfica de tipo <strong>treemap</strong>.
        </p>
    </section>

    {#if cargando}
        <p class="loading-msg">Cargando datos de la API del Grupo 11...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    {#if resumen}
        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">Registros obtenidos</span>
                <strong>{resumen.totalRegistros}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Media de consumo</span>
                <strong>{formatNumber(resumen.averageAlcohol)} L</strong>
            </article>

            <article class="summary-card">
                <span class="label">Mayor consumo</span>
                <strong>
                    {resumen.maxCountry.nation}
                    ({formatNumber(resumen.maxCountry.alcoholLitre)} L)
                </strong>
            </article>

            <article class="summary-card">
                <span class="label">Menor consumo</span>
                <strong>
                    {resumen.minCountry.nation}
                    ({formatNumber(resumen.minCountry.alcoholLitre)} L)
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
                        <th>Alcohol total per cápita</th>
                        <th>Consumo registrado</th>
                        <th>Consumo no registrado</th>
                    </tr>
                </thead>

                <tbody>
                    {#each datos as item (`${item.nation}-${item.year}-${item.alcoholLitre}`)}
                        <tr>
                            <td>{item.nation}</td>
                            <td>{item.year}</td>
                            <td>{formatNumber(item.alcoholLitre)} L</td>
                            <td>{formatNumber(item.recordedConsumption)} L</td>
                            <td>{formatNumber(item.unrecordedConsumption)} L</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Visualización realizada con <strong>ApexCharts</strong>, tipo <strong>treemap</strong>.
        Esta combinación es distinta de <strong>Highcharts + area</strong>,
        <strong>Highcharts + bar</strong> y <strong>ApexCharts + radar</strong>.
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
        background: #fff6e6;
        border: 1px solid #ffe0a3;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #6b4700;
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