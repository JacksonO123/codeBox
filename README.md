# codeBox

### Codebox is an interactive text editor with syntax highlighting

<br>

## Getting Started

- Apply the provided `style.css` in the header, and `codebox.js` at the end of the body.
- The code-box will fit whatever container it is put into

---

## Managing Files

For files to be shown and saved in the codebox include the following code in a node server

Some of the code is optional, the api methods that must be present for saving and showing files are:

- `/folder_data`
  - serve the files
- `/save_file`
  - save a file to the codebox (only if only if savable is true)

Example:

```javascript
const express = require('express');
const app = express();
const fs = require('fs');

app.use(express.urlencoded({ extended: false }));
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
