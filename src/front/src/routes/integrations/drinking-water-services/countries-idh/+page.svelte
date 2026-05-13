<script>
    import { onMount } from 'svelte';

    const myAPI = '/api/v1/drinking-water-services';
    const g26API = 'https://sos2526-26.onrender.com/api/v2/countries-idh-per-years';

    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 2
        }).format(value);
    }

    function formatDecimal(value) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }).format(value);
    }

    function normalizeCountryKey(country) {
        if (!country) return '';

        const replacements = {
            'united-states': 'united states',
            'united-states-of-america': 'united states',
            'usa': 'united states',
            'uk': 'united kingdom',
            'russian-federation': 'russia',
            'viet-nam': 'vietnam'
        };

        const normalized = country
            .toString()
            .trim()
            .toLowerCase()
            .replaceAll('-', ' ')
            .replace(/\s+/g, ' ');

        return replacements[normalized] || normalized;
    }

    function normalizeCountryLabel(country) {
        if (!country) return 'Sin país';

        return country
            .toString()
            .trim()
            .replaceAll('-', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    async function loadIntegration() {
        try {
            cargando = true;
            mensajeError = '';
            tablaDatos = [];

            const [resMine, resG26] = await Promise.all([
                fetch(myAPI),
                fetch(g26API)
            ]);

            if (!resMine.ok) {
                throw new Error(`Error en mi API: ${resMine.status}`);
            }

            if (!resG26.ok) {
                throw new Error(`Error en la API del Grupo 26: ${resG26.status}`);
            }

            const myData = await resMine.json();
            const g26Data = await resG26.json();

            if (!Array.isArray(myData) || !Array.isArray(g26Data)) {
                mensajeError = 'Alguna de las APIs no ha devuelto un array válido.';
                cargando = false;
                return;
            }

            if (myData.length === 0 || g26Data.length === 0) {
                mensajeError = 'Faltan datos. Asegúrate de que ambas APIs tienen datos cargados.';
                cargando = false;
                return;
            }

            // Años disponibles en la API del Grupo 26
            const g26Years = new Set(
                g26Data
                    .map((d) => Number(d.year))
                    .filter((year) => Number.isFinite(year))
            );

           
            const myProcessedData = {};

            myData.forEach((d) => {
                if (
                    !d.entity ||
                    d.year === undefined ||
                    d.wat_bas_pop_residence_urban === null ||
                    d.wat_bas_pop_residence_urban === undefined
                ) {
                    return;
                }

                const year = Number(d.year);

                if (!g26Years.has(year)) {
                    return;
                }

                const countryKey = normalizeCountryKey(d.entity);
                const countryLabel = normalizeCountryLabel(d.entity);
                const waterValue = Number(d.wat_bas_pop_residence_urban) || 0;

                if (waterValue <= 0) {
                    return;
                }

                if (!myProcessedData[countryKey]) {
                    myProcessedData[countryKey] = {
                        countryLabel,
                        waterTotal: 0,
                        records: 0,
                        years: new Set()
                    };
                }

                myProcessedData[countryKey].waterTotal += waterValue;
                myProcessedData[countryKey].records += 1;
                myProcessedData[countryKey].years.add(year);
            });

            // 2. Procesamos la API del G26: HDI por país y año
            const g26ProcessedData = {};

            g26Data.forEach((d) => {
                if (
                    !d.country ||
                    d.year === undefined ||
                    d.hdi_value === undefined ||
                    !Number.isFinite(Number(d.hdi_value))
                ) {
                    return;
                }

                const countryKey = normalizeCountryKey(d.country);
                const countryLabel = normalizeCountryLabel(d.country);
                const hdiValue = Number(d.hdi_value);
                const hdiRank = Number(d.hdi_rank);
                const hdiChange = Number(d.hdi_change);
                const year = Number(d.year);

                if (hdiValue <= 0) {
                    return;
                }

                if (!g26ProcessedData[countryKey]) {
                    g26ProcessedData[countryKey] = {
                        countryLabel,
                        hdiTotal: 0,
                        hdiRankTotal: 0,
                        hdiChangeTotal: 0,
                        records: 0,
                        years: new Set()
                    };
                }

                g26ProcessedData[countryKey].hdiTotal += hdiValue;
                g26ProcessedData[countryKey].hdiRankTotal += Number.isFinite(hdiRank) ? hdiRank : 0;
                g26ProcessedData[countryKey].hdiChangeTotal += Number.isFinite(hdiChange) ? hdiChange : 0;
                g26ProcessedData[countryKey].records += 1;
                g26ProcessedData[countryKey].years.add(year);
            });

            // 3. Cruzamos solo países que aparecen en ambas APIs
            const commonCountries = Object.keys(myProcessedData).filter((countryKey) => {
                return g26ProcessedData[countryKey];
            });

            if (commonCountries.length === 0) {
                mensajeError =
                    'No hay países coincidentes entre mi API y la API del Grupo 26 para poder integrarlos.';
                cargando = false;
                return;
            }

            tablaDatos = commonCountries
                .map((countryKey) => {
                    const water = myProcessedData[countryKey];
                    const hdi = g26ProcessedData[countryKey];

                    return {
                        country: hdi.countryLabel || water.countryLabel,
                        waterAverage: water.waterTotal / water.records,
                        hdiAverage: hdi.hdiTotal / hdi.records,
                        hdiRankAverage: hdi.hdiRankTotal / hdi.records,
                        hdiChangeAverage: hdi.hdiChangeTotal / hdi.records,
                        myYears: Array.from(water.years).sort((a, b) => a - b).join(', '),
                        g26Years: Array.from(hdi.years).sort((a, b) => a - b).join(', ')
                    };
                })
                .sort((a, b) => b.hdiAverage - a.hdiAverage);

            await renderChart();

            cargando = false;
        } catch (error) {
            console.error('Error cargando la integración con G26:', error);
            mensajeError = `Error al cargar la integración: ${error.message}`;
            cargando = false;
        }
    }

    async function renderChart() {
        const ApexCharts = (await import('apexcharts')).default;

        const chartData = tablaDatos.slice(0, 25).map((item) => {
            return {
                x: Number(item.waterAverage.toFixed(2)),
                y: Number(item.hdiAverage.toFixed(3)),
                country: item.country,
                hdiRankAverage: item.hdiRankAverage,
                hdiChangeAverage: item.hdiChangeAverage,
                myYears: item.myYears,
                g26Years: item.g26Years
            };
        });

        const options = {
            series: [
                {
                    name: 'Países integrados',
                    data: chartData
                }
            ],
            chart: {
                type: 'scatter',
                height: 540,
                zoom: {
                    enabled: true,
                    type: 'xy'
                },
                toolbar: {
                    show: true
                }
            },
            title: {
                text: 'Integración: agua potable urbana e índice de desarrollo humano',
                align: 'center'
            },
            subtitle: {
                text: 'Comparación entre mi API drinking-water-services y la API countries-idh-per-years del Grupo 26',
                align: 'center'
            },
            xaxis: {
                title: {
                    text: 'Media de población urbana con agua potable básica'
                },
                labels: {
                    formatter: function (value) {
                        return formatNumber(value);
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Media del Índice de Desarrollo Humano'
                },
                min: 0,
                max: 1,
                labels: {
                    formatter: function (value) {
                        return Number(value).toFixed(2);
                    }
                }
            },
            markers: {
                size: 7
            },
            dataLabels: {
                enabled: false
            },
            tooltip: {
                custom: function ({ dataPointIndex }) {
                    const item = chartData[dataPointIndex];

                    return `
                        <div style="padding:10px; background:white; border:1px solid #ccc;">
                            <strong>${item.country}</strong><br>
                            <span>Media población urbana con agua potable: ${formatNumber(item.x)}</span><br>
                            <span>Media IDH: ${formatDecimal(item.y)}</span><br>
                            <span>Ranking medio IDH: ${formatNumber(item.hdiRankAverage)}</span><br>
                            <span>Cambio medio ranking: ${formatNumber(item.hdiChangeAverage)}</span><br>
                            <span>Años en mi API: ${item.myYears}</span><br>
                            <span>Años en G26: ${item.g26Years}</span>
                        </div>
                    `;
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
    <title>Integración con G26</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración: agua potable e IDH</h1>
            <p class="subtitle">
                Comparación entre mi API <strong>drinking-water-services</strong> y la API
                <strong>countries-idh-per-years</strong> del Grupo 26.
            </p>
        </div>

        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
            ⬅ Volver a la pagina de integraciones
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción de la integración</h2>

       

        <p>
            En mi API se calcula la media de <strong>wat_bas_pop_residence_urban</strong>, que
            representa la población urbana con servicios básicos de agua potable. En la API del
            Grupo 26 se calcula la media de <strong>hdi_value</strong>, que representa el Índice de
            Desarrollo Humano.
        </p>

       
    </section>

    {#if cargando}
        <p class="loading-msg">Haciendo fetch a las APIs y procesando datos...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
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
                        <th>País / entidad</th>
                        <th>Media población urbana con agua potable básica</th>
                        <th>Media IDH</th>
                        <th>Ranking medio IDH</th>
                        <th>Cambio medio ranking</th>
                        <th>Años en mi API</th>
                        <th>Años en G26</th>
                    </tr>
                </thead>

                <tbody>
                    {#each tablaDatos as item (`${item.country}-${item.myYears}-${item.g26Years}`)}
                        <tr>
                            <td>{item.country}</td>
                            <td>{formatNumber(item.waterAverage)}</td>
                            <td>{formatDecimal(item.hdiAverage)}</td>
                            <td>{formatNumber(item.hdiRankAverage)}</td>
                            <td>{formatNumber(item.hdiChangeAverage)}</td>
                            <td>{item.myYears}</td>
                            <td>{item.g26Years}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Integración realizada con <strong>ApexCharts</strong>, tipo <strong>scatter</strong>.
        
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
        background: #eef6ff;
        border: 1px solid #cfe2ff;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #1f456e;
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

    @media (max-width: 700px) {
        .header {
            flex-direction: column;
        }

        .chart-container {
            min-height: 460px;
        }
    }
</style>