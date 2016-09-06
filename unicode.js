const co = require('co');
const fetch = require('node-fetch');
const fs = require('fs');
const leftPad = require('left-pad'); // FTW!

// Parses a CSV formatted <text> that may contain comments,
// extracting only relevant fields given by <fieldNames>:
//
// e.g. let <fieldNames> be ['codepoints', 'property']; <text> = '
// 	# this is a comment
// 	1F600         ; Emoji                # 6.1  [1] (😀)       GRINNING FACE
// 	1F601..1F610  ; Emoji                # 6.0 [16] (😁..😐)    GRINNING FACE WITH SMILING EYES..NEUTRAL FACE
// ';
//
// Returns a data structure like this:
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
		// Collapse any amount of whitespace to a single space:
		.map(line => line.replace(anyWhitespace, ' '))
		// Separate fields and comment:
		.map(line => {
			const indexOfComment = line.indexOf('#');
			return {
				fields: line.slice(0, indexOfComment > -1 ? indexOfComment : line.length).trim(),
				comment: indexOfComment > -1
					? line.slice(indexOfComment + 1, line.length).trim()
					: undefined,
			};
		})
		// Kick out empty lines:
		.filter(line => line.fields.length > 0)
		// Split fields into array while retaining comment:
		.map(line => ({
			fields: line.fields.split(';').map(field => field.trim()),
			comment: line.comment,
		}))
		// Map fields to props while only keeping fields that we're interested in via fieldNames:
		.map(line => fieldNames.reduce(((newObj, field, i) => {
			if (field != null) newObj[field] = line.fields[i];
			return newObj;
		}), { comment: line.comment }));
};

function codepointSequenceToString(codepointSequence) {
	// string: codepointSequenceToString('0032 FE0E')
	// argument list: codepointSequenceToString('0032', 'FE0F')
	// array: codepointSequenceToString(['0032', 'FE0F', '20E3'])
	const sequence = arguments.length > 1 ? Array.prototype.slice.call(arguments) : codepointSequence;
	const codepoints = typeof sequence === 'string' ? sequence.split(' ') : sequence;
	const numericCodepoints = codepoints.map(codepoint => parseInt(codepoint, 16));
	return String.fromCodePoint(...numericCodepoints);
}

const specs = {
	unicodeData: {
		// Code point names:
		name: 'unicode-data',
		url: 'http://www.unicode.org/Public/9.0.0/ucd/UnicodeData.txt',
		fields: ['codepoint', 'name'],
		data: {
			parsed: null,
			nameForCodepoint: null,
		},
	},
	emojiSources: {
		// Provides mappings between unicode code points and sequences on one hand
		// and Shift-JIS codes for cell phone carrier symbols on the other hand:
		name: 'emoji-sources',
		url: 'http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt',
		fields: ['unicode', 'docomo', 'kddi', 'softbank'],
		data: {
			parsed: null,
			shiftJisByCarrierForCodepoint: null,
		},
	},
	emojiData: {
		// Emoji code points:
		// Property "Emoji=Yes" means "emoji character", a character that is recommended for use as emoji
		// If property "Emoji=No", then "Emoji_Presentation=No", "Emoji_Modifier=No" and "Emoji_Modifier_Base=No"
		// Property "Emoji_Presentation=Yes" means "default emoji presentation character",
		//   a character that, by default, should appear with an emoji presentation style
		// Property "Emoji_Presentation=No" means "default text presentation character",
		//   a character that, by default, should appear with a text presentation style
		// Property "Emoji_Modifier=Yes" — A character that can be used to modify the appearance of a preceding emoji in an emoji modifier sequence
		// property="Emoji_Modifier_Base" means A character whose appearance can be modified by a subsequent emoji modifier in an emoji modifier sequence
		name: 'emoji-data',
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-data.txt',
		fields: ['codepoints', 'property'],
		data: {
			parsed: null,
			emoji: null,
			emojiPresentation: null,
			emojiModifier: null,
			emojiModifierBase: null,
			enhanced: null,
			combined: null,
		},
	},
	standardizedVariants: {
		// Variation sequences:
		// Some Unicode characters are normally displayed as emoji; some are normally
		// displayed as ordinary text, and some can be displayed both ways.
		// A variation selector that can modify the appearance of a preceding emoji character in
		// a variation sequence is used to select which presentation style (emoji or text) a character should have
		// U+FE0E VARIATION SELECTOR-15 (VS15) for a text presentation style
		// U+FE0F VARIATION SELECTOR-16 (VS16) for an emoji presentation style
		// Only the specific subset of emoji characters defined in this file can have both emoji and text presentation
		// styles - all others get their presentation style implicitly without the need to append a variation selector.
		name: 'standardized-variants',
		url: 'http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt',
		fields: ['sequence', 'description'],
		data: {
			parsed: null,
			variationSequencesForCodepoint: null,
		},
	},
	emojiSequences: {
		// Combining, flag, modifier sequences.
		// We use this only to get combining and flag sequences.
		name: 'emoji-sequences',
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-sequences.txt',
		fields: ['sequence', 'type', 'description'],
		data: {
			parsed: null,
			compatibleCodepointsForCombiningMark: null,
			flagEmoji: null,
		},
	},
	emojiZwjSequences: {
		// Zero-Width-Joiner sequences:
		name: 'emoji-zwj-sequences',
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-zwj-sequences.txt',
		fields: ['sequence', 'type', 'description'],
		data: {
			parsed: null,
			joinedEmoji: null,
		},
	},
};

