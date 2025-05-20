const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.91k5x.mongodb.net/?appName=Cluster0`;


// middle wares 
app.use(cors({
  origin: 'http://localhost:5173',  // frontend URL
  credentials: true
}));
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
    const usersCollection = database.collection("users");
    const menuCollection = database.collection("menu");
    const reviewCollection = database.collection("reviews");
    const cartsCollection = database.collection("carts");

    app.get('/menu', async (req, res) => {

      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    // Menu endpoints
    app.post('/menu', async (req, res) => {
      try {
        const item = req.body;
        const result = await menuCollection.insertOne(item);
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: 'Error adding menu item',
          error: error.message
        });
      }
    });

    app.patch('/menu/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedItem = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: updatedItem
        };
        const result = await menuCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: 'Error updating menu item',
          error: error.message
        });
      }
    });

    app.delete('/menu/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await menuCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: 'Error deleting menu item',
          error: error.message
        });
      }
    });

    // review get and post 
    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    app.get('/reviews/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email : email}
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/reviews', async(req,res)=>{
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    })


    
    // users
    // admin call all users 
    app.get('/allusers', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // delete user
    app.delete('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await usersCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: 'Error deleting user',
          error: error.message
        });
      }
    });

    // make admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // remove admin
    app.patch('/users/remove-admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'user'  // or you can use $unset: { role: "" } to remove the role field entirely
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get('/user/:email', async (req, res) => {
      const userEmail = req.params.email;
      // console.log(userEmail)
      const existingUser = await usersCollection.findOne({
        email: userEmail
      });
      // console.log(existingUser) 
      res.send(existingUser);
    })


    app.post('/users', async (req, res) => {
      try {
        const userEmail = req.body.email;
        const existingUser = await usersCollection.findOne({
          email: userEmail
        });
        if (existingUser) {
          res.send({ message: 'user already exist', insertedId: null })
        }

        else {
          const newUser = req.body;
          const result = await usersCollection.insertOne(newUser);
          res.send(result);

        }
      } catch (error) {
        res.status(500).send({
          message: 'Error creating user',
          error: error.message
        })
      }
    })

    //carts collection api
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([]);
      }
      const cartList = await cartsCollection.find({
        userEmail: email
      }).toArray();

      const detailedCart = await Promise.all(
        cartList.map(async (cartItem) => {
          const menuItem = await menuCollection.findOne({ _id: cartItem.menuId });
          return {
            ...menuItem,
            cartId: cartItem._id // ✅ Unique identifier for each cart entry
          };
        })
      );
      // console.log(detailedCart);

      res.send(detailedCart);
    });

    app.post('/carts', async (req, res) => {
      const item = req.body;
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { menuId: id };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });

    app.delete('/carts/clear/:email', async (req, res) => {
      const email = req.params.email;
      const result = await cartsCollection.deleteMany({ userEmail: email });
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
