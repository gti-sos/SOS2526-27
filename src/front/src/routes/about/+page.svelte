<script>
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>About | SOS2526-27</title>
</svelte:head>

<div class="container">
	<header>
		<h1>SOS2526-27</h1>
		<a href={resolve('/')} class="back-link">&larr; Volver al inicio</a>
	</header>

	<div class="section-card">
		<h2>Team</h2>
		<ul>
			<li>
				<span>Alejandro Campos Sánchez-Cruzado</span>
				<a href="https://github.com/alecamsan1" class="github-tag" target="_blank" rel="noopener noreferrer">
					@alecamsan1
				</a>
			</li>
			<li>
				<span>Alejandro Catalán Noviembre</span>
				<a href="https://github.com/alecn-us" class="github-tag" target="_blank" rel="noopener noreferrer">
					@alecn-us
				</a>
			</li>
			<li>
				<span>Adrián Pérez Sánchez</span>
				<a href="https://github.com/adrianperez17" class="github-tag" target="_blank" rel="noopener noreferrer">
					@adrianperez17
				</a>
			</li>
		</ul>
	</div>

	<div class="section-card">
		<h2>Project Description</h2>
		<p>
			Our project analyzes global hydraulic infrastructure (dams, reservoirs, and related works)
			to study its geographical distribution, temporal evolution, and primary use
			(e.g., hydroelectric generation, irrigation, water supply, and flood control).
			The goal is to understand how this infrastructure has expanded and specialized across
			different regions and the structural characteristics (dam height, storage capacity,
			reservoir area, installed power, etc.) associated with each use.
		</p>
	</div>

	<div class="section-card">
		<h2>Access Links</h2>
		<ul>
			<li>
				<strong>Repository:</strong>
				<a href="https://github.com/gti-sos/SOS2526-27" target="_blank" rel="noopener noreferrer">
					gti-sos/SOS2526-27
				</a>
			</li>
			<li>
				<strong>Live URL:</strong>
				<a href="https://sos2526-27.onrender.com" target="_blank" rel="noopener noreferrer">
					sos2526-27.onrender.com
				</a>
			</li>
		</ul>
	</div>

	<div class="section-card">
		<h2>Developed APIs</h2>
		<ul>
			<li>
				<a href={resolve('/api/v1/drinking-water-services')} class="api-link" target="_blank" rel="noopener noreferrer">
					Drinking Water Services API
				</a>
			</li>
			<li>
				<a href={resolve('/api/v1/water-dams')} class="api-link" target="_blank" rel="noopener noreferrer">
					Water Dams API
				</a>
			</li>
			<li>
				<a href={resolve('/api/v1/world-hydroelectric-plants')} class="api-link" target="_blank" rel="noopener noreferrer">
					World Hydroelectric Plants API
				</a>
			</li>
		</ul>
	</div>

	<footer>
		Sistemas Orientados a Servicios | 2026
	</footer>
</div>

<style>
	:global(body) {
		font-family: Inter, system-ui, sans-serif;
		background-color: #f8fafc;
		color: #1e293b;
		line-height: 1.6;
		margin: 0;
		padding: 40px 20px;
		display: flex;
		justify-content: center;
	}

	.container {
		max-width: 800px;
		width: 100%;
	}

	header {
		border-bottom: 2px solid #2563eb;
		margin-bottom: 40px;
		padding-bottom: 10px;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
		letter-spacing: -1px;
	}

	.back-link {
		text-decoration: none;
		color: #2563eb;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	h2 {
		font-size: 1.25rem;
		color: #1e293b;
		margin-top: 0;
		margin-bottom: 16px;
	}

	.section-card {
		background: #ffffff;
		padding: 25px;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		margin-bottom: 20px;
	}

	p {
		margin: 0;
		font-size: 1rem;
		color: #1e293b;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		padding: 10px 0;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	li:last-child {
		border-bottom: none;
	}

	a {
		color: #2563eb;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	a:hover {
		opacity: 0.7;
		text-decoration: underline;
	}

	.api-link {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.github-tag {
		background: #f1f5f9;
		padding: 4px 10px;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.85rem;
		color: #334155;
		white-space: nowrap;
	}

	footer {
		text-align: center;
		margin-top: 50px;
		color: #64748b;
		font-size: 0.85rem;
	}

	@media (max-width: 700px) {
		header {
			flex-direction: column;
			align-items: flex-start;
		}

		li {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>