const co = require('co');
const fetch = require('node-fetch');
const fs = require('fs');

const parse = (text, fields) => {
	if (fields == null) {
		return null;
	}
	return text.split('\n')
		.map(line => {
			const indexOfComment = line.indexOf('#');
			return {
				fields: line.slice(0, indexOfComment > -1 ? indexOfComment : line.length).trim(),
				comment: line.slice(indexOfComment, line.length).trim(),
			};
		})
		.filter(line => line.fields.length > 0)
		.map(line => ({
			fields: line.fields.split(';').map(field => field.trim()),
			comment: line.comment,
		}))
		.map(line => ({
			fields: line.fields.slice(0, fields.length + 1),
			comment: line.comment,
		}))
		// .forEach(line => console.log(line))
		.map(line => fields.reduce(((newObj, field, i) => {
			newObj[field] = line.fields[i];
			return newObj;
		}), { comment: line.comment }));
};

const specs = {
	emojiData: {
		// emoji code points
		name: 'emoji-data',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-data.txt',
		fields: ['codepoints', 'property'],
	},
	unicodeData: {
		// code point names
		name: 'unicode-data',
		url: 'http://www.unicode.org/Public/UNIDATA/UnicodeData.txt',
		fields: ['codepoint', 'name'],
	},
	emojiSequences: {
		// combining, flag, modifier sequences
		name: 'emoji-sequences',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-sequences.txt',
		fields: ['codepoints', 'type', 'description'],
	},
	emojiZwjSequences: {
		// zero-width-joiner sequences
		name: 'emoji-zwj-sequences',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt',
		fields: ['codepoints', 'type', 'description'],
	},
};

co(function *() {
	const specsArray = [
		specs.emojiData,
		specs.unicodeData,
		specs.emojiSequences,
		specs.emojiZwjSequences,
	];
	const results = yield specsArray.map(spec => fetch(spec.url));
	const texts = yield results.map(result => result.text());
	const parsed = texts.map((text, i) => parse(text, specsArray[i].fields));
	specsArray.forEach((spec, i) => spec.data = parsed[i]);
	specsArray.forEach(spec => fs.writeFileSync(`./json/${spec.name}.json`, JSON.stringify(spec.data, null, 2)));
});
