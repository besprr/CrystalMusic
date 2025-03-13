require('dotenv').config
const express = require('express')
const userRoutes = require('../controllers/authController')

const router = express.Router()

router.post('/register', userRoutes.registerUser)
router.post('/login', userRoutes.loginUser)
// router.post('/refresh', refreshTokens)

module.exports = router