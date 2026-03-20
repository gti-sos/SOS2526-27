import express from 'express';
import Datastore from 'nedb';

const router = express.Router();

const db = new Datastore({
    filename: "./drinking-water-services-v1.db",
    autoload: true
});

// DATOS INICIALES

const water_services = [
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


// LOAD INITIAL DATA

router.get("/loadInitialData",(req,res)=>{

    db.count({}, (err,count)=>{

        if(count===0){

            db.insert(water_services);
            res.sendStatus(201);

        }else{

            res.sendStatus(409);

        }

    });

});


// GET COLECCIÓN + FILTROS + PAGINACIÓN

router.get("/",(req,res)=>{

    let query={};

    if(req.query.entity)
        query.entity=req.query.entity;

    if(req.query.code)
        query.code=req.query.code;

    if(req.query.year)
        query.year=Number(req.query.year);

    if(req.query.wat_bas_pop_residence_urban)
        query.wat_bas_pop_residence_urban=Number(req.query.wat_bas_pop_residence_urban);

    if(req.query.from && req.query.to){
        query.year={
            $gte:Number(req.query.from),
            $lte:Number(req.query.to)
        };
    }

    const limit=Number(req.query.limit);
    const offset=Number(req.query.offset);

    let cursor=db.find(query,{_id:0});

    if(limit)
        cursor=cursor.limit(limit);

    if(offset)
        cursor=cursor.skip(offset);

    cursor.exec((err,docs)=>{
        res.status(200).json(docs);
    });

});


// GET RECURSO CONCRETO

router.get("/:entity/:year",(req,res)=>{

    const entity=req.params.entity;
    const year=Number(req.params.year);

    db.findOne(
        {entity:entity,year:year},
        {_id:0},
        (err,doc)=>{

            if(doc)
                res.status(200).json(doc);
            else
                res.sendStatus(404);

        }
    );

});


// POST COLECCIÓN

router.post("/",(req,res)=>{

    const newData=req.body;

    const campos=[
        "entity",
        "code",
        "year",
        "wat_bas_pop_residence_urban"
    ];

    if(!newData)
        return res.sendStatus(400);

    const faltan=campos.some(c=>!newData.hasOwnProperty(c));
    const extra=Object.keys(newData).some(c=>!campos.includes(c));

    if(faltan||extra)
        return res.sendStatus(400);

    db.findOne(
        {entity:newData.entity,year:newData.year},
        (err,doc)=>{

            if(doc)
                res.sendStatus(409);

            else{

                db.insert(newData);
                res.sendStatus(201);

            }

        }
    );

});


// PUT RECURSO

router.put("/:entity/:year",(req,res)=>{

    const entity=req.params.entity;
    const year=Number(req.params.year);
    const updated=req.body;

    const campos=[
        "entity",
        "code",
        "year",
        "wat_bas_pop_residence_urban"
    ];

    const faltan=campos.some(c=>!updated.hasOwnProperty(c));

    if(faltan)
        return res.sendStatus(400);

    if(updated.entity!==entity || updated.year!==year)
        return res.sendStatus(400);

    db.update(
        {entity:entity,year:year},
        updated,
        {},
        (err,numUpdated)=>{

            if(numUpdated===0)
                res.sendStatus(404);
            else
                res.sendStatus(200);

        }
    );

});


// DELETE RECURSO

router.delete("/:entity/:year",(req,res)=>{

    const entity=req.params.entity;
    const year=Number(req.params.year);

    db.remove(
        {entity:entity,year:year},
        {},
        (err,numRemoved)=>{

            if(numRemoved===0)
                res.sendStatus(404);
            else
                res.sendStatus(200);

        }
    );

});


// DELETE COLECCIÓN

router.delete("/",(req,res)=>{

    db.remove({}, {multi:true}, ()=>{
        res.sendStatus(200);
    });

});


// MÉTODOS PROHIBIDOS

router.put("/",(req,res)=>res.sendStatus(405));
router.post("/:entity/:year",(req,res)=>res.sendStatus(405));


// DOCS

router.get("/docs",(req,res)=>{
    res.redirect("https://documenter.getpostman.com/view/52242576/2sBXieqtPa");
});


// EXPORTAR MÓDULO

export default router;