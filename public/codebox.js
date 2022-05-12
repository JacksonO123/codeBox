// document.head.innerHTML +=
//   '<script src="https://unpkg.com/axios/dist/axios.min.js"></script>';
const axiosImport = h('script');
axiosImport.setAttribute('src', 'https://unpkg.com/axios/dist/axios.min.js');
document.head.appendChild(axiosImport);

class HtmlSringElement {
  constructor(type) {
    this.type = type;
    this.classArr = [];
    this.before = `<${type}`;
    this.after = `</${type}>`;
    this.content = this.before + '>' + this.after;
  }
  finalize() {
    return this.content;
  }
  addClass(className) {
    this.classArr.push(className);
  }
  /**
   * @param {string} value
   */
  setContent(value) {
    const classes =
      this.classArr.length > 0 ? ` class="${this.classArr.join(' ')}">` : '>';
    this.content = this.before + classes + value + this.after;
  }
}

class CodeBox extends HTMLElement {
  constructor() {
    super();
    this.lines = 0;
    this.currentTabs = 0;
    this.lineEl = null;
    this.tabEl = null;
    this.contentEl = null;
    this.currentTab = null;
    this.editable = false;
    this.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    this.operators = '+-*/%^=<>';
    this.filesData = {};
    this.parens = [
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
      ['"', '"'],
      ["'", "'"],
      ['`', '`'],
    ];
    this.wordTypes = {
      util: [
        'function',
        'if',
        'else',
        'for',
        'while',
        'var',
        'const',
        'new',
        'class',
        'extends',
        'import',
        'export',
        'from',
        'as',
        'return',
        'break',
        'continue',
        'in',
        'of',
        'instanceof',
        'typeof',
        'let',
        'try',
        'catch',
        'finally',
        'throw',
        'yield',
        'await',
        'switch',
        'case',
      ],
    };
  }
  connectedCallback() {
    const tabs = h('div');
    this.tabEl = tabs;
    tabs.classList.add('codebox-tabs');

    const tabControlWrapper = h('div');
    tabControlWrapper.classList.add('tab-control-wrapper');

    const tabWrapper = h('div');
    this.tabEl = tabWrapper;
    tabWrapper.classList.add('tab-wrapper');

    tabControlWrapper.appendChild(tabWrapper);
    tabs.appendChild(tabControlWrapper);

    const controlWrapper = h('div');
    controlWrapper.classList.add('control-wrapper');
    tabs.appendChild(controlWrapper);

    const contentWrapper = h('div');
    contentWrapper.classList.add('codebox-content-wrapper');

    const lines = h('div');
    this.lineEl = lines;
    lines.classList.add('codebox-line-nums');

    const content = h('div');
    content.classList.add('codebox-content');

    const code = h('div');
    code.classList.add('codebox-code');

    content.appendChild(code);

    let editable = true;
    if (this.hasAttribute('editable')) {
      editable = parseBool(this.getAttribute('editable'));
    }
    this.editable = editable;

    contentWrapper.appendChild(lines);
    contentWrapper.appendChild(content);
    this.appendChild(tabs);
    this.appendChild(contentWrapper);

    const textarea = h('textarea');
    textarea.setAttribute('spellcheck', 'false');
    textarea.setAttribute('name', 'codeboxValue');
    textarea.setAttribute('id', 'codeboxValue');
    textarea.addEventListener('input', (e) => {
      if (!this.editable || this.currentFile == null) {
        e.preventDefault();
        return;
      }
      let start = textarea.selectionStart;
      let char = e.target.value[start - 1];
      let openParens = this.parens.map((item) => item[0]);
      if (openParens.includes(char)) {
        let parenIndex = openParens.indexOf(char);
        let closeParen = this.parens[parenIndex][1];
        textarea.value =
          textarea.value.substring(0, start) +
          closeParen +
          textarea.value.substring(start);
        this.textareaUpdate(code, textarea, textarea.value);
        textarea.setSelectionRange(start, start);
      } else {
        this.textareaUpdate(code, textarea, e.target.value);
      }
      this.filesData[this.currentFile] = textarea.value;
    });
    textarea.addEventListener('keydown', (e) => {
      if (!this.editable || this.currentFile == null) {
        e.preventDefault();
        return;
      }
      let start = textarea.selectionStart;
      let openParens = this.parens.map((item) => item[0]);
      let closeParens = this.parens.map((item) => item[1]);
      if (closeParens.includes(e.key) && textarea.value[start] == e.key) {
        e.preventDefault();
        textarea.setSelectionRange(start + 1, start + 1);
      } else if (e.key == 'Tab') {
        e.preventDefault();
        textarea.value =
          textarea.value.substring(0, start) +
          '\t' +
          textarea.value.substring(start);
        textarea.setSelectionRange(start + 1, start + 1);
        this.currentTabs++;
        this.textareaUpdate(code, textarea, textarea.value);
      } else if (e.key == 'Enter') {
        e.preventDefault();
        if (textarea.scrollTop - this.lines * 19.5 > 445) {
          textarea.scrollTo(0, this.lines * 19.5);
        }
        if (
          openParens.includes(textarea.value[start - 1]) &&
          closeParens.includes(textarea.value[start])
        ) {
          textarea.value =
            textarea.value.substring(0, start) +
            '\n' +
            '\t'.repeat(this.currentTabs + 1) +
            '\n' +
            '\t'.repeat(this.currentTabs) +
            textarea.value.substring(start);
          textarea.setSelectionRange(
            start + 2 + this.currentTabs,
            start + 2 + this.currentTabs
          );
        } else {
          textarea.value =
            textarea.value.substring(0, start) +
            '\n' +
            '\t'.repeat(this.currentTabs) +
            textarea.value.substring(start);
          textarea.setSelectionRange(
            start + 1 + this.currentTabs,
            start + 1 + this.currentTabs
          );
        }
        this.textareaUpdate(code, textarea, textarea.value);
      } else if (e.key == 'Backspace') {
        let end = textarea.selectionEnd;
        if (start == end && start > 0) {
          if (
            openParens.includes(textarea.value[start - 1]) &&
            closeParens.includes(textarea.value[start])
          ) {
            e.preventDefault();
            textarea.value =
              textarea.value.substring(0, start - 1) +
              textarea.value.substring(start + 1);
            textarea.setSelectionRange(start - 1, start - 1);
          } else {
            e.preventDefault();
            textarea.value =
              textarea.value.substring(0, start - 1) +
              textarea.value.substring(start);
            textarea.setSelectionRange(start - 1, start - 1);
          }
        }
        this.textareaUpdate(code, textarea, textarea.value);
      }
      const lineBefore = getLineTextBeforeCursor(textarea).split('');
      this.currentTabs = 0;
      for (let i = 0; i < lineBefore.length; i++) {
        if (lineBefore[i] == '\t') {
          this.currentTabs++;
        }
      }
      this.lines = textarea.value.split('\n').length - 1;
      this.updateLines();
      this.filesData[this.currentFile] = textarea.value;
    });
    textarea.addEventListener('scroll', (e) => {
      lines.scrollTo(0, e.target.scrollTop);
      code.scrollTo(0, e.target.scrollTop);
    });

    content.appendChild(textarea);

    if (this.hasAttribute('folder')) {
      const runButton = h('button');
      runButton.classList.add('ctrl-button');
      runButton.innerText = 'Run';
      runButton.onclick = () => {
        if (this.isValidJsFile(this.currentFile)) {
          this.run();
        } else {
          console.warn('File must be a valid js file to run');
        }
      };

      const saveButton = h('button');
      saveButton.classList.add('ctrl-button');
      saveButton.innerText = 'Save';
      saveButton.onclick = () => {
        this.save(textarea);
      };

      const addFileButton = h('button');
      addFileButton.classList.add('add-file-button');
      addFileButton.innerHTML = '<span>+</span>';
      addFileButton.onclick = () => {
        const newFileName = prompt('Enter file name')?.trim();
        if (newFileName != null) {
          if (newFileName == '') {
            alert('file name cannot be empty');
          } else if (!this.isValidFile(newFileName)) {
            alert('invalid file name. file name must have extension');
          } else {
            fetch(`/add_file/${newFileName}`).then(() => {
              this.tabEl.innerHTML = '';
              this.getFolderFiles(code, textarea);
            });
          }
        }
      };
      if (editable) {
        if (this.hasAttribute('savable')) {
          const canSave = parseBool(this.getAttribute('savable'));
          if (canSave) {
            controlWrapper.appendChild(saveButton);
          }
        }
        controlWrapper.appendChild(runButton);
        tabControlWrapper.appendChild(addFileButton);
      }
    }

    this.contentEl = content;

    this.getFolderFiles(code, textarea);

    this.updateLines();
  }
  save(input) {
    axios.post('/save_file', {
      name: this.currentFile,
      value: JSON.stringify(input.value),
    });
  }
  run() {
    eval(this.filesData[this.currentFile]);
  }
  getFolderFiles(code, textarea) {
    if (this.hasAttribute('folder')) {
      const folder = this.getAttribute('folder');
      fetch(`/folder_data/${folder}`)
        .then((res) => res.json())
        .then((data) => {
          this.filesData = data;
          Object.keys(data).forEach((key) => {
            this.addFile(key, data[key], code, textarea);
          });
        });
    }
  }
  addFile(fileName, fileData, code, textarea) {
    this.currentFile = fileName;
    const tab = h('div');
    tab.classList.add('tab');
    tab.innerHTML = fileName;
    tab.onclick = () => {
      this.currentFile = fileName;
      textarea.value = fileData;
      this.textareaUpdate(code, textarea, fileData);
      this.setTabFocused(fileName);
    };
    this.tabEl.appendChild(tab);
    this.setTabFocused(fileName);
    textarea.value = fileData;
    this.textareaUpdate(code, textarea, textarea.value);
  }
  setTabFocused(fileName) {
    let tempTabs = this.tabEl.children;
    for (let i = 0; i < tempTabs.length; i++) {
      if (tempTabs[i].innerText == fileName) {
        if (!tempTabs[i].classList.contains('focused')) {
          tempTabs[i].classList.add('focused');
        }
      } else {
        tempTabs[i].classList.remove('focused');
      }
    }
  }
  textareaUpdate(code, input, value) {
    const validJsFile = this.isValidJsFile(
      this.currentFile ? this.currentFile : ''
    );
    let codeLines = this.parseInputCode(value, validJsFile);
    code.innerHTML = codeLines;
    this.lines = input.value.split('\n').length - 1;
    this.updateLines();
  }
  isValidJsFile(fileName) {
    let valid = fileName.match(/\.js$/, 'i') ? true : false;
    return valid;
  }
  isValidFile(fileName) {
    let valid = fileName.match(/\.(\w+)$/, 'i') ? true : false;
    return valid;
  }
  parseInputCode(code, highlight) {
    let lines = code.split('\n');
    let finalLines = '';

    let inMultilineString = false;
    for (let i = 0; i < lines.length; i++) {
      const newLine = new HtmlSringElement('span');
      newLine.addClass('line');

      let lineData = '';
      let tokens = this.splitByChars(lines[i]);
      let inString = false;
      let inComment = false;
      let canCloseComment = false;
      let startString;
      const quotes = ["'", '"', '`'];
      for (let j = 0; j < tokens.length; j++) {
        if (tokens[j] == '\t') {
          lineData += '<span class="tab-space"></span>';
        } else if (!highlight) {
          lineData += `<span class="other">${tokens[j]}</span>`;
        } else if (inComment) {
          lineData += `<span class="comment">${tokens[j]}</span>`;
          if (tokens[j - 1] == '*' && tokens[j] == '/' && canCloseComment) {
            inComment = false;
          }
        } else if (tokens[j] == '/' && tokens[j + 1] == '/') {
          inComment = true;
          lineData += `<span class="comment">${tokens[j]}</span>`
        } else if (tokens[j] == '/' && tokens[j + 1] == '*') {
          canCloseComment = true;
          inComment = true;
          lineData += `<span class="comment">${tokens[j]}</span>`
        } else if (quotes.includes(tokens[j])) {
          if (inString) {
            if (tokens[j] === startString) {
              lineData += `${tokens[j]}</span>`;
              inString = false;
            } else {
              lineData += tokens[j];
            }
          } else {
            lineData += `<span class="string">${tokens[j]}`;
            inString = true;
            startString = tokens[j];
          }
        } else if (inString) {
          lineData += tokens[j];
        } else if (tokens[j + 1] && tokens[j] + tokens[j + 1] == '=>') {
          lineData += `<span class="util">=></span>`;
          j++;
        } else if (tokens[j] == ' ') {
          lineData += '<span class="space"></span>';
        } else if (this.wordTypes.util.includes(tokens[j])) {
          lineData += `<span class="util">${tokens[j]}</span>`;
        } else if (tokens[j] == ' ') {
          lineData += ' ';
        } else if (!isNaN(+tokens[j])) {
          lineData += `<span class="number">${tokens[j]}</span>`;
        } else if (this.operators.includes(tokens[j])) {
          lineData += `<span class="operator">${tokens[j]}</span>`;
        } else if (tokens[j] != undefined) {
          lineData += `<span class="other">${tokens[j]}</span>`;
        }
        if (inString) inMultilineString = true;
      }
      newLine.setContent(lineData);

      finalLines += newLine.finalize();
    }

    return finalLines;
  }
  splitByChars(str) {
    let chars = str.split('');
    let tempStr = '';
    let words = [];
    for (let i = 0; i < chars.length; i++) {
      if (!this.alphabet.includes(chars[i])) {
        if (chars[i] == ' ') {
          if (tempStr != '') words.push(tempStr);
          tempStr = '';
          words.push(chars[i]);
        } else if (tempStr != '') {
          words.push(tempStr);
          tempStr = '';
          words.push(chars[i]);
        } else {
          words.push(chars[i]);
        }
      } else {
        tempStr += chars[i];
      }
    }
    if (tempStr != '') words.push(tempStr);
    return words;
  }
  updateLines() {
    while (this.lineEl.children.length > this.lines) {
      let lineChildren = this.lineEl.children;
      lineChildren[lineChildren.length - 1].remove();
    }

    while (this.lineEl.children.length <= this.lines) {
      const newLine = h('div');
      newLine.classList.add('line-num');
      let lineChildren = this.lineEl.children;
      let lineNum = +lineChildren[lineChildren.length - 1]?.innerText + 1;
      newLine.innerText = lineNum ? lineNum : '0';

      this.lineEl.appendChild(newLine);
    }
  }
}

function getLineTextBeforeCursor(input) {
  let start = input.selectionStart;
  let str = input.value.substring(0, start);
  return str.substring(str.lastIndexOf('\n') + 1);
}

function h(type) {
  return document.createElement(type);
}

function parseBool(str) {
  if (str == 'true') return true;
  return false;
}

customElements.define('code-box', CodeBox);
