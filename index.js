const express = require('express');
const app = express();
const fs = require('fs');

app.use(express.static('public'));
app.use(express.json());

let folderName = '';

app.get('/folder_data/:folderName', (req, res) => {
	folderName = req.params.folderName;
	let files = {};
	fs.readdirSync(`./public/${folderName}`).forEach(file => {
		let fileData = fs.readFileSync(`./public/${folderName}/${file}`);
		files[file] = fileData.toString();
	});
	res.end(JSON.stringify(files));
});

app.get('/add_file/:newFileName', (req, res) => {
	if (folderName != '') {
		const newFileName = req.params.newFileName;
		fs.writeFileSync(`./public/${folderName}/${newFileName}`, '');
	}
	res.end();
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