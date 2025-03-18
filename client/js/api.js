const API_URL = 'http://localhost:3000'

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
    credentials: 'include',
  })
  return response
}

export const loginUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
    credentials: 'include',
  })
  return response
}

export const createRecord = async (recordData, token) => {
  const response = await fetch(`${API_URL}/records/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(recordData),
  })
  return response
}


export const getBookings = async (status = null) => {
  const token = localStorage.getItem('token');
  let url = `${API_URL}/admin/bookings`;
  
  if (status) {
    url += `?status=${encodeURIComponent(status)}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include'
    });

    // Проверяем статус ответа
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка загрузки данных');
    }

    const data = await response.json();
    return data; // Возвращаем данные напрямую

  } catch (error) {
    console.error('Ошибка API (getBookings):', error);
    throw error; // Пробрасываем ошибку для обработки в компонентах
  }
};

export const getUsers = async (token) => {
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