const jwt = require('jsonwebtoken')
const { queryDatabase } = require('../config/db')
require('dotenv').config()

const generateAccessToken = (userId, fullName, roleId) => {
	return jwt.sign(
		{ userId, fullName, roleId },
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
		}
	)
}

const generateRefreshToken = (userId, fullName, roleId) => {
	return jwt.sign(
		{ userId, fullName, roleId },
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
		}
	)
}

const verifyAccessToken = token => {
	try {
		return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
	} catch (error) {
		return null
	}
}

const verifyRefreshToken = token => {
	try {
		return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
	} catch (error) {
		return null
	}
}

const saveRefreshToken = async (userId, refreshToken) => {
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
	const deleteQuery = `DELETE FROM RefreshTokens WHERE UserID = ?`
	await queryDatabase(deleteQuery, [userId])

	const query = `INSERT INTO RefreshTokens (UserID, Token, ExpiresAt)
	VALUES(?, ?, ?)`
	await queryDatabase(query, [userId, refreshToken, expiresAt])
}

const getUserByRefreshToken = async refreshToken => {
	const query = `SELECT * FROM Users WHERE RefreshToken = ?`
	const result = await queryDatabase(query, [refreshToken])
	return result[0]
}

module.exports = {
	saveRefreshToken,
	getUserByRefreshToken,
	generateAccessToken,
	generateRefreshToken,
	verifyAccessToken,
	verifyRefreshToken,
}
