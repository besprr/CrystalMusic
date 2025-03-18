require('dotenv').config
const express = require('express')
const recordsRoutes = require('../controllers/recordsController')
const { authenticateToken } = require('../middlewares/tokenMiddleware')

const router = express.Router()

router.post('/create', authenticateToken, recordsRoutes.createRecord)

module.exports = router
