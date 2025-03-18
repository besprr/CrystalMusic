import { openAdminPanel } from './admin.js'; // Импортируем openAdminPanel
import { setupAuth } from './auth.js'
import { setupRecords } from './records.js'
import { setupUI, updateButtonsAfterAuth } from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
  setupUI()
  setupAuth()
  setupRecords()

  // Проверка статуса авторизации при загрузке страницы
  const token = localStorage.getItem('token')
  updateButtonsAfterAuth(!!token)

  // Показываем кнопку админ-панели, если пользователь — администратор
  const roleId = localStorage.getItem('roleId')
  const adminButton = document.querySelector('.header__admin-button')
  if (roleId === '1') {
    adminButton.style.display = 'inline-block'
    adminButton.addEventListener('click', openAdminPanel) // Используем openAdminPanel
  }
})