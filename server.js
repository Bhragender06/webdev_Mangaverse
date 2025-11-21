const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

const DEFAULT_USER = {
	username: 'mangaverse',
	email: 'support@mangaverse.app',
	password: 'MangaVerse@123',
	phone: 'N/A',
	gender: 'N/A',
};

app.use(cors());
app.use(bodyParser.json());

// Serve static files so you can open the site at http://localhost:3000
app.use(express.static(__dirname));

// Absolute path to the Excel file (update if you relocate the project)
const EXCEL_PATH = path.resolve('C:/Users/BHRAGENENDER KUMAR/Downloads/manga verse/manga verse/registration.xlsx');

function ensureWorkbookWithHeader() {
	let workbook;
	if (fs.existsSync(EXCEL_PATH)) {
		workbook = XLSX.readFile(EXCEL_PATH);
	} else {
		workbook = XLSX.utils.book_new();
		const headerSheet = XLSX.utils.aoa_to_sheet([
			[
				'Username',
				'Email',
				'Phone',
				'Gender',
				'Password',
				'Full Name',
				'Birth Date',
				'Reading Level',
				'Genres',
				'Newsletter',
				'Timestamp',
			],
		]);
		XLSX.utils.book_append_sheet(workbook, headerSheet, 'Registrations');
	}

	const sheetName = workbook.SheetNames[0] || 'Registrations';
	let worksheet = workbook.Sheets[sheetName];
	if (!worksheet) {
		worksheet = XLSX.utils.aoa_to_sheet([
			[
				'Username',
				'Email',
				'Phone',
				'Gender',
				'Password',
				'Full Name',
				'Birth Date',
				'Reading Level',
				'Genres',
				'Newsletter',
				'Timestamp',
			],
		]);
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
	}

	return { workbook, sheetName, worksheet };
}

function appendRegistrationRow(userData) {
	const {
		username,
		email,
		phone,
		gender,
		password,
		fullName,
		birthDate,
		readingLevel,
		genres,
		newsletter,
	} = userData;

	const { workbook, sheetName, worksheet } = ensureWorkbookWithHeader();

	const newRow = [
		username || '',
		email || '',
		phone || '',
		gender || '',
		password || '',
		fullName || '',
		birthDate || '',
		readingLevel || '',
		Array.isArray(genres) ? genres.join(', ') : genres || '',
		newsletter ? 'Yes' : 'No',
		new Date().toISOString()
	];

	const existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
	existingData.push(newRow);
	const newSheet = XLSX.utils.aoa_to_sheet(existingData);
	workbook.Sheets[sheetName] = newSheet;
	XLSX.writeFile(workbook, EXCEL_PATH);
}

function findUserRecord(identifier) {
	if (!identifier) {
		console.log('findUserRecord: No identifier provided');
		return null;
	}

	if (!fs.existsSync(EXCEL_PATH)) {
		console.log('findUserRecord: Excel file does not exist at', EXCEL_PATH);
		return null;
	}

	try {
		const workbook = XLSX.readFile(EXCEL_PATH);
		const sheetName = workbook.SheetNames[0];
		if (!sheetName) {
			console.log('findUserRecord: No sheet found in workbook');
			return null;
		}

		const worksheet = workbook.Sheets[sheetName];
		if (!worksheet) {
			console.log('findUserRecord: Worksheet is empty');
			return null;
		}

		// Read all rows including header
		const allRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });
		
		// Skip header row (first row)
		if (allRows.length <= 1) {
			console.log('findUserRecord: Excel file has no data rows (only header)');
			return null;
		}

		// Get header row to map column names
		const headers = allRows[0];
		const usernameIndex = headers.findIndex(h => 
			(h && h.toString().toLowerCase().includes('username'))
		);
		const emailIndex = headers.findIndex(h => 
			(h && h.toString().toLowerCase().includes('email'))
		);
		const passwordIndex = headers.findIndex(h => 
			(h && h.toString().toLowerCase().includes('password'))
		);

		if (usernameIndex === -1 || emailIndex === -1 || passwordIndex === -1) {
			console.log('findUserRecord: Required columns not found. Headers:', headers);
			// Fallback: try with standard column names
			const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
			const normalized = identifier.trim().toLowerCase();

			const found = rows.find((row) => {
				const username = (row.Username || row.username || '').toString().trim().toLowerCase();
				const email = (row.Email || row.email || '').toString().trim().toLowerCase();
				return username === normalized || email === normalized;
			});

			if (found) {
				console.log('findUserRecord: Found user using fallback method');
			}
			return found || null;
		}

		// Search through data rows
		const normalized = identifier.trim().toLowerCase();
		for (let i = 1; i < allRows.length; i++) {
			const row = allRows[i];
			const username = (row[usernameIndex] || '').toString().trim().toLowerCase();
			const email = (row[emailIndex] || '').toString().trim().toLowerCase();

			if (username === normalized || email === normalized) {
				// Build record object matching expected format
				const record = {
					Username: row[usernameIndex] || '',
					Email: row[emailIndex] || '',
					Password: row[passwordIndex] || '',
					Phone: row[headers.findIndex(h => h && h.toString().toLowerCase().includes('phone'))] || '',
					Gender: row[headers.findIndex(h => h && h.toString().toLowerCase().includes('gender'))] || '',
				};
				console.log('findUserRecord: Found matching user:', record.Username || record.Email);
				return record;
			}
		}

		console.log('findUserRecord: No matching user found for:', identifier);
		return null;
	} catch (error) {
		console.error('findUserRecord: Error reading Excel file:', error);
		return null;
	}
}

