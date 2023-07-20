const { connectDB, disconnectDB } = require('../connection_db.js');
const express = require('express');
const dotenv = require('dotenv');

const app = express();
dotenv.config()

app.use(express.json()); //utilizar json en nuestro servidor (middleware)
app.use(express.urlencoded({ extended: true }));

const condiciones_prueba = {
    categoria: "Comedor",
    precio: { $gte: 100, $lte: 300 }
}
const updateObject_prueba = {
    nombre: 'Producto act (5)',
    precio: 0,
    categoria: 'pruebas'
}

app.get('/', async (req, res) => {
    try {
        const { categoria, precio_gte, precio_lte } = req.query;
        let condiciones = {};
        if (categoria) {
            condiciones.categoria = categoria;
        };
        if (precio_gte && precio_lte) {
            condiciones.precio = { $gte: parseInt(precio_gte), $lte: parseInt(precio_lte) };
        }
        else if (precio_lte) {
            condiciones.precio = { $lte: parseInt(precio_lte) };
        }
        else if (precio_gte) {
            condiciones.precio = { $gte: parseInt(precio_gte) };
        };
        const result = await getMuebles(condiciones);
        console.log(condiciones);
        res.status(200).send({ payload: result });
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor');
    };

})
app.get('/:id', async (req, res) => {
    try {
        let { id } = req.params;
        id = parseInt(id)
        const result = await getMueble(id);
        console.log(result);
        if (!result) {
            res.status(400).send('El código no corresponde a un mueble registrado');
        } else {
            res.status(200).send(result);
        }
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor');
    };
})
app.put('/:id', async (req, res) => {
    try {
        let { id } = req.params;
        id = parseInt(id)
        const { nombre, precio, categoria } = req.body;
        if (!nombre || !precio || !categoria) {
            return res.status(400).send('Faltan datos relevantes')
        }
        const updateObject = {
            nombre: nombre,
            precio: precio,
            categoria: categoria
        }
        console.log(updateObject);
        const result = await updateMueble(id, updateObject);
        console.log(result);
        res.status(200).send({ message: 'Registro creado', payload: result })
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor')
    }
})
app.delete('/:id', async (req, res) => {
    try {
        let { id } = req.params;
        id = parseInt(id);
        result = await deleteMueble(id);
        if (result.deletedCount != 0) {
            res.status(200).send('Registro eliminado');
        } else {
            return res.status(400).send('Registro no eliminado')
        }
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor')
    }
})
app.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.log(`Running on http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/`);
})

const getMuebles = async (condiciones) => {
    try {
        const client = await connectDB();
        const db = client.db('muebleria');
        if (condiciones.lenght == 0) {
            const collection = await db.collection('muebles').find().toArray();
            console.table(collection);
            await disconnectDB();
            return collection;
        }
        const collection = await db.collection('muebles').find(condiciones).toArray();
        console.table(collection);
        await disconnectDB()
        return collection
    } catch (error) {
        throw new Error('Error getting data: ',error)
    }
};

const getMueble = async (id) => {
    try {
        const client = await connectDB();
        const db = client.db('muebleria');
        const mueble = await db.collection('muebles').findOne({ codigo: id });
        await disconnectDB();
        return mueble;
    } catch (error) {
        throw new Error('Error getting data: ', error)
    };
};

const updateMueble = async (id, updateObject) => {
    try {
        const client = await connectDB();
        const db = client.db('muebleria');
        const mueble = await db.collection('muebles').findOneAndUpdate(
            { codigo: id },
            { $set: updateObject },
            { returnDocument: "after" }
        );
        await disconnectDB();
        return mueble.value;
    } catch (error) {
        throw new Error('Error getting data: ', error)
    }
}

const deleteMueble = async (id) => {
    try {
        const client = await connectDB();
        const db = client.db('muebleria');
        const mueble = await db.collection('muebles').deleteOne({ codigo: id });
        await disconnectDB();
        return mueble;
    } catch (error) {
        throw new Error('Error getting data: ', error)
    }
}
