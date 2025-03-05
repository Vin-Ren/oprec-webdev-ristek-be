import express from "express";

const app = express();

app.get('/test', (req, res) => {
    res.json({'hello': 'world'})
})

app.listen(3000, () => {
    console.log("Running at localhost:3000")
})