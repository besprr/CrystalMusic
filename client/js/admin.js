import { getBookings, getUsers, updateBookingStatus } from './api.js'

export function openAdminPanel() {
	const adminPanelDialog = document.getElementById('adminPanelDialog')
	adminPanelDialog.showModal()
	document.querySelector('.tablinks').click()
	loadAdminData()
}

// Функция для закрытия админ-панели
export function closeAdminPanel() {
	const adminPanelDialog = document.getElementById('adminPanelDialog')
	adminPanelDialog.close()
}

// Загрузка всех данных при открытии панели
async function loadAdminData() {
	try {
		await loadUsers()
		await loadAllBookings() // Загружаем все бронирования
		await loadPendingBookings()
	} catch (error) {
		console.error('Ошибка загрузки данных:', error)
		alert('Ошибка загрузки данных')
	}
}

// Загрузка всех бронирований
async function loadAllBookings() {
  try {
    const data = await getBookings(); // Получаем данные
    console.log('Данные всех бронирований:', data); // Лог для отладки

    // Проверка данных
    if (!data || !Array.isArray(data.bookings)) {
      throw new Error('Некорректные данные с сервера');
    }

    const tbody = document.getElementById('allBookingsTableBody');
    tbody.innerHTML = '';

    data.bookings.forEach(booking => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${booking.UserName}</td>
        <td>${booking.RoomName}</td>
        <td>${booking.ServiceName}</td>
        <td>${new Date(booking.StartTime).toLocaleString()}</td>
        <td>${new Date(booking.EndTime).toLocaleString()}</td>
        <td>${booking.Status}</td>
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Ошибка загрузки всех бронирований:', error);
    alert('Ошибка загрузки данных. Проверьте консоль.');
  }
}

// Загрузка пользователей
async function loadUsers() {
  try {
    const response = await getUsers(localStorage.getItem('token'));
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка загрузки пользователей');
    }

    const users = await response.json();
    const searchInput = document.getElementById('searchUsers');
    const tbody = document.getElementById('usersTableBody');

    const filterUsers = (searchText) => {
      tbody.innerHTML = '';
      const filteredUsers = users.filter(user => 
        user.FullName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.Email.toLowerCase().includes(searchText.toLowerCase())
      );

      filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.UserID}</td>
          <td>${user.FullName}</td>
          <td>${user.Email}</td>
          <td>${new Date(user.RegistrationDate).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
      });
    };

    searchInput.addEventListener('input', (e) => filterUsers(e.target.value));
    filterUsers('');

  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    alert('Ошибка загрузки пользователей. Проверьте консоль.');
  }
}

// Загрузка ожидающих бронирований
async function loadPendingBookings() {
  try {
    const data = await getBookings('Pending');
    console.log('Данные ожидающих бронирований:', data); // Лог для отладки

    // Проверка данных
    if (!data || !Array.isArray(data.bookings)) {
      throw new Error('Некорректные данные с сервера');
    }

    const tbody = document.getElementById('pendingBookingsTableBody');
    tbody.innerHTML = '';

    data.bookings.forEach(booking => {
      const row = document.createElement('tr');
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
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Ошибка загрузки ожидающих бронирований:', error);
    alert('Ошибка загрузки данных. Проверьте консоль.');
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

// Добавляем функции в глобальную область видимости
window.confirmBooking = confirmBooking
window.rejectBooking = rejectBooking
window.openTab = openTab
