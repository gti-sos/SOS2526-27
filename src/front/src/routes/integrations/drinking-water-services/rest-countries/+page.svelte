<script>
    import { onMount } from 'svelte';

    const myAPI = '/api/v1/drinking-water-services';

    const restCountriesAPI =
        'https://restcountries.com/v3.1/region/europe?fields=name,population,area,region,subregion,capital,cca3';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);
    let resumen = $state(null);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 0
        }).format(value);
    }

    function formatDecimal(value) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    async function loadIntegration() {
        try {
            cargando = true;
            mensajeError = '';
            tablaDatos = [];
            resumen = null;

            const [resMine, resCountries] = await Promise.all([
                fetch(myAPI),
                fetch(restCountriesAPI)
            ]);

            if (!resMine.ok) {
                throw new Error(`Error en mi API: ${resMine.status}`);
            }

            if (!resCountries.ok) {
                throw new Error(`Error en REST Countries: ${resCountries.status}`);
            }

            const myData = await resMine.json();
            const countriesData = await resCountries.json();

            if (!Array.isArray(myData) || !Array.isArray(countriesData)) {
                mensajeError = 'Alguna de las APIs no ha devuelto un array válido.';
                cargando = false;
                return;
            }

            if (myData.length === 0 || countriesData.length === 0) {
                mensajeError = 'Faltan datos en una de las APIs.';
                cargando = false;
                return;
            }

            // 1. Procesamos REST Countries
            const countriesProcessed = countriesData
                .filter((item) => {
                    return (
                        item.name &&
                        item.name.common &&
                        item.cca3 &&
                        item.population !== undefined &&
                        Number.isFinite(Number(item.population))
                    );
                })
                .map((item) => {
                    return {
                        country: item.name.common,
                        code: item.cca3,
                        capital: item.capital ? item.capital[0] : 'Sin capital',
                        region: item.region || 'Sin región',
                        subregion: item.subregion || 'Sin subregión',
                        population: Number(item.population),
                        area: Number(item.area) || 0
                    };
                });

            // 2. Procesamos MI API: último dato disponible por código ISO3
            const latestWaterByCode = {};

            myData.forEach((item) => {
                if (
                    !item.code ||
                    item.year === undefined ||
                    item.wat_bas_pop_residence_urban === null ||
                    item.wat_bas_pop_residence_urban === undefined ||
                    !Number.isFinite(Number(item.wat_bas_pop_residence_urban))
                ) {
                    return;
                }

                const code = item.code;
                const year = Number(item.year);
                const waterPopulation = Number(item.wat_bas_pop_residence_urban);

                if (waterPopulation <= 0) {
                    return;
                }

                if (!latestWaterByCode[code] || year > latestWaterByCode[code].year) {
                    latestWaterByCode[code] = {
                        entity: item.entity,
                        code,
                        year,
                        waterPopulation
                    };
                }
            });

            // 3. Integramos ambas APIs mediante código ISO3
            const integratedData = countriesProcessed
                .filter((country) => latestWaterByCode[country.code])
                .map((country) => {
                    const water = latestWaterByCode[country.code];

                    const estimatedCoverage =
                        country.population > 0
                            ? (water.waterPopulation / country.population) * 100
                            : 0;

                    const density = country.area > 0 ? country.population / country.area : 0;

                    return {
                        country: country.country,
                        code: country.code,
                        capital: country.capital,
                        region: country.region,
                        subregion: country.subregion,
                        population: country.population,
                        area: country.area,
                        density,
                        waterYear: water.year,
                        waterPopulation: water.waterPopulation,
                        estimatedCoverage
                    };
                })
                .filter((item) => item.estimatedCoverage > 0)
                .sort((a, b) => b.estimatedCoverage - a.estimatedCoverage);

            if (integratedData.length === 0) {
                mensajeError =
                    'No hay países europeos coincidentes entre mi API y REST Countries.';
                cargando = false;
                return;
            }

            tablaDatos = integratedData;

            const averageCoverage =
                integratedData.reduce((acc, item) => acc + item.estimatedCoverage, 0) /
                integratedData.length;

            const totalPopulation = integratedData.reduce(
                (acc, item) => acc + item.population,
                0
            );

            const totalWaterPopulation = integratedData.reduce(
                (acc, item) => acc + item.waterPopulation,
                0
            );

            resumen = {
                totalCountries: integratedData.length,
                averageCoverage,
                totalPopulation,
                totalWaterPopulation,
                bestCountry: integratedData[0],
                worstCountry: integratedData[integratedData.length - 1]
            };

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando la integración con REST Countries:', error);
            mensajeError = `Error al cargar la integración: ${error.message}`;
            cargando = false;
        }
    }

    async function renderChart() {
        const ApexCharts = (await import('apexcharts')).default;

        const chartData = tablaDatos.slice(0, 12);

        const values = chartData.map((item) => {
            return Number(Math.min(item.estimatedCoverage, 100).toFixed(2));
        });

        const labels = chartData.map((item) => item.country);

        const options = {
            series: values,
            chart: {
                type: 'radialBar',
                height: 560,
                toolbar: {
                    show: true
                }
            },
            title: {
                text: 'Integración: países europeos y agua potable urbana',
                align: 'center'
            },
            subtitle: {
                text: 'REST Countries + mi API drinking-water-services mediante código ISO3',
                align: 'center'
            },
            labels,
            plotOptions: {
                radialBar: {
                    dataLabels: {
                        name: {
                            fontSize: '14px'
                        },
                        value: {
                            fontSize: '14px',
                            formatter: function (value) {
                                return `${formatDecimal(value)}%`;
                            }
                        },
                        total: {
                            show: true,
                            label: 'Media',
                            formatter: function () {
                                return `${formatDecimal(resumen.averageCoverage)}%`;
                            }
                        }
                    }
                }
            },
            tooltip: {
                custom: function ({ seriesIndex }) {
                    const item = chartData[seriesIndex];

                    return `
                        <div style="padding:10px; background:white; border:1px solid #ccc;">
                            <strong>${item.country} (${item.code})</strong><br>
                            <span>Capital: ${item.capital}</span><br>
                            <span>Subregión: ${item.subregion}</span><br>
                            <span>Población total: ${formatNumber(item.population)}</span><br>
                            <span>Población urbana con agua potable: ${formatNumber(item.waterPopulation)}</span><br>
                            <span>Año dato agua potable: ${item.waterYear}</span><br>
                            <span>Porcentaje estimado: ${formatDecimal(item.estimatedCoverage)}%</span>
                        </div>
                    `;
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
    <title>Integración con REST Countries</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración: países europeos y agua potable</h1>
            <p class="subtitle">
                Cruce entre mi API <strong>drinking-water-services</strong> y la API externa
                <strong>REST Countries</strong>.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/'}>
            ⬅ Volver a la pagina principal
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción de la integración</h2>

        <p>
            Esta vista realiza dos peticiones mediante <strong>fetch</strong>: una a mi API de
            servicios de agua potable urbana y otra a la API externa REST Countries, que proporciona
            información general de países europeos. Ambas APIs devuelven datos en formato
            <strong>JSON</strong>.
        </p>

        <p>
            La integración se realiza cruzando ambas fuentes mediante el código ISO3:
            <strong>code</strong> en mi API y <strong>cca3</strong> en REST Countries.
            Para cada país europeo coincidente, se toma el último dato disponible de
            <strong>wat_bas_pop_residence_urban</strong> y se compara con la población total del
            país obtenida desde REST Countries.
        </p>

        <p>
            A partir de ambas APIs se calcula un indicador combinado:
            <strong>población urbana con agua potable básica / población total del país</strong>.
            Los resultados se muestran mediante una gráfica <strong>radialBar</strong> y una tabla
            HTML, evitando mostrar JSON en bruto.
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
                <span class="label">Países europeos integrados</span>
                <strong>{resumen.totalCountries}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Población total integrada</span>
                <strong>{formatNumber(resumen.totalPopulation)}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Población urbana con agua</span>
                <strong>{formatNumber(resumen.totalWaterPopulation)}</strong>
            </article>

            <article class="summary-card">
                <span class="label">Media estimada</span>
                <strong>{formatDecimal(resumen.averageCoverage)}%</strong>
            </article>
        </section>

        <section class="summary-grid">
            <article class="summary-card">
                <span class="label">Mayor porcentaje estimado</span>
                <strong>
                    {resumen.bestCountry.country}
                    ({formatDecimal(resumen.bestCountry.estimatedCoverage)}%)
                </strong>
            </article>

            <article class="summary-card">
                <span class="label">Menor porcentaje estimado</span>
                <strong>
                    {resumen.worstCountry.country}
                    ({formatDecimal(resumen.worstCountry.estimatedCoverage)}%)
                </strong>
            </article>

            <article class="summary-card">
                <span class="label">Fuente externa</span>
                <strong>REST Countries</strong>
            </article>

            <article class="summary-card">
                <span class="label">Cruce utilizado</span>
                <strong>code / cca3</strong>
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
                        <th>País</th>
                        <th>Código</th>
                        <th>Capital</th>
                        <th>Subregión</th>
                        <th>Población total</th>
                        <th>Área</th>
                        <th>Densidad</th>
                        <th>Año dato agua</th>
                        <th>Población urbana con agua potable</th>
                        <th>Porcentaje estimado</th>
                    </tr>
                </thead>

                <tbody>
                    {#each tablaDatos as item (`${item.code}-${item.waterYear}`)}
                        <tr>
                            <td>{item.country}</td>
                            <td>{item.code}</td>
                            <td>{item.capital}</td>
                            <td>{item.subregion}</td>
                            <td>{formatNumber(item.population)}</td>
                            <td>{formatNumber(item.area)} km²</td>
                            <td>{formatDecimal(item.density)} hab/km²</td>
                            <td>{item.waterYear}</td>
                            <td>{formatNumber(item.waterPopulation)}</td>
                            <td>{formatDecimal(item.estimatedCoverage)}%</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Integración realizada con <strong>ApexCharts</strong>, tipo <strong>radialBar</strong>.
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
        background: #f5f3ff;
        border: 1px solid #ddd6fe;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #4c1d95;
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