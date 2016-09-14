import fetch from 'node-fetch';
import parse from '../utils/parse';

// UnicodeData.txt provides code point names.
const defaultUrl = 'http://www.unicode.org/Public/9.0.0/ucd/UnicodeData.txt';

// Transforms data to map each code point to a name, e.g.
// {
// 	...
// 	"1F600": "GRINNING FACE",
// 	"1F601": "GRINNING FACE WITH SMILING EYES",
// 	...
// }
function buildNameForCodepoint(data) {
	return data.reduce((nameForCp, datum) => {
		const extNameForCp = nameForCp;
		extNameForCp[datum.codepoint] = datum.name;
		return extNameForCp;
	}, {});
}

export const internals = {
	defaultUrl,
	buildNameForCodepoint,
};

export default function* UnicodeData({ url = defaultUrl }) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['codepoint', 'name']);
	const nameForCodepoint = buildNameForCodepoint(data);
	return { // API
		getNameForCodepoint: codepoint => nameForCodepoint[codepoint],
	};
}
