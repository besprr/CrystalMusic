require('dotenv').config()
const validateRecords = require('../utils/validateRecords')
const recordService = require('../services/recordsService')
const { queryDatabase } = require('../config/db')
const { sendBookingConfirmation } = require('../services/emailService')
const { getUserById } = require('../services/userService')

const createRecord = async (req, res) => {
	const { categoryId, hours, time, date } = req.body

	if (!categoryId || !hours || !time || !date) {
		console.error('Ошибка: Не все поля заполнены')
		return res.status(400).json({ error: 'Все поля обязательны' })
	}

	try {
		const selectedDate = new Date(`${date}T${time}:00`)
		const now = new Date()

		if (selectedDate <= now) {
			console.error(
				'Ошибка: Выбранная дата и время должны быть позже текущего времени'
			)
			return res.status(400).json({
				error: 'Выбранная дата и время должны быть позже текущего времени',
			})
		}

		const selectedHour = selectedDate.getHours()
		if (selectedHour < 10 || selectedHour >= 23) {
			console.error('Ошибка: Запись возможна только с 10:00 до 23:00')
			return res
				.status(400)
				.json({ error: 'Запись возможна только с 10:00 до 23:00' })
		}

		const endTime = new Date(selectedDate.getTime() + hours * 60 * 60 * 1000)
		const endHour = endTime.getHours()
		if (endHour >= 23) {
			console.error('Ошибка: Конец записи не может выходить за 23:00')
			return res
				.status(400)
				.json({ error: 'Конец записи не может выходить за 23:00' })
		}
		const getServiceAndRoomQuery = `
     SELECT 
    s.ServiceID, 
    sr.RoomID, 
    c.CategoryName 
  FROM Services s
  JOIN ServiceRooms sr ON s.ServiceID = sr.ServiceID
  JOIN Categories c ON s.CategoryID = c.CategoryID
  WHERE s.CategoryID = ?
`

		const [serviceRoom] = await queryDatabase(getServiceAndRoomQuery, [
			categoryId,
		])

		if (!serviceRoom) {
			console.error('Ошибка: Услуга недоступна для записи')
			return res.status(400).json({ error: 'Услуга недоступна для записи' })
		}

		const { ServiceID: serviceId, RoomID: roomId } = serviceRoom

		// Проверяем доступность времени
		const isTimeAvailable = await validateRecords.checkTimeAndDate(
			date,
			time,
			hours
		)
		if (!isTimeAvailable) {
			console.error('Ошибка: Выбранные дата и время заняты')
			return res.status(400).json({ error: 'Выбранные дата и время заняты' })
		}

		// Создаем запись в базе данных
		const userId = req.user.userId
		const insertBookingQuery = `
      INSERT INTO Bookings (UserID, RoomID, ServiceID, StartTime, EndTime, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `
		await queryDatabase(insertBookingQuery, [
			userId,
			roomId,
			serviceId,
			selectedDate,
			endTime,
			'Pending',
		])

		const user = await getUserById(userId)

		await sendBookingConfirmation(user.Email, {
			serviceName: serviceRoom.CategoryName, // Убедитесь, что serviceRoom содержит ServiceName
			startTime: selectedDate,
			hours: hours,
		})

		console.log('✅ Запись успешно создана')
		return res.status(200).json({ message: 'Запись успешно создана' })
	} catch (err) {
		console.error('Ошибка при создании записи:', err)
		res.status(500).json({
			error: 'Ошибка при создании записи',
			details: err.message,
		})
	}
}

const getBookedDates = async (req, res) => {
	try {
		const query = `
      SELECT DISTINCT CONVERT(date, StartTime) AS BookedDate
      FROM Bookings
      WHERE Status != 'Cancelled'
    `
		const bookedDates = await queryDatabase(query)

		// Преобразуем даты в массив строк "YYYY-MM-DD"
		const formattedDates = bookedDates.map(
			row => row.BookedDate.toISOString().split('T')[0]
		)

		res.json({ bookedDates: formattedDates })
	} catch (error) {
		console.error('Ошибка при получении занятых дат:', error)
		res.status(500).json({ error: 'Ошибка сервера' })
	}
}

module.exports = { createRecord, getBookedDates }
