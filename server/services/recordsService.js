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

const createRecord = async (req, res) => {
  const { categoryId, hours, time, date } = req.body;

  if (!categoryId || !hours || !time || !date) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    // Преобразуем дату
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // Получаем serviceId и roomId из базы данных
    const getServiceAndRoomQuery = `
      SELECT s.ServiceID, sr.RoomID
      FROM Services s
      JOIN ServiceRooms sr ON s.ServiceID = sr.ServiceID
      WHERE s.CategoryID = ?
    `;
    const [serviceRoom] = await queryDatabase(getServiceAndRoomQuery, [categoryId]);

    if (!serviceRoom) {
      return res.status(400).json({ error: 'Услуга недоступна для записи' });
    }

    const { ServiceID: serviceId, RoomID: roomId } = serviceRoom;

    // Проверяем доступность времени
    const isTimeAvailable = await validateRecords.checkTimeAndDate(
      formattedDate,
      time,
      hours
    );
    if (!isTimeAvailable) {
      return res.status(400).json({ error: 'Выбранные дата и время заняты' });
    }

    // Создаем запись в базе данных
    const userId = req.user.userId;
    const startTime = new Date(`${formattedDate}T${time}:00`);
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

    const insertBookingQuery = `
      INSERT INTO Bookings (UserID, RoomID, ServiceID, StartTime, EndTime, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await queryDatabase(insertBookingQuery, [
      userId,
      roomId,
      serviceId,
      startTime,
      endTime,
      'Pending',
    ]);

    return res.status(200).json({ message: 'Запись успешно создана' });
  } catch (err) {
    console.error('Ошибка при создании записи:', err);
    res.status(500).json({
      error: 'Ошибка при создании записи',
      details: err.message,
    });
  }
};

module.exports = {checkDateInDB, createRecord}
