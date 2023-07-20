const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const URL = process.env.DATABASE_URL;
const client = new MongoClient(URL);

const connectDB = async () => {
    console.log('Connecting to database');
    try {
        await client.connect();
        console.log('Connected');
        return client;
    } catch (error) {
        console.log('Failed to connect to mongodb, detail: ', error);
    };
    return null;
}

const disconnectDB = async () => {
    console.log('Disconnecting');
    try {
        await client.close()
    } catch (error) {
        console.log('Failed to disconnect from mongodb, detail: ', error);
    };
};

module.exports = {
    connectDB,
    disconnectDB
};