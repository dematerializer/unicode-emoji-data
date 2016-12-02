const punycode = require('punycode');

// Extracts a simplified, human readable representation from an emoji datum:
const extractEmojiInfoFromDatum = (datum, presentation) => {
	let sequence;
	switch (presentation) {
		case 'default':
			sequence = datum.presentation.default;
			break;
		case 'text':
		case 'emoji':
			sequence = datum.presentation.variation[presentation];
			break;
		default:
			// Prefer emoji presentation variation sequence if not specified otherwise explicitly:
			sequence = datum.presentation.variation ? datum.presentation.variation.emoji : datum.presentation.default;
	}
	return {
		name: datum.name,
		sequence,
		output: punycode.ucs2.encode(sequence.split(' ').map(cp => parseInt(cp, 16))),
	};
};

export const internals = {
	extractEmojiInfoFromDatum,
};

// Expands all emoji data entries such that each combination and each
// modification of one entry results in a separate, simplified entry:
export default function expandEmojiData(data) {
	const expandedEmojiOnly = [];
	data.forEach((datum) => {
		if (datum.combination) {
			Object.keys(datum.combination).forEach(combiningMark =>
				// Combinations should take on an emoji presentation by default,
				// no explicit emoji presentation variation selector needed:
				expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.combination[combiningMark], 'default')),
			);
		} else {
			expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum));
		}
		if (datum.modification && datum.modification.skin) {
			Object.keys(datum.modification.skin).forEach(type =>
				expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.modification.skin[type])),
			);
		}
	});
	return expandedEmojiOnly;
}
