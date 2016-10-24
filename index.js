// NOTE: need to use ES2015 here because this file will be included in the npm package!

const expandEmojiData = require('./build/expand-emoji-data.js').default;

const emojiData = {
	'unicode-9-emoji-3': require('./lib/emoji-data-unicode-9-emoji-3.json'), // eslint-disable-line global-require
	'unicode-9-emoji-4': require('./lib/emoji-data-unicode-9-emoji-4.json'), // eslint-disable-line global-require
};

const expandedEmojiData = {
	'unicode-9-emoji-3': expandEmojiData(emojiData['unicode-9-emoji-3']),
	'unicode-9-emoji-4': expandEmojiData(emojiData['unicode-9-emoji-4']),
};

module.exports = {
	presets: Object.keys(emojiData),
	emojiData: emojiData, // eslint-disable-line object-shorthand
	expandedEmojiData: expandedEmojiData, // eslint-disable-line object-shorthand
};
