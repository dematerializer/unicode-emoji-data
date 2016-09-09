process.on('uncaughtException', (err) => console.error(err));
process.on('unhandledRejection', (err) => console.error(err));

const co = require('co');
const fs = require('fs');

const UnicodeData = require('./unicode-data');
const EmojiSources = require('./emoji-sources');
const EmojiSequences = require('./emoji-sequences');
const StandardizedVariants = require('./standardized-variants');
const EmojiZwjSequences = require('./emoji-zwj-sequences');
const EmojiData = require('./emoji-data');

co(function* () {
	const unicodeData = yield UnicodeData('http://www.unicode.org/Public/9.0.0/ucd/UnicodeData.txt');
	const emojiSources = yield EmojiSources('http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt');
	const emojiSequences = yield EmojiSequences('http://www.unicode.org/Public/emoji/3.0/emoji-sequences.txt', unicodeData.getNameForCodepoint);
	const standardizedVariants = yield StandardizedVariants('http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt');
	const emojiZwjSequences = yield EmojiZwjSequences('http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt', unicodeData.getNameForCodepoint);
	const emojiData = yield EmojiData(
		'http://www.unicode.org/Public/emoji/3.0/emoji-data.txt',
		unicodeData.getNameForCodepoint,
		standardizedVariants.getVariationSequencesForCodepoint,
		emojiSequences.getCombinationsForCodepoint,
		emojiSources.getShiftJisCodeByCarrierForCodepoint
	);
	const combined = [
		...emojiData.emoji,
		...emojiSequences.flagEmoji,
		...emojiZwjSequences.zwjEmoji,
	];
	fs.writeFileSync('./json/combined.json', JSON.stringify(combined, null, 2));
});
