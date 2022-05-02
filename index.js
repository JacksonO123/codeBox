class HtmlSringElement {
	constructor (type) {
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
		const classes = this.classArr.length > 0 ? ` class="${this.classArr.join(' ')}">` : '>';
		this.content = this.before + classes + value + this.after;
	}
}

class CodeBox extends HTMLElement {
	constructor() {
		super();
		this.lines = 0;
		this.currentTabs = 0;
		this.lineEl = null;
		this.alphabet = 'abcdefghijklmnopqrstuvwxyz1234567890';
		this.parens = [
			['(', ')'],
			['[', ']'],
			['{', '}'],
			['"', '"'],
			["'", "'"],
			['`', '`']
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
				'case'
			]
		}
	}
	connectedCallback() {
		const tabs = h('div');
		tabs.classList.add('codebox-tabs')

		const tabWrapper = h('div');
		tabWrapper.classList.add('tab-wrapper');
		tabs.appendChild(tabWrapper);

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

		contentWrapper.appendChild(lines);
		contentWrapper.appendChild(content);
		this.appendChild(tabs);
		this.appendChild(contentWrapper);

		if (!editable) {
			this.updateLines();
			return;
		}
		
		const textarea = h('textarea');
		textarea.setAttribute('spellcheck', 'false');
		textarea.addEventListener('input', e => {
			let start = textarea.selectionStart;
			let char = e.target.value[start - 1];
			let openParens = this.parens.map(item => item[0]);
			if (openParens.includes(char)) {
				let parenIndex = openParens.indexOf(char);
				let closeParen = this.parens[parenIndex][1];
				textarea.value = textarea.value.substring(0, start) + closeParen + textarea.value.substring(start);
				this.textareaUpdate(code, textarea, textarea.value);
				textarea.setSelectionRange(start, start);
			} else {
				this.textareaUpdate(code, textarea, e.target.value);
			}
		});
		textarea.addEventListener('keydown', e => {
			let start = textarea.selectionStart;
			let openParens = this.parens.map(item => item[0]);
			let closeParens = this.parens.map(item => item[1]);
			if (closeParens.includes(e.key) && textarea.value[start] == e.key) {
				e.preventDefault();
				textarea.setSelectionRange(start+1, start+1);
			} else if (e.key == 'Tab') {
				e.preventDefault();
				textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(start);
				textarea.setSelectionRange(start+1, start+1);
				this.currentTabs++;
			} else if (e.key == 'Enter') {
				e.preventDefault();
				console.log(textarea.scrollTop, this.lines*19.5);
				if (textarea.scrollTop - this.lines*19.5 > 445) {
					textarea.scrollTo(0, this.lines*19.5);
				}
				if (
					openParens.includes(textarea.value[start - 1]) &&
					closeParens.includes(textarea.value[start])
				) {
					textarea.value = textarea.value.substring(0, start) + '\n' + '\t'.repeat(this.currentTabs+1) + '\n' + '\t'.repeat(this.currentTabs) + textarea.value.substring(start);
					textarea.setSelectionRange(start+2+this.currentTabs, start+2+this.currentTabs);
				} else {
					textarea.value = textarea.value.substring(0, start) + '\n' + '\t'.repeat(this.currentTabs) + textarea.value.substring(start);
					textarea.setSelectionRange(start+1+this.currentTabs, start+1+this.currentTabs);
				}
				this.textareaUpdate(code, textarea, textarea.value);
			} else if (e.key == 'Backspace') {
				let end = textarea.selectionEnd;
				if (start == end && start > 0) {
					if (
						openParens.includes(textarea.value[start-1]) &&
						closeParens.includes(textarea.value[start])
					) {
						e.preventDefault();
						textarea.value = textarea.value.substring(0, start-1) + textarea.value.substring(start+1);
						textarea.setSelectionRange(start-1, start-1);
					} else {
						e.preventDefault();
						textarea.value = textarea.value.substring(0, start-1) + textarea.value.substring(start);
						textarea.setSelectionRange(start-1, start-1);
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
		});
		textarea.addEventListener('scroll', e => {
			lines.scrollTo(0, e.target.scrollTop);
			code.scrollTo(0, e.target.scrollTop);
		});

		content.appendChild(textarea);
		
		this.updateLines();
	}
	textareaUpdate(code, input, value) {
		let codeLines = this.parseInputCode(value);
		code.innerHTML = codeLines;
		this.lines = input.value.split('\n').length - 1;
		this.updateLines();
	}
	parseInputCode(code) {
		let lines = code.split('\n');
		let finalLines = '';

		for (let i = 0; i < lines.length; i++) {
			const newLine = new HtmlSringElement('span');
			newLine.addClass('line');

			let lineData = '';
			let tokens = this.splitByChars(lines[i]);
			let inString = false;
			let startString;
			const quotes = ["'", '"', "`"];
			for (let j = 0; j < tokens.length; j++) {
				if (tokens[j] == '\t') {
					lineData += '<span class="tab-space"></span>';
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
				} else if (tokens[j + 1] && tokens[j] + tokens[j+1] == '=>') {
					lineData += `<span class="util">=></span>`;
					j += 2;
				} else if (this.wordTypes.util.includes(tokens[j])) {
					lineData += `<span class="util">${tokens[j]}</span>`;
				} else if (tokens[j] == ' ') {
					lineData += ' ';
				} else if (!isNaN(+tokens[j])) {
					lineData += `<span class="number">${tokens[j]}</span>`;
				} else if (tokens[j] != undefined) {
					lineData += `<span class="other">${tokens[j]}</span>`;
				}
			}
			newLine.setContent(lineData);

			finalLines += newLine.finalize();
			finalLines += '<br>';
		}
		finalLines = finalLines.substring(0, finalLines.lastIndexOf('<br>'));

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
		return words;``
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

const getLineTextBeforeCursor = (input) => {
	let start = input.selectionStart;
	let str = input.value.substring(0, start);
	return str.substring(str.lastIndexOf('\n')+1);
}

const h = (type) => {
	return document.createElement(type);
}

const parseBool = (str) => {
	if (str == 'true') return true;
	return false;
}

customElements.define('code-box', CodeBox);