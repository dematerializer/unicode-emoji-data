// standardized-variants
// StandardizedVariants.txt provides variation sequences.
// Some Unicode characters are normally displayed as emoji; some are normally
// displayed as ordinary text, and some can be displayed both ways.
// A variation selector that can modify the appearance of a preceding emoji character in
// a variation sequence is used to select which presentation style (emoji or text) a character should have
// U+FE0E VARIATION SELECTOR-15 (VS15) for a text presentation style
// U+FE0F VARIATION SELECTOR-16 (VS16) for an emoji presentation style
// Only the specific subset of emoji characters defined in this file can have both emoji and text presentation
// styles - all others get their presentation style implicitly without the need to append a variation selector.
const defaultUrl = 'http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt';

import fetch from 'node-fetch';
import parse from '../utils/parse';

export default function* StandardizedVariants({ url = defaultUrl }) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['sequence', 'description']);

	// Variation selectors that can modify the appearance of
	// a preceding emoji character in a variation sequence:
	const variationSelectors = {
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
	const variationSequencesForCodepoint = data
		.filter(datum => {
			const hasTextVariationSelector = datum.sequence.includes(variationSelectors.text);
			const hasEmojiVariationSelector = datum.sequence.includes(variationSelectors.emoji);
			return hasTextVariationSelector || hasEmojiVariationSelector;
		})
		.reduce((variationSequencesForCodepoint, datum) => {
			const [ cp, vs ] = datum.sequence.split(' ');
			if (variationSequencesForCodepoint[cp] == null) {
				variationSequencesForCodepoint[cp] = {};
			}
			Object.keys(variationSelectors).forEach(style => {
				if (vs === variationSelectors[style]) {
					variationSequencesForCodepoint[cp][style] = datum.sequence;
				}
			});
			return variationSequencesForCodepoint;
		}, { // initial map
			// emoji-zwj-sequences.txt v4.0 mentions: "three characters used in emoji zwj sequences
			// with the emoji variation selector do not yet appear in StandardizedVariants.txt"
			// - so we add them here manually:
			'2640': { // FEMALE SIGN
				'text': `2640 ${variationSelectors.text}`,
				'emoji': `2640 ${variationSelectors.emoji}`,
			},
			'2642': { // MALE SIGN
				'text': `2642 ${variationSelectors.text}`,
				'emoji': `2642 ${variationSelectors.emoji}`,
			},
			'2695': { // STAFF OF AESCULAPIUS
				'text': `2695 ${variationSelectors.text}`,
				'emoji': `2695 ${variationSelectors.emoji}`,
			},
		});
	return { // API
		getVariationSequencesForCodepoint: codepoint => variationSequencesForCodepoint[codepoint],
	};
}