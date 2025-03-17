const { queryDatabase } = require('../config/db')

const checkDateInDB = async (firstDate, secondDate) => {
	const query = `
		SELECT StartTime, EndTime 
		FROM Bookings 
		WHERE CAST(StartTime AS DATE) = ? 
			OR CAST(EndTime AS DATE) = ?
	`
	return await queryDatabase(query, [firstDate, secondDate])
}

const createRecord = async (userId, recordingType, hours, time, date) => {
	try {
		// Преобразуем время начала и вычисляем время окончания
		const startTime = new Date(`${date}T${time}:00`)
		const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000)

		// Запрос для добавления записи в таблицу Bookings
		const query = `
			INSERT INTO Bookings (UserID, ServiceID, RoomID, StartTime, EndTime, Status)
			VALUES (?, ?, ?, ?, ?, ?)
		`
		// Предположим, что ServiceID и RoomID пока что статические (можно доработать)
		const serviceId = 1 // ID услуги (например, "Запись в студии")
		const roomId = 1 // ID помещения (например, "Основная студия")
		const status = 'Confirmed' // Статус записи

		await queryDatabase(query, [
			userId,
			serviceId,
			roomId,
			startTime,
			endTime,
			status,
		])

		console.log('✅ Запись успешно создана')
		return true
	} catch (err) {
		console.error('Ошибка при создании записи:', err)
		throw err
	}
}

module.exports = {checkDateInDB, createRecord}
