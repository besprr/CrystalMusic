import { cancelUserBooking, getUserBookings } from './api.js'

export function initUserCabinet() {
	const userCabinetBtn = document.querySelector('.header__cabinet-button')
	if (userCabinetBtn) {
		userCabinetBtn.addEventListener('click', openUserCabinet)
	}
}

export function openUserCabinet() {
	const dialog = document.getElementById('userCabinetDialog')

	document.getElementById('userFullName').textContent =
		localStorage.getItem('userName')
	document.getElementById('userEmail').textContent =
		localStorage.getItem('userEmail')
	document.getElementById('userRegDate').textContent = new Date(
		localStorage.getItem('regDate')
	).toLocaleDateString()

	loadUserBookings()
	dialog.style.display = 'flex'
	dialog.showModal()
}

export function closeUserCabinet() {
  const dialog = document.getElementById('userCabinetDialog');
	dialog.close()
	dialog.style.display = 'none'
}

async function loadUserBookings() {
	try {
		const userId = localStorage.getItem('userId')
		if (!userId) throw new Error('User ID не найден')

		const bookings = await getUserBookings(userId)
		renderBookings(bookings)
	} catch (error) {
		console.error('Ошибка загрузки записей:', error)
		alert('Ошибка загрузки записей: ' + error.message)
	}
}

function renderBookings(bookings) {
	const tbody = document.getElementById('userBookingsTable')
	tbody.innerHTML = ''
	if (!bookings || bookings.length === 0) {
		const tr = document.createElement('tr')
		const td = document.createElement('td')
		td.colSpan = 6
		td.textContent = 'Нет записей бронирований.'
		td.style.textAlign = 'center'
		tr.appendChild(td)
		tbody.appendChild(tr)
		return
	}

	bookings.forEach(booking => {
		const tr = document.createElement('tr')

		const serviceTd = document.createElement('td')
		serviceTd.textContent = booking.ServiceName
		tr.appendChild(serviceTd)

		const roomTd = document.createElement('td')
		roomTd.textContent = booking.RoomName
		tr.appendChild(roomTd)


		const start = new Date(booking.StartTime)
		const end = new Date(booking.EndTime)

		const dateTd = document.createElement('td')
		dateTd.textContent = start.toLocaleDateString() 
		tr.appendChild(dateTd)

		const timeTd = document.createElement('td')
		timeTd.textContent = `${start.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
		tr.appendChild(timeTd)

		const statusTd = document.createElement('td')
		statusTd.textContent = booking.Status
		tr.appendChild(statusTd)

		const actionsTd = document.createElement('td')
		const cancelBtn = document.createElement('button')
		cancelBtn.textContent = 'Отменить'
		cancelBtn.onclick = () => cancelBooking(booking.BookingID)
		actionsTd.appendChild(cancelBtn)
		tr.appendChild(actionsTd)

		tbody.appendChild(tr)
	})
}

export async function cancelBooking(bookingId) {
	if (!confirm('Вы уверены, что хотите отменить эту запись?')) return

	try {
		const userId = localStorage.getItem('userId')
		await cancelUserBooking(bookingId, userId)
		alert('Запись успешно отменена')
		loadUserBookings()
	} catch (error) {
		console.error('Ошибка:', error)
		alert('Не удалось отменить запись')
	}
}

window.userCabinet = {
	openUserCabinet,
	closeUserCabinet,
	cancelBooking,
}
