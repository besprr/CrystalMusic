const express = require('express')
const router = express.Router()
const { queryDatabase } = require('../config/db')
const jwt = require('jsonwebtoken')
const { authenticateToken } = require('../middlewares/tokenMiddleware')
const { Packer, Document, Paragraph, TextRun } = require('docx')

// Получение записей (бронирований)
router.get('/bookings', authenticateToken, async (req, res) => {
	try {
		const { status } = req.query
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
    `

		if (status) {
			query += ` WHERE Bookings.Status = ?`
		}

		const result = await queryDatabase(query, status ? [status] : [])
		res.json({ bookings: result })
	} catch (error) {
		console.error('Ошибка:', error)
		res.status(500).json({
			error: 'Ошибка при получении записей',
			details: error.message,
		})
	}
})

// Получение пользователей
router.get('/users', async (req, res) => {
	try {
		const query = `SELECT UserID, FullName, Email, RegistrationDate FROM Users`
		const result = await queryDatabase(query)
		res.json(result)
	} catch (error) {
		res.status(500).json({ message: 'Ошибка при получении пользователей' })
	}
})

// Экспорт пользователей в Word
router.get('/export-users', authenticateToken, async (req, res) => {
	try {
		// Запрашиваем данные пользователей
		const query = `SELECT UserID, FullName, Email, RegistrationDate FROM Users`
		const users = await queryDatabase(query)

		const doc = new Document({
			creator: 'CrystalMusic',
			title: 'Список пользователей',
			sections: [
				{
					children: [
						new Paragraph({
							text: 'Список пользователей',
							heading: 'Heading1',
						}),
						...users
							.map(user => [
								new Paragraph(`ID: ${user.UserID}`),
								new Paragraph(`Имя: ${user.FullName}`),
								new Paragraph(`Email: ${user.Email}`),
								new Paragraph(
									`Дата регистрации: ${new Date(
										user.RegistrationDate
									).toLocaleDateString()}`
								),
								new Paragraph(' '),
							])
							.flat(),
					],
				},
			],
		})

		// Генерация файла
		const buffer = await Packer.toBuffer(doc)

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		)
		res.setHeader('Content-Disposition', 'attachment; filename=users_list.docx')
		res.send(buffer)
	} catch (error) {
		console.error('Ошибка при генерации Word файла:', error)
		res.status(500).json({ error: 'Ошибка при генерации отчёта' })
	}
})

// Экспорт активностей пользователей (посещений) в Word
router.get('/export-visits', authenticateToken, async (req, res) => {
	try {
		// Запрашиваем данные о посещениях
		const query = `
      SELECT 
          FirstVisitDate,
          LastVisitDate
      FROM Visits
    `
		const visits = await queryDatabase(query)

		// Создаем документ Word
		const doc = new Document({
			creator: 'CrystalMusic',
			title: 'Отчет о посещениях',
			sections: [
				{
					children: [
						new Paragraph({
							text: 'Отчет о посещениях сайта',
							heading: 'Heading1',
						}),
						...visits
							.map((visit, index) => [
								new Paragraph(`Пользователь #${index + 1}`),
								new Paragraph(
									`Первое посещение: ${new Date(
										visit.FirstVisitDate
									).toLocaleString()}`
								),
								new Paragraph(
									`Последнее посещение: ${new Date(
										visit.LastVisitDate
									).toLocaleString()}`
								),
								new Paragraph(' '),
							])
							.flat(),
					],
				},
			],
		})

		// Генерация файла
		const buffer = await Packer.toBuffer(doc)

		// Отправляем файл клиенту
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		)
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=visits_report.docx'
		)
		res.send(buffer)
	} catch (error) {
		console.error('Ошибка при генерации отчета о посещениях:', error)
		res.status(500).json({ error: 'Ошибка при генерации отчета' })
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

router.get('/rejected-bookings', async (req, res) => {
	try {
		const query = `
      SELECT 
        rb.BookingID,
        u.FullName,
        u.Email,
        r.RoomName,
        s.ServiceName,
        rb.StartTime,
        rb.EndTime,
        rb.CancellationReason,
        rb.CancellationDate
      FROM RejectedBookings rb
      INNER JOIN Users u ON rb.UserID = u.UserID
      INNER JOIN Rooms r ON rb.RoomID = r.RoomID
      INNER JOIN Services s ON rb.ServiceID = s.ServiceID
      ORDER BY rb.CancellationDate DESC
    `

		const result = await queryDatabase(query)
		res.json({ rejectedBookings: result })
	} catch (error) {
		console.error('Ошибка:', error)
		res.status(500).json({
			error: 'Ошибка при получении отклоненных заявок',
			details: error.message,
		})
	}
})

router.get('/employees', async (req, res) => {
	try {
		const result = await queryDatabase(`
            SELECT 
                e.FullName AS EmployeeName,
                e.Position,
                CONVERT(varchar, b.StartTime, 120) AS StartTime,
                CONVERT(varchar, b.EndTime, 120) AS EndTime
            FROM Employees e
            LEFT JOIN Rooms r ON r.EmployeeID = e.EmployeeID
            LEFT JOIN Bookings b ON b.RoomID = r.RoomID
            ORDER BY e.FullName, b.StartTime
        `)
		res.json(result)
	} catch (err) {
		console.error('Ошибка загрузки сотрудников:', err)
		res.status(500).send('Ошибка загрузки сотрудников')
	}
})

module.exports = router
