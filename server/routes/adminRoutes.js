const express = require('express')
const router = express.Router()
const { queryDatabase } = require('../config/db')
const jwt = require('jsonwebtoken')
const { authenticateToken } = require('../middlewares/tokenMiddleware')

router.get('/bookings', authenticateToken, async (req, res) => {
  try {
      const { status } = req.query;
      let query = `
          SELECT 
              Bookings.BookingID,
              Users.FullName AS UserName,
              Rooms.RoomName,
              Services.ServiceName,
              Bookings.StartTime,
              Bookings.EndTime,
              Bookings.Status
          FROM Bookings
          INNER JOIN Users ON Bookings.UserID = Users.UserID
          INNER JOIN Rooms ON Bookings.RoomID = Rooms.RoomID
          INNER JOIN Services ON Bookings.ServiceID = Services.ServiceID
      `;

      if (status) {
          query += ` WHERE Bookings.Status = ?`;
      }

      const result = await queryDatabase(query, status ? [status] : []);
      res.json({ bookings: result });
  } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ 
          error: 'Ошибка при получении записей',
          details: error.message 
      });
  }
});

router.get('/users', async (req, res) => {
	try {
		const query = `SELECT UserID, FullName, Email, RegistrationDate FROM Users`
		const result = await queryDatabase(query)
		res.json(result)
	} catch (error) {
		res.status(500).json({ message: 'Ошибка при получении пользователей' })
	}
})

// Обновление статуса бронирования
router.patch('/bookings/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { status } = req.body
		const query = `UPDATE Bookings SET Status = ? WHERE BookingID = ?`
		await queryDatabase(query, [status, id])
		res.json({ success: true })
	} catch (error) {
		res.status(500).json({ message: 'Ошибка обновления статуса' })
	}
})

module.exports = router
