import { createRecord } from './api.js'

export const setupRecords = () => {
	const recordOverlay = document.getElementById('record-overlay')
	const bookButton = document.querySelector('.hero__button.button')

	recordOverlay.addEventListener('submit', async (e) => {
		e.preventDefault()

		const recordingType = recordOverlay.querySelector('.record-input:nth-of-type(1)').value
		const hours = recordOverlay.querySelector('.record-input:nth-of-type(2)').value
		const time = recordOverlay.querySelector('.record-input:nth-of-type(3)').value
		const date = recordOverlay.querySelector('.record-input:nth-of-type(4)').value

		if (!recordingType || !hours || !time || !date) {
			alert('Пожалуйста, заполните все поля')
			return
		}

		const token = localStorage.getItem('token')
		if (!token) {
			alert('Пожалуйста, авторизуйтесь для записи')
			return
		}

		try {
			const response = await createRecord({ recordingType, hours, time, date }, token)
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

	bookButton.addEventListener('click', () => {
		const token = localStorage.getItem('token')
		if (token) {
			recordOverlay.showModal()
		} else {
			alert('Для записи на студию необходимо авторизоваться')
		}
	})
}