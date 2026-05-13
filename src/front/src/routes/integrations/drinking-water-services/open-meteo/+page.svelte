<script>
    import { onMount } from 'svelte';

    const myAPI = '/api/v1/drinking-water-services';

    const openMeteoAPI =
        'https://api.open-meteo.com/v1/forecast?latitude=37.3891&longitude=-5.9845&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FMadrid';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);
    let resumen = $state(null);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 2
        }).format(value);
    }

    function formatTemp(value) {
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

    async function loadIntegration() {
        try {
            cargando = true;
            mensajeError = '';
            tablaDatos = [];
            resumen = null;

            const [resMine, resMeteo] = await Promise.all([
                fetch(myAPI),
                fetch(openMeteoAPI)
            ]);

            if (!resMine.ok) {
                throw new Error(`Error en mi API: ${resMine.status}`);
            }

            if (!resMeteo.ok) {
                throw new Error(`Error en Open-Meteo: ${resMeteo.status}`);
            }

            const myData = await resMine.json();
            const meteoData = await resMeteo.json();

            if (!Array.isArray(myData)) {
                mensajeError = 'Mi API no ha devuelto un array válido.';
                cargando = false;
                return;
            }

            if (!meteoData.daily || !Array.isArray(meteoData.daily.time)) {
                mensajeError = 'Open-Meteo no ha devuelto el formato esperado.';
                cargando = false;
                return;
            }

            // 1. Buscamos el último dato disponible de España en mi API
            const spainData = myData
                .filter((item) => {
                    return (
                        item.entity === 'Spain' &&
                        item.year !== undefined &&
                        item.wat_bas_pop_residence_urban !== null &&
                        item.wat_bas_pop_residence_urban !== undefined &&
                        Number.isFinite(Number(item.wat_bas_pop_residence_urban))
                    );
                })
                .map((item) => ({
                    entity: item.entity,
                    code: item.code,
                    year: Number(item.year),
                    waterPopulation: Number(item.wat_bas_pop_residence_urban)
                }))
                .sort((a, b) => b.year - a.year);

            if (spainData.length === 0) {
                mensajeError =
                    'No se ha encontrado ningún dato válido de Spain en mi API drinking-water-services.';
                cargando = false;
                return;
            }

            const latestSpainWater = spainData[0];

            // 2. Procesamos Open-Meteo
            const meteoCleanData = meteoData.daily.time.map((date, index) => {
                return {
                    date,
                    label: formatDate(date),
                    tempMax: Number(meteoData.daily.temperature_2m_max[index]),
                    tempMin: Number(meteoData.daily.temperature_2m_min[index]),
                    precipitation: Number(meteoData.daily.precipitation_sum[index])
                };
            });

            if (meteoCleanData.length === 0) {
                mensajeError = 'Open-Meteo no contiene datos diarios válidos.';
                cargando = false;
                return;
            }

            // 3. Integramos ambos datos en una misma estructura
            tablaDatos = meteoCleanData.map((item) => {
                return {
                    date: item.date,
                    label: item.label,
                    tempMin: item.tempMin,
                    tempMax: item.tempMax,
                    precipitation: item.precipitation,
                    country: latestSpainWater.entity,
                    waterYear: latestSpainWater.year,
                    waterPopulation: latestSpainWater.waterPopulation
                };
            });

            const averageMax =
                meteoCleanData.reduce((acc, item) => acc + item.tempMax, 0) /
                meteoCleanData.length;

            const averageMin =
                meteoCleanData.reduce((acc, item) => acc + item.tempMin, 0) /
                meteoCleanData.length;

            const totalPrecipitation = meteoCleanData.reduce(
                (acc, item) => acc + item.precipitation,
                0
            );

            const hottestDay = meteoCleanData.reduce((max, item) => {
                return item.tempMax > max.tempMax ? item : max;
            }, meteoCleanData[0]);

            resumen = {
                country: latestSpainWater.entity,
                waterYear: latestSpainWater.year,
                waterPopulation: latestSpainWater.waterPopulation,
                averageMax,
                averageMin,
                totalPrecipitation,
                hottestDay,
                timezone: meteoData.timezone || 'Europe/Madrid'
            };

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando la integración con Open-Meteo:', error);
            mensajeError = `Error al cargar la integración: ${error.message}`;
            cargando = false;
        }
    }

    async function renderChart() {
        const ApexCharts = (await import('apexcharts')).default;

        const chartData = tablaDatos.map((item) => {
            return {
                x: item.label,
                y: [item.tempMin, item.tempMax],
                precipitation: item.precipitation,
                waterPopulation: item.waterPopulation,
                waterYear: item.waterYear
            };
        });

        const options = {
            series: [
                {
                    name: 'Rango de temperatura diaria',
                    data: chartData
                }
            ],
            chart: {
                type: 'rangeBar',
                height: 540,
                toolbar: {
                    show: true
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '45%'
                }
            },
            title: {
                text: 'Integración: previsión meteorológica y servicios de agua potable',
                align: 'center'
            },
            subtitle: {
                text: 'Comparación entre Open-Meteo para Sevilla y mi API drinking-water-services para España',
                align: 'center'
            },
            xaxis: {
                title: {
                    text: 'Día de previsión'
                }
            },
            yaxis: {
                title: {
                    text: 'Temperatura mínima y máxima diaria'
                },
                labels: {
                    formatter: function (value) {
                        return `${formatTemp(value)} ºC`;
                    }
                }
            },
            tooltip: {
                custom: function ({ dataPointIndex }) {
                    const item = tablaDatos[dataPointIndex];

                    return `
                        <div style="padding:10px; background:white; border:1px solid #ccc;">
                            <strong>${item.label}</strong><br>
                            <span>Temperatura mínima: ${formatTemp(item.tempMin)} ºC</span><br>
                            <span>Temperatura máxima: ${formatTemp(item.tempMax)} ºC</span><br>
                            <span>Precipitación: ${formatTemp(item.precipitation)} mm</span><br>
                            <hr style="margin:6px 0;">
                            <span>País integrado: ${item.country}</span><br>
                            <span>Año dato agua potable: ${item.waterYear}</span><br>
                            <span>Población urbana con agua potable básica: ${formatNumber(item.waterPopulation)}</span>
                        </div>
                    `;
                }
            },
            dataLabels: {
                enabled: false
        
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
            loadIntegration();
        }

        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    });
</script>

<svelte:head>
    <title>Integración con Open-Meteo</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración: clima en Sevilla y agua potable en España</h1>
            <p class="subtitle">
                Comparación entre mi API <strong>drinking-water-services</strong> y la API externa
                <strong>Open-Meteo</strong>.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver a la pagina de integraciones
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción de la integración</h2>
        
        <p>
            Para integrar ambas fuentes, se toma el último dato disponible de
            <strong>Spain</strong> en mi API, usando la variable
            <strong>wat_bas_pop_residence_urban</strong>, y se combina con la previsión de
            temperaturas máximas, mínimas y precipitación de Sevilla.
        </p>

    </section>

    {#if cargando}
        <p class="loading-msg">Haciendo fetch a las APIs y procesando datos...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    {#if resumen}
        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">País integrado</span>
                <strong>{resumen.country}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Dato agua potable</span>
                <strong>{formatNumber(resumen.waterPopulation)}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Año del dato</span>
                <strong>{resumen.waterYear}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Día más cálido</span>
                <strong>{resumen.hottestDay.label}</strong>
            </article>
        </section>

        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">Temperatura máxima media</span>
                <strong>{formatTemp(resumen.averageMax)} ºC</strong>
            </article>

            <article class="summary-card">
                <span class="label">Temperatura mínima media</span>
                <strong>{formatTemp(resumen.averageMin)} ºC</strong>
            </article>

            <article class="summary-card">
                <span class="label">Precipitación total</span>
                <strong>{formatTemp(resumen.totalPrecipitation)} mm</strong>
            </article>

            <article class="summary-card">
                <span class="label">Zona horaria</span>
                <strong>{resumen.timezone}</strong>
            </article>
        </section>
    {/if}

    <section class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <div id="apex-chart"></div>
    </section>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <h2>Datos integrados</h2>

            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Temperatura mínima</th>
                        <th>Temperatura máxima</th>
                        <th>Precipitación</th>
                        <th>País API agua</th>
                        <th>Año dato agua</th>
                        <th>Población urbana con agua potable básica</th>
                    </tr>
                </thead>

                <tbody>
                    {#each tablaDatos as item (`${item.date}-${item.tempMin}-${item.tempMax}-${item.waterYear}`)}
                        <tr>
                            <td>{item.label}</td>
                            <td>{formatTemp(item.tempMin)} ºC</td>
                            <td>{formatTemp(item.tempMax)} ºC</td>
                            <td>{formatTemp(item.precipitation)} mm</td>
                            <td>{item.country}</td>
                            <td>{item.waterYear}</td>
                            <td>{formatNumber(item.waterPopulation)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Integración realizada con <strong>ApexCharts</strong>, tipo <strong>rangeBar</strong>.
        No se utiliza una gráfica de tipo line. Los datos se obtienen mediante
        <strong>fetch</strong>, se procesan como <strong>JSON</strong> y se muestran mediante
        gráfica y tabla HTML.
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
        font-size: 1.5rem;
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
        margin-bottom: 20px;
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
        min-height: 580px;
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
            min-height: 500px;
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