const { queryDatabase } = require('../config/db')

const checkIfExists = async (field, value) => {
	const allowedFields = ['Login', 'Email']
	if (!allowedFields.includes(field)) {
		throw new Error('Недопустимое поле для проверки')
	}

	const query = `SELECT * FROM Users WHERE ${field} = ?`
	const result = await queryDatabase(query, [value])
	return result.length > 0
}

const createUser = async (RoleID, FullName, Email, hashedPassword) => {
	const query = `
			INSERT INTO Users (RoleID, FullName, Email, PasswordHash)
			VALUES (?, ?, ?, ?)
	`
	await queryDatabase(query, [RoleID, FullName, Email, hashedPassword])
}

const getUserByEmail = async email => {
	const query = `SELECT * FROM Users WHERE Email = ?`
	const result = await queryDatabase(query, [email])
	return result[0]
}

module.exports = {
	checkIfExists,
	createUser,
	getUserByEmail,
}
