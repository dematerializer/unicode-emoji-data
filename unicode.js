const co = require('co');
const fetch = require('node-fetch');
const fs = require('fs');

const parse = (text, fields) => {
	if (fields == null) {
		return null;
	}
	return text.split('\n')
		.map(line => line.slice(0, line.indexOf('#')).trim())
		.filter(line => line.length > 0)
		.map(line =>line.split(';').map(field => field.trim()))
		.map(line => line.slice(0, fields.length + 1))
		.map(line => fields.reduce(((obj, field, i) => {
			obj[field] = line[i];
			return obj;
		}), {}));
};

const specs = [
	{
		// emoji code points
		name: 'emoji-data',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-data.txt',
		fields: ['codepoints', 'property'],
		data: null,
	},{
		// code point names
		name: 'unicode-data',
		url: 'http://www.unicode.org/Public/UNIDATA/UnicodeData.txt',
		fields: ['codepoint', 'name'],
		data: null,
	},{
		// combining, flag, modifier sequences
		name: 'emoji-sequences',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-sequences.txt',
		fields: ['codepoints', 'type', 'description'],
		data: null,
	},{
		// zero-width-joiner sequences
		name: 'emoji-zwj-sequences',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt',
		fields: ['codepoints', 'type', 'description'],
		data: null,
	},
];

co(function *() {
	const results = yield specs.map(({ url }) => fetch(url));
	const texts = yield results.map(result => result.text());
	const parsed = texts.map((text, i) => parse(text, specs[i].fields));
	specs.forEach((spec, i) => spec.data = parsed[i]);
	specs.forEach(spec => fs.writeFileSync(`./json/${spec.name}.json`, JSON.stringify(spec.data, null, 2)));
});
