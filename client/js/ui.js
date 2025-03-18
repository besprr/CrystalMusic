export const updateButtonsAfterAuth = isAuthenticated => {
	const authButton = document.querySelector('.header__button.auth')
	const regButton = document.querySelector('.header__button.reg')
	const logoutButton = document.querySelector('.header__button.logout')
	const bookButton = document.querySelector('.hero__button.button')
	const adminButton = document.querySelector('.header__admin-button')

	if (isAuthenticated) {
		authButton.style.display = 'none'
		regButton.style.display = 'none'
		logoutButton.style.display = 'inline-block'
		bookButton.style.display = 'inline-block'
	} else {
		authButton.style.display = 'inline-block'
		regButton.style.display = 'inline-block'
		logoutButton.style.display = 'none'
		bookButton.style.display = 'none'
	}

	if (localStorage.getItem('roleId') === '1') {
		adminButton.style.display = 'inline-block'
	} else {
		adminButton.style.display = 'none'
	}
}

export const setupUI = () => {
	const authButton = document.querySelector('.header__button.auth')
	const regButton = document.querySelector('.header__button.reg')
	const authOverlay = document.getElementById('auth-overlay')
	const regOverlay = document.getElementById('reg-overlay')

	authButton.addEventListener('click', () => {
		authOverlay.showModal()
	})

	regButton.addEventListener('click', () => {
		regOverlay.showModal()
	})

	authOverlay.addEventListener('close', () => {
		authOverlay.querySelector('.auth-input').value = ''
	})

	regOverlay.addEventListener('close', () => {
		regOverlay.querySelector('.reg-input').value = ''
	})
}
