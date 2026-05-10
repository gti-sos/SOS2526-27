import fs from 'fs';
import csv from 'csv-parser';
import Datastore from 'nedb';

const db = new Datastore({
    filename: './drinking-water-services-v1.db',
    autoload: true
});

const results = [];

fs.createReadStream('./data/drinking-water-services-coverage-urban.csv')
    .pipe(csv())
    .on('data', (row) => {
        const item = {
            entity: row.entity,
            code: row.code,
            year: Number(row.year),
            wat_bas_pop_residence_urban:
                row.wat_bas_pop__residence_urban === ''
                    ? null
                    : Number(row.wat_bas_pop__residence_urban)
        };

        results.push(item);
    })
    .on('end', () => {
        db.remove({}, { multi: true }, (err) => {
            if (err) {
                console.error('Error borrando datos antiguos:', err);
                return;
            }

            db.insert(results, (err, newDocs) => {
                if (err) {
                    console.error('Error insertando datos:', err);
                    return;
                }

                console.log(`Datos importados correctamente: ${newDocs.length} registros`);
            });
        });
    });