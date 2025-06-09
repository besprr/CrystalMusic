import {
	exportUsers,
	getBookings,
	getRejectedBookings,
	getUsers,
	updateBookingStatus,
} from './api.js'

export function openAdminPanel() {
	const adminPanelDialog = document.getElementById('adminPanelDialog')
	adminPanelDialog.showModal()
	document.querySelector('.tablinks').click()
	loadAdminData()
}

export function closeAdminPanel() {
	const adminPanelDialog = document.getElementById('adminPanelDialog')
	adminPanelDialog.close()
}

// Загрузка всех данных при открытии панели
async function loadAdminData() {
	try {
		await loadUsers()
		await loadAllBookings()
		await loadPendingBookings()
		await loadRejectedBookings()
	} catch (error) {
		console.error('Ошибка загрузки данных:', error)
		alert('Ошибка загрузки данных')
	}
}

// Загрузка всех бронирований
async function loadAllBookings() {
	try {
		const data = await getBookings() // Получаем данные
		console.log('Данные всех бронирований:', data) // Лог для отладки

		// Проверка данных
		if (!data || !Array.isArray(data.bookings)) {
			throw new Error('Некорректные данные с сервера')
		}

		const tbody = document.getElementById('allBookingsTableBody')
		tbody.innerHTML = ''

		data.bookings.forEach(booking => {
			const row = document.createElement('tr')
			row.innerHTML = `
        <td>${booking.UserName}</td>
        <td>${booking.RoomName}</td>
        <td>${booking.ServiceName}</td>
        <td>${new Date(booking.StartTime).toLocaleString()}</td>
        <td>${new Date(booking.EndTime).toLocaleString()}</td>
        <td>${
					booking.Status === 'Confirmed' ? 'Подтверждена' : 'В обработке'
				}</td>
      `
			tbody.appendChild(row)
		})
	} catch (error) {
		console.error('Ошибка загрузки всех бронирований:', error)
		alert('Ошибка загрузки данных. Проверьте консоль.')
	}
}

async function loadPendingBookings() {
	try {
		const data = await getBookings('Pending')
		console.log('Данные ожидающих бронирований:', data) // Лог для отладки

		// Проверка данных
		if (!data || !Array.isArray(data.bookings)) {
			throw new Error('Некорректные данные с сервера')
		}

		const tbody = document.getElementById('pendingBookingsTableBody')
		tbody.innerHTML = ''

		data.bookings.forEach(booking => {
			const row = document.createElement('tr')
			row.innerHTML = `
        <td>${booking.UserName}</td>
        <td>${booking.RoomName}</td>
        <td>${booking.ServiceName}</td>
        <td>${new Date(booking.StartTime).toLocaleString()}</td>
        <td>${new Date(booking.EndTime).toLocaleString()}</td>
        <td class="action-buttons">
          <button onclick="confirmBooking(${booking.BookingID})">✓</button>
          <button onclick="rejectBooking(${booking.BookingID})">✕</button>
        </td>
      `
			tbody.appendChild(row)
		})
	} catch (error) {
		console.error('Ошибка загрузки ожидающих бронирований:', error)
		alert('Ошибка загрузки данных. Проверьте консоль.')
	}
}

