const co = require('co');
const fetch = require('node-fetch');
const fs = require('fs');

const parse = (text, regex, fields) => {
	if (regex == null || fields == null) {
		return null;
	}
	return text.split('\n')
		.map(line => line.trim())
		.filter(line => line.length > 0 && !line.startsWith('#'))
		.map(line => line.match(regex))
		.map(matches => matches && matches.slice(1, fields.length + 1).map(field => field.trim()))
		.map(matches => matches && fields.reduce(((obj, field, i) => {
			obj[field] = matches[i];
			return obj;
		}), {}));
		// .forEach(obj => console.log(obj));
};

const specs = [
	{
		// emoji code points
		name: 'emoji-data',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-data.txt',
		// 2139          ; Emoji  # 3.0  [1] (ℹ️)     INFORMATION SOURCE
		// 2194..2199    ; Emoji  # 1.1  [6] (↔️..↙️)  LEFT RIGHT ARROW..SOUTH WEST ARROW
		regex: /^(\S*)\s*;\s*(\S*)\s*#\s*(\S*)\s*\[(\S*)\]\s*\((\S*)\)\s*(.*)/,
		fields: ['codepoints', 'property', 'version', 'count', 'emojis', 'name'],
		data: null,
	},{
		// code point names
		name: 'unicode-data',
		url: 'http://www.unicode.org/Public/UNIDATA/UnicodeData.txt',
		// 1F984;UNICORN FACE;So;0;ON;;;;;N;;;;;
		regex: /^\s*([\d\w]*)\s*;\s*([\d\w\s,\-<>]*)\s*;/,
		fields: ['codepoint', 'name'],
		data: null,
	},{
		// combining, flag, modifier sequences
		name: 'emoji-sequences',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-sequences.txt',
		// 26F9 1F3FE  ; Emoji_Modifier_Sequence  ; PERSON WITH BALL, type-5  # 8.0  [1] (⛹🏾)
		regex: /^\s*([\d\w\s]*)\s*;\s*([\d\w\s]*)\s*;\s*([\d\w\s,\-]*)\s*#\s*([\d.]*)\s*\[(\d)*\]\s*\((\S*)\)/,
		fields: ['codepoints', 'type', 'description', 'version', 'count', 'emoji'],
		data: null,
	},{
		// zero-width-joiner sequences
		name: 'emoji-zwj-sequences',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt',
		format: 'codepoints ; type ; description # version [count] (emoji)',
		// 1F937 1F3FB 200D 2642 FE0F  ; Emoji_ZWJ_Sequence  ; Man shrugging, type-1-2  # 9.0  [1] (🤷🏻‍♂️)
		regex: /^\s*([\d\w\s]*)\s*;\s*([\d\w\s]*)\s*;\s*([\d\w\s,\-]*)\s*#\s*([\d.]*)\s*\[(\d)*\]\s*\((\S*)\)/,
		fields: ['codepoints', 'type', 'description', 'version', 'count', 'emoji'],
		data: null,
	},
];

co(function *() {
	const results = yield specs.map(({ url }) => fetch(url));
	const texts = yield results.map(result => result.text());
	const parsed = texts.map((text, i) => parse(text, specs[i].regex, specs[i].fields));
	specs.forEach((spec, i) => spec.data = parsed[i]);
	specs.forEach(spec => fs.writeFileSync(`${spec.name}.json`, JSON.stringify(spec.data, null, 2)));
});
