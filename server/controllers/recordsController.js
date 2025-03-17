require('dotenv').config()
const validateRecords = require('../utils/validateRecords')
const recordService = require('../services/recordsService')

const createRecord = async (req, res) => {
	const { recordingType, hours, time, date } = req.body

	if (!recordingType || !hours || !time || !date) {
		return res.status(400).json({ error: 'Все поля обязательны' })
	}

	try {
		const formattedDate = new Date(date).toISOString().split('T')[0]

		const isTimeAvailable = await validateRecords.checkTimeAndDate(
			formattedDate,
			time,
			hours
		)
		if (!isTimeAvailable) {
			return res.status(400).json({ error: 'Выбранные дата и время заняты' })
		}

	
		const userId = req.user.userId

		// Создаем запись в базе данных
		await recordService.createRecord(
			userId,
			recordingType,
			hours,
			time,
			formattedDate
		)

		return res.status(200).json({ message: 'Запись успешно создана' })
	} catch (err) {
		console.error('Ошибка при создании записи:', err)
		res.status(500).json({
			error: 'Ошибка при создании записи пользователем',
			details: err.message,
		})
	}
}

module.exports = { createRecord }
