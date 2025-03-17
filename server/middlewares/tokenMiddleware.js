const { verifyAccessToken } = require('../services/jwtService');

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
			return res.status(401).json({ error: 'Токен отсутствует' });
	}

	const decoded = verifyAccessToken(token);
	if (!decoded) {
			return res.status(401).json({ error: 'Недействительный токен' });
	}

	req.user = decoded;
	next();
};

module.exports = {authenticateToken}