import expandEmojiData from './expand-emoji-data';
import emojiDataV3 from './emoji-data-v3.json';
import emojiDataV4 from './emoji-data-v4.json';

const expandedEmojiDataV3 = expandEmojiData(emojiDataV3);
const expandedEmojiDataV4 = expandEmojiData(emojiDataV4);

export default {
	v3: {
		full: emojiDataV3,
		expanded: expandedEmojiDataV3,
	},
	v4: {
		full: emojiDataV4,
		expanded: expandedEmojiDataV4,
	},
};
