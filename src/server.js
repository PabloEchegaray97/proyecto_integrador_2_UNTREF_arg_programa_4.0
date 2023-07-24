const { connectDB, disconnectDB } = require('../connection_db.js');
const express = require('express');
const dotenv = require('dotenv');

const app = express();
dotenv.config()

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/api/v1/muebles', async (req, res) => {
    try {
        const { categoria, precio_gte, precio_lte } = req.query;
        let condiciones = {};
        if (categoria) {
            condiciones.categoria = categoria;
        };
        if (precio_gte && precio_lte) {
            condiciones.precio = { $gte: Number(precio_gte), $lte: Number(precio_lte) };
        }
        else if (precio_lte) {
            condiciones.precio = { $lte: Number(precio_lte) };
        }
        else if (precio_gte) {
            condiciones.precio = { $gte: Number(precio_gte) };
        };
        const result = await getMuebles(condiciones);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor');
    };

})

app.get('/api/v1/muebles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getMueble(id);
        if (!result) {
            res.status(400).send('El código no corresponde a un mueble registrado');
        } else {
            res.status(200).send({ payload: result });
        }
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor');
    };
})

app.post('/api/v1/muebles', async (req, res) => {
    try {
        let { nombre, precio, categoria, codigo } = req.body;
        if (!nombre || !precio || !categoria) {
            return res.status(400).send('Faltan datos relevantes')
        }
        if (!codigo) {
            codigo = await getNextId();
        }
        let newObject = { 
            nombre: nombre,
            precio: Number(precio),
            categoria: categoria,
            codigo: codigo
        }
        await createMueble(newObject);
        res.status(201).send({ message: 'Registro creado', payload: newObject })
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor');
    }
})

app.put('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, precio, categoria} = req.body;
    if (!nombre || !precio || !categoria || !codigo) {
        return res.status(400).send('Faltan datos relevantes')
    };
    try {     
        const updateObject = {
            nombre: nombre,
            precio: Number(precio),
            categoria: categoria
        };
        const mueble = await getMueble(Number(codigo));
        if (!mueble) return res.status(400).send('El código no corresponde a un mueble registrado');
        else {
            const result = await updateMueble(codigo, updateObject);
            console.log(result);
            res.status(200).send({ message: 'Registro actualizado', payload: result });
        }
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor');
    };
});

app.delete('/api/v1/muebles/:id', async (req, res) => {
    try {
        let { id } = req.params;
        id = Number(id);
        result = await deleteMueble(id);
        if (result.deletedCount == 0) {
            return res.status(400).send('Registro no eliminado')
        };
        res.status(200).send('Registro eliminado');
    } catch (error) {
        res.status(500).send('Se ha generado un error en el servidor');
    };
});

app.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.log(`Running on http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/v1/muebles/`);
});


const getMuebles = async (condiciones) => {
    try {
        const client = await connectDB();
        const db = client.db('muebleria');
        let sortOption = {};
        if (condiciones.length == 0) {
            const collection = await db.collection('muebles').find().toArray();
            return collection;
        }
        if (condiciones.precio && condiciones.precio.$lte) {
            sortOption = { precio: -1 }; 
        }
        if (condiciones.categoria) {
            sortOption = { nombre: 1 } ;
        }
        const collection = await db.collection('muebles').find(condiciones).sort(sortOption).toArray();
        return collection;
    } catch (error) {
        throw new Error('Error getting data: ', error);
    }
    finally {
        await disconnectDB();
    };
};

const getMueble = async (id) => {
    try {
        const client = await connectDB();
        const db = client.db('muebleria');
        const mueble = await db.collection('muebles').findOne({ codigo: Number(id) });
        return mueble;
    } catch (error) {
        throw new Error('Error getting data: ', error)
    }
    finally {
        await disconnectDB();
    }
};

const createMueble = async (newObject) => {
    const client = await connectDB();
    const db = client.db('muebleria');
    try {
        const mueble = await db.collection('muebles').insertOne(newObject);
        const result = await db.collection('muebles').findOne({ _id: mueble.insertedId })
        return result;
    } catch (error) {
        throw new Error('Error creating document: ', error);
    } finally {
        await disconnectDB();
    };
};

const updateMueble = async (id, updateObject) => {
    try {
        const client = await connectDB();
        const db = client.db('muebleria');
        const mueble = await db.collection('muebles').findOneAndUpdate(
            { codigo: Number(id) },
            { $set: updateObject },
            { returnDocument: "after" }
        );
        return mueble.value;
    } catch (error) {
        throw new Error('Error getting data: ', error)
    } finally {
        await disconnectDB();
    };
}

const deleteMueble = async (id) => {
    try {
        const client = await connectDB();
        const db = client.db('muebleria');
        const mueble = await db.collection('muebles').deleteOne({ codigo: id });
        return mueble;
    } catch (error) {
        throw new Error('Error getting data: ', error)
    } finally {
        await disconnectDB();
    };
};

const getNextId = async () => {
    try {
        let list = await getMuebles({});
        list.sort((a, b) => a.codigo - b.codigo)
        console.log(list[list.length - 1].codigo);
        const nextID = (list.length > 0) ? list[list.length - 1].codigo + 1 : 1;
        return nextID;
    } catch (error) {
        console.log('Error getting next ID:', error);
        return null;
    }
};