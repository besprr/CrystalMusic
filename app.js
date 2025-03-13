require('dotenv').config()
const express = require('express')
const cors = require('cors')
const crypto = require('crypto');
require('./server/config/db');

const authRoutes = require('./server/routes/authRoutes');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

app.use('/auth', authRoutes)

app.listen(port, () => {
	console.log(`✅ Сервер успешно запущен на порту ${port}`)
})