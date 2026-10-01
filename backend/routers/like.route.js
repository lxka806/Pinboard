const express = require('express')

const likeRouter = express.Router()

const {
    likePost,
    unlikePost,
    getPostLikes,
    getLikedPosts
} = require('../controllers/like.controller')

const { protect } = require('../middlewares/auth.middleware')

likeRouter.post('/:id/like', protect, likePost)
likeRouter.delete('/:id/unlike', protect, unlikePost)
likeRouter.get('/mine', protect, getLikedPosts)
likeRouter.get('/:id/likes', protect, getPostLikes)

module.exports = likeRouter
