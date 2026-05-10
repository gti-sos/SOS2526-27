<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const consumicionesDrinkingWater = [
		{
			nombre: 'World Bank',
			descripcion: 'Consumición directa de World Bank mediante proxy propio.',
			ruta: '/consumptions/drinking-water-services/world-bank'
		}
	];

	function irA(ruta) {
		goto(resolve(ruta));
	}
</script>

<svelte:head>
	<title>Consumiciones - SOS2526-27</title>
</svelte:head>

<main class="container">
	<header>
		<div>
			<h1>Consumiciones</h1>
			<p class="subtitle">
				Consumiciones directas de APIs usadas como apoyo para el entregable D03.
			</p>
		</div>

		<button class="back-button" onclick={() => irA('/')}>
			⬅ Volver a la página principal
		</button>
	</header>

	<section class="card">
		<h2>drinking-water-services</h2>

		<div class="button-grid">
			{#each consumicionesDrinkingWater as consumicion (consumicion.ruta)}
				<article class="mini-card">
					<h3>{consumicion.nombre}</h3>
					<p>{consumicion.descripcion}</p>

					<button class="secondary-button" onclick={() => irA(consumicion.ruta)}>
						Abrir consumición
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
		border-bottom: 2px solid #f97316;
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
		border-left: 4px solid #f97316;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

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
		background-color: #f97316;
		color: white;
		border: none;
		padding: 8px 14px;
		border-radius: 7px;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.secondary-button:hover {
		background-color: #ea580c;
	}

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