import 'isomorphic-fetch';
import parse from './parse';

// emoji-variation-sequences.txt provides variation sequences.
// Some Unicode characters are normally displayed as emoji; some are normally
// displayed as ordinary text, and some can be displayed both ways.
// A variation selector that can modify the appearance of a preceding emoji character in
// a variation sequence is used to select which presentation style (emoji or text) a character should have
// U+FE0E VARIATION SELECTOR-15 (VS15) for a text presentation style
// U+FE0F VARIATION SELECTOR-16 (VS16) for an emoji presentation style
// Only the specific subset of emoji characters defined in this file can have both emoji and text presentation
// styles - all others get their presentation style implicitly without the need to append a variation selector.
const defaultUrl = 'http://www.unicode.org/Public/emoji/5.0/emoji-variation-sequences.txt';

// Variation selectors that can modify the appearance of
// a preceding emoji character in a variation sequence:
const variationSelectors = {
	text: 'FE0E',  // VARIATION SELECTOR-15 (VS15) for a text presentation
	emoji: 'FE0F', // VARIATION SELECTOR-16 (VS16) for an emoji presentation
};

// Maps variation sequences grouped by style to each
// code point that supports both text and emoji styles:
// {
// 	"0023": { // NUMBER SIGN
// 		"text": "0023 FE0E",
// 		"emoji": "0023 FE0F",
// 	},
// 	...
// }
function buildVariationSequencesForCodepoint(data) {
	return data.reduce((varSeqForCp, datum) => {
		const [cp, vs] = datum.sequence.split(' ');
		const nextVarSeqForCp = varSeqForCp;
		if (nextVarSeqForCp[cp] == null) {
			nextVarSeqForCp[cp] = {};
		}
		Object.keys(variationSelectors).forEach((style) => {
			if (vs === variationSelectors[style]) {
				nextVarSeqForCp[cp][style] = datum.sequence;
			}
		});
		return nextVarSeqForCp;
	}, {});
}

export const internals = {
	defaultUrl,
	variationSelectors,
	buildVariationSequencesForCodepoint,
};

export default function* VariationSequences({ url = defaultUrl }) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['sequence']);
	const variationSequencesForCodepoint = buildVariationSequencesForCodepoint(data);
	return { // API
		getVariationSequencesForCodepoint: codepoint => variationSequencesForCodepoint[codepoint],
	};
}
