const co = require('co');
const fetch = require('node-fetch');
const fs = require('fs');
const leftPad = require('left-pad');

// Let <fieldNames> be ['codepoints', 'property'];
// Parses a CSV formatted <text> that may contain comments e.g.
// '
// 	# this is a comment
// 	1F600         ; Emoji                # 6.1  [1] (😀)       GRINNING FACE
// 	1F601..1F610  ; Emoji                # 6.0 [16] (😁..😐)    GRINNING FACE WITH SMILING EYES..NEUTRAL FACE
// '
// into a data structure like this:
// [
// 	{
// 		codepoints: '1F600',
// 		property: 'Emoji',
// 		comment: '6.1 [1] (😀) GRINNING FACE'
// 	},
// 	{
// 		codepoints: '1F601..1F610',
// 		property: 'Emoji',
// 		comment: '6.0 [16] (😁..😐) GRINNING FACE WITH SMILING EYES..NEUTRAL FACE'
// 	},
// ]
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
					? line.slice(indexOfComment + 1, line.length).trim()
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
		// map fields to props while only keeping fields that we're interested in via fieldNames
		.map(line => fieldNames.reduce(((newObj, field, i) => {
			if (field != null) newObj[field] = line.fields[i];
			return newObj;
		}), { comment: line.comment }));
};

function codepointSequenceToString(codepointSequence) {
	// string: codepointSequenceToString('0032-FE0E')
	// argument list: codepointSequenceToString('0032', 'FE0F')
	// array: codepointSequenceToString(['0032', 'FE0F', '20E3'])
	const sequence = arguments.length > 1 ? Array.prototype.slice.call(arguments) : codepointSequence;
	const codepoints = typeof sequence === 'string' ? sequence.split('-') : sequence;
	return codepoints
		.map(codepoint => String.fromCodePoint(parseInt(codepoint, 16)))
		.reduce((str, cp) => (str + cp), '');
}

// http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt
// contains emoji variation sequences (emoji or text presentation)
// variation selector that can modify the appearance of a preceding emoji character in a variation sequence
// U+FE0E VARIATION SELECTOR-15 (VS15) for a text presentation
// U+FE0F VARIATION SELECTOR-16 (VS16) for an emoji presentation

const specs = {
	unicodeData: {
		// code point names
		name: 'unicode-data',
		url: 'http://www.unicode.org/Public/UNIDATA/UnicodeData.txt',
		fields: ['codepoint', 'name'],
		data: null,
	},
	emojiData: {
		// contains emoji code points
		// property="Emoji" means "emoji character", a character that is recommended for use as emoji
		// property="Emoji_Presentation" means "default emoji presentation character", A character that, by default, should appear with an emoji presentation, rather than a text presentation
		// a character that does not have the "Emoji_Presentation" property means "default text presentation character", A character that, by default, should appear with a text presentation, rather than an emoji presentation
		// emoji variation selector is used to select which presentation (emoji or text) a character has
		// emoji modifier — A character that can be used to modify the appearance of a preceding emoji in an emoji modifier sequence
		// property="Emoji_Modifier_Base" means A character whose appearance can be modified by a subsequent emoji modifier in an emoji modifier sequence
		// If Emoji=No, then Emoji_Presentation=No, Emoji_Modifier=No, and Emoji_Modifier_Base=No.
		name: 'emoji-data',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-data.txt',
		fields: ['codepoints', 'property'],
		data: null,
	},
	emojiSequences: {
		// contains combining, flag, modifier sequences
		name: 'emoji-sequences',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-sequences.txt',
		fields: ['codepoints', 'type', 'description'],
		data: null,
	},
	emojiZwjSequences: {
		// zero-width-joiner sequences
		name: 'emoji-zwj-sequences',
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt',
		fields: ['codepoints', 'type', 'description'],
		data: null,
	},
};

co(function *() {
	// combine spec props in an array for batch processing
	const specsArray = [
		specs.unicodeData,
		specs.emojiData,
		specs.emojiSequences,
		specs.emojiZwjSequences,
	];
	// batch fetch and parse spec files
	const texts = yield specsArray.map(spec => fetch(spec.url).then(res => res.text()));
	specsArray.forEach((spec, i) => spec.data = parse(texts[i], spec.fields));

	// transform unicodeData to map code point to name, e.g.
	// {
	// 	'1F600': 'GRINNING FACE',
	// 	'1F601': 'GRINNING FACE WITH SMILING EYES',
	// }
	specs.unicodeData.data = specs.unicodeData.data
		.reduce((nameForCodepoint, datum, i) => {
			nameForCodepoint[datum.codepoint] = datum.name;
			return nameForCodepoint;
		}, {});

	// expand emojiData codepoint ranges (e.g. '1F601..1F610') into separate objects
	specs.emojiData.data = specs.emojiData.data
		.reduce((expandedEmojiData, datum) => {
			if (datum.codepoints.indexOf('..') > -1) {
				const codepointRange = datum.codepoints.split('..').map(cp => parseInt(cp, 16));
				const [lowCodepoint, highCodepoint] = codepointRange;
				for (let cp = lowCodepoint; cp <= highCodepoint; cp++) {
					const cpHex = leftPad(cp.toString(16), 4, 0).toUpperCase();
					expandedEmojiData.push(Object.assign({}, datum, {
						codepoint: cpHex,
						codepoints: undefined, // no longer needed
					}));
				}
			} else {
				expandedEmojiData.push(Object.assign({}, datum, {
					codepoint: datum.codepoints,
					codepoints: undefined, // no longer needed
				}));
			}
			return expandedEmojiData;
		}, []);

	// group emojiData by property
	specs.emojiData.data = [
		'Emoji',
		'Emoji_Presentation',
		'Emoji_Modifier',
		'Emoji_Modifier_Base',
	].reduce((emojiDataForProperty, prop) => {
		emojiDataForProperty[prop] = specs.emojiData.data.filter(datum => datum.property === prop);
		return emojiDataForProperty;
	}, {});

	// assemble combined emoji data
	specs.emojiData.data.combined = specs.emojiData.data.Emoji.map(datum => {
		const emojiPresentations = specs.emojiData.data.Emoji_Presentation;
		const isEmojiPresentation = emojiPresentations.filter(ep => ep.codepoint === datum.codepoint).length > 0;
		const codepoint = datum.codepoint;
		const explicitTextPresentationSequence = `${codepoint}-FE0E`;
		const explicitEmojiPresentationSequence = `${codepoint}-FE0F`;
		return Object.assign({}, {
			codepoint,
			name: specs.unicodeData.data[datum.codepoint],
			recommendedPresentation: isEmojiPresentation ? 'emoji' : 'text',
			presentation: {
				default: {
					sequence: codepoint,
					output: codepointSequenceToString(codepoint),
				},
				text: {
					sequence: explicitTextPresentationSequence,
					output: codepointSequenceToString(explicitTextPresentationSequence),
				},
				emoji: {
					sequence: explicitEmojiPresentationSequence,
					output: codepointSequenceToString(explicitEmojiPresentationSequence),
				},
			},
		});
	});

	fs.writeFileSync('./json/combined.json', JSON.stringify(specs.emojiData.data.combined, null, 2));

	// specsArray.forEach(spec => fs.writeFileSync(`./json/${spec.name}.json`, JSON.stringify(spec.data, null, 2)));
});
