process.stdin.setEncoding("utf8");
const path = require("path");
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({extended: true}));
require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 

const axios = require('axios');

const portNumber = 80;
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;
const databaseAndCollection = {db: db, collection: collection};
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.29ueb32.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.get("/", async (request, response) => {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`;
    const apiResponse = await axios.get(url);
    let photo = `<img src="${apiResponse.data.url}" alt="nasa" >`;
    response.render('home.ejs', {photo});
});

app.post("/processed", async (request, response) => {
    let name = request.body.name;
    let info = request.body.info;
    let entry = {name: name, info: info};
    try {
        await client.connect();
        await insert(client, databaseAndCollection, entry);
      } catch (e) {
        console.error(e);
      } finally {
        await client.close();
      }
    response.render('processed.ejs', {name, info});
});

/*app.get('/nasa-apod', async (request, response) => {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`;
  
    try {
      const apiResponse = await axios.get(url);
      const data = apiResponse.data;
      let photo = `<img src="${data.url}" alt="nasa" >`;
      response.render('nasaImage.ejs', {photo});
    } catch (error) {
      console.error(error);
      response.status(500).send('Error retrieving data from the NASA APOD API.');
    }
});*/

async function insert(client, databaseAndCollection, entry) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(entry);
}

app.listen(portNumber, (err) => {
    if (err) {
      console.log("Starting server failed.");
    } else {
      console.log(`To access server: http://localhost:${portNumber}`);
    }
});
