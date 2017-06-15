import 'isomorphic-fetch';
import parse from './parse';
import preset from './preset';

// emoji-zwj-sequences.txt provides Zero-Width-Joiner sequences.
const defaultUrl = preset.emojiZwjSequencesUrl;

const zeroWidthJoiner = '200D';
const anyVariationSelector = /FE0E|FE0F/g;
const anyModifier = /1F3FB|1F3FC|1F3FD|1F3FE|1F3FF/g;

// Build additional emoji entries from zero width joiner sequences:
// [
// 	...
// 	{
// 		"name": "MAN, ROCKET",
// 		"defaultPresentation": "emoji",
// 		"presentation": {
// 			"default": "1F468 200D 1F680",
// 		},
// 		"modification": {
// 			"skin": {
// 				"type-1-2": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-1-2
// 					"name": "MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-1-2",
// 					"defaultPresentation": "emoji",
// 					"presentation": {
// 						"default": "1F468 1F3FB 200D 1F680",
// 					}
// 				},
// 				"type-3": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-3
// 					"name": "MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-3",
// 					"defaultPresentation": "emoji",
// 					"presentation": {
// 						"default": "1F468 1F3FC 200D 1F680",
// 					}
// 				},
// 				"type-4": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-4
// 					"name": "MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-4",
// 					"defaultPresentation": "emoji",
// 					"presentation": {
// 						"default": "1F468 1F3FD 200D 1F680",
// 					}
// 				},
// 				"type-5": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-5
// 					"name": "MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-5",
// 					"defaultPresentation": "emoji",
// 					"presentation": {
// 						"default": "1F468 1F3FE 200D 1F680",
// 					}
// 				},
// 				"type-6": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-6
// 					"name": "MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-6",
// 					"defaultPresentation": "emoji",
// 					"presentation": {
// 						"default": "1F468 1F3FF 200D 1F680",
// 					}
// 				}
// 			}
// 		}
// 	},
// 	...
// ]
function buildZwjEmoji(
	data,
	getNameForCodepoint,
	getMetaForModifierName,
	getEmojiVersionForCodepoint,
	getUnicodeVersionForCodepoint,
) {
	const zwjEmoji = data.filter(datum =>
		datum.sequence.match(anyModifier) == null,
	)
	.map((datum) => {
		const joinedName = datum.sequence
			.replace(anyVariationSelector, '')
			.split(zeroWidthJoiner)
			.map(codepoint => getNameForCodepoint(codepoint.trim().split(' ')[0]))
			.join(', ');
		return {
			// no codepoint prop here because it's technically just a combination of other codepoints
			name: joinedName,
			defaultPresentation: 'emoji',
			presentation: {
				default: datum.sequence,
			},
			version: getEmojiVersionForCodepoint(datum.sequence),
			unicodeVersion: getUnicodeVersionForCodepoint(datum.sequence),
		};
	});
	data.filter(datum =>
		datum.sequence.match(anyModifier),
	)
	.forEach((datum) => {
		const [cp, mod, ...rest] = datum.sequence.replace(anyVariationSelector, '').trim().split(' ');
		const parentDatum = zwjEmoji.find(d =>
			d.presentation.default.includes(cp) && d.presentation.default.includes(rest[rest.length - 1]),
		);
		/* istanbul ignore else */
		if (parentDatum) {
			if (parentDatum.modification == null) {
				parentDatum.modification = { skin: {} };
			}
			const modName = getNameForCodepoint(mod);
			const nameMeta = getMetaForModifierName(modName);
			parentDatum.modification.skin[nameMeta.propKey] = {
				name: `${parentDatum.name}; ${nameMeta.nameExt}`,
				defaultPresentation: 'emoji',
				presentation: {
					default: datum.sequence,
				},
				version: getEmojiVersionForCodepoint(datum.sequence),
				unicodeVersion: getUnicodeVersionForCodepoint(datum.sequence),
			};
		} // else no parent datum found for datum.sequence
	});
	return zwjEmoji;
}

export const internals = {
	defaultUrl,
	zeroWidthJoiner,
	buildZwjEmoji,
};

export default function* EmojiZwjSequences({
	url = defaultUrl,
	getNameForCodepoint,
	getMetaForModifierName,
	getEmojiVersionForCodepoint,
	getUnicodeVersionForCodepoint,
}) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['sequence', 'type', 'description']);
	const zwjEmoji = buildZwjEmoji(
		data,
		getNameForCodepoint,
		getMetaForModifierName,
		getEmojiVersionForCodepoint,
		getUnicodeVersionForCodepoint,
	);
	return { // API
		zeroWidthJoiner,
		zwjEmoji,
	};
}
