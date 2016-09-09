// unicode-data
// UnicodeData.txt provides code point names.
const defaultUrl = 'http://www.unicode.org/Public/9.0.0/ucd/UnicodeData.txt';

const parse = require('./parse');
const fetch = require('node-fetch');

module.exports = function* (url = defaultUrl) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['codepoint', 'name']);

	// Transform data to map each code point to a name, e.g.
	// {
	// 	...
	// 	'1F600': 'GRINNING FACE',
	// 	'1F601': 'GRINNING FACE WITH SMILING EYES',
	// 	...
	// }
	const nameForCodepoint = data.reduce((nameForCodepoint, datum) => {
		nameForCodepoint[datum.codepoint] = datum.name;
		return nameForCodepoint;
	}, {});

	return { // API
		getNameForCodepoint: codepoint => nameForCodepoint[codepoint],
	};
};
