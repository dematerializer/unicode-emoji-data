// emoji-sources
// EmojiSources.txt provides mappings between unicode code points and sequences
// on one hand and Shift-JIS codes for cell phone carrier symbols on the other hand.
const defaultUrl = 'http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt';

const parse = require('./parse');
const fetch = require('node-fetch');

module.exports = function* (url = defaultUrl) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['unicode', 'docomo', 'kddi', 'softbank']);

	// Transform data to map each unicode code point or sequence
	// to a Shift-JIS code for cell phone carriers, e.g.
	// {
	// 	...
	// 	'0023 20E3': { // unicode
	// 		'docomo': 'F985',
	// 		'kddi': 'F489',
	// 		'softbank': 'F7B0',
	// 	},
	// 	...
	// }
	const shiftJisCodeByCarrierForCodepointMap = data.reduce((map, datum) => {
		if (datum.docomo.length > 0 || datum.kddi.length > 0 || datum.softbank.length > 0) {
			map[datum.unicode] = {
				docomo: datum.docomo.length > 0 ? datum.docomo : undefined,
				kddi: datum.kddi.length > 0 ? datum.kddi : undefined,
				softbank: datum.softbank.length > 0 ? datum.softbank : undefined,
			};
		}
		return map;
	}, {});
	
	return { // API
		getShiftJisCodeByCarrierForCodepoint: codepoint => shiftJisCodeByCarrierForCodepointMap[codepoint],
	};
};
