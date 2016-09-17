import co from 'co';
import fs from 'fs';

import buildUnicodeData from './specs/unicode-data';
import buildEmojiSources from './specs/emoji-sources';
import buildEmojiSequences from './specs/emoji-sequences';
import buildStandardizedVariants from './specs/standardized-variants';
import buildEmojiZwjSequences from './specs/emoji-zwj-sequences';
import buildEmojiData from './specs/emoji-data';
import { codepointSequenceToString } from './utils/convert';

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

co(function* main() {
	const unicodeData = yield buildUnicodeData({
		url: 'http://www.unicode.org/Public/9.0.0/ucd/UnicodeData.txt',
	});

	const emojiSources = yield buildEmojiSources({
		url: 'http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt',
	});

	const standardizedVariants = yield buildStandardizedVariants({
		url: 'http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt',
	});

	const emojiSequences = yield buildEmojiSequences({
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-sequences.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
	});

	const emojiData = yield buildEmojiData({
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-data.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
		getCombinationsForCodepoint: emojiSequences.getCombinationsForCodepoint,
		getShiftJisCodesForCodepoint: emojiSources.getShiftJisCodesForCodepoint,
	});

	const emojiZwjSequences = yield buildEmojiZwjSequences({
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getMetaForModifierName: emojiData.getMetaForModifierName,
	});

	const combined = [
		...emojiData.emoji,
		...emojiSequences.flagEmoji,
		...emojiZwjSequences.zwjEmoji,
	];

	fs.writeFileSync('lib/emoji.json', JSON.stringify(combined));

	const makeDatumReadable = (node) => {
		Object.keys(node).forEach((key) => {
			const prop = node[key];
			if (['default', 'text', 'emoji'].includes(key)) {
				node[key] = { // eslint-disable-line no-param-reassign
					sequence: prop,
					output: codepointSequenceToString(prop),
				};
			} else if (prop === Object(prop) && Object.prototype.toString.call(prop) !== '[object Array]' && typeof prop !== 'string') {
				makeDatumReadable(prop);
			}
		});
		return node;
	};

	const readable = combined.map(datum => makeDatumReadable(datum));

	fs.writeFileSync('lib/emoji.readable.json', JSON.stringify(readable, null, 2));
});
