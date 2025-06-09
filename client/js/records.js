import { createRecord, getCategories } from './api.js'

export const setupRecords = () => {
	const entryForm = document.querySelector('.entry-form')
	const categorySelect = document.getElementById('category-select')
	const hoursInput = entryForm.querySelector(
		'.entry-form__input[type="number"]'
	)
	const timeInput = entryForm.querySelector('.entry-form__input[type="time"]')
	const dateInput = document.getElementById('date-input')
	const calendarEl = document.getElementById('calendar')

	const loadCategories = async () => {
		try {
			const categories = await getCategories()
			console.log('Категории:', categories)

			categorySelect.innerHTML = ''

			categories.forEach(category => {
				const option = document.createElement('option')
				option.value = category.CategoryID
				option.className = 'entry-form__option'
				option.textContent = category.CategoryName
				categorySelect.appendChild(option)
			})
		} catch (error) {
			console.error('Ошибка при загрузке категорий:', error)
			alert('Не удалось загрузить категории. Попробуйте позже.')
		}
	}


	const initCalendar = () => {
		const calendar = new FullCalendar.Calendar(calendarEl, {
			initialView: 'dayGridMonth',
			locale: 'ru',
			selectable: true,
			select: function (info) {
				const selectedDate = info.startStr // Получаем выбранную дату
				console.log('Выбрана дата:', selectedDate)
				dateInput.value = selectedDate.split('T')[0] // Заполняем скрытое поле для даты
			},
			validRange: {
				start: new Date().toISOString().split('T')[0], // Запрещаем выбор прошлого
			},
		})
		calendar.render()
	}

	// Инициализация формы
	const initForm = () => {
		loadCategories()
		initCalendar()

		entryForm.addEventListener('submit', async e => {
			e.preventDefault()

			const categoryId = categorySelect.value
			const hours = hoursInput.value
			const time = timeInput.value
			const date = document.getElementById('date-input-calendar').value // Используем скрытое поле для даты

			console.log('categoryId:', categoryId)
			console.log('hours:', hours)
			console.log('time:', time)
			console.log('date:', date)

			// Проверяем, что все поля заполнены
			if (!categoryId || !hours || !time || !date) {
				alert('Пожалуйста, заполните все поля')
				return
			}

			const now = new Date()
			const selectedDate = new Date(`${date}T${time}:00`)
			const startTime = new Date(selectedDate)
			const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000)

			// Проверяем, что выбранная дата не раньше текущей
			if (selectedDate <= now) {
				alert('Выбранная дата и время должны быть позже текущего времени')
				return
			}

			// Проверяем, что время находится в диапазоне 10:00 - 23:00
			const selectedHour = selectedDate.getHours()
			if (selectedHour < 10 || selectedHour >= 23) {
				alert('Запись возможна только с 10:00 до 23:00')
				return
			}

			// Проверяем, что конец записи не выходит за 23:00
			const endHour = endTime.getHours()
			if (endHour >= 23) {
				alert('Конец записи не может выходить за 23:00')
				return
			}

			const token = localStorage.getItem('token')
			if (!token) {
				alert('Пожалуйста, авторизуйтесь для записи')
				return
			}

			try {
				const response = await createRecord(
					{ categoryId, hours, time, date },
					token
				)
				if (response.ok) {
					alert('Запись успешно создана')
					entryForm.reset() // Очищаем форму после успешной отправки
				} else {
					const error = await response.json()
					alert('Ошибка при записи: ' + (error.message || 'Неизвестная ошибка'))
				}
			} catch (error) {
				alert('Ошибка при отправке данных: ' + error.message)
			}
		})
	}

	initForm()
}
