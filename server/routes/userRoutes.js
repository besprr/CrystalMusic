require('dotenv').config()
const express = require('express')
const { queryDatabase } = require('../config/db')

const router = express.Router()

router.get('/bookings', async (req, res) => {
	try {
		const userId = req.query.userId
		if (!userId) {
			return res.status(400).json({ error: 'userId не передан' })
		}

		const query = `
      SELECT 
        b.BookingID,
        s.ServiceName,
        r.RoomName,
        b.StartTime,
        b.EndTime,
        b.Status
      FROM Bookings b
      JOIN Services s ON b.ServiceID = s.ServiceID
      JOIN Rooms r ON b.RoomID = r.RoomID
      WHERE b.UserID = ?
        AND b.EndTime >= GETDATE()  -- Показывать только текущие и будущие брони
      ORDER BY b.StartTime DESC
    `

		const result = await queryDatabase(query, [userId])
		res.json(result)
	} catch (error) {
		console.error('Ошибка при получении бронирований:', error)
		res.status(500).json({ error: 'Ошибка при получении записей' })
	}
})

router.patch('/bookings/:id/cancel', async (req, res) => {
	try {
		const bookingId = req.params.id
		const userId = req.body.userId

		const checkQuery = 'SELECT UserID FROM Bookings WHERE BookingID = ?'
		const booking = await queryDatabase(checkQuery, [bookingId])

		if (!booking || booking.length === 0 || booking[0].UserID != userId) {
			return res.status(403).json({ error: 'Нет доступа к этой записи' })
		}

		const updateQuery = 'UPDATE Bookings SET Status = ? WHERE BookingID = ?'
		await queryDatabase(updateQuery, ['Cancelled', bookingId])

		res.json({ success: true })
	} catch (error) {
		console.error('Ошибка при отмене записи:', error)
		res.status(500).json({ error: 'Ошибка при отмене записи' })
	}
})

module.exports = router