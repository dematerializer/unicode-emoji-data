// NOTE: need to use ES5 here because this file will be included in the npm package!

/* eslint-disable */

var punycode = require('punycode');

// Extracts a simplified, human readable representation from an emoji datum:
function extractEmojiInfoFromDatum(datum) {
	// prefer explicit emoji presentation variation sequence
	var sequence = datum.presentation.variation ? datum.presentation.variation.emoji : datum.presentation.default;
	return {
		name: datum.name,
		sequence,
		output: punycode.ucs2.encode(sequence.split(' ').map(function (cp) {
			return parseInt(cp, 16);
		})),
	};
}

module.exports.internals = {
	extractEmojiInfoFromDatum,
};

// Expands all emoji data entries such that each combination and each
// modification of one entry results in a separate, simplified entry:
module.exports.default = function expandEmojiData(data) {
	var expandedEmojiOnly = [];
	data.forEach(function (datum) {
		if (datum.combination) {
			Object.keys(datum.combination).forEach(function (combiningMark) {
				return expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.combination[combiningMark]));
			});
		} else {
			expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum));
		}
		if (datum.modification && datum.modification.skin) {
			Object.keys(datum.modification.skin).forEach(function (type) {
				return expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.modification.skin[type]));
			});
		}
	});
	return expandedEmojiOnly;
};
