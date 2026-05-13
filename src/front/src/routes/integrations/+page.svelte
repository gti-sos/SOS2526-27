<script>
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';

    const integracionesDrinkingWater = [
        {
            nombre: 'REST Countries',
            descripcion: 'Relaciona los países de la API de agua potable con información internacional normalizada mediante códigos ISO3.',
            ruta: '/integrations/drinking-water-services/rest-countries'
        },
        {
            nombre: 'Renewable Energy',
            descripcion: 'Compara los niveles de acceso a servicios de agua potable con indicadores de consumo de energías renovables.',
            ruta: '/integrations/drinking-water-services/renewable-energy'
        },
        {
            nombre: 'Open-Meteo',
            descripcion: 'Integra datos meteorológicos actuales para contextualizar el acceso al agua potable en función de las condiciones climáticas.',
            ruta: '/integrations/drinking-water-services/open-meteo'
        },
        {
            nombre: 'Online Sales',
            descripcion: 'Relaciona los datos de acceso a agua potable con indicadores de ventas online para analizar posibles patrones socioeconómicos.',
            ruta: '/integrations/drinking-water-services/online-sales'
        },
        {
            nombre: 'Countries IDH',
            descripcion: 'Compara la cobertura de servicios de agua potable con indicadores de desarrollo humano por país y año.',
            ruta: '/integrations/drinking-water-services/countries-idh'
        },
        {
            nombre: 'Alcohol Consumption',
            descripcion: 'Relaciona la cobertura de agua potable con datos de consumo de alcohol per cápita para explorar diferencias entre países.',
            ruta: '/integrations/drinking-water-services/alcohol-consumption'
        },{
            nombre:'World Bank',
            descripcion:'Consulta datos del Banco Mundial mediante un proxy propio para analizar indicadores internacionales relacionados con el acceso al agua potable',
            ruta:'/integrations/drinking-water-services/world-bank'
        }
    ];

    const integracionesHydroelectric = [
        {
            nombre: 'Art & Energy',
            descripcion: 'Comparativa entre capacidad hidroeléctrica y el patrimonio artístico del MET Museum.',
            ruta: '/integrations/world-hydroelectric-plants/art'
        },
        {
            nombre: 'Nobel Prize Stats',
            descripcion: 'Relación entre capacidad hidroeléctrica y laureados Nobel mediante Proxy.',
            ruta: '/integrations/world-hydroelectric-plants/nobel-prize'
        },
        {
            nombre: 'Wine Stats',
            descripcion: 'Distribución por variedad de uva usada en los vinos.',
            ruta: '/integrations/world-hydroelectric-plants/wine-stats'
        },
        {
            nombre: 'Esports Growth',
            descripcion: 'Evolución de la audiencia de los eSports.',
            ruta: '/integrations/world-hydroelectric-plants/esportsgrowth-stats'
        },
        {
            nombre: 'FIFA Squad Value',
            descripcion: 'Relación entre el valor de plantilla FIFA y la capacidad hidroeléctrica.',
            ruta: '/integrations/world-hydroelectric-plants/fifa-squad-value-per-years'
        },
        {
            nombre: 'Population Stats',
            descripcion: 'Correlación entre densidad de población y potencia hidroeléctrica instalada.',
            ruta: '/integrations/world-hydroelectric-plants/population'
        },
        {
            nombre: 'Road Fatalities',
            descripcion: 'Análisis de capacidad hidroeléctrica y muertes de tráfico por país.',
            ruta: '/integrations/world-hydroelectric-plants/road-fatalities'
        },
        {
            nombre: 'Universities Stats',
            descripcion: 'Relación entre el número de universidades y el potencia hidroeléctrica.',
            ruta: '/integrations/world-hydroelectric-plants/universities'
        }
    ];

    function irA(ruta) {
        goto(resolve(ruta));
    }
</script>

<svelte:head>
    <title>Integraciones - SOS2526-27</title>
</svelte:head>

<main class="container">
    <header>
        <div>
            <h1>Integraciones</h1>
            <p class="subtitle">
                Integraciones realizadas combinando las APIs
                <strong>drinking-water-services,water-dams y world-hydroelectric-plants</strong> con APIs externas y APIs de otros grupos SOS.
            </p>
        </div>

        <button class="back-button" onclick={() => irA('/')}>
            ⬅ Volver a la página principal
        </button>
    </header>

    <section class="card green-section">
        <h2>drinking-water-services</h2>

        <div class="button-grid">
            {#each integracionesDrinkingWater as integracion (integracion.ruta)}
                <article class="mini-card">
                    <h3>{integracion.nombre}</h3>
                    <p>{integracion.descripcion}</p>

                    <button class="secondary-button green-btn" onclick={() => irA(integracion.ruta)}>
                        Abrir integración
                    </button>
                </article>
            {/each}
        </div>
    </section>

    <section class="card blue-section">
        <h2>world-hydroelectric-plants</h2>

        <div class="button-grid">
            {#each integracionesHydroelectric as integracion (integracion.ruta)}
                <article class="mini-card">
                    <h3>{integracion.nombre}</h3>
                    <p>{integracion.descripcion}</p>

                    <button class="secondary-button blue-btn" onclick={() => irA(integracion.ruta)}>
                        Abrir integración
                    </button>
                </article>
            {/each}
        </div>
    </section>
</main>

<style>
    :global(body) {
        margin: 0;
        font-family: Inter, system-ui, sans-serif;
        background: #f8fafc;
        color: #1e293b;
    }

    .container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 28px;
        border-bottom: 2px solid #16a34a;
        padding-bottom: 16px;
    }

    h1 {
        margin: 0 0 8px 0;
        font-size: 2rem;
    }

    h2 {
        margin-top: 0;
        font-size: 1.25rem;
    }

    h3 {
        margin: 0 0 8px 0;
        font-size: 1rem;
        color: #0f172a;
    }

    .subtitle {
        margin: 0;
        color: #64748b;
    }

    .card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    /* ESTILOS DE BORDE POR SECCIÓN */
    .green-section { border-left: 4px solid #16a34a; }
    .blue-section { border-left: 4px solid #0284c7; }

    .button-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
    }

    .mini-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .mini-card p {
        color: #64748b;
        font-size: 0.9rem;
        margin: 0 0 14px 0;
        line-height: 1.35;
    }

    .secondary-button {
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 7px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
    }

    /* ESTILOS DE BOTÓN POR SECCIÓN */
    .green-btn { background-color: #16a34a; }
    .green-btn:hover { background-color: #15803d; }

    .blue-btn { background-color: #0284c7; }
    .blue-btn:hover { background-color: #0369a1; }

    .back-button {
        background-color: #64748b;
        color: white;
        border: none;
        padding: 9px 16px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
    }

    .back-button:hover {
        background-color: #475569;
    }

    @media (max-width: 1000px) {
        .button-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 700px) {
        header {
            flex-direction: column;
        }

        .button-grid {
            grid-template-columns: 1fr;
        }
    }
</style>