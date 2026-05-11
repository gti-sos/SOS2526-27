<script>
    import { onMount, tick } from 'svelte';
    import { Chart } from 'frappe-charts';

    // Se elimina statusMsg para que no aparezca ningún mensaje de carga

    async function loadIntegration() {
        try {
            // 1. Peticiones al Proxy y a tu API (Arquitectura según pág. 9 )
            const resProxy = await fetch('/api/v1/proxy-worldbank');
            const resMy = await fetch('/api/v1/world-hydroelectric-plants');

            if (!resProxy.ok || !resMy.ok) return;

            const externalData = await resProxy.json();
            const myData = await resMy.json();

            // 2. Lógica de Agrupación por País (Evita repeticiones)
            const gdpList = externalData[1];
            const countryMap = myData.reduce((acc, plant) => {
                const pCountry = plant.country.toLowerCase().trim();
                
                if (acc[pCountry]) {
                    acc[pCountry].capacity += Number(plant.capacity_mw);
                } else {
                    const gdpEntry = gdpList.find(g => 
                        g.country.value.toLowerCase().trim().includes(pCountry)
                    );
                    if (gdpEntry && gdpEntry.value) {
                        acc[pCountry] = {
                            name: plant.country.toUpperCase(),
                            capacity: Number(plant.capacity_mw),
                            gdp: Number((gdpEntry.value / 1e9).toFixed(2))
                        };
                    }
                }
                return acc;
            }, {});

            // 3. ORDENACIÓN ALFABÉTICA de los países
            const processedData = Object.values(countryMap).sort((a, b) => 
                a.name.localeCompare(b.name)
            );

            if (processedData.length > 0) {
                // Esperamos a que el DOM esté listo sin mostrar mensajes previos
                await tick(); 

                new Chart("#chart-final", {
                    title: "Potencia Total vs PIB (Orden Alfabético)",
                    data: {
                        labels: processedData.map(d => d.name),
                        datasets: [
                            { 
                                name: "Capacidad (MW)", 
                                chartType: "bar", 
                                values: processedData.map(d => d.capacity) 
                            },
                            { 
                                name: "PIB (Billones $)", 
                                chartType: "line", 
                                values: processedData.map(d => d.gdp) 
                            }
                        ]
                    },
                    type: 'bar',
                    height: 450,
                    colors: ['#3498db', '#e74c3c']
                });
            }
        } catch (error) {
            console.error("Error cargando la integración:", error);
        }
    }

    onMount(loadIntegration);
</script>

<main class="container">
    <header class="header">
        <h1>Externa 1: World Bank (GDP) vía Proxy</h1>
        <button class="btn-back" on:click={() => window.history.back()}>⬅ Volver</button>
    </header>

    <div id="chart-final" style="min-height: 450px; background: white; border-radius: 12px;"></div>
    
    <div class="info-box">
        <p>🛡️ <strong>Proxy Propio:</strong> Se utiliza el esquema de la pág. 9 para evitar bloqueos SOP.</p>
        <p>📊 <strong>Complejidad:</strong> Integración Widget Normal (0,20 pts) según la tabla de complejidad de la asignatura.</p>
    </div>
</main>

<style>
    .container { padding: 30px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .btn-back { background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    #chart-final { padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .info-box { 
        margin-top: 25px; 
        background: #e3f2fd; 
        padding: 15px; 
        border-left: 5px solid #2196f3; 
        font-size: 0.9rem;
    }
</style>