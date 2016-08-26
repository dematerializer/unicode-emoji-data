const co = require('co');
const fetch = require('node-fetch');
const fs = require('fs');
const leftPad = require('left-pad');

const parse = (text, fieldNames) => {
	if (fieldNames == null) {
		return null;
	}
	const anyWhitespace = /([\s])+/g;
	return text.split('\n')
		// collapse any amount of whitespace to a single space
		.map(line => line.replace(anyWhitespace, ' '))
		// separate fields and comment
		.map(line => {
			const indexOfComment = line.indexOf('#');
			return {
				fields: line.slice(0, indexOfComment > -1 ? indexOfComment : line.length).trim(),
				comment: indexOfComment > -1
					? line.slice(indexOfComment, line.length).trim()
					: undefined,
			};
		})
		// kick out empty lines
		.filter(line => line.fields.length > 0)
		// split fields into array while retaining comment
		.map(line => ({
			fields: line.fields.split(';').map(field => field.trim()),
			comment: line.comment,
		}))
		// only keep fields that we're interested in
		.map(line => ({
			fields: line.fields.slice(0, fieldNames.length + 1),
			comment: line.comment,
		}))
		// map fields to props
		.map(line => fieldNames.reduce(((newObj, field, i) => {
			newObj[field] = line.fields[i];
			return newObj;
		}), { comment: line.comment }));
};

const specs = {
	unicodeData: {
		// code point names
		name: 'unicode-data',
		url: 'http://www.unicode.org/Public/UNIDATA/UnicodeData.txt',
		fields: ['codepoint', 'name'],
	},
	emojiData: {
		// emoji code points
		name: 'emoji-data',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-data.txt',
		fields: ['codepoints', 'property'],
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
	// combine spec props in an array for easy processing
	const specsArray = [
		specs.emojiData,
		specs.unicodeData,
		specs.emojiSequences,
		specs.emojiZwjSequences,
	];
	// fetch, parse and memoize spec files
	const results = yield specsArray.map(spec => fetch(spec.url));
	const texts = yield results.map(result => result.text());
	const parsed = texts.map((text, i) => parse(text, specsArray[i].fields));
	specsArray.forEach((spec, i) => spec.data = parsed[i]);
	// specsArray.forEach(spec => fs.writeFileSync(`./json/${spec.name}.json`, JSON.stringify(spec.data, null, 2)));

	// map code points to names
	const nameForCodepoint = specs.unicodeData.data
		.reduce((newObj, datum, i) => {
			newObj[datum.codepoint] = datum.name;
			return newObj;
		}, {});
	specs.unicodeData.data = nameForCodepoint;
	// fs.writeFileSync(`./json/unicode-data.json`, JSON.stringify(specs.unicodeData.data, null, 2));

	// expand and extend emoji data with other sources
	const expandedEmojiData = [];
	specs.emojiData.data.forEach(datum => {
		if (datum.codepoints.indexOf('..') > -1) {
			const codeRange = datum.codepoints.split('..').map(code => parseInt(code, 16));
			const lowCodepoint = codeRange[0];
			const highCodepoint = codeRange[1];
			for (cp = lowCodepoint; cp <= highCodepoint; cp++) {
				const hexCp = leftPad(cp.toString(16), 4, 0).toUpperCase();
				expandedEmojiData.push(Object.assign({}, {
					// assign new and prettify (clean unused, reorder) props
					codepoint: hexCp,
					// codepointNumber: cp,
					name: nameForCodepoint[hexCp],
					// property: datum.property,
					// comment: datum.comment,
				}));
			}
		} else {
			expandedEmojiData.push(Object.assign({}, {
				// assign new and prettify (clean unused, reorder) props
				codepoint: datum.codepoints,
				// codepointNumber: parseInt(datum.codepoints, 16),
				name: nameForCodepoint[datum.codepoints],
				// property: datum.property,
				// comment: datum.comment,
			}));
		}
	});
	specs.emojiData.data = expandedEmojiData;
	fs.writeFileSync(`./json/emoji-data.json`, JSON.stringify(specs.emojiData.data, null, 2));
});