co(function *() {
	// Combine spec props in an array for batch processing:
	const specsArray = [
		specs.unicodeData,
		specs.emojiSources,
		specs.emojiData,
		specs.standardizedVariants,
		specs.emojiSequences,
		specs.emojiZwjSequences,
	];

	// Batch fetch and parse spec files:
	const texts = yield specsArray.map(spec => fetch(spec.url).then(res => res.text()));
	specsArray.forEach((spec, i) => spec.data.parsed = parse(texts[i], spec.fields));

	// Transform unicodeData to map each code point to a name, e.g.
	// {
	// 	...
	// 	'1F600': 'GRINNING FACE',
	// 	'1F601': 'GRINNING FACE WITH SMILING EYES',
	// 	...
	// }
	specs.unicodeData.data.nameForCodepoint = specs.unicodeData.data.parsed
		.reduce((nameForCodepoint, datum) => {
			nameForCodepoint[datum.codepoint] = datum.name;
			return nameForCodepoint;
		}, {});

	// Transform emojiSources to map unicode code points or sequences
	// to Shift-JIS code for different cell phone carrier symbols, e.g.
	// {
	// 	...
	// 	'0023 20E3': { // unicode
	// 		'docomo': 'F985',
	// 		'kddi': 'F489',
	// 		'softbank': 'F7B0',
	// 	},
	// 	...
	// }
	specs.emojiSources.data.shiftJisByCarrierForCodepoint = specs.emojiSources.data.parsed
		.reduce((shiftJisByCarrierForCodepoint, datum) => {
			shiftJisByCarrierForCodepoint[datum.unicode] = {
				docomo: datum.docomo.length > 0 ? datum.docomo : undefined,
				kddi: datum.kddi.length > 0 ? datum.kddi : undefined,
				softbank: datum.softbank.length > 0 ? datum.softbank : undefined,
			};
			return shiftJisByCarrierForCodepoint;
		}, {});

	// Expand emojiData code point ranges (e.g. '1F601..1F610') into separate objects:
	specs.emojiData.data.parsed = specs.emojiData.data.parsed
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

	// Group emojiData by property:
	const emojiDataParsed = specs.emojiData.data.parsed;
	specs.emojiData.data = Object.assign({}, specs.emojiData.data, {
		emoji: emojiDataParsed.filter(datum => datum.property === 'Emoji'),
		emojiPresentation: emojiDataParsed.filter(datum => datum.property === 'Emoji_Presentation'),
		emojiModifier: emojiDataParsed.filter(datum => datum.property === 'Emoji_Modifier'),
		emojiModifierBase: emojiDataParsed.filter(datum => datum.property === 'Emoji_Modifier_Base'),
	});

	// Combining marks can modify the appearance of a preceding
	// emoji variation sequence when used in a combining sequence.

	const combiningMarks = {
		'20E3': { // COMBINING ENCLOSING KEYCAP
			propertyKey: 'keycap',
			// For digits, follow naming convention of pure emoji U+1F51F (KEYCAP TEN)
			combinedName: name => name.startsWith('DIGIT') ? name.replace('DIGIT', 'KEYCAP') : `KEYCAP ${name}`,
		},
		'20E0': { // COMBINING ENCLOSING CIRCLE BACKSLASH
			// Prohibition mark is generally recommended in tr51 but there are
			// no compatible code points mentioned in StandardizedVariants.txt
			// and implementations don't seem to support this yet
		},
	};

	// Build a map of compatible code points for each combining mark
	// while associating with them their transformed/combined name:
	// {
	// 	...
	// 	'20E3': { // COMBINING ENCLOSING KEYCAP
	// 		...
	// 		'002A': 'KEYCAP ASTERISK', // ASTERISK
	// 		'0030': 'KEYCAP ZERO', // DIGIT ZERO
	// 		...
	// 	},
	// 	...
	// }
	specs.emojiSequences.data.compatibleCodepointsForCombiningMark = specs.emojiSequences.data.parsed
		.filter(datum => datum.type === 'Emoji_Combining_Sequence')
		.reduce((compatibleCodepointsForCombiningMark, datum) => {
			const codepoints = datum.sequence.split(' ');
			const compatibleCodepoint = codepoints[0]; // ignore the variation selector
			const combiningMark = codepoints[codepoints.length - 1];
			if (compatibleCodepointsForCombiningMark[combiningMark] == null) {
				compatibleCodepointsForCombiningMark[combiningMark] = {};
			}
			const compatibleCodepointName = specs.unicodeData.data.nameForCodepoint[compatibleCodepoint];
			const combinedName = combiningMarks[combiningMark].combinedName(compatibleCodepointName);
			compatibleCodepointsForCombiningMark[combiningMark][compatibleCodepoint] = combinedName;
			return compatibleCodepointsForCombiningMark;
		}, {});

	// Build additional flag entries from flag sequences:
	specs.emojiSequences.data.flagEmoji = specs.emojiSequences.data.parsed
		.filter(datum => datum.type === 'Emoji_Flag_Sequence')
		.map(datum => ({
			codepoint: datum.sequence,
			name: datum.sequence.split(' ').reduce((combinedName, codepoint) => {
				const cpName = specs.unicodeData.data.nameForCodepoint[codepoint];
				return combinedName + cpName[cpName.length - 1];
			}, 'REGIONAL INDICATOR SYMBOL LETTERS '),
			defaultPresentation: 'emoji',
			presentation: {
				default: {
					sequence: datum.sequence,
					output: codepointSequenceToString(datum.sequence),
				},
			},
		}));

	// Build emoji modifier map (maps each modifier code point to a name), e.g.
	// {
	// 	...
	// 	'1F3FB': 'EMOJI MODIFIER FITZPATRICK TYPE-1-2',
	// 	...
	// }
	specs.emojiData.data.emojiModifier = specs.emojiData.data.emojiModifier
		.reduce((nameForModifierCodepoint, datum) => {
			nameForModifierCodepoint[datum.codepoint] = specs.unicodeData.data.nameForCodepoint[datum.codepoint];
			return nameForModifierCodepoint;
		}, {});

	// Build map of emoji that can be modified (maps each modifiable code point to a modifier sequence).
	// Those are basically all emoji that have skin variations:
	specs.emojiData.data.emojiModifierBase = specs.emojiData.data.emojiModifierBase
		.reduce((modifierSequencesForModifiableCodepoint, baseDatum) => {
			modifierSequencesForModifiableCodepoint[baseDatum.codepoint] = Object.keys(specs.emojiData.data.emojiModifier)
				.reduce((sequenceForModifierName, modifierCodepoint) => {
					const sequence = `${baseDatum.codepoint} ${modifierCodepoint}`;
					sequenceForModifierName[specs.emojiData.data.emojiModifier[modifierCodepoint]] = {
						sequence,
						output: codepointSequenceToString(sequence),
					};
					return sequenceForModifierName;
				}, {});
			return modifierSequencesForModifiableCodepoint;
		}, {});

	// Variation selector that can modify the appearance of
	// a preceding emoji character in a variation sequence:
	const variationSelector = {
		text: 'FE0E',  // VARIATION SELECTOR-15 (VS15) for a text presentation
		emoji: 'FE0F', // VARIATION SELECTOR-16 (VS16) for an emoji presentation
	};

	// Extract variation sequences grouped by style
	// for each code point that supports both:
	// {
	// 	'0023': { // NUMBER SIGN
	// 		'text': '0023 FE0E',
	// 		'emoji': '0023 FE0F',
	// 	},
	// 	...
	// }
	specs.standardizedVariants.data.variationSequencesForCodepoint = specs.standardizedVariants.data.parsed
		.filter(datum => {
			const hasTextVariationSelector = datum.sequence.indexOf(variationSelector.text) > -1;
			const hasEmojiVariationSelector = datum.sequence.indexOf(variationSelector.emoji) > -1;
			return hasTextVariationSelector || hasEmojiVariationSelector;
		})
		.reduce((variationSequencesForCodepoint, datum) => {
			const [ cp, vs ] = datum.sequence.split(' ');
			if (variationSequencesForCodepoint[cp] == null) {
				variationSequencesForCodepoint[cp] = {};
			}
			Object.keys(variationSelector).forEach(style => {
				if (vs === variationSelector[style]) {
					variationSequencesForCodepoint[cp][style] = datum.sequence;
				}
			});
			return variationSequencesForCodepoint;
		}, {});
	// emoji-zwj-sequences.txt v4.0 mentions: "three characters used in emoji zwj sequences
	// with the emoji variation selector do not yet appear in StandardizedVariants.txt"
	// - so we add them here manually:
	// specs.standardizedVariants.data.variationSequencesForCodepoint['2640'] = { // FEMALE SIGN
	// 	'text': `2640 ${variationSelector.text}`,
	// 	'emoji': `2640 ${variationSelector.emoji}`,
	// };
	// specs.standardizedVariants.data.variationSequencesForCodepoint['2642'] = { // MALE SIGN
	// 	'text': `2642 ${variationSelector.text}`,
	// 	'emoji': `2642 ${variationSelector.emoji}`,
	// };
	// specs.standardizedVariants.data.variationSequencesForCodepoint['2695'] = { // STAFF OF AESCULAPIUS
	// 	'text': `2695 ${variationSelector.text}`,
	// 	'emoji': `2695 ${variationSelector.emoji}`,
	// };

	// Build additional emoji entries from Zero-Width-Joiner sequences:
	const zeroWidthJoiner = '200D';
	specs.emojiZwjSequences.data.joinedEmoji = specs.emojiZwjSequences.data.parsed
		.map(datum => {
			const nameForCp = specs.unicodeData.data.nameForCodepoint;
			const anyVariationSelector = new RegExp(`${variationSelector.text}|${variationSelector.emoji}`, 'g');
			const joinedName = datum.sequence
				.replace(anyVariationSelector, '')
				.split(zeroWidthJoiner)
				.map(codepoint => {
					const [cp, mod] = codepoint.trim().split(' ');
					return nameForCp[cp] + (mod ? `, ${nameForCp[mod]}` : '');
				})
				.join(', ');
			return {
				name: joinedName,
				defaultPresentation: 'emoji',
				presentation: {
					default: {
						sequence: datum.sequence,
						output: codepointSequenceToString(datum.sequence),
					},
				},
			}
		});

	// Assemble enhanced emoji data:
	const emojiPresentations = specs.emojiData.data.emojiPresentation;
	specs.emojiData.data.enhanced = specs.emojiData.data.emoji.map(datum => {
		const codepoint = datum.codepoint;
		const isDefaultEmojiPresentation = emojiPresentations.some(ep => ep.codepoint === codepoint);
		const variationSequence = specs.standardizedVariants.data.variationSequencesForCodepoint[codepoint];
		const combination = Object.keys(specs.emojiSequences.data.compatibleCodepointsForCombiningMark)
			.reduce((combinationForCombiningMarkProp, mark) => {
				const markPropertyKey = combiningMarks[mark].propertyKey;
				const compatibleCodepoints = specs.emojiSequences.data.compatibleCodepointsForCombiningMark[mark];
				if (compatibleCodepoints[codepoint] == null) {
					return combinationForCombiningMarkProp; // return early
				}
				// tr51: Combining marks may be applied to emoji, just like they can
				// be applied to other characters. When a combining mark is applied
				// to a code point, the combination should take on an emoji presentation.
				// StandardizedVariants.txt defines both emoji and text variations to be
				// compatible with keycap marks and implementations also support both.
				// Furthermore, EmojiSources.txt indicates keycap mark be joined
				// without a variation sequence present.
				// -> So as a consequence we support all three presentations:
				const defaultPresentation = `${codepoint} ${mark}`;
				const textPresentation = `${codepoint} ${variationSelector.text} ${mark}`;
				const emojiPresentation = `${codepoint} ${variationSelector.emoji} ${mark}`;
				combinationForCombiningMarkProp[markPropertyKey] = compatibleCodepoints[codepoint] == null ? undefined : {
					name: compatibleCodepoints[codepoint],
					presentation: {
						default: {
							sequence: defaultPresentation,
							output: codepointSequenceToString(defaultPresentation),
						},
						variation: {
							text: {
								sequence: textPresentation,
								output: codepointSequenceToString(textPresentation),
							},
							emoji: {
								sequence: emojiPresentation,
								output: codepointSequenceToString(emojiPresentation),
							},
						},
					},
				};
				return combinationForCombiningMarkProp;
			}, {});
		const modification = specs.emojiData.data.emojiModifierBase[codepoint];
		return Object.assign({}, {
			codepoint,
			shiftJis: specs.emojiSources.data.shiftJisByCarrierForCodepoint[codepoint],
			name: specs.unicodeData.data.nameForCodepoint[codepoint],
			defaultPresentation: isDefaultEmojiPresentation ? 'emoji' : 'text',
			presentation: {
				default: {
					sequence: codepoint, // only the base without explicit variation
					output: codepointSequenceToString(codepoint),
				},
				variation: !variationSequence ? undefined : {
					text: {
						sequence: variationSequence.text,
						output: codepointSequenceToString(variationSequence.text),
					},
					emoji: {
						sequence: variationSequence.emoji,
						output: codepointSequenceToString(variationSequence.emoji),
					},
				},
			},
			combination: Object.keys(combination).length > 0 ? combination : undefined,
			modification,
		});
	});

	specs.emojiData.data.combined = [
		specs.emojiData.data.enhanced,
		specs.emojiSequences.data.flagEmoji,
		specs.emojiZwjSequences.data.joinedEmoji,
	];

	// specsArray.forEach(spec => fs.writeFileSync(`./json/${spec.name}.json`, JSON.stringify(spec.data, null, 2)));
	fs.writeFileSync('./json/combined.json', JSON.stringify(specs.emojiData.data.combined, null, 2));
});
