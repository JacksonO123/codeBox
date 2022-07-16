class LineEl extends HTMLElement {
	constructor() {
		super();
	}
	connectedCallback() { }
}

class CodeBox extends HTMLElement {
	constructor() {
		super();
	}
	connectedCallback() {
		const container = h('div');
		container.classList.add('editor-container')

		const tabContainer = h('div');
		tabContainer.classList.add('tab-container');

		const tabWrapper = h('div');
		tabWrapper.classList.add('tab-wrapper');

		// test tab
		const tab = h('div');
		tab.classList.add('tab');
		tab.innerHTML = 'test';

		const controls = h('div');
		controls.classList.add('controls');

		const editorWrapper = h('div');
		editorWrapper.classList.add('editor-wrapper');

		const lineNumbers = h('div');
		lineNumbers.classList.add('line-numbers');
		lineNumbers.id = 'lineNumbers';

		const editor = h('main');
		editor.classList.add('editor');
		editor.setAttribute('contenteditable', true);
		editor.setAttribute('spellcheck', 'false');
		editor.setAttribute('autocorrect', 'off');
		editor.setAttribute('autocapitalize', 'off');
		editor.setAttribute('translate', 'no');
		editor.setAttribute('contenteditable', 'true');
		editor.setAttribute('style', 'tab-size: 4;');
		editor.setAttribute('role', 'textbox');
		editor.setAttribute('aria-multiline', 'true');
		editor.setAttribute('aria-autocomplete', 'list');
		editor.id = 'editor';

		let pressingMeta = false;
		let pressedEnter = false;
		editor.addEventListener('keyup', e => {
			if (e.key == 'Meta') pressingMeta = false;
		});
		editor.addEventListener('paste', e => {
			e.preventDefault();
			const text = e.clipboardData.getData('text/html');
			const el = this.getElFromPasteText(text);
			console.log(el);
			// insert text at cursor
			const range = document.createRange();
			range.selectNodeContents(editor);
			range.collapse(false);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
			document.execCommand('insertHTML', false, text);
		});
		editor.addEventListener('keydown', e => {
			const selection = window.getSelection();
			const range = selection.getRangeAt(0);
			const start = range.startOffset;
			const end = range.endOffset;
			const line = this.getLine(range.startContainer);
			this.setCurrentLine(editor, line);
			if (e.key == 'Meta') pressingMeta = true;
			if (e.key == 'Backspace') {
				if (pressingMeta) {
					console.log('preventing default');
					e.preventDefault();
					if (line.tagName != 'MAIN') line.innerHTML = '';
				} else if (start == 0) {
					if (!pressingMeta) {
						this.renderLineNumbers(editor.childNodes.length - 1);
					}
					if (editor.childNodes.length == 1) {
						console.log('preventing default');
						e.preventDefault();
					} else {
						const index = Array.prototype.indexOf.call(editor.childNodes, line);
						if (!pressedEnter) {
							this.setCurrentLine(editor, editor.childNodes[index - 1]);
						}
					}
				}
			} else if (e.key == 'Enter') {
				e.preventDefault();
				this.renderLineNumbers(editor.childNodes.length + 1);
				const newLine = this.getNewLine();
				this.setCurrentLine(editor, newLine);
				editor.insertBefore(newLine, line.nextSibling);
				const newRange = document.createRange();
				newRange.setStart(newLine, 0);
				newRange.setEnd(newLine, 0);
				selection.removeAllRanges();
				selection.addRange(newRange);
			} else if (e.key == 'ArrowDown') {
			}

			if (e.key == 'Enter') {
				pressedEnter = true;
			} else {
				pressedEnter = false;
			}
		});
    let red = false;
    editor.addEventListener('keyup', e => {
      if (e.key == 'Escape') {
        if (red) {
          this.setColor('white');
          red = false;
        } else {
          this.setColor('red');
          red = true;
        }
      }
    });

		// render elements
		tabWrapper.appendChild(tab);
		tabContainer.appendChild(tabWrapper);
		tabContainer.appendChild(controls);
		container.appendChild(tabContainer);
		editorWrapper.appendChild(lineNumbers);
		editor.appendChild(this.getNewLine(true));
		editorWrapper.appendChild(editor);
		container.appendChild(editorWrapper);
		this.appendChild(container);

		// render line numbers
		this.renderLineNumbers();
	}
  setColor(color) {
    console.log(color);
		document.execCommand('forecolor', false, color);
  }
	getElFromPasteText(text) {
		text = text.substring(text.indexOf('>') + 2);
		return text.match(/^\w+/gm)[0];
	}
	getInnerHtml(el) {
		let innerHtml = '';
		for (const child of el.childNodes) {
			if (child.tagName) {
				innerHtml += this.getInnerHtml(child);
			} else {
				innerHtml += child.textContent;
			}
		}
		return innerHtml;
	}
	getLine(el) {
		if (el.tagName == 'LINE-EL') return el;
		return this.getLine(el.parentNode);
	}
	setCurrentLine(editor, line) {
		if (editor.tagName == 'MAIN') {
			const children = editor.childNodes;
			for (let i = 0; i < children.length; i++) {
				children[i].classList.remove('current-line');
			}
			if (line && line.tagName == 'LINE-EL') {
				line.classList.add('current-line');
			}
		}
	}
	renderLineNumbers(l = null) {
		const lineNumbers = get('lineNumbers');
		lineNumbers.innerHTML = '';
		let lines = get('editor').childNodes.length;
		lines = lines == 0 ? 1 : lines;
		for (let i = 0; i < (l ? l : lines); i++) {
			const lineNumber = h('div');
			lineNumber.innerHTML = i + 1;
			lineNumber.classList.add('line-number');
			lineNumbers.appendChild(lineNumber)
		}
	}
	getNewLine(current = false) {
		const line = h('line-el');
		if (current) line.classList.add('current-line');
		line.addEventListener('mousedown', e => {
			e.stopPropagation();
			this.setCurrentLine(get('editor'), line);
		});
		return line;
	}
}

function get(id) {
	return document.getElementById(id);
}

function h(type) {
	return document.createElement(type);
}

customElements.define('line-el', LineEl);
customElements.define('code-box', CodeBox);
