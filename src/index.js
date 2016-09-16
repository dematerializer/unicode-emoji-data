import co from 'co';
import fs from 'fs';

import generateUnicodeData from './specs/unicode-data';
import generateEmojiSources from './specs/emoji-sources';
import generateEmojiSequences from './specs/emoji-sequences';
import generateStandardizedVariants from './specs/standardized-variants';
import generateEmojiZwjSequences from './specs/emoji-zwj-sequences';
import generateEmojiData from './specs/emoji-data';
import { codepointSequenceToString } from './utils/convert';

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

co(function* main() {
	const unicodeData = yield generateUnicodeData({
		url: 'http://www.unicode.org/Public/9.0.0/ucd/UnicodeData.txt',
	});

	const emojiSources = yield generateEmojiSources({
		url: 'http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt',
	});

	const standardizedVariants = yield generateStandardizedVariants({
		url: 'http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt',
	});

	const emojiSequences = yield generateEmojiSequences({
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-sequences.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
	});

	const emojiZwjSequences = yield generateEmojiZwjSequences({
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
	});

	const emojiData = yield generateEmojiData({
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-data.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
		getCombinationsForCodepoint: emojiSequences.getCombinationsForCodepoint,
		getShiftJisCodesForCodepoint: emojiSources.getShiftJisCodesForCodepoint,
	});

	const combined = [
		...emojiData.emoji,
		...emojiSequences.flagEmoji,
		...emojiZwjSequences.zwjEmoji,
	];

	fs.writeFileSync('lib/emoji.min.json', JSON.stringify(combined));

	const makeDatumReadable = (node) => {
		Object.keys(node).forEach((key) => {
			const prop = node[key];
			if (['default', 'text', 'emoji'].includes(key)) {
				node[key] = {
					sequence: prop,
					output: codepointSequenceToString(prop),
				};
			} else if (key === 'skin') {
				node[key] = Object.keys(prop).reduce((skinModifications, modifier) => {
					const extSkinModifications = skinModifications;
					extSkinModifications[modifier] = {
						sequence: prop[modifier],
						output: codepointSequenceToString(prop[modifier]),
					}
					return extSkinModifications;
				}, {});
			} else if (prop === Object(prop) && Object.prototype.toString.call(prop) !== '[object Array]' && typeof prop !== 'string') {
				makeDatumReadable(prop);
			}
		});
		return node;
	};

	const readable = combined.map(datum => makeDatumReadable(datum));

	fs.writeFileSync('lib/emoji.json', JSON.stringify(readable, null, 2));
});
