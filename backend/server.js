const express = require('express')
const dotenv = require('dotenv')
dotenv.config()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 3000
const MONGODB_URL = process.env.MONGODB_URL

const app = express()

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())

app.use((req, res, next) => {
    const origin = req.headers.origin

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin)
        res.setHeader("Access-Control-Allow-Credentials", "true")
        res.setHeader("Vary", "Origin")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type")
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    }

    if (req.method === "OPTIONS") {
        return res.sendStatus(204)
    }

    next()
})


const authRouter = require('./routers/auth.route')
const likeRouter = require("./routers/like.route")
const postRouter = require("./routers/post.route")
const commentRouter = require("./routers/comment.route")

app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRouter)
app.use('/api/posts', postRouter)
app.use('/api/likes', likeRouter)
app.use('/api/comments', commentRouter)

mongoose.connect(MONGODB_URL)
    .then(() => {
        console.log('MONGODB is connected')

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    })