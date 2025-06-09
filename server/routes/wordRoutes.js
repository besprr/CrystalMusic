const express = require('express')
const router = express.Router()
const { queryDatabase } = require('../config/db')
const {
	Document,
	Paragraph,
	Table,
	TableRow,
	TableCell,
	Header,
	Footer,
	AlignmentType,
	BorderStyle,
	Packer,
} = require('docx')
const fs = require('fs')
const path = require('path')

// 📄 Экспорт всех записей (Bookings)
router.get('/bookings', async (req, res) => {
	try {
		const { dateFrom, dateTo } = req.query

		let query = `
            SELECT b.BookingID, u.FullName, s.ServiceName, r.RoomName, b.StartTime, b.EndTime, b.Status
            FROM Bookings b
            JOIN Users u ON b.UserID = u.UserID
            JOIN Services s ON b.ServiceID = s.ServiceID
            JOIN Rooms r ON b.RoomID = r.RoomID
            WHERE 1=1
        `

		const params = []
		if (dateFrom) {
			query += ' AND b.StartTime >= ?'
			params.push(dateFrom)
		}
		if (dateTo) {
			query += ' AND b.EndTime <= ?'
			params.push(dateTo)
		}

		const result = await queryDatabase(query, [...params])

		const doc = new Document({
			sections: [
				{
					children: [
						new Paragraph({ text: 'Отчет по записям', heading: 'Heading1' }),
						new Table({
							rows: [
								new TableRow({
									children: [
										'ID',
										'Пользователь',
										'Услуга',
										'Комната',
										'Начало',
										'Конец',
										'Статус',
									].map(
										text => new TableCell({ children: [new Paragraph(text)] })
									),
								}),
								...result.map(
									r =>
										new TableRow({
											children: [
												r.BookingID,
												r.FullName,
												r.ServiceName,
												r.RoomName,
												new Date(r.StartTime).toLocaleString(),
												new Date(r.EndTime).toLocaleString(),
												r.Status,
											].map(
												cell =>
													new TableCell({
														children: [new Paragraph(String(cell))],
													})
											),
										})
								),
							],
						}),
					],
				},
			],
		})

		const buffer = await Packer.toBuffer(doc)
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=bookings-report.docx'
		)
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		)
		res.send(buffer)
	} catch (err) {
		console.error(err)
		res.status(500).send('Ошибка при создании отчета')
	}
})

// 📄 Экспорт визитов
router.get('/visits', async (req, res) => {
	try {
		const result = await queryDatabase(`
            SELECT VisitID, UserHash, FirstVisitDate, LastVisitDate
            FROM Visits
        `)

		const doc = new Document({
			sections: [
				{
					children: [
						new Paragraph({ text: 'Отчет по визитам', heading: 'Heading1' }),
						new Table({
							rows: [
								new TableRow({
									children: [
										'ID',
										'Хеш пользователя',
										'Первый визит',
										'Последний визит',
									].map(
										text => new TableCell({ children: [new Paragraph(text)] })
									),
								}),
								...result.map(
									r =>
										new TableRow({
											children: [
												r.VisitID,
												r.UserHash,
												new Date(r.FirstVisitDate).toLocaleDateString(),
												new Date(r.LastVisitDate).toLocaleDateString(),
											].map(
												cell =>
													new TableCell({
														children: [new Paragraph(String(cell))],
													})
											),
										})
								),
							],
						}),
					],
				},
			],
		})

		const buffer = await Packer.toBuffer(doc)
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=visits-report.docx'
		)
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		)
		res.send(buffer)
	} catch (err) {
		console.error(err)
		res.status(500).send('Ошибка при создании отчета')
	}
})

