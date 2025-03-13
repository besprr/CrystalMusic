require('dotenv').config()
const sql = require('msnodesqlv8')

const connectionString = process.env.DB_CONNECTION_STRING

const queryDatabase = (query, params = []) => {
	return new Promise((resolve, reject) => {
		sql.query(connectionString, query, params, (err, result) => {
			if (err) {
				reject(err)
			} else {
				resolve(result)
			}
		})
	})
}

queryDatabase('SELECT 1')
	.then(() => console.log('✅ Успешное подключение к БД'))
	.catch(err => console.error('❌ Ошибка подключения к БД:', err))

module.exports = { queryDatabase }
