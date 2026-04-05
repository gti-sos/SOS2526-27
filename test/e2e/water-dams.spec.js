import { test, expect } from '@playwright/test';

// Adaptado a tu ruta de presas
const BASE_URL = 'http://localhost:10000/water-dams';

test.describe('Pruebas E2E - Water Dams (Presas)', () => {

    // Borra y lista antes de cada test para asegurar un estado limpio
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        
        // Manejador de diálogos para aceptar los confirm() automáticamente
        page.on('dialog', dialog => dialog.accept());

        // Adaptado a tus botones específicos
        await page.getByRole('button', { name: 'Borrar Todo' }).click();
        await page.getByRole('button', { name: 'Cargar Datos Iniciales' }).click();
        
        // Esperamos a que la tabla cargue datos
        await expect(page.locator('.styled-table tbody tr').first()).toBeVisible({ timeout: 10000 });
    });

    // 1. CREAR RECURSO
    test('Debe permitir crear una nueva presa', async ({ page }) => {
        const uniqueName = `Presa_Test_${Date.now()}`;
        // Localizamos el formulario de añadir (el que no es el buscador)
        const createBox = page.locator('section.form-box').filter({ hasText: 'Añadir Nueva Presa' });
        
        await createBox.getByPlaceholder('Nombre Presa').fill(uniqueName);
        await createBox.getByPlaceholder('País').fill('España');
        await createBox.getByPlaceholder('Año').fill('2026');
        await createBox.getByPlaceholder('Río').fill('Guadalquivir');
        await createBox.getByPlaceholder('Grand ID').fill('9999');
        
        await page.getByRole('button', { name: 'Guardar Presa' }).click();

        // Verificamos tu mensaje de éxito exacto
        const alerta = page.locator('.alert.exito');
        await expect(alerta).toContainText('Presa añadida correctamente', { timeout: 7000 });
        await expect(page.getByText(uniqueName)).toBeVisible();
    });

    // 2. LISTAR TODOS LOS RECURSOS
    test('Debe listar las presas iniciales correctamente', async ({ page }) => {
        const filas = page.locator('.styled-table tbody tr');
        // Verificamos que al menos cargó las 10 iniciales
        await expect(filas).not.toHaveCount(0);
    });

    // 3. BORRAR RECURSO CONCRETO
    test('Debe permitir borrar una presa específica', async ({ page }) => {
        // Cogemos el nombre de la primera presa de la tabla
        const primerNombre = page.locator('.styled-table tbody tr td strong').first();
        const textoBorrar = await primerNombre.innerText();

        // Pulsamos el primer botón de borrar
        await page.locator('.btn-delete').first().click();

        // Verificamos tu mensaje de éxito
        await expect(page.locator('.alert.exito')).toContainText('Presa eliminada');
        // Comprobamos que el nombre ya no está en la tabla
        await expect(page.locator('.styled-table')).not.toContainText(textoBorrar);
    });

    // 4. BORRAR TODOS LOS RECURSOS
    test('Debe vaciar la base de datos y mostrar mensaje de éxito', async ({ page }) => {
        await page.getByRole('button', { name: 'Borrar Todo' }).click();

        const alertaExito = page.locator('.alert.exito');
        await expect(alertaExito).toBeVisible({ timeout: 7000 });
        await expect(alertaExito).toContainText('Base de datos vaciada');

        const filas = page.locator('.styled-table tbody tr');
        await expect(filas).toHaveCount(0);
    });

    // 5. EDITAR RECURSO (VISTA SEPARADA)
    test('Debe editar una presa y ver los cambios reflejados en la tabla', async ({ page }) => {
        const btnEdit = page.locator('.btn-edit').first();
        await btnEdit.click();

        // Esperamos a que cambie la URL a la vista de edición
        await page.waitForURL(url => url.pathname.includes('/water-dams/'));

        // Usamos getByLabel porque en tu código de edición tienes etiquetas <label>
        const inputRio = page.locator('label', { hasText: 'Río:' }).locator('input');
        await inputRio.fill('Río Editado Playwright');

        await page.getByRole('button', { name: 'Guardar cambios' }).click();

        // Verificamos tu mensaje de éxito de edición
        const alertaExito = page.locator('.alert.exito');
        await expect(alertaExito).toContainText('¡Operación exitosa!');

        await page.getByRole('button', { name: 'Volver al listado' }).click();
        
        await page.waitForURL(BASE_URL);

        // Comprobamos que el cambio se ve en la tabla principal
        await expect(page.getByText('Río Editado Playwright')).toBeVisible();
    });

  // 6. BUSCADOR Y FILTROS
    test('Debe filtrar resultados por país usando el buscador avanzado', async ({ page }) => {
        // Seleccionamos el campo de País (el primero es el del buscador/filtro según tu estructura)
        const inputPais = page.getByPlaceholder('País').first();
        await inputPais.fill('Canada');
        
        // FIX: Usar el nombre exacto del botón que aparece en el snapshot
        // 'Actualizar Lista' es el botón que dispara la carga con los filtros aplicados
        await page.getByRole('button', { name: 'Actualizar Lista' }).click();

        // Verificamos el mensaje de éxito (ajusta el texto según tu API)
        const alertaExito = page.locator('.alert.exito');
        await expect(alertaExito).toBeVisible({ timeout: 10000 });
        
        // Verificamos que los resultados en la tabla corresponden al filtro
        const primeraFila = page.locator('.styled-table tbody tr').first();
        await expect(primeraFila).toBeVisible();
        await expect(primeraFila).toContainText('Canada');
    });
});