// 📄 Экспорт статистики по услугам
router.get('/services-stats', async (req, res) => {
	try {
		const query = `
            SELECT 
                s.ServiceID,
                s.ServiceName,
                COUNT(b.BookingID) AS BookingCount
            FROM Services s
            LEFT JOIN Bookings b ON s.ServiceID = b.ServiceID
            GROUP BY s.ServiceID, s.ServiceName
        `

		const result = await queryDatabase(query)

		const doc = new Document({
			sections: [
				{
					properties: {
						titlePage: true,
					},
					headers: {
						default: new Header({
							children: [
								new Paragraph({
									text: 'CrystalMusic',
									alignment: AlignmentType.RIGHT,
									style: 'Header',
									spacing: { after: 100 },
									border: {
										bottom: {
											style: BorderStyle.SINGLE,
											size: 8,
											color: '000000',
										},
									},
								}),
							],
						}),
					},
					children: [
						new Paragraph({
							text: 'CrystalMusic',
							heading: 'Title',
							alignment: AlignmentType.CENTER,
							spacing: { before: 500, after: 300 },
						}),
						new Paragraph({
							text: 'Статистика по услугам',
							heading: 'Heading1',
							alignment: AlignmentType.CENTER,
							spacing: { after: 400 },
						}),
						new Paragraph({
							text: `Отчет сгенерирован: ${new Date().toLocaleDateString()}`,
							alignment: AlignmentType.CENTER,
							style: 'Subtitle',
							spacing: { after: 600 },
						}),
						new Paragraph({
							text: 'Период: за всё время',
							heading: 'Heading2',
							spacing: { after: 200 },
							pageBreakBefore: true,
						}),
						new Table({
							rows: [
								new TableRow({
									children: ['ID услуги', 'Название', 'Количество записей'].map(
										text => new TableCell({ children: [new Paragraph(text)] })
									),
								}),
								...result.map(
									r =>
										new TableRow({
											children: [
												r.ServiceID,
												r.ServiceName,
												r.BookingCount,
											].map(
												cell =>
													new TableCell({
														children: [new Paragraph(String(cell))],
													})
											),
										})
								),
							],
						}),
					],
				},
			],
		})

		const buffer = await Packer.toBuffer(doc)
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=services-stats.docx'
		)
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		)
		res.send(buffer)
	} catch (err) {
		console.error('Ошибка при создании отчета по услугам:', err)
		res.status(500).send('Ошибка при создании отчета по услугам')
	}
})

router.get('/employees-stats', async (req, res) => {
	try {
		const query = `
            SELECT 
                e.EmployeeID,
                e.FullName AS EmployeeName,
                e.Position,
                COUNT(b.BookingID) AS BookingCount,
                SUM(DATEDIFF(MINUTE, b.StartTime, b.EndTime)) AS TotalMinutes
            FROM Employees e
            LEFT JOIN Rooms r ON r.EmployeeID = e.EmployeeID
            LEFT JOIN Bookings b ON b.RoomID = r.RoomID
            GROUP BY e.EmployeeID, e.FullName, e.Position
            ORDER BY BookingCount DESC
        `

		const result = await queryDatabase(query)

		// Создаем документ Word
		const doc = new Document({
			sections: [
				{
					properties: {
						titlePage: true,
					},
					headers: {
						default: new Header({
							children: [
								new Paragraph({
									text: 'CrystalMusic',
									alignment: AlignmentType.RIGHT,
									style: 'Header',
									spacing: { after: 100 },
									border: {
										bottom: {
											style: BorderStyle.SINGLE,
											size: 8,
											color: '000000',
										},
									},
								}),
							],
						}),
					},
					children: [
						// Титульная страница
						new Paragraph({
							text: 'CrystalMusic',
							heading: 'Title',
							alignment: AlignmentType.CENTER,
							spacing: { before: 500, after: 300 },
						}),
						new Paragraph({
							text: 'Статистика занятости сотрудников',
							heading: 'Heading1',
							alignment: AlignmentType.CENTER,
							spacing: { after: 400 },
						}),
						new Paragraph({
							text: `Отчет сгенерирован: ${new Date().toLocaleDateString()}`,
							alignment: AlignmentType.CENTER,
							style: 'Subtitle',
							spacing: { after: 600 },
						}),

						// Основное содержимое
						new Paragraph({
							text: '1. Общая статистика',
							heading: 'Heading2',
							pageBreakBefore: true,
						}),

						// Таблица с данными
						new Table({
							rows: [
								new TableRow({
									children: [
										'ID',
										'Сотрудник',
										'Должность',
										'Кол-во записей',
										'Часы работы',
									].map(
										text => new TableCell({ children: [new Paragraph(text)] })
									),
								}),
								...result.map(
									r =>
										new TableRow({
											children: [
												r.EmployeeID,
												r.EmployeeName,
												r.Position,
												r.BookingCount || 0,
												Math.round(((r.TotalMinutes || 0) / 60) * 10) / 10,
											].map(
												cell =>
													new TableCell({
														children: [new Paragraph(String(cell))],
													})
											),
										})
								),
							],
						}),
					],
				},
			],
			styles: {
				paragraphStyles: [
					{
						id: 'Header',
						name: 'Header Style',
						run: {
							size: 24,
							bold: true,
							color: '2F5496',
						},
					},
					{
						id: 'Title',
						name: 'Report Title',
						run: {
							size: 36,
							bold: true,
							color: '2F5496',
						},
					},
				],
			},
		})

		const buffer = await Packer.toBuffer(doc)
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=employees-stats.docx'
		)
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		)
		res.send(buffer)
	} catch (err) {
		console.error('Ошибка:', err)
		res.status(500).send('Ошибка при создании отчета')
	}
})

module.exports = router