app.post('/api/register', (req, res) => {
	const {
		username,
		email,
		phone,
		gender,
		password,
		fullName,
		birthDate,
		readingLevel,
		genres = '',
		newsletter = false,
	} = req.body || {};

	if (!username || !email || !phone || !gender || !password) {
		return res.status(400).json({ success: false, message: 'Missing required fields' });
	}
	try {
		appendRegistrationRow({
			username,
			email,
			phone,
			gender,
			password,
			fullName,
			birthDate,
			readingLevel,
			genres,
			newsletter,
		});
		return res.json({ success: true });
	} catch (err) {
		console.error('Failed to append to Excel:', err);
		return res.status(500).json({ success: false, message: 'Failed to save registration' });
	}
});

app.post('/api/login', (req, res) => {
	const { usernameOrEmail, password } = req.body || {};

	console.log('Login attempt for:', usernameOrEmail);

	if (!usernameOrEmail || !password) {
		console.log('Login failed: Missing credentials');
		return res
			.status(400)
			.json({ success: false, message: 'Username/email and password are required' });
	}

	const record = findUserRecord(usernameOrEmail);

	if (!record) {
		console.log('User not found in Excel, checking default user...');
		const normalized = usernameOrEmail.trim().toLowerCase();
		const matchesDefault =
			normalized === DEFAULT_USER.username.toLowerCase() ||
			normalized === DEFAULT_USER.email.toLowerCase();

		if (!matchesDefault || DEFAULT_USER.password !== password) {
			console.log('Login failed: Invalid default credentials');
			return res.status(401).json({
				success: false,
				message: 'Account not found. Please check your credentials or register.',
			});
		}

		console.log('Login successful: Using default user');
		return res.json({
			success: true,
			user: {
				username: DEFAULT_USER.username,
				email: DEFAULT_USER.email,
				phone: DEFAULT_USER.phone,
				gender: DEFAULT_USER.gender,
				lastLogin: new Date().toISOString(),
			},
		});
	}

	const storedPassword = (record.Password || '').toString().trim();
	const providedPassword = password.trim();

	console.log('Comparing passwords. Stored length:', storedPassword.length, 'Provided length:', providedPassword.length);

	if (storedPassword !== providedPassword) {
		console.log('Login failed: Password mismatch');
		return res
			.status(401)
			.json({ success: false, message: 'Invalid username or password' });
	}

	console.log('Login successful: User authenticated from Excel');
	return res.json({
		success: true,
		user: {
			username: record.Username || '',
			email: record.Email || '',
			phone: record.Phone || '',
			gender: record.Gender || '',
			lastLogin: new Date().toISOString(),
		},
	});
});

app.listen(PORT, () => {
	console.log(`MangaVerse server running at http://localhost:${PORT}`);
});


