const expandEmojiData = require('./expand-emoji-data.js');

const emojiData = {
	v3: require('./emoji-data-v3.json'), // eslint-disable-line global-require
	v4: require('./emoji-data-v4.json'), // eslint-disable-line global-require
};

const expandedEmojiData = {
	v3: expandEmojiData(emojiData.v3),
	v4: expandEmojiData(emojiData.v4),
};

export default {
	v3: {
		full: emojiData.v3,
		expanded: expandedEmojiData.v3,
	},
	v4: {
		full: emojiData.v4,
		expanded: expandedEmojiData.v4,
	},
};
