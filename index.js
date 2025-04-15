const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config() 
const port = process.env.PORT || 5000;



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.91k5x.mongodb.net/?appName=Cluster0`;


// middle wares 
app.use(cors());
app.use(express.json());   

app.get('/', (req, res) => {
    res.send('Hello from my server')
});





// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("BistroDB");
    const menuCollection = database.collection("menu");
    const reviewCollection = database.collection("reviews");

    app.get('/menu', async (req, res) => {
        
        const result = await menuCollection.find().toArray();
        res.send(result);
    });

    app.get('/reviews', async (req, res) => {
        const result = await reviewCollection.find().toArray();
        res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.listen(port, () => {    
    console.log(`Server is running on port: ${port}`)
});
