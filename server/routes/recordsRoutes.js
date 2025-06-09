require('dotenv').config
const express = require('express')
const recordsRoutes = require('../controllers/recordsController')
const { queryDatabase } = require('../config/db')
const { authenticateToken } = require('../middlewares/tokenMiddleware')

const router = express.Router()

router.post('/create', authenticateToken, recordsRoutes.createRecord)

router.get('/categories', async (req, res) => {
	try {
		const query = 'SELECT CategoryID, CategoryName FROM Categories'
		const categories = await queryDatabase(query)

		res.json({ categories })
	} catch (error) {
		console.error('Ошибка при получении категорий:', error)
		res.status(500).json({ error: 'Ошибка сервера' })
	}
})

router.get('/bookings', async (req, res) => {
	try {
		const query = `
      SELECT 
        b.BookingID, 
        b.StartTime, 
        b.EndTime, 
        s.ServiceName, 
        s.BaseColor
      FROM Bookings b
      JOIN Services s ON b.ServiceID = s.ServiceID
    `

		const bookings = await queryDatabase(query)

		res.json(bookings)
	} catch (err) {
		console.error('Ошибка при получении бронирований:', err)
		res.status(500).json({ error: 'Ошибка при получении бронирований' })
	}
})

module.exports = router
