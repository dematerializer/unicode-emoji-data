// NOTE: need to use ES5 here because this file will be included in the npm package!

/* eslint-disable */

var expandEmojiData = require('./build/expand-emoji-data.js').default;

var emojiData = {
	v3: require('./lib/v3.json'),
	v4: require('./lib/v4.json')
};

var expandedEmojiData = {
	v3: expandEmojiData(emojiData.v3),
	v4: expandEmojiData(emojiData.v4)
};

module.exports = {
	v3: {
		full: emojiData.v3,
		expanded: expandedEmojiData.v3
	},
	v4: {
		full: emojiData.v4,
		expanded: expandedEmojiData.v4
	}
};
