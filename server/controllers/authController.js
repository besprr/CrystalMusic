require('dotenv').config()
const bcrypt = require('bcrypt')

const userService = require('../services/userService')
const jwtService = require('../services/jwtService')

const saltRounds = parseInt(process.env.SALT_ROUNDS)

const registerUser = async (req, res) => {
	const { RoleID, FullName, Email, PasswordHash } = req.body

	if (!RoleID || !FullName || !Email || !PasswordHash) {
		return res.status(400).json({ error: 'Все поля обязательны.' })
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

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: 'lax',
			secure: false,
		})

		await jwtService.saveRefreshToken(user.UserID, refreshToken)

		res.status(200).json({ accessToken, refreshToken, user })
	} catch (err) {
		console.error('❌ Ошибка при авторизации:', err)
		res
			.status(500)
			.json({ error: 'Ошибка при авторизации', details: err.message })
	}
}

const refreshTokens = async (req, res) => {
	const refreshToken = req.cookies.refreshToken

	if (!refreshToken) {
		return res.status(400).json({ error: 'Refresh токен обязателен' })
	}

	try {
		const decoded = jwtService.verifyRefreshToken(refreshToken)
		if (!decoded) {
			return res.status(401).json({ error: 'Недействительный refresh токен' })
		}

		const user = await jwtService.getUserByRefreshToken(refreshToken)
		if (!user) {
			return res.status(401).json({ error: 'Пользователь не найден' })
		}

		const accessToken = jwtService.generateAccessToken(
			user.UserID,
			user.Login,
			user.RoleID
		)
		const newRefreshToken = jwtService.generateRefreshToken(
			user.UserID,
			user.Login,
			user.RoleID
		)

		await jwtService.saveRefreshToken(user.UserID, newRefreshToken)

		res.cookie('refreshToken', newRefreshToken, {
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60 * 1000, 
			sameSite: 'lax',
			secure: false, 
		})

		res.status(200).json({ accessToken, newRefreshToken })
	} catch (error) {
		console.error('❌ Ошибка при обновлении токенов:', error)
		res
			.status(500)
			.json({ error: 'Ошибка при обновлении токенов', details: error.message })
	}
}

module.exports = { registerUser, loginUser, refreshTokens }
