require('dotenv').config
const express = require('express')
const userRoutes = require('../controllers/authController')
const { queryDatabase } = require('../config/db')


const router = express.Router()

router.post('/register', userRoutes.registerUser)
router.post('/login', userRoutes.loginUser)
router.post('/refresh', userRoutes.refreshTokens)
router.post('/track-visit', async (req, res) => {
	const { userHash } = req.body;

  if (!userHash) {
    return res.status(400).json({ error: 'Отсутствует userHash' });
  }

  try {
    const checkQuery = `
      SELECT * FROM Visits WHERE UserHash = ?
    `;
    const [existingVisit] = await queryDatabase(checkQuery, [userHash]);

    if (existingVisit) {
      const updateQuery = `
        UPDATE Visits
        SET LastVisitDate = GETDATE()
        WHERE UserHash = ?
      `;
      await queryDatabase(updateQuery, [userHash]);
    } else {
      const insertQuery = `
        INSERT INTO Visits (UserHash, FirstVisitDate, LastVisitDate)
        VALUES (?, GETDATE(), GETDATE())
      `;
      await queryDatabase(insertQuery, [userHash]);
    }

    res.status(200).json({ message: 'Посещение успешно отслежено' });
  } catch (error) {
    console.error('Ошибка при отслеживании посещения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
})

module.exports = router