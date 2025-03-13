require('dotenv').config()
const bcrypt = require('bcrypt')

const userService = require('../services/userService')
const jwtService = require('../services/jwtService')

const { validateEmail } = require('../utils/validateEmail')

const saltRounds = parseInt(process.env.SALT_ROUNDS)

const registerUser = async (req, res) => {
	const { RoleID, FullName, Email, PasswordHash } = req.body

	if (!RoleID || !FullName || !Email || !PasswordHash) {
		return res.status(400).json({ error: 'Все поля обязательны.' })
	}

	if (!validateEmail(Email)) {
		return res.status(400).json({ error: 'Неверный формат почты.' })
	}

	try {
		const emailExists = await userService.checkIfExists('Email', Email)
		if (emailExists) {
			return res.status(400).json({ error: 'Этот email уже занят' })
		}

		const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds)
		await userService.createUser(RoleID, FullName, Email, hashedPassword)

		console.log('✅ Пользователь успешно зарегистрирован')
		res.status(201).json({ message: 'Пользователь успешно зарегистрирован' })
	} catch (err) {
		console.error('Ошибка при регистрации:', err)
		res.status(500).json({
			error: 'Ошибка при регистрации пользователя',
			details: err.message,
		})
	}
}

const loginUser = async (req, res) => {
	const { Email, PasswordHash } = req.body

	if (!Email || !PasswordHash) {
		return res.status(400).json({ error: 'Все поля обязательны!' })
	}

	try {
		const user = await userService.getUserByEmail(Email)
	
		if (!user) {
			return res.status(400).json({ error: 'Пользователь не найден' })
		}
		const isPasswordValid = await bcrypt.compare(
			PasswordHash,
			user.PasswordHash
		)

		if (!isPasswordValid) {
			return res.status(400).json({ error: 'Неверный пароль!' })
		}

		const accessToken = jwtService.generateAccessToken(
			user.UserID,
			user.FullName,
			user.RoleID
		)

	
		const refreshToken = jwtService.generateRefreshToken(
			user.UserID,
			user.FullName,
			user.RoleID
		)


		await jwtService.saveRefreshToken(user.UserID, refreshToken)

		res.status(200).json({ accessToken, refreshToken, user })
	} catch (err) {
		console.error('❌ Ошибка при авторизации:', err)
		res
			.status(500)
			.json({ error: 'Ошибка при авторизации', details: err.message })
	}
}

module.exports = { registerUser, loginUser }
