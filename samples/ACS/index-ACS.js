const datos = [
    { entity: "Afghanistan", code: "AFG", year: 2000, wat_bas_pop_residence_urban: 1564933.9 },
    { entity: "Afghanistan", code: "AFG", year: 2001, wat_bas_pop_residence_urban: 1583404 },
    { entity: "Americas (WHO)", code: "WHO_AMR", year: 2003, wat_bas_pop_residence_urban: 72906260 },
    { entity: "Americas (WHO)", code: "WHO_AMR", year: 2004, wat_bas_pop_residence_urban: 74281944 },
    { entity: "Angola", code: "AGO", year: 2007, wat_bas_pop_residence_urban: null },
    { entity: "Angola", code: "AGO", year: 2008, wat_bas_pop_residence_urban: null },
    { entity: "Algeria", code: "DZA", year: 2019, wat_bas_pop_residence_urban: 6242828 },
    { entity: "Algeria", code: "DZA", year: 2020, wat_bas_pop_residence_urban: 6882381.5 },
    { entity: "Antigua and Barbuda", code: "ATG", year: 2020, wat_bas_pop_residence_urban: null },
    { entity: "Antigua and Barbuda", code: "ATG", year: 2021, wat_bas_pop_residence_urban: null },
    { entity: "Antigua and Barbuda", code: "ATG", year: 2022, wat_bas_pop_residence_urban: null }
];

const entidad_seleccionada= "Algeria"; 

const filtrada= datos.filter(d => 
    d.entity ===entidad_seleccionada && d.wat_bas_pop_residence_urban!==null 
);

const media= filtrada.reduce((acumulador,d) => acumulador +d.wat_bas_pop_residence_urban,0 ) / filtrada.length;

console.log(`La media de wat_bas_pop_residence_urban en ${entidad_seleccionada} es  ${media} `);

