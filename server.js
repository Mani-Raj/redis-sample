const express = require("express");
const axios = require("axios");
const redis = require("redis");
const app = express();
const redisPort = 6379;

// creating redis client
const client = redis.createClient(redisPort);

//log error to the console if any occurs
client.on("error", (err) => {
    console.log(err);
});

app.get("/jobs", (req, res) => {
    const searchTerm = req.query.search;
    try {
        // get data from redis
        client.get(searchTerm, async (err, jobs) => {
            if (err) throw err;
    
            if (jobs) {
                // if data exists in redis - return res
                res.status(200).send({
                    jobs: JSON.parse(jobs),
                    message: "data retrieved from the cache"
                });
            } else {
                // if data not exists in redis - get through api and store in redis as well
                const jobs = await axios.get(`https://api.github.com/repositories/19438/issues?title=${searchTerm}`);
                client.setex(searchTerm, 600, JSON.stringify(jobs.data));
                res.status(200).send({
                    jobs: jobs.data,
                    message: "cache miss"
                });
            }
        });
    } catch(err) {
        res.status(500).send({message: err.message});
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Node server started", process.env.PORT);
});