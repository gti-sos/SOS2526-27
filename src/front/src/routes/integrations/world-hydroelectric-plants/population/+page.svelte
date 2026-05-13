<script>
    import { onMount } from 'svelte';

    async function loadIntegration() {
        try {
            const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
            const backendHost = isLocal ? "http://localhost:10000" : window.location.origin;

            // 1. CARGA DE DATOS
            // Usamos CountriesNow API (Población histórica por país)
            const [resMy, resExt] = await Promise.all([
                fetch(`${backendHost}/api/v1/world-hydroelectric-plants?limit=1000`),
                fetch('https://countriesnow.space/api/v0.1/countries/population')
            ]);

            const myData = await resMy.json();
            const extDataRaw = await resExt.json();
            const extData = extDataRaw.data; 

            if (!myData.length || !extData) return;

            // 2. AGRUPACIÓN Y CRUCE DE DATOS
            const integratedMap = {};
            
            myData.forEach(plant => {
                const countryKey = plant.country.toLowerCase().trim();
                
                if (!integratedMap[countryKey]) {
                    // Buscamos el país 
                    const match = extData.find(e => e.country.toLowerCase().trim() === countryKey);
                    
                    if (match && match.populationCounts) {
                        // Cogemos el último año disponible de población (el último del array)
                        const latestPop = match.populationCounts[match.populationCounts.length - 1].value;
                        
                        integratedMap[countryKey] = {
                            name: plant.country.toUpperCase(),
                            capacity: 0,
                            population: latestPop
                        };
                    }
                }
                
                if (integratedMap[countryKey]) {
                    integratedMap[countryKey].capacity += Number(plant.capacity_mw);
                }
            });

            // 3. SELECCIÓN DE DATOS (Ordenados alfabéticamente)
            const finalData = Object.values(integratedMap)
            .sort((a, b) => a.name.localeCompare(b.name)) 
            .slice(0, 12); 
           
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
                        "Población": "y2" 
                    }
                },
                axis: {
                    x: {
                        type: "category",
                        categories: finalData.map(d => d.name),
                        label: "Países"
                    },
                    y: {
                        label: "Potencia Instalada (MW)"
                    },
                    y2: {
                        show: true,
                        label: "Población",
                        tick: {
                            format: d => (d / 1000000).toFixed(1) + "M"
                        }
                    }
                },
                title: {
                    text: "Cruce: Capacidad Energética vs Población"
                },
                color: {
                    pattern: ["#2980b9", "#c0392b"]
                },
                grid: {
                    y: { show: true }
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
        <h1>Integración API Externa: Population & Energy</h1>
        <button class="btn-back" on:click={() => window.history.back()}>⬅ Volver</button>
    </header>

    <div class="chart-card">
        <div id="step-chart"></div>
    </div>

    <div class="analysis-box">
        <p>
            <span class="icon">🏘️</span> 
            Se han cruzado datos de capacidad con el censo poblacional 
            obtenido de la API <strong>CountriesNow</strong>. Al usar un gráfico escalonado con <strong>doble eje Y</strong>, 
            podemos observar si existe una relación directa entre el volumen de población y la infraestructura de 
            energía renovable de cada nación sin que las escalas se solapen.
        </p>
    </div>
</main>

<style>
    :global(body) { background-color: #f8f9fa; margin: 0; font-family: sans-serif; }
    .page-container { padding: 40px; max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; }
    .btn-back { background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .chart-card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin-bottom: 35px; }
    
    .analysis-box { 
        background-color: #fff5f5; 
        border-left: 6px solid #ff4d4d; 
        padding: 25px; 
        border-radius: 4px; 
        color: #333; 
        font-size: 16px; 
        line-height: 1.6; 
    }
    .icon { margin-right: 12px; }
    #step-chart { min-height: 450px; }
</style>