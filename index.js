const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 5000;
require("dotenv").config();
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wascw.mongodb.net/volunteerNetwork?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("connect");
});

client.connect((err) => {
  const volunteersCollection = client
    .db("volunteerNetwork")
    .collection("volunteers");
  const registerCollection = client
    .db("volunteerNetwork")
    .collection("registerInfo");

  // initially add all events
  app.post("/addEvents", (req, res) => {
    volunteersCollection.insertMany(req.body).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  // load all events for home page
  app.get("/events", (req, res) => {
    volunteersCollection
      .find({ name: { $regex: req.query.search } })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  // load specific event for registration form
  app.get("/event/:eventId", (req, res) => {
    const event = parseInt(req.params.eventId);
    volunteersCollection.find({ id: event }).toArray((err, documents) => {
      res.send(documents[0]);
    });
  });
  // insert registration form
  app.post("/registration", (req, res) => {
    registerCollection
      .insertOne(req.body)
      .then((result) => res.send(result.insertedCount > 0));
  });
  // load specific user events
  app.get("/userEvents", (req, res) => {
    registerCollection
      .find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  // delete user event
  app.delete("/cancelEvent/:eventId", (req, res) => {
    const id = req.params.eventId;
    registerCollection.deleteOne({ _id: ObjectId(id) }).then((result) => {
      res.send(result.deletedCount > 0);
    });
  });
  // load all register-volunteer for admin
  app.get("/volunteerList", (req, res) => {
    registerCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  // add new event form admin
  app.post("/addEvent", (req, res) => {
    volunteersCollection
      .insertOne(req.body)
      .then((result) => res.send(result.insertedCount > 0));
  });
});

app.listen(process.env.PORT || port);
