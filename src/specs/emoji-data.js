// emoji-data
// emoji-data.txt provides emoji code points.
// Property "Emoji=Yes" means "emoji character", a character that is recommended for use as emoji
// If property "Emoji=No", then "Emoji_Presentation=No", "Emoji_Modifier=No" and "Emoji_Modifier_Base=No"
// Property "Emoji_Presentation=Yes" means "default emoji presentation character",
//   a character that, by default, should appear with an emoji presentation style
// Property "Emoji_Presentation=No" means "default text presentation character",
//   a character that, by default, should appear with a text presentation style
// Property "Emoji_Modifier=Yes" — A character that can be used to modify the appearance of a preceding emoji in an emoji modifier sequence
// property="Emoji_Modifier_Base" means A character whose appearance can be modified by a subsequent emoji modifier in an emoji modifier sequence
const defaultUrl = 'http://www.unicode.org/Public/emoji/3.0/emoji-data.txt';

import fetch from 'node-fetch';
import leftPad from 'left-pad'; // FTW!
import parse from '../utils/parse';
import { codepointSequenceToString } from '../utils/convert';

export default function* EmojiData(url = defaultUrl, getNameForCodepoint, getVariationSequencesForCodepoint, getCombinationsForCodepoint, getShiftJisCodeByCarrierForCodepoint) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['codepoints', 'property']);

	// Expand code point ranges (e.g. '1F601..1F610') into separate objects:
	const expandedEmojiData = data
		.reduce((expanded, datum) => {
			if (datum.codepoints.indexOf('..') > -1) {
				const codepointRange = datum.codepoints.split('..').map(cp => parseInt(cp, 16));
				const [lowCodepoint, highCodepoint] = codepointRange;
				for (let cp = lowCodepoint; cp <= highCodepoint; cp++) {
					const cpHex = leftPad(cp.toString(16), 4, 0).toUpperCase();
					expanded.push({
						...datum,
						codepoint: cpHex,
						codepoints: undefined, // no longer needed
					});
				}
			} else {
				expanded.push({
					...datum,
					codepoint: datum.codepoints,
					codepoints: undefined, // no longer needed
				});
			}
			return expanded;
		}, []);

	// Group emojiData by property:
	const emoji = expandedEmojiData.filter(datum => datum.property === 'Emoji');
	const emojiPresentation = expandedEmojiData.filter(datum => datum.property === 'Emoji_Presentation');
	const emojiModifier = expandedEmojiData.filter(datum => datum.property === 'Emoji_Modifier');
	const emojiModifierBase = expandedEmojiData.filter(datum => datum.property === 'Emoji_Modifier_Base');

	// Build emoji modifier map (maps each modifier code point to a name), e.g.
	// {
	// 	...
	// 	'1F3FB': 'EMOJI MODIFIER FITZPATRICK TYPE-1-2',
	// 	...
	// }
	const nameForModifierCodepoint = emojiModifier
		.reduce((nameForModifierCodepoint, datum) => {
			nameForModifierCodepoint[datum.codepoint] = getNameForCodepoint(datum.codepoint);
			return nameForModifierCodepoint;
		}, {});

	// Build map of emoji that can be modified (maps each modifiable code point to a modifier sequence).
	// Those are basically all emoji that have skin variations:
	const modifierSequencesForModifiableCodepoint = emojiModifierBase
		.reduce((modifierSequencesForModifiableCodepoint, baseDatum) => {
			modifierSequencesForModifiableCodepoint[baseDatum.codepoint] = Object.keys(nameForModifierCodepoint)
				.reduce((sequenceForModifierName, modifierCodepoint) => {
					const sequence = `${baseDatum.codepoint} ${modifierCodepoint}`;
					sequenceForModifierName[nameForModifierCodepoint[modifierCodepoint]] = {
						sequence,
						output: codepointSequenceToString(sequence),
					};
					return sequenceForModifierName;
				}, {});
			return modifierSequencesForModifiableCodepoint;
		}, {});

		// Assemble enhanced emoji data:
		const enhanced = emoji.map(datum => {
			const codepoint = datum.codepoint;
			const isDefaultEmojiPresentation = emojiPresentation.some(ep => ep.codepoint === codepoint);
			const variationSequences = getVariationSequencesForCodepoint(codepoint);
			const combinations = getCombinationsForCodepoint(codepoint);
			const modifications = modifierSequencesForModifiableCodepoint[codepoint] == null ? undefined : {
				skin: modifierSequencesForModifiableCodepoint[codepoint],
			};
			return {
				name: getNameForCodepoint(codepoint),
				codepoint,
				shiftJis: getShiftJisCodeByCarrierForCodepoint(codepoint),
				defaultPresentation: isDefaultEmojiPresentation ? 'emoji' : 'text',
				presentation: {
					default: {
						sequence: codepoint, // only the base without explicit variation
						output: codepointSequenceToString(codepoint),
					},
					variation: !variationSequences ? undefined : {
						text: {
							sequence: variationSequences.text,
							output: codepointSequenceToString(variationSequences.text),
						},
						emoji: {
							sequence: variationSequences.emoji,
							output: codepointSequenceToString(variationSequences.emoji),
						},
					},
				},
				combination: Object.keys(combinations).length > 0 ? combinations : undefined,
				modification: modifications,
			};
		});

	return { // API
		emoji: enhanced,
	};
}
