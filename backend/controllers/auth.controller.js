const Auth = require('../models/auth.model')
const JWT = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const cookieOptions = (req, includeExpiration = true) => ({
    httpOnly: true,
    secure: req.secure || req.get('x-forwarded-proto') === 'https',
    sameSite: 'strict',
    ...(includeExpiration ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {})
})

const register = async (req, res) => {
    try{
        const username = typeof req.body.username === 'string' ? req.body.username.trim() : ''
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
        const password = typeof req.body.password === 'string' ? req.body.password : ''

        if (!username || !email || password.length < 6) {
            return res.status(400).json({
                message: 'Username, a valid email, and a password of at least 6 characters are required'
            })
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Authentication is not configured on the server' })
        }

        const existingUser = await Auth.findOne({ $or: [{ email }, { username }] })

        if(existingUser){
            return res.status(409).json({
                message: existingUser.email === email ? 'Email is already registered' : 'Username is already taken'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new Auth({
            username,
            email,
            password: hashedPassword
        })

        await newUser.save()

        const token = JWT.sign(
            {
                id: newUser._id,
                email: newUser.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        )

        res.cookie('token', token, cookieOptions(req))

        return res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                profilePicture: newUser.profilePicture,
                bio: newUser.bio
            }
        })

    }catch(e){
        console.log(e)
        if (e.code === 11000) {
            return res.status(409).json({ message: 'Email or username is already in use' })
        }
        return res.status(500).json(
            {
                message: "Internal server error"
            }
        )
    }
}

const login = async (req, res) =>{
    try{
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
        const password = typeof req.body.password === 'string' ? req.body.password : ''

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Authentication is not configured on the server' })
        }

        const user = await Auth.findOne({ email })

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' })
        }  

        const token = JWT.sign(
            {
                id: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        )

        res.cookie('token', token, cookieOptions(req))

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio
            }
        })

    }catch(e){
        console.log(e)
        return res.status(500).json(
            {
                message: "Internal server error"
            }
        )
    }
}

const editProfile = async (req, res) => {
    try{
        const { username, profilePicture, bio } = req.body

        const user = await Auth.findById(req.user.id)

        if(!user){
            return res.status(404).json(
                {
                    message: "User not found"
                }
            )
        }

        user.username = username || user.username
        user.profilePicture = profilePicture || user.profilePicture
        user.bio = bio || user.bio

        await user.save()

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio
            }
        })

    }catch(e){
        console.log(e)
        return res.status(500).json(
            {
                message: "Internal server error"
            }
        )
    }   
}

const logout = (req, res) => {
    res.clearCookie('token', cookieOptions(req, false))
    return res.status(200).json({
        message: "User logged out successfully"
    })
}

const session = async (req, res) => {
    const token = req.cookies?.token

    if (!token) {
        return res.status(200).json({ user: null })
    }

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET)
        const user = await Auth.findById(decoded.id).select('-password')
        return res.status(200).json({ user: user || null })
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(200).json({ user: null })
        }

        console.log(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

const profile = async (req, res) => {
    try {
        const user = await Auth.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    register,
    login,
    session,
    editProfile,
    logout,
    profile
}