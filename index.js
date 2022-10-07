//Set Up Express Server Here
// import express from "express";
// import cors from "cors";
// import moonbirdsOwners from './moonbirdsOwners.js';
// import moonbirdsHistory from './moonbirdsHistory.js';

const express = require("express");
const cors = require("cors");

const moonbirdsOwners = require("./moonbirdsOwners");
const moonbirdsHistory = require("./moonbirdsHistory");
const address = require("../stats/stats");

// import moonbirdsOwners from "./moonbirdsOwners.js";
// import moonbirdsHistory from "./moonbirdsHistory.js";



const collections = {
    "0x23581767a106ae21c074b2276d25e5c3e136a68b": {
        owners: moonbirdsOwners,
        history: moonbirdsHistory,
    },
}



const app = express();
const port = 4000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to the server");
});

// return data from collections. 
app.get("/collection", (req, res) => {
    const slug = req.query.slug;
    res.send(collections[slug].owners);
    
});

// pass single address and get all transactions, user endpoint

app.get("/user", (req, res) => {
    const slug = req.query.slug;
    const address = req.query.address;
    res.send(collections[slug].history[address]);
});

app.listen(port, () => console.log(`Server running on ${port}`));
