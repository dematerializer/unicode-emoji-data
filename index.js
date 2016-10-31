// NOTE: need to use ES5 here because this file will be included in the npm package!

/* eslint-disable */

var expandEmojiData = require('./build/expand-emoji-data.js').default;

var emojiData = {
	'unicode-9-emoji-3': require('./lib/emoji-data-unicode-9-emoji-3.json'),
	'unicode-9-emoji-4': require('./lib/emoji-data-unicode-9-emoji-4.json'),
};

var expandedEmojiData = {
	'unicode-9-emoji-3': expandEmojiData(emojiData['unicode-9-emoji-3']),
	'unicode-9-emoji-4': expandEmojiData(emojiData['unicode-9-emoji-4']),
};

module.exports = {
	presets: Object.keys(emojiData),
	emojiData: emojiData,
	expandedEmojiData: expandedEmojiData,
};
