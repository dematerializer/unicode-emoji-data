import fetch from 'node-fetch';
import parse from '../utils/parse';
import { codepointSequenceToString } from '../utils/convert';

// emoji-zwj-sequences.txt provides Zero-Width-Joiner sequences.
const defaultUrl = 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt';

const zeroWidthJoiner = '200D';
const anyVariationSelector = /FE0E|FE0F/g;
const anyModifier = /1F3FB|1F3FC|1F3FD|1F3FE|1F3FF/g;

// Build additional emoji entries from Zero-Width-Joiner sequences:
// [
// 	...
// 	{
// 		"name": "MAN, ROCKET",
// 		"defaultPresentation": "emoji",
// 		"presentation": {
// 			"default": {
// 				"sequence": "1F468 200D 1F680",
// 				"output": "👨‍🚀"
// 			}
// 		},
// 		"modification": {
// 			"skin": {
// 				"EMOJI MODIFIER FITZPATRICK TYPE-1-2": {
// 					"sequence": "1F468 1F3FB 200D 1F680",
// 					"output": "👨🏻‍🚀"
// 				},
// 				"EMOJI MODIFIER FITZPATRICK TYPE-3": {
// 					"sequence": "1F468 1F3FC 200D 1F680",
// 					"output": "👨🏼‍🚀"
// 				},
// 				"EMOJI MODIFIER FITZPATRICK TYPE-4": {
// 					"sequence": "1F468 1F3FD 200D 1F680",
// 					"output": "👨🏽‍🚀"
// 				},
// 				"EMOJI MODIFIER FITZPATRICK TYPE-5": {
// 					"sequence": "1F468 1F3FE 200D 1F680",
// 					"output": "👨🏾‍🚀"
// 				},
// 				"EMOJI MODIFIER FITZPATRICK TYPE-6": {
// 					"sequence": "1F468 1F3FF 200D 1F680",
// 					"output": "👨🏿‍🚀"
// 				}
// 			}
// 		}
// 	},
// 	...
// ]
function buildZwjEmoji(data, getNameForCodepoint) {
	const zwjEmoji = data.filter(datum =>
		datum.sequence.match(anyModifier) == null
	)
	.map((datum) => {
		const joinedName = datum.sequence
			.replace(anyVariationSelector, '')
			.split(zeroWidthJoiner)
			.map((codepoint) => {
				const [cp] = codepoint.trim().split(' ');
				return getNameForCodepoint(cp);
			})
			.join(', ');
		return {
			// no codepoint prop here because it's technically just a combination of other codepoints
			name: joinedName,
			defaultPresentation: 'emoji',
			presentation: {
				default: {
					sequence: datum.sequence,
					output: codepointSequenceToString(datum.sequence),
				},
			},
		};
	});
	data.filter(datum =>
		datum.sequence.match(anyModifier) != null
	)
	.forEach((datum) => {
		const [cp, mod, ...rest] = datum.sequence.replace(anyVariationSelector, '').trim().split(' ');
		const parentDatum = zwjEmoji.find(d =>
			d.presentation.default.sequence.includes(cp) && d.presentation.default.sequence.includes(rest[rest.length - 1])
		);
		if (parentDatum) {
			if (parentDatum.modification == null) {
				parentDatum.modification = { skin: {} };
			}
			parentDatum.modification.skin[getNameForCodepoint(mod)] = {
				sequence: datum.sequence,
				output: codepointSequenceToString(datum.sequence),
			};
		} else {
			console.warn('No parent datum found for', datum);
		}
	});
	return zwjEmoji;
}

export const internals = {
	defaultUrl,
	zeroWidthJoiner,
	buildZwjEmoji,
};

export default function* EmojiZwjSequences({ url = defaultUrl, getNameForCodepoint }) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['sequence', 'type', 'description']);
	const zwjEmoji = buildZwjEmoji(data, getNameForCodepoint);
	return { // API
		zeroWidthJoiner,
		zwjEmoji,
	};
}
