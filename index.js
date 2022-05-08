const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port=process.env.PORT || 5000;

const app=express();

app.use(cors());
app.use(express.json())



function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    // console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tpxgr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run(){
    try{
        await client.connect();
        const itemCollection=client.db('royal-truckings').collection('itemListings');

        //AuTH
        app.post('/login',async(req,res)=>{
            const user=req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
                expiresIn:'2d'
            });
            res.send(accessToken);
        })

        //Implementing JWT in My Items

        app.get("/myitems", verifyJWT, async (req, res) => {
          const authHeader=req.headers.authorization;
          const decodedEmail = req.decoded.email;
          const email = req.query.email;
          if (email === decodedEmail) {
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
          } else {
            res.status(403).send({ message: "forbidden accessX" });
          }
        });


        app.get('/items',async(req,res)=>{
            const query = {};
            const cursor=itemCollection.find(query);
            const items= await cursor.toArray();
            res.send(items);
        })

        app.get('/item/:id', async (req,res)=>{
            const id=req.params.id;
            const query= {_id:ObjectId(id)};
            const item=await itemCollection.findOne(query);
            res.send(item);;

        })

        //Posting new Item

        app.post('/item',async(req,res)=>{
            const newItem=req.body;
            const result=await itemCollection.insertOne(newItem);
            res.send(result);
        })

        //Deleting an Item

        app.delete('/item/:id',async (req,res)=>{
            const id=req.params.id;
            const qurery={_id:ObjectId(id)};
            const result= await itemCollection.deleteOne(qurery);
            res.send(result);
        })

        //Restock

        app.put('/item/:id', async (req,res)=>{
            const id=req.params.id;
            const updatedStock = req.body;
            const filter={_id:ObjectId(id)};
            const options={
                upsert:true
            };
            const updateDoc = {
              $set: {
                quantity: updatedStock.stockInt,
              },
            };
            const result = await itemCollection.updateOne(
              filter,
              updateDoc,
              options
            );
            res.send(result);
        })
    }
    finally{

    }

};

run().catch(console.dir);





app.get('/',(req,res)=>{
    res.send("Server Running....");
})

app.listen(port,()=>{
    console.log("Listening Port:",port);
})