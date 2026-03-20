<script>
	const equipo = [
		{
			nombre: 'Alejandro Campos Sánchez-Cruzado',
			recurso: 'drinking-water-services',
			frontend: '/drinking-water-services',
			api: '/api/v1/drinking-water-services',
			docs: 'https://documenter.getpostman.com/view/52242576/2sBXieqtPa',
			github: 'https://github.com/alecamsan1'
		},
		{
			nombre: 'Alejandro Catalán Noviembre',
			recurso: 'water-dams',
			frontend: '/water-dams',
			api: '/api/v1/water-dams',
			docs: "https://documenter.getpostman.com/view/52243900/2sBXigNZbh",
			github: 'https://github.com/alecn-us'
		},
		{
			nombre: 'Adrián Pérez Sánchez',
			recurso: 'world-hydroelectric-plants',
			frontend: '/world-hydroelectric-plants',
			api: '/api/v1/world-hydroelectric-plants',
			docs: "https://documenter.getpostman.com/view/52298948/2sBXigMDpo",
			github: 'https://github.com/adrianperez17'
		}
	];

	const repositorioEquipo = 'https://github.com/gti-sos/SOS2526-27';

	/** @param {string} ruta */
	function irA(ruta) {
		window.location.href = ruta;
	}

	/** @param {string} url */
	function abrirExterno(url) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
    function irAAbout() {
		window.location.href = '/about', '_self';
	}
</script>

<svelte:head>
	<title>SOS2526-27</title>
</svelte:head>

<div class="container">
	<header>
		<div>
			<h1>SOS2526-27</h1>
			<p class="subtitle">
				Portal del equipo con acceso a los frontends, APIs, documentación y repositorio.
			</p>
		</div>
		<button class="link-button" onclick={irAAbout}>Sobre el equipo</button>
	</header>

	<section class="card">
		<h2>Repositorio del equipo</h2>
		<p>
			<button class="link-button" onclick={() => abrirExterno(repositorioEquipo)}>
				Ir al repositorio de GitHub
			</button>
		</p>
	</section>

	<section class="card">
		<h2>Componentes del equipo y recursos</h2>

		<table>
			<thead>
				<tr>
					<th>Miembro</th>
					<th>Fuente de datos / recurso</th>
					<th>Frontend</th>
					<th>API base</th>
					<th>Documentación Postman</th>
					<th>GitHub</th>
				</tr>
			</thead>
			<tbody>
				{#each equipo as persona (persona.recurso)}
					<tr>
						<td>{persona.nombre}</td>
						<td>{persona.recurso}</td>
						<td>
							<button class="link-button" onclick={() => irA(persona.frontend)}>
								Abrir frontend
							</button>
						</td>
						<td>
							<button class="link-button" onclick={() => irA(persona.api)}>
								Abrir API
							</button>
						</td>
						<td>
							<button class="link-button" onclick={() => abrirExterno(persona.docs)}>
								Ver documentación
							</button>
						</td>
						<td>
							<button class="link-button" onclick={() => abrirExterno(persona.github)}>
								Perfil GitHub
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</div>

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
		border-bottom: 2px solid #2563eb;
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

	.subtitle {
		margin: 0;
		color: #64748b;
	}

	.link-button {
		background: none;
		border: none;
		padding: 0;
		color: #2563eb;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 12px;
	}

	th,
	td {
		text-align: left;
		padding: 12px;
		border-bottom: 1px solid #e2e8f0;
		vertical-align: top;
	}

	th {
		background: #f8fafc;
		font-weight: 700;
	}

	.link-button:hover {
		text-decoration: underline;
	}

	@media (max-width: 900px) {
		header {
			flex-direction: column;
		}

		table,
		thead,
		tbody,
		tr,
		th,
		td {
			display: block;
		}

		thead {
			display: none;
		}

		tr {
			border: 1px solid #e2e8f0;
			border-radius: 10px;
			padding: 10px;
			margin-bottom: 12px;
			background: white;
		}

		td {
			border-bottom: none;
			padding: 6px 0;
		}
	}
</style>