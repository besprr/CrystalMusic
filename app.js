require('dotenv').config()
require('./server/config/db')

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const authRoutes = require('./server/routes/authRoutes')
const recordsRoutes = require('./server/routes/recordsRoutes')
const adminRoutes = require('./server/routes/adminRoutes')
const userRoutes = require('./server/routes/userRoutes')
const wordRoutes = require('./server/routes/wordRoutes')

const app = express()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(
	cors({
		origin: 'http://localhost:5500',
		credentials: true,
	})
)
app.use(cookieParser())

app.use('/auth', authRoutes)
app.use('/records', recordsRoutes)
app.use('/admin', adminRoutes)
app.use('/user', userRoutes)
app.use('/export', wordRoutes)

app.listen(port, () => {
	console.log(`✅ Сервер успешно запущен на порту ${port}`)
})
