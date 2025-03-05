import express from 'express';

const app = express();


app.get('/test', (req, res) => {
    res.json({'hello': 'world'})
})

export default app;
