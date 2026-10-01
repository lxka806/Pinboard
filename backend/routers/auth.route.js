const express = require('express')

const authRouter = express.Router()

const {
    register,
    login,
    session,
    editProfile,
    logout,
    profile 
} = require('../controllers/auth.controller')

const { protect } = require('../middlewares/auth.middleware')

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.get('/session', session)
authRouter.put('/edit-profile', protect, editProfile)
authRouter.post('/logout', logout)
authRouter.get('/profile', protect, profile)

module.exports = authRouter