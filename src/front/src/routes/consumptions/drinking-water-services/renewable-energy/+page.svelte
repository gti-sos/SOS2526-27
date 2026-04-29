<script>
    import { onMount } from 'svelte';

    const g17API = 'https://sos2526-17.onrender.com/api/v1/renewable-energy-consumptions';

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

    function formatCountry(country) {
        if (!country) return 'Sin país';

        return country
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

            const res = await fetch(g17API);

            if (!res.ok) {
                mensajeError = 'No se pudo acceder a la API del Grupo 17.';
                cargando = false;
                return;
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                mensajeError = 'La API del Grupo 17 no tiene datos disponibles.';
                cargando = false;
                return;
            }

            const cleanData = data
                .filter((item) => {
                    return (
                        item.country &&
                        item.year !== undefined &&
                        item.wind !== undefined &&
                        item.hydro !== undefined &&
                        item.solar !== undefined &&
                        item.other !== undefined
                    );
                })
                .map((item) => {
                    const wind = Number(item.wind) || 0;
                    const hydro = Number(item.hydro) || 0;
                    const solar = Number(item.solar) || 0;
                    const other = Number(item.other) || 0;
                    const total = wind + hydro + solar + other;

                    return {
                        country: formatCountry(item.country),
                        code: item.code || '',
                        year: Number(item.year),
                        wind,
                        hydro,
                        solar,
                        other,
                        total
                    };
                })
                .filter((item) => item.total > 0)
                .sort((a, b) => b.total - a.total);

            if (cleanData.length === 0) {
                mensajeError = 'La API respondió correctamente, pero no hay registros válidos para representar.';
                cargando = false;
                return;
            }

            datos = cleanData;

            const totals = cleanData.reduce(
                (acc, item) => {
                    acc.wind += item.wind;
                    acc.hydro += item.hydro;
                    acc.solar += item.solar;
                    acc.other += item.other;
                    acc.total += item.total;
                    return acc;
                },
                {
                    wind: 0,
                    hydro: 0,
                    solar: 0,
                    other: 0,
                    total: 0
                }
            );

            const percentages = {
                wind: totals.total ? (totals.wind / totals.total) * 100 : 0,
                hydro: totals.total ? (totals.hydro / totals.total) * 100 : 0,
                solar: totals.total ? (totals.solar / totals.total) * 100 : 0,
                other: totals.total ? (totals.other / totals.total) * 100 : 0
            };

            resumen = {
                records: cleanData.length,
                total: totals.total,
                topRecord: cleanData[0],
                totals,
                percentages
            };

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando datos del Grupo 17:', error);
            mensajeError = 'Error de conexión o de procesamiento al cargar la API del Grupo 17.';
            cargando = false;
        }
    }

    async function renderChart() {
        const ApexCharts = (await import('apexcharts')).default;

        const labels = ['Eólica', 'Hidráulica', 'Solar', 'Otras'];
        const values = [
            Number(resumen.percentages.wind.toFixed(2)),
            Number(resumen.percentages.hydro.toFixed(2)),
            Number(resumen.percentages.solar.toFixed(2)),
            Number(resumen.percentages.other.toFixed(2))
        ];

        const options = {
            series: values,
            chart: {
                type: 'radialBar',
                height: 540,
                toolbar: {
                    show: true
                }
            },
            title: {
                text: 'Distribución del consumo de energías renovables',
                align: 'center'
            },
            subtitle: {
                text: 'Consumo directo de la API renewable-energy-consumptions del Grupo 17',
                align: 'center'
            },
            labels,
            plotOptions: {
                radialBar: {
                    dataLabels: {
                        name: {
                            fontSize: '16px'
                        },
                        value: {
                            fontSize: '15px',
                            formatter: function (value) {
                                return Number(value).toFixed(2) + '%';
                            }
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: function () {
                                return '100%';
                            }
                        }
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function (value) {
                        return Number(value).toFixed(2) + '% del total';
                    }
                }
            },
            legend: {
                show: true,
                position: 'bottom'
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
    <title>Consumo API Grupo 17</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Consumo de energías renovables</h1>
            <p class="subtitle">
                Consumo directo de la API <strong>renewable-energy-consumptions</strong> del Grupo 17.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción del uso</h2>
        <p>
            Esta vista consume mediante <strong>fetch</strong> la API RESTful del Grupo 17,
            recibe los datos en formato <strong>JSON</strong> y representa el reparto acumulado
            del consumo de energías renovables entre eólica, hidráulica, solar y otras fuentes.
        </p>
    </section>

    {#if cargando}
        <p class="loading-msg">Cargando datos de la API del Grupo 17...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    {#if resumen}
        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">Registros obtenidos</span>
                <strong>{resumen.records}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Consumo renovable total</span>
                <strong>{formatNumber(resumen.total)}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Mayor registro</span>
                <strong>
                    {resumen.topRecord.country} ({resumen.topRecord.year})
                </strong>
            </article>

            <article class="summary-card">
                <span class="label">Fuente dominante</span>
                <strong>
                    {resumen.percentages.wind >= resumen.percentages.hydro &&
                    resumen.percentages.wind >= resumen.percentages.solar &&
                    resumen.percentages.wind >= resumen.percentages.other
                        ? 'Eólica'
                        : resumen.percentages.hydro >= resumen.percentages.solar &&
                            resumen.percentages.hydro >= resumen.percentages.other
                          ? 'Hidráulica'
                          : resumen.percentages.solar >= resumen.percentages.other
                            ? 'Solar'
                            : 'Otras'}
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
                        <th>Código</th>
                        <th>Año</th>
                        <th>Eólica</th>
                        <th>Hidráulica</th>
                        <th>Solar</th>
                        <th>Otras</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    {#each datos as item (`${item.country}-${item.code}-${item.year}-${item.total}`)}
                        <tr>
                            <td>{item.country}</td>
                            <td>{item.code}</td>
                            <td>{item.year}</td>
                            <td>{formatNumber(item.wind)}</td>
                            <td>{formatNumber(item.hydro)}</td>
                            <td>{formatNumber(item.solar)}</td>
                            <td>{formatNumber(item.other)}</td>
                            <td>{formatNumber(item.total)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Visualización realizada con <strong>ApexCharts</strong>, tipo <strong>radialBar</strong>.
        Esta combinación es distinta de <strong>Highcharts + area</strong>,
        <strong>Highcharts + bar</strong>, <strong>Highcharts + pie</strong>,
        <strong>ApexCharts + radar</strong> y <strong>ApexCharts + treemap</strong>.
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
        background: #ecfdf5;
        border: 1px solid #bbf7d0;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #166534;
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