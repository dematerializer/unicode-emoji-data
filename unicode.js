const co = require('co');
const fetch = require('node-fetch');
const fs = require('fs');
const leftPad = require('left-pad');

function codepointSequenceToString (codepointSequence) {
	// string: codepointSequenceToString('0032-FE0E')
	// argument list: codepointSequenceToString('0032', 'FE0E')
	// array: codepointSequenceToString(['0032', 'FE0E'])
	const sequence = arguments.length > 1 ? Array.prototype.slice.call(arguments) : codepointSequence;
	const codepoints = typeof sequence === 'string' ? sequence.split('-') : sequence;
	return codepoints
		.map(codepoint => String.fromCodePoint(parseInt(codepoint, 16)))
		.reduce((str, cp) => (str + cp), '');
};

console.log(codepointSequenceToString('0032-FE0E'));
console.log(codepointSequenceToString('0032', 'FE0F'));
console.log(codepointSequenceToString(['0032', 'FE0F', '20E3']));
return;

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

// http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt
// contains emoji variation sequences (emoji or text representation)
// variation selector that can modify the appearance of a preceding emoji character in a variation sequence
// U+FE0E VARIATION SELECTOR-15 (VS15) for a text presentation
// U+FE0F VARIATION SELECTOR-16 (VS16) for an emoji presentation

const specs = {
	unicodeData: {
		// code point names
		name: 'unicode-data',
		url: 'http://www.unicode.org/Public/UNIDATA/UnicodeData.txt',
		fields: ['codepoint', 'name'],
	},
	emojiData: {
		// contains emoji code points
		// property="Emoji" means "emoji character", a character that is recommended for use as emoji
		// property="Emoji_Presentation" means "default emoji presentation character", A character that, by default, should appear with an emoji presentation, rather than a text presentation
		// a character that does not have the "Emoji_Presentation" property means "default text presentation character", A character that, by default, should appear with a text presentation, rather than an emoji presentation
		// emoji variation selector is used to select which representation (emoji or text) a character has
		// emoji modifier — A character that can be used to modify the appearance of a preceding emoji in an emoji modifier sequence
		// property="Emoji_Modifier_Base" means A character whose appearance can be modified by a subsequent emoji modifier in an emoji modifier sequence
		// If Emoji=No, then Emoji_Presentation=No, Emoji_Modifier=No, and Emoji_Modifier_Base=No.
		name: 'emoji-data',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-data.txt',
		fields: ['codepoints', 'property'],
	},
	emojiSequences: {
		// contains combining, flag, modifier sequences
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
		specs.unicodeData,
		specs.emojiData,
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
	const enhancedEmojiData = [];
	specs.emojiData.data.forEach(datum => {
		if (datum.codepoints.indexOf('..') > -1) {
			const codeRange = datum.codepoints.split('..').map(code => parseInt(code, 16));
			const lowCodepoint = codeRange[0];
			const highCodepoint = codeRange[1];
			for (cp = lowCodepoint; cp <= highCodepoint; cp++) {
				const hexCp = leftPad(cp.toString(16), 4, 0).toUpperCase();
				enhancedEmojiData.push(Object.assign({}, {
					// assign new and prettify (clean unused, reorder) props
					codepoint: hexCp,
					// codepointNumber: cp,
					name: nameForCodepoint[hexCp],
					emoji: String.fromCodePoint(cp),
					// property: datum.property,
					comment: datum.comment,
				}));
			}
		} else {
			enhancedEmojiData.push(Object.assign({}, {
				// assign new and prettify (clean unused, reorder) props
				codepoint: datum.codepoints,
				// codepointNumber: parseInt(datum.codepoints, 16),
				name: nameForCodepoint[datum.codepoints],
				emoji: String.fromCodePoint(parseInt(datum.codepoints, 16)),
				// property: datum.property,
				comment: datum.comment,
			}));
		}
	});
	specs.emojiData.data = enhancedEmojiData;
	fs.writeFileSync(`./json/emoji-data.json`, JSON.stringify(specs.emojiData.data, null, 2));
});