// Загрузка пользователей
async function loadUsers() {
	try {
		const response = await getUsers(localStorage.getItem('token'))

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.error || 'Ошибка загрузки пользователей')
		}

		const users = await response.json()

		const searchInput = document.getElementById('searchUsers')
		const sortBySelect = document.getElementById('sortBy')
		const sortOrderSelect = document.getElementById('sortOrder')
		const dateFromInput = document.getElementById('dateFrom')
		const dateToInput = document.getElementById('dateTo')
		const resetFiltersBtn = document.getElementById('resetFilters')
		const tbody = document.getElementById('usersTableBody')

		const filterAndSortUsers = () => {
			const searchText = searchInput.value.toLowerCase()
			const sortBy = sortBySelect.value
			const sortOrder = sortOrderSelect.value
			const dateFrom = dateFromInput.value
			const dateTo = dateToInput.value

			let filteredUsers = users.filter(
				user =>
					user.FullName.toLowerCase().includes(searchText) ||
					user.Email.toLowerCase().includes(searchText)
			)

			if (dateFrom) {
				const fromDate = new Date(dateFrom)
				filteredUsers = filteredUsers.filter(user => {
					const userDate = new Date(user.RegistrationDate)
					return userDate >= fromDate
				})
			}

			if (dateTo) {
				const toDate = new Date(dateTo)
				toDate.setHours(23, 59, 59, 999)
				filteredUsers = filteredUsers.filter(user => {
					const userDate = new Date(user.RegistrationDate)
					return userDate <= toDate
				})
			}

			filteredUsers.sort((a, b) => {
				let valueA, valueB
				if (sortBy === 'RegistrationDate') {
					valueA = new Date(a[sortBy])
					valueB = new Date(b[sortBy])
				} else {
					valueA = a[sortBy].toLowerCase()
					valueB = b[sortBy].toLowerCase()
				}

				if (sortOrder === 'asc') {
					return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
				} else {
					return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
				}
			})

			tbody.innerHTML = ''
			filteredUsers.forEach(user => {
				const row = document.createElement('tr')
				row.innerHTML = `
					<td>${user.FullName}</td>
					<td>${user.Email}</td>
					<td>${new Date(user.RegistrationDate).toLocaleDateString()}</td>
				`
				tbody.appendChild(row)
			})
		}

		// Навешиваем обработчики на все элементы управления
		searchInput.addEventListener('input', filterAndSortUsers)
		sortBySelect.addEventListener('change', filterAndSortUsers)
		sortOrderSelect.addEventListener('change', filterAndSortUsers)
		dateFromInput.addEventListener('change', filterAndSortUsers)
		dateToInput.addEventListener('change', filterAndSortUsers)

		resetFiltersBtn.addEventListener('click', () => {
			searchInput.value = ''
			sortBySelect.value = 'FullName'
			sortOrderSelect.value = 'asc'
			dateFromInput.value = ''
			dateToInput.value = ''
			filterAndSortUsers()
		})

		// Первичная отрисовка
		filterAndSortUsers()
	} catch (error) {
		console.error('Ошибка загрузки пользователей:', error)
		alert('Ошибка загрузки данных пользователей. Проверьте консоль.')
	}
}

async function loadRejectedBookings(token) {
	const tableBody = document.getElementById('rejectedBookingsTableBody')
	tableBody.innerHTML = ''

	try {
		const response = await getRejectedBookings(token)

		if (!response.ok) {
			throw new Error(`Ошибка запроса: ${response.status}`)
		}

		const data = await response.json()
		const bookings = data.rejectedBookings

		if (bookings.length === 0) {
			const row = document.createElement('tr')
			const cell = document.createElement('td')
			cell.colSpan = 5
			cell.textContent = 'Нет отклонённых заявок.'
			cell.style.textAlign = 'center'
			row.appendChild(cell)
			tableBody.appendChild(row)
			return
		}

		bookings.forEach(booking => {
			const row = document.createElement('tr')

			const userCell = document.createElement('td')
			userCell.textContent = booking.FullName

			const emailCell = document.createElement('td')
			emailCell.textContent = booking.Email

			const roomCell = document.createElement('td')
			roomCell.textContent = booking.RoomName

			const serviceCell = document.createElement('td')
			serviceCell.textContent = booking.ServiceName

			const dateCell = document.createElement('td')
			const start = new Date(booking.StartTime)
			const end = new Date(booking.EndTime)
			dateCell.textContent = `${start.toLocaleDateString()}`

			row.appendChild(userCell)
			row.appendChild(emailCell)
			row.appendChild(roomCell)
			row.appendChild(serviceCell)
			row.appendChild(dateCell)

			tableBody.appendChild(row)
		})
	} catch (error) {
		console.error('Ошибка загрузки отклонённых заявок:', error)
		const row = document.createElement('tr')
		const cell = document.createElement('td')
		cell.colSpan = 5
		cell.textContent = 'Ошибка при загрузке данных.'
		cell.style.textAlign = 'center'
		row.appendChild(cell)
		tableBody.appendChild(row)
	}
}

