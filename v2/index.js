const express = require('express');
const app = express();
const fs = require('fs');

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
	res.end(fs.readFileSync('public/index.html'));
});

app.get('*', (req, res) => {
	res.end('404 page not found');
});

app.listen(8080, () => {
	console.log('server running: port 8080');
});