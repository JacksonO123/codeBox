const express = require('express');
const app = express();
const fs = require('fs');

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
	res.end(fs.readFileSync('public/index.html'));
});

app.listen(8000, () => {
	console.log('server running');
});