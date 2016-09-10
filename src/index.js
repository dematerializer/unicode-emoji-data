process.on('uncaughtException', err => console.error(err));
process.on('unhandledRejection', err => console.error(err));

import co from 'co';
import fs from 'fs';

import UnicodeData from './specs/unicode-data';
import EmojiSources from './specs/emoji-sources';
import EmojiSequences from './specs/emoji-sequences';
import StandardizedVariants from './specs/standardized-variants';
import EmojiZwjSequences from './specs/emoji-zwj-sequences';
import EmojiData from './specs/emoji-data';

co(function* () {
	const unicodeData = yield UnicodeData({
		url: 'http://www.unicode.org/Public/9.0.0/ucd/UnicodeData.txt',
	});
	const emojiSources = yield EmojiSources({
		url: 'http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt',
	});
	const emojiSequences = yield EmojiSequences({
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-sequences.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
	});
	const standardizedVariants = yield StandardizedVariants({
		url: 'http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt',
	});
	const emojiZwjSequences = yield EmojiZwjSequences({
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
	});
	const emojiData = yield EmojiData({
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-data.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
		getCombinationsForCodepoint: emojiSequences.getCombinationsForCodepoint,
		getShiftJisCodeByCarrierForCodepoint: emojiSources.getShiftJisCodeByCarrierForCodepoint,
	});
	const combined = [
		...emojiData.emoji,
		...emojiSequences.flagEmoji,
		...emojiZwjSequences.zwjEmoji,
	];
	fs.writeFileSync('lib/emoji.json', JSON.stringify(combined, null, 2));
});
