const API_URL = 'http://localhost:3000'

export const registerUser = async userData => {
	const response = await fetch(`${API_URL}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(userData),
		credentials: 'include',
	})
	return response
}

export const loginUser = async userData => {
	const response = await fetch(`${API_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(userData),
		credentials: 'include',
	})
	return response
}

export const createRecord = async (recordData, token) => {
	console.log('Отправляемые данные в createRecord:', recordData)

	try {
		const response = await fetch(`${API_URL}/records/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			credentials: 'include',
			body: JSON.stringify(recordData),
		})

		console.log('Статус ответа:', response.status)

		if (!response.ok) {
			const errorData = await response.json()
			console.error('Ошибка от сервера:', errorData)
			throw new Error(errorData.error || 'Неизвестная ошибка')
		}

		console.log('Ответ сервера:', await response.json())
		return response
	} catch (error) {
		console.error('Ошибка API (createRecord):', error)
		throw error
	}
}

export const getBookings = async (status = null) => {
	const token = localStorage.getItem('token')
	let url = `${API_URL}/admin/bookings`

	if (status) {
		url += `?status=${encodeURIComponent(status)}`
	}

	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			credentials: 'include',
		})

		// Проверяем статус ответа
		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.error || 'Ошибка загрузки данных')
		}

		const data = await response.json()
		return data // Возвращаем данные напрямую
	} catch (error) {
		console.error('Ошибка API (getBookings):', error)
		throw error // Пробрасываем ошибку для обработки в компонентах
	}
}

export const getRejectedBookings = async token => {
	const response = await fetch(`${API_URL}/admin/rejected-bookings`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	return response
}

export const getUsers = async token => {
	const response = await fetch(`${API_URL}/admin/users`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return response
}

export const updateBookingStatus = async (bookingId, status, token) => {
	const response = await fetch(`${API_URL}/admin/bookings/${bookingId}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ status }),
	})
	return response
}

export const exportUsers = async () => {
	const token = localStorage.getItem('token')
	try {
		const response = await fetch(`${API_URL}/admin/export-users`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.error || 'Ошибка при генерации отчёта')
		}

		return response.blob()
	} catch (error) {
		console.error('Ошибка API (exportUsers):', error)
		throw error
	}
}

export const fetchWithAuth = async (url, options = {}) => {
	let response = await fetch(`${API_URL}${url}`, {
		...options,
		headers: {
			...options.headers,
			Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
		},
	})

	if (response.status === 401) {
		const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
		})

		if (refreshResponse.ok) {
			const { accessToken } = await refreshResponse.json()
			localStorage.setItem('accessToken', accessToken)

			response = await fetch(`${API_URL}${url}`, {
				...options,
				headers: {
					...options.headers,
					Authorization: `Bearer ${accessToken}`,
				},
			})
		} else {
			localStorage.removeItem('accessToken')
			window.location.href = '/login'
			return Promise.reject(new Error('Unauthorized'))
		}
	}

	return response
}

export const getCategories = async () => {
	const token = localStorage.getItem('token')
	try {
		const response = await fetch(`${API_URL}/records/categories`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.error || 'Ошибка загрузки категорий')
		}

		const data = await response.json()
		return data.categories
	} catch (error) {
		console.error('Ошибка API (getCategories):', error)
		throw error
	}
}

export const getBookedDates = async () => {
	const token = localStorage.getItem('token')
	try {
		const response = await fetch(`${API_URL}/bookings/booked-dates`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.error || 'Ошибка загрузки занятых дат')
		}

		const data = await response.json()
		return data.bookedDates
	} catch (error) {
		console.error('Ошибка API (getBookedDates):', error)
		throw error
	}
}

export async function getUserBookings(userId) {
	try {
		const response = await fetch(`${API_URL}/user/bookings?userId=${userId}`)
		if (!response.ok) {
			throw new Error('Ошибка загрузки записей')
		}
		const data = await response.json()
		return data
	} catch (error) {
		console.error('Ошибка в getUserBookings:', error)
		throw error
	}
}

export const cancelUserBooking = async (bookingId, userId) => {
	const response = await fetch(`${API_URL}/user/bookings/${bookingId}/cancel`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
		body: JSON.stringify({ userId }),
	})

	if (!response.ok) throw new Error('Ошибка отмены записи')
	return response.json()
}
