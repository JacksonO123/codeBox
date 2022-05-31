# codeBox

### Codebox is an interactive text editor with syntax highlighting

codebox v2 aims to get rid of the problems found in codebox v1 by changing the way it works fundementally

<br>

## Getting Started

- Apply the provided `style.css`, and `codebox.js` in the header.
- The code-box will fit whatever container it is put into

_in development_

<!-- --- -->

<!-- ## Managing Files

For files to be shown and saved in the codebox include the following code in a node server

Some of the code is optional, the api methods that **must** to be present are:

- `/folder_data`
  - serve the files
- `/add_file`
  - add a file to the codebox (only if editable is true)
- `/save_file`
  - save a file to the codebox (only if only if savable is true)

```
const express = require('express');
const app = express();
const fs = require('fs');

app.use(express.static('public'));
app.use(express.json());

// folder name to be used for storing files
let folderName = '';

// get folder data as a JSON object
app.get('/folder_data/:folderName', (req, res) => {
  folderName = req.params.folderName;
  let files = {};
  fs.readdirSync(`./public/${folderName}`).forEach((file) => {
    let fileData = fs.readFileSync(`./public/${folderName}/${file}`);
    files[file] = fileData.toString();
  });
  res.end(JSON.stringify(files));
});

// add a file
app.get('/add_file/:newFileName', (req, res) => {
  if (folderName != '') {
    const newFileName = req.params.newFileName;
    fs.writeFileSync(`./public/${folderName}/${newFileName}`, '');
  }
  res.end();
});

// save a file
app.post('/save_file', (req, res) => {
  const name = req.body.name;
  const content = JSON.parse(req.body.value);
  fs.writeFileSync(`./public/${folderName}/${name}`, content);
  res.redirect('/');
  res.end();
});

// serve main index.html file
app.get('/', (req, res) => {
  res.end(fs.readFileSync('public/index.html'));
});

app.get('*', (req, res) => {
  res.end('404 page not found');
});

app.listen(8000, () => {
  console.log('server running: http://localhost:8000');
});
```

- To attach files to show up in the codebox, make a folder in the `/public` folder with the files to be shown in the codebox, then add the folder's name to the `folder` attribute in the code-box element.
- Set the `editable` attribute to `true` or `false` to set weather the code box should be editable (true by default).
- To add the ability to save files, set the `savable` attribute to `true` or `false` (false by default).

_does not apply to codebox v2_ -->