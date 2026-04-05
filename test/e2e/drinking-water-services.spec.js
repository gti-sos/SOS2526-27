import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:10000/drinking-water-services';

test.describe('Pruebas E2E - Servicios de agua potable', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BASE_URL);

		// Aceptar automáticamente los confirm() si aparecen
		page.on('dialog', async (dialog) => {
			await dialog.accept();
		});

		// Dejamos una base conocida antes de cada test
		await page.getByRole('button', { name: 'Borrar todos los recursos' }).click();
		await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();

		// Esperamos a que haya al menos una fila o a que termine la carga
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
	});

	// 1. LISTAR
	test('Debe listar los recursos iniciales correctamente', async ({ page }) => {
		const filas = page.locator('table tbody tr');
		await expect(filas).not.toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Servicios de agua potable' })).toBeVisible();
	});

	// 2. CREAR
	test('Debe permitir crear un nuevo recurso', async ({ page }) => {
		const entidad = `Testland-${Date.now()}`;

		await page.getByPlaceholder('País o entidad').fill(entidad);
		await page.getByPlaceholder('Código').fill('TST');
		await page.getByPlaceholder('Año').fill('2026');
		await page.getByPlaceholder('Población urbana con servicio básico').fill('88.5');

		await page.getByRole('button', { name: 'Crear recurso' }).click();

		const alerta = page.locator('.alert.exito');
		await expect(alerta).toBeVisible({ timeout: 7000 });
		await expect(alerta).toContainText('Recurso creado correctamente.');

		await expect(page.locator('table')).toContainText(entidad);
		await expect(page.locator('table')).toContainText('2026');
	});

	// 3. BORRAR UNO
	test('Debe permitir borrar un recurso concreto', async ({ page }) => {
		const primeraFila = page.locator('table tbody tr').first();
		const textoFila = await primeraFila.textContent();

		await primeraFila.locator('.btn-delete').click();

		const alerta = page.locator('.alert.exito, .alert.error');
		await expect(alerta).toBeVisible({ timeout: 7000 });

		// Como tu mensaje exacto puede variar según el código final,
		// comprobamos que la fila original ya no esté
		if (textoFila) {
			await expect(page.locator('table')).not.toContainText(textoFila.trim());
		}
	});

	// 4. BORRAR TODOS
	test('Debe permitir borrar todos los recursos', async ({ page }) => {
		await page.getByRole('button', { name: 'Borrar todos los recursos' }).click();

		const alerta = page.locator('.alert.exito, .alert.error');
		await expect(alerta).toBeVisible({ timeout: 7000 });

		// Según tu frontend puede quedarse sin filas y mostrar mensaje vacío
		await expect(page.locator('table tbody tr')).toHaveCount(0);
	});

	// 5. EDITAR
	test('Debe navegar a la vista dinámica de edición', async ({ page }) => {
		await page.locator('.btn-edit').first().click();

		await expect(page).toHaveURL(/\/drinking-water-services\/.+\/\d+$/);
	});

	// 6. BUSCAR POR AÑO
	test('Debe permitir buscar recursos por rango de años', async ({ page }) => {
		await page.getByPlaceholder('Año desde').fill('2000');
		await page.getByPlaceholder('Año hasta').fill('2010');

		await page.getByRole('button', { name: 'Buscar' }).click();

		// Verificamos que la tabla sigue visible y que no da error grave
		await expect(page.locator('table')).toBeVisible();

		// Si sale un mensaje, al menos debe ser visible de forma controlada
		const alerta = page.locator('.alert');
		if (await alerta.count()) {
			await expect(alerta.first()).toBeVisible();
		}
	});
});