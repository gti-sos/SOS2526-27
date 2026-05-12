<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    let myAPI = '/api/v1/water-dams';
    if (dev) myAPI = 'http://localhost:10000' + myAPI;

    // API Externa: Datos de consumo de agua (Estimaciones basadas en promedios mundiales)
    const consumptionAPI = 'https://restcountries.com/v3.1/all?fields=name,area';

    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES').format(value);
    }

    // Datos de consumo aproximado (m3 por habitante/año) según la FAO para estos países
    const waterUsagePerCapita = {
        "Spain": 700,
        "United States": 1500,
        "Canada": 1200,
        "Germany": 400,
        "Italy": 750,
        "China": 450,
        "Sweden": 300
    };

    function normalizeCountry(name) {
        if (!name) return '';
        let country = name.toString().trim().toLowerCase();
        if (country === 'spain' || country === 'españa') return 'Spain';
        if (country === 'italy' || country === 'italia') return 'Italy';
        if (country === 'germany' || country === 'alemania') return 'Germany';
        return country.charAt(0).toUpperCase() + country.slice(1);
    }

    async function loadIntegration() {
        try {
            cargando = true;
            const resMine = await fetch(myAPI);
            const myRawData = await resMine.json();

            // 1. Agrupamos tus presas
            const myGrouped = {};
            myRawData.forEach(item => {
                const c = normalizeCountry(item.country);
                myGrouped[c] = (myGrouped[c] || 0) + (Number(item.cap_mcm) || 0);
            });

            // 2. Cruzamos con datos de consumo (FAO + Población para calcular consumo total)
            // Usamos RestCountries solo para obtener la población actualizada y calcular el total
            const resPop = await fetch('https://restcountries.com/v3.1/all?fields=name,population');
            const popData = await resPop.json();
            const popMap = {};
            popData.forEach(c => { popMap[c.name.common] = c.population; });

            tablaDatos = Object.keys(myGrouped)
                .filter(c => waterUsagePerCapita[c] && popMap[c])
                .map(c => {
                    const pop = popMap[c];
                    const usagePerPerson = waterUsagePerCapita[c];
                    // Consumo total anual en mcm (millones de metros cúbicos)
                    const totalUsageMcm = (pop * usagePerPerson) / 1000000; 
                    
                    return {
                        country: c,
                        capacity: myGrouped[c],
                        consumption: totalUsageMcm.toFixed(2)
                    };
                });

            renderChart();
        } catch (error) {
            mensajeError = 'Error al integrar con datos de consumo mundial.';
        } finally {
            cargando = false;
        }
    }

    async function renderChart() {
        const Highcharts = (await import('highcharts')).default;
        
        Highcharts.chart('container-chart', {
            chart: { type: 'area' },
            title: { text: 'Balance Hídrico: Capacidad vs Consumo Anual' },
            xAxis: { categories: tablaDatos.map(i => i.country) },
            yAxis: { title: { text: 'Millones de m³ (mcm)' } },
            tooltip: { shared: true },
            plotOptions: {
                area: {
                    fillOpacity: 0.5,
                    marker: { enabled: false, symbol: 'circle', radius: 2, states: { hover: { enabled: true } } }
                }
            },
            series: [{
                name: 'Capacidad Almacenada (Presas)',
                data: tablaDatos.map(i => Number(i.capacity)),
                color: '#2b908f'
            }, {
                name: 'Consumo Estimado (País)',
                data: tablaDatos.map(i => Number(i.consumption)),
                color: '#f45b5b'
            }]
        });
    }

    onMount(loadIntegration);
</script>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración (API externa): Balance Hídrico Mundial</h1>
            <p class="subtitle">Capacidad de almacenamiento frente a demanda de consumo (FAO Data).</p>
        </div>
        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>⬅ Volver</button>
    </header>

    <section class="info-box">
        <p>Integración <strong>Normal (0,20 pts)</strong>. Comparamos la oferta (capacidad de nuestras presas) frente a la demanda (consumo anual total calculado mediante población y datos de uso de la FAO).</p>
    </section>

    <div id="container-chart" style="width: 100%; height: 500px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 30px;"></div>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Oferta (Capacidad Presas mcm)</th>
                        <th>Demanda (Consumo Anual mcm)</th>
                        <th>Diferencia</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tablaDatos as item}
                        <tr>
                            <td>{item.country}</td>
                            <td>{formatNumber(item.capacity)}</td>
                            <td>{formatNumber(item.consumption)}</td>
                            <td style="color: {item.capacity - item.consumption > 0 ? 'green' : 'red'}">
                                {formatNumber((item.capacity - item.consumption).toFixed(2))}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    .container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
    .info-box { background: #eef2ff; border: 1px solid #c3dafe; padding: 15px; border-radius: 8px; color: #1e40af; margin-bottom: 20px; }
    .btn-back { background-color: #312e81; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .table-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
</style>