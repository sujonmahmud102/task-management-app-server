const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.voqisr3.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();

        // collections
        const usersCollection = client.db('taskDB').collection('users');
        const taskCollection = client.db('taskDB').collection('tasks');


        // create users
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);

            const query = {
                email: user.email
            };
            const existingUser = await usersCollection.findOne(query);
            // console.log('existing user', existingUser)

            if (existingUser) {
                return res.send({
                    message: 'user already exists'
                })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        // create task collection
        app.post('/add-task', async (req, res) => {
            const task = req.body;
            const result = await taskCollection.insertOne(task);
            res.send(result);
        });

        // task api
        app.get('/tasks', async (req, res) => {
            let query = {};
            if (req.query.userEmail) {
                query = {
                    userEmail: req.query.userEmail
                }
            }

            const result = await taskCollection.find(query).toArray();
            res.send(result);
        });

        // delete task
        app.delete('/task/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await taskCollection.deleteOne(query);
            res.send(result);
        });


        // single task api
        app.get('/task/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await taskCollection.findOne(query);
            res.send(result);
        })

        // update task
        app.put('/updateTask/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: new ObjectId(id)
            };
            const updatedTask = req.body;
            // console.log(updatedTask)
            const options = {
                upsert: true
            };
            const task = {
                $set: {
                    title: updatedTask.title,
                    dueDate: updatedTask.dueDate,
                    status: updatedTask.status,
                    assignedUser: updatedTask.assignedUser,
                    description: updatedTask.description,
                }
            };
            const result = await taskCollection.updateOne(filter, task, options);
            res.send(result);
        })

        // all users api
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        // admin statistics
        app.get('/admin-stats', async (req, res) => {
            const users = await usersCollection.estimatedDocumentCount();
            const tasks = await taskCollection.estimatedDocumentCount();
            const completedTask = await taskCollection.countDocuments({
                status: 'Completed'
            });
            const IncompletedTask = await taskCollection.countDocuments({
                status: 'Incomplete'
            });
            const InProgessTask = await taskCollection.countDocuments({
                status: 'In Progess'
            });


            res.send({
                users,
                tasks,
                completedTask,
                IncompletedTask,
                InProgessTask
            })
        })

        // making admin
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: new ObjectId(id)
            };
            const updateDoc = {
                $set: {
                    role: 'Admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({
        //     ping: 1
        // });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Task management is running')
})

app.listen(port, () => {
    console.log(`task management is running on port ${port}`)
})