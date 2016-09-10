// emoji-zwj-sequences
// emoji-zwj-sequences.txt provides Zero-Width-Joiner sequences.
const defaultUrl = 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt';

import fetch from 'node-fetch';
import parse from '../utils/parse';
import { codepointSequenceToString } from '../utils/convert';

export default function* EmojiZwjSequences({ url = defaultUrl, getNameForCodepoint }) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['sequence', 'type', 'description']);

	const zeroWidthJoiner = '200D';
	const anyVariationSelector = /FE0E|FE0F/g;
	const anyModifier = /1F3FB|1F3FC|1F3FD|1F3FE|1F3FF/g;

	// Build additional emoji entries from Zero-Width-Joiner sequences:
	const zwjEmoji = data
		.filter(datum => datum.sequence.match(anyModifier) == null)
		.map(datum => {
			const joinedName = datum.sequence
				.replace(anyVariationSelector, '')
				.split(zeroWidthJoiner)
				.map(codepoint => {
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
			}
		});

	data
		.filter(datum => datum.sequence.match(anyModifier) != null)
		.forEach(datum => {
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

	return { // API
		zeroWidthJoiner,
		zwjEmoji,
	};
}
