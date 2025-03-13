const API_URL = 'http://localhost:3000'

document.addEventListener('DOMContentLoaded', () => {
	const authButton = document.querySelector('.header__button.auth')
	const regButton = document.querySelector('.header__button.reg')
	const logoutButton = document.querySelector('.header__button.logout')
	const bookButton = document.querySelector('.hero__button.button')
	const authOverlay = document.getElementById('auth-overlay')
	const regOverlay = document.getElementById('reg-overlay')
	const authForm = document.querySelector('.auth-form')
	const regForm = document.querySelector('.reg-form')
	const recordOverlay = document.getElementById('record-overlay')

	const updateButtonsAfterAuth = isAuthenticated => {
		if (isAuthenticated) {
			authButton.style.display = 'none'
			regButton.style.display = 'none'
			logoutButton.style.display = 'inline-block'
			bookButton.style.display = 'inline-block'
		} else {
			authButton.style.display = 'inline-block'
			regButton.style.display = 'inline-block'
			logoutButton.style.display = 'none'
			bookButton.style.display = 'none'
		}
	}

	const checkAuthStatus = () => {
		const token = localStorage.getItem('token')
		updateButtonsAfterAuth(!!token)
	}

	checkAuthStatus()

	authButton.addEventListener('click', () => {
		authOverlay.showModal()
	})

	regButton.addEventListener('click', () => {
		regOverlay.showModal()
	})

	authOverlay.addEventListener('close', () => {
		authOverlay.querySelector('.auth-input').value = ''
	})

	regOverlay.addEventListener('close', () => {
		regOverlay.querySelector('.reg-input').value = ''
	})

	regForm.addEventListener('submit', async e => {
		e.preventDefault()

		const FullName = regForm.querySelector('.reg-input:nth-of-type(1)').value
		const Email = regForm.querySelector('.reg-input:nth-of-type(2)').value
		const PasswordHash = regForm.querySelector(
			'.reg-input:nth-of-type(3)'
		).value
		const RoleID = 2

		if (!FullName || !Email || !PasswordHash) {
			alert('Пожалуйста, заполните все поля')
			return
		}

		try {
			const response = await fetch(`${API_URL}/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ RoleID, FullName, Email, PasswordHash }),
			})

			if (response.ok) {
				alert('Регистрация успешна')
				regOverlay.close()
				regForm.reset()
			} else {
				const error = await response.json()
				alert('Ошибка регистрации: ' + error.error || 'Неизвестная ошибка')
			}
		} catch (error) {
			console.error('Error:', error)
		}
	})
	// Кирилл
	// besprrr@yandex.body
	// 1111

	authForm.addEventListener('submit', async e => {
		e.preventDefault()

		const Email = authForm.querySelector('.auth-input:nth-of-type(1)').value
		const PasswordHash = authForm.querySelector(
			'.auth-input:nth-of-type(2)'
		).value

		if (!Email || !PasswordHash) {
			alert('Пожалуйста, заполните все поля')
			return
		}

		try {
			const response = await fetch(`${API_URL}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ Email, PasswordHash }),
			})

			if (response.ok) {
				const data = await response.json()
				alert('Авторизация успешна')
				authOverlay.close()
				authForm.reset()

				localStorage.setItem('token', data.accessToken)

				localStorage.setItem('userName', data.user.FullName)
				localStorage.setItem('userEmail', data.user.Email)
				localStorage.setItem('roleId', data.user.RoleID)

				updateButtonsAfterAuth(true)
			} else {
				const error = await response.json()
				alert('Ошибка авторизации: ' + (error.message || 'Неизвестная ошибка'))
			}
		} catch (error) {
			console.error('Error:', error)
			alert('Ошибка при авторизации. Пожалуйста, попробуйте позже.')
		}
	})

	recordOverlay.addEventListener('submit', async e => {
		e.preventDefault()

		const recordingType = recordOverlay.querySelector(
			'.record-input:nth-of-type(1)'
		).value
		const hours = recordOverlay.querySelector(
			'.record-input:nth-of-type(2)'
		).value
		const time = recordOverlay.querySelector(
			'.record-input:nth-of-type(3)'
		).value
		const date = recordOverlay.querySelector(
			'.record-input:nth-of-type(4)'
		).value

		if (!recordingType || !hours || !time || !date) {
			alert('Пожалуйста, заполните все поля')
			return
		}

		const token = localStorage.getItem('token')
		if (!token) {
			alert('Пожалуйста, авторизуйтесь для записи')
			return
		}

		const name = localStorage.getItem('userName')
		console.log(name)
		const phone = localStorage.getItem('userPhone')
		console.log(phone)

		if (!name || !phone) {
			alert(
				'Не удалось получить данные пользователя. Пожалуйста, авторизуйтесь заново.'
			)
			return
		}

		try {
			const response = await fetch('http://localhost:9000/record', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name,
					phone,
					recordingType,
					hours,
					time,
					date,
				}),
			})

			if (response.ok) {
				alert('Запись успешно создана')
				recordOverlay.close()
			} else {
				const error = await response.json()
				alert('Ошибка при записи: ' + (error.message || 'Неизвестная ошибка'))
			}
		} catch (error) {
			alert('Ошибка при отправке данных: ' + error.message)
		}
	})

	logoutButton.addEventListener('click', async () => {
		try {
			localStorage.removeItem('token')
			localStorage.removeItem('userName')
			localStorage.removeItem('userEmail')

			updateButtonsAfterAuth(false)
		} catch (error) {
			console.error('Error:', error)
		}
	})

	bookButton.addEventListener('click', () => {
		const token = localStorage.getItem('token')
		if (token) {
			recordOverlay.showModal()
		} else {
			alert('Для записи на студию необходимо авторизоваться')
		}
	})
})
