import express from "express";
import dotenv from "dotenv";

import app from "./app";

dotenv.config()

const PORT = process.env.SERVER_PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})