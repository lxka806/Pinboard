const express = require('express')
const dotenv = require('dotenv')
dotenv.config()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const PORT = process.env.PORT || 3000
const MONGODB_URL = process.env.MONGODB_URL

const app = express()

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}))

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