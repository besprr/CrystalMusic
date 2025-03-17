const { checkDateInDB } = require('../services/recordsService')

const checkTimeAndDate = async (date, time, durationHours) => {
	try {
		console.log(date)
		const startTime = new Date(`${date}T${time}:00`)
		const endTime = new Date(
			startTime.getTime() + durationHours * 60 * 60 * 1000
		)

		// Преобразуем дату в формат YYYY-MM-DD
		const formattedDate = new Date(date).toISOString().split('T')[0]

		const bookings = await checkDateInDB(formattedDate, formattedDate)

		// Проверяем каждое бронирование на пересечение с выбранным временем
		for (const booking of bookings) {
			const bookingStart = new Date(booking.StartTime)
			const bookingEnd = new Date(booking.EndTime)

			// Если есть пересечение, возвращаем false
			if (
				(startTime >= bookingStart && startTime < bookingEnd) || // Начало нового бронирования внутри существующего
				(endTime > bookingStart && endTime <= bookingEnd) || // Конец нового бронирования внутри существующего
				(startTime <= bookingStart && endTime >= bookingEnd) // Новое бронирование полностью перекрывает существующее
			) {
				return false
			}
		}

		// Если пересечений нет, время свободно
		return true
	} catch (err) {
		console.error('Ошибка при проверке времени и даты:', err)
		throw err
	}
}

module.exports = { checkTimeAndDate }