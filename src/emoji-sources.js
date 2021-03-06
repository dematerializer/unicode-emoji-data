import 'isomorphic-fetch';
import parse from './parse';

// EmojiSources.txt provides mappings between unicode code points and sequences
// on one hand and Shift-JIS codes for cell phone carrier symbols on the other hand.
const defaultUrl = 'http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt';

// Build a structure that maps each unicode code point or sequence
// to one or more Shift-JIS codes for cell phone carrier symbols, e.g.
// {
// 	...
// 	"0023 20E3": { // unicode
// 		"docomo": "F985",
// 		"kddi": "F489",
// 		"softbank": "F7B0",
// 	},
// 	...
// }
function buildShiftJisCodesForCodepoint(data) {
	return data.reduce((sjisForCp, datum) => {
		const nextSjisForCp = sjisForCp;
		if (datum.docomo.length > 0 || datum.kddi.length > 0 || datum.softbank.length > 0) {
			nextSjisForCp[datum.unicode] = {
				docomo: datum.docomo.length > 0 ? datum.docomo : undefined,
				kddi: datum.kddi.length > 0 ? datum.kddi : undefined,
				softbank: datum.softbank.length > 0 ? datum.softbank : undefined,
			};
		}
		return nextSjisForCp;
	}, {});
}

export const internals = {
	defaultUrl,
	buildShiftJisCodesForCodepoint,
};

export default function* EmojiSources({ url = defaultUrl }) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['unicode', 'docomo', 'kddi', 'softbank']);
	const shiftJisCodesForCodepoint = buildShiftJisCodesForCodepoint(data);
	return { // API
		getShiftJisCodesForCodepoint: codepoint => shiftJisCodesForCodepoint[codepoint],
	};
}
