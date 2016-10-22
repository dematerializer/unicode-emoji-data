import punycode from 'punycode';

function extractEmojiInfoFromDatum(datum) {
	const sequence = datum.presentation.variation ? datum.presentation.variation.emoji : datum.presentation.default;
	return {
		name: datum.name,
		sequence,
		output: punycode.ucs2.encode(sequence.split(' ').map(cp => parseInt(cp, 16))),
	};
}

export const internals = {
	extractEmojiInfoFromDatum,
};

export default function expandEmojiData(data) {
	const expandedEmojiOnly = [];
	data.forEach((datum) => {
		if (datum.combination) {
			Object.keys(datum.combination).forEach(combiningMark =>
				expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.combination[combiningMark]))
			);
		} else {
			expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum));
		}
		if (datum.modification && datum.modification.skin) {
			Object.keys(datum.modification.skin).forEach(type =>
				expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.modification.skin[type]))
			);
		}
	});
	return expandedEmojiOnly;
}
