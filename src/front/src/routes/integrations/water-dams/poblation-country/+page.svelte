<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    let myAPI = '/api/v1/water-dams';
    if (dev) myAPI = 'http://localhost:10000' + myAPI;
    const countriesAPI = 'https://restcountries.com/v3.1/all?fields=name,population';

    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES').format(value);
    }

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
            const [resMine, resExt] = await Promise.all([ fetch(myAPI), fetch(countriesAPI) ]);
            const myRawData = await resMine.json();
            const extRawData = await resExt.json();

            const myGrouped = {};
            myRawData.forEach(item => {
                const c = normalizeCountry(item.country);
                myGrouped[c] = (myGrouped[c] || 0) + (Number(item.cap_mcm) || 0);
            });

            const popMap = {};
            extRawData.forEach(c => { popMap[c.name.common] = c.population; });

            tablaDatos = Object.keys(myGrouped)
                .filter(c => popMap[c])
                .map(c => ({
                    country: c,
                    dams: myGrouped[c],
                    population: popMap[c],
                    ratio: (myGrouped[c] / (popMap[c] / 1000000)).toFixed(2)
                }))
                .sort((a, b) => b.dams - a.dams); // Ordenamos para que el embudo se vea bien

            if (tablaDatos.length > 0) {
                setTimeout(renderChart, 200);
            }
        } catch (error) {
            mensajeError = 'Error al cargar la integración.';
        } finally {
            cargando = false;
        }
    }

    function renderChart() {
        const data = [{
            type: 'funnel',
            y: tablaDatos.map(i => i.country),
            x: tablaDatos.map(i => i.dams),
            textinfo: "value+percent initial",
            connector: { line: { color: "royalblue", width: 3 } },
            marker: {
                color: ["#636EFA", "#EF553B", "#00CC96", "#AB63FA", "#FFA15A"],
                line: { width: [2, 2, 2, 2, 2], color: "white" }
            }
        }];

        const layout = {
            title: { text: "Embudo de Capacidad Hídrica por País (mcm)" },
            margin: { l: 150 },
            width: 800,
            height: 500
        };

        Plotly.newPlot('plotly-div', data, layout);
    }

    onMount(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.plot.ly/plotly-2.24.1.min.js";
        script.onload = loadIntegration;
        document.head.appendChild(script);
    });
</script>

<main class="container">
    <header class="header">
        <h1>Integración Global (API externa): Plotly Funnel</h1>
        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>⬅ Volver</button>
    </header>

    <section class="info-box">
        <p>Esta integración utiliza un <strong>Funnel Chart</strong> (Embudo) de la Api de REST Countries API para visualizar jerárquicamente la capacidad de las presas comparada con la población entre países.</p>
    </section>

    <div id="plotly-div" style="display: flex; justify-content: center; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 30px;"></div>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Suma Presas (mcm)</th>
                        <th>Población</th>
                        <th>Ratio (mcm/millón)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tablaDatos as item}
                        <tr>
                            <td>{item.country}</td>
                            <td>{formatNumber(item.dams)}</td>
                            <td>{formatNumber(item.population)}</td>
                            <td><strong>{item.ratio}</strong></td>
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
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; color: #475569; margin-bottom: 20px; }
    .btn-back { background-color: #475569; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .table-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
</style>