// Обработчики для кнопок
export async function confirmBooking(bookingId) {
	try {
		const response = await updateBookingStatus(bookingId, 'Confirmed')
		if (response.ok) {
			alert('Статус обновлен')
			loadPendingBookings()
			loadAllBookings()
		}
	} catch (error) {
		alert('Ошибка обновления статуса')
	}
}

export async function rejectBooking(bookingId) {
	try {
		const response = await updateBookingStatus(bookingId, 'Cancelled')
		if (response.ok) {
			alert('Статус обновлен')
			loadPendingBookings()
			loadAllBookings()
		}
	} catch (error) {
		alert('Ошибка обновления статуса')
	}
}

export function openTab(evt, tabName) {
	const tabcontents = document.querySelectorAll('.tabcontent')
	tabcontents.forEach(tab => tab.classList.remove('active'))

	const tablinks = document.querySelectorAll('.tablinks')
	tablinks.forEach(link => link.classList.remove('active'))

	document.getElementById(tabName).classList.add('active')
	evt.currentTarget.classList.add('active')
}

export async function exportUsersToWord() {
	try {
		const blob = await exportUsers()
		if (!blob) throw new Error('Пустой Blob')

		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'users_list.docx'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	} catch (error) {
		console.error('Ошибка при экспорте:', error)
		alert('Ошибка при генерации отчёта.')
	}
}

export async function exportVisitsToWord() {
	try {
		// Отправляем запрос на сервер для получения файла
		const response = await fetch('http://localhost:3000/admin/export-visits', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.error || 'Ошибка при генерации отчета')
		}

		// Получаем Blob из ответа
		const blob = await response.blob()

		// Создаем ссылку для скачивания
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'visits_report.docx'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	} catch (error) {
		console.error('Ошибка при экспорте визитов:', error)
		alert('Ошибка при генерации отчета о визитах.')
	}
}

// Функция экспорта статистики по услугам
export async function exportServicesStats() {
	try {

		// Формируем URL с параметрами
		let url = 'http://localhost:3000/export/services-stats'

		// Отправляем запрос
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.error || 'Ошибка при генерации отчета')
		}

		// Скачиваем файл
		const blob = await response.blob()
		const downloadUrl = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = downloadUrl
		a.download = 'services-stats.docx'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(downloadUrl)
	} catch (error) {
		console.error('Ошибка при экспорте статистики услуг:', error)
		alert('Ошибка при генерации отчета по услугам')
	}
}

// Функция экспорта статистики по записям
export async function exportBookingsStats() {
	try {
		const dateFrom = document.getElementById('dateFrom').value
		const dateTo = document.getElementById('dateTo').value

		// Формируем URL с параметрами
		let url = 'http://localhost:3000/export/bookings'
		const params = new URLSearchParams()

		if (dateFrom) params.append('dateFrom', dateFrom)
		if (dateTo) params.append('dateTo', dateTo)

		if (params.toString()) url += `?${params.toString()}`

		// Отправляем запрос
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.error || 'Ошибка при генерации отчета')
		}

		// Скачиваем файл
		const blob = await response.blob()
		const downloadUrl = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = downloadUrl
		a.download = 'bookings-stats.docx'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(downloadUrl)
	} catch (error) {
		console.error('Ошибка при экспорте статистики записей:', error)
		alert('Ошибка при генерации отчета по записям')
	}
}

document
	.getElementById('exportToWord')
	?.addEventListener('click', exportUsersToWord)
document
	.getElementById('exportVisitsToWord')
	?.addEventListener('click', exportVisitsToWord)
document
	.getElementById('exportServicesStats')
	?.addEventListener('click', exportServicesStats)
document
	.getElementById('exportBookingsStats')
	?.addEventListener('click', exportBookingsStats)
window.confirmBooking = confirmBooking
window.rejectBooking = rejectBooking
window.openTab = openTab
