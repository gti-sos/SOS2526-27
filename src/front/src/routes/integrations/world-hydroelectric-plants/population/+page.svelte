<script>
    import { onMount } from 'svelte';

    async function loadIntegration() {
        try {
            // 1. Detección de Host (Local vs Render)
            const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
            const backendHost = isLocal ? "http://localhost:10000" : window.location.origin;

            // 2. Carga de datos
            const [resMy, resExt] = await Promise.all([
                fetch(`${backendHost}/api/v1/world-hydroelectric-plants`),
                fetch('https://restcountries.com/v3.1/all?fields=name,population')
            ]);

            const myData = await resMy.json();
            const extData = await resExt.json();

            // 3. aAgrupación por país
            const integratedMap = {};
            myData.forEach(plant => {
                const countryKey = plant.country.toLowerCase().trim();
                if (!integratedMap[countryKey]) {
                    const match = extData.find(e => e.name.common.toLowerCase().trim() === countryKey);
                    if (match) {
                        integratedMap[countryKey] = {
                            name: plant.country.toUpperCase(),
                            capacity: 0,
                            population: match.population
                        };
                    }
                }
                if (integratedMap[countryKey]) {
                    integratedMap[countryKey].capacity += Number(plant.capacity_mw);
                }
            });

            // 4. Ordenación Alfabética
            const finalData = Object.values(integratedMap).sort((a, b) => a.name.localeCompare(b.name));

            // Billboard.js - area-step
            window.bb.generate({
                bindto: "#step-chart",
                data: {
                    columns: [
                        ["Capacidad MW", ...finalData.map(d => d.capacity)],
                        ["Población", ...finalData.map(d => d.population)]
                    ],
                    type: "area-step", 
                    axes: {
                        "Población": "y2" // Doble eje 
                    }
                },
                axis: {
                    x: {
                        type: "category",
                        categories: finalData.map(d => d.name),
                        label: "Países"
                    },
                    y: {
                        label: "Capacidad (MW)"
                    },
                    y2: {
                        show: true,
                        label: "Población Total"
                    }
                },
                color: {
                    pattern: ["#1f77b4", "#ff7f0e"]
                }
            });

        } catch (e) {
            console.error("Error en la integración:", e);
        }
    }

    onMount(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/billboard.js/dist/billboard.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/billboard.js/dist/billboard.pkgd.min.js";
        script.onload = loadIntegration;
        document.head.appendChild(script);
    });
</script>

<main class="page-container">
    <header class="header">
        <h1>Integración Externa: Population & Energy</h1>
        <button class="btn-back" on:click={() => window.history.back()}>⬅ Volver</button>
    </header>

    <div class="chart-card">
        <div id="step-chart"></div>
    </div>

    <div class="info-panel">
        <p>🚀 Cruce de datos de capacidad hydroeléctrica (API propia) con población (API externa).</p>
    </div>
</main>

<style>
    .page-container { padding: 30px; max-width: 1100px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-back { background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    .chart-card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .info-panel { margin-top: 25px; padding: 20px; background: #fdf2f2; border-left: 5px solid #dc2626; color: #991b1b; }
    
    #step-chart { min-height: 450px; }
</style>