const express = require('express');
const app = express();
const fs = require('fs');

app.use(express.static('public'));
app.use(express.json());

app.get('/folder_data/:folderName', (req, res) => {
	const folderName = req.params.folderName;
	let files = {};
	fs.readdirSync(`./public/${folderName}`).forEach(file => {
		let fileData = fs.readFileSync(`./public/${folderName}/${file}`);
		files[file] = fileData.toString();
	});
	res.end(JSON.stringify(files));
});

app.get('/', (req, res) => {
	res.end(fs.readFileSync('public/index.html'));
});

app.get('*', (req, res) => {
	res.end('404 page not found');
});

app.listen(8000, () => {
	console.log('server running');
});