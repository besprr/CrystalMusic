import { loginUser, registerUser } from './api.js'
import { updateButtonsAfterAuth } from './ui.js'

export const setupAuth = () => {
	const authForm = document.querySelector('.auth-form')
	const regForm = document.querySelector('.reg-form')
	const logoutButton = document.querySelector('.header__button.logout')

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
			const response = await registerUser({
				RoleID,
				FullName,
				Email,
				PasswordHash,
			})
			if (response.ok) {
				alert('Регистрация успешна')
				regForm.reset()
			} else {
				const error = await response.json()
				alert('Ошибка регистрации: ' + (error.error || 'Неизвестная ошибка'))
			}
		} catch (error) {
			console.error('Error:', error)
		}
	})

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
			const response = await loginUser({ Email, PasswordHash })
			if (response.ok) {
				const data = await response.json()
				alert('Авторизация успешна')
				authForm.reset()

				localStorage.setItem('token', data.accessToken)
				localStorage.setItem('userName', data.user.FullName)
				localStorage.setItem('userEmail', data.user.Email)
				localStorage.setItem('roleId', data.user.RoleID)
				localStorage.setItem('userId', data.user.UserID)

				

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

	logoutButton.addEventListener('click', () => {
		localStorage.removeItem('token')
		localStorage.removeItem('userName')
		localStorage.removeItem('userEmail')
		localStorage.removeItem('roleId')
		updateButtonsAfterAuth(false)
	})
}
