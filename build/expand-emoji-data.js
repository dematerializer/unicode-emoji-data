// NOTE: need to use ES2015 here because this file will be included in the package!

const punycode = require('punycode');

// Extracts a simplified, human readable representation from an emoji datum:
function extractEmojiInfoFromDatum(datum) {
	// prefer explicit emoji presentation variation sequence
	const sequence = datum.presentation.variation ? datum.presentation.variation.emoji : datum.presentation.default;
	return {
		name: datum.name,
		sequence,
		output: punycode.ucs2.encode(sequence.split(' ').map(cp => parseInt(cp, 16))),
	};
}

module.exports.internals = {
	extractEmojiInfoFromDatum,
};

// Expands all emoji data entries such that each combination and each
// modification of one entry results in a separate, simplified entry:
module.exports.default = function expandEmojiData(data) {
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
};
