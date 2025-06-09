export async function setupEmployeesSection() {
	try {
		const response = await fetch('http://localhost:3000/export/employees-stats')
		const blob = await response.blob()

		const downloadLink = document.createElement('a')
		downloadLink.href = URL.createObjectURL(blob)
		downloadLink.download = 'employees-stats.docx'
		document.body.appendChild(downloadLink)
		downloadLink.click()
		document.body.removeChild(downloadLink)
	} catch (error) {
		console.error('Ошибка при экспорте:', error)
		alert('Ошибка при экспорте отчета')
	}
}

export async function loadEmployees() {
	try {
		const res = await fetch('http://localhost:3000/admin/employees')

		const employees = await res.json()
		console.log('сотрудники', employees)

		const tbody = document.getElementById('employeesTableBody')
		tbody.innerHTML = ''

		employees.forEach(employee => {
			const row = document.createElement('tr')

			// Формируем текст для времени
			let timeText = 'Нет записей'
			if (employee.StartTime != null && employee.EndTime != null) {
				const startTime = employee.StartTime
				const endTime = employee.EndTime.split(' ')[1]
				timeText = `${startTime} - ${endTime}`
			}

			row.innerHTML = `
                <td>${employee.EmployeeName}</td>
                <td>${employee.Position}</td>
                <td>${timeText}</td>
            `

			tbody.appendChild(row)
		})
	} catch (error) {
		console.error(error)
	}
}
