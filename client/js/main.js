import { openAdminPanel } from './admin.js'
import { setupAuth } from './auth.js'
import { loadEmployees, setupEmployeesSection } from './employees.js'
import { setupRecords } from './records.js'
import { setupUI, updateButtonsAfterAuth } from './ui.js'
import { initUserCabinet } from './userCabinet.js'

document.addEventListener('DOMContentLoaded', async () => {
	setupUI()
	setupAuth()
	setupRecords()

	async function generateUserHash() {
		return (
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15)
		)
	}

	let userHash = localStorage.getItem('userHash')
	if (!userHash) {
		userHash = generateUserHash()
		localStorage.setItem('userHash', userHash)
	}

	try {
		await fetch('http://localhost:3000/auth/track-visit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userHash }),
		})
	} catch (error) {
		console.error('Ошибка при отслеживании посещения:', error)
	}

	const token = localStorage.getItem('token')
	updateButtonsAfterAuth(!!token)

	const roleId = localStorage.getItem('roleId')
	const adminButton = document.querySelector('.header__admin-button')
	if (roleId === '1') {
		adminButton.style.display = 'inline-block'
		adminButton.addEventListener('click', openAdminPanel)
	}

	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const calendarEl = document.getElementById('calendar')
	// Инициализация календаря
	const calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: 'dayGridMonth',
		selectable: true,
		selectMirror: true,
		locale: 'ru',
		height: 'auto',
		validRange: {
			start: today.toISOString().split('T')[0], // Ограничиваем выбор дат начиная с сегодняшнего дня
		},
		events: async function (fetchInfo, successCallback, failureCallback) {
			try {
				const res = await fetch('http://localhost:3000/records/bookings') // Получаем события с сервера
				const data = await res.json()

				const events = data.map(booking => ({
					title: booking.ServiceName,
					start: booking.StartTime,
					end: booking.EndTime,
					color: booking.BaseColor || '#f87171',
				}))

				successCallback(events)
			} catch (error) {
				console.error('Ошибка загрузки событий:', error)
				failureCallback(error)
			}
		},
		dateClick: function (info) {
			const selectedDate = new Date(info.dateStr)
			// Если выбранная дата меньше сегодняшнего дня, игнорируем выбор
			if (selectedDate < today) {
				alert('Вы не можете выбрать дату в прошлом!')
				return
			}
			alert(`Вы выбрали дату: ${info.dateStr}`)
			const currentDate = document.getElementById('date-input-calendar')
			currentDate.value = info.dateStr
			calendar.select(info.dateStr)
		},
	})
	initUserCabinet()
	calendar.render()

	document
		.querySelector('.header__admin-button')
		.addEventListener('click', loadEmployees)

	document
		.getElementById('exportEmployeesStats')
		.addEventListener('click', setupEmployeesSection)
})
