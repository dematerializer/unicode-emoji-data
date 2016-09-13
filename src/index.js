import co from 'co';
import fs from 'fs';

import generateUnicodeData from './specs/unicode-data';
import generateEmojiSources from './specs/emoji-sources';
import generateEmojiSequences from './specs/emoji-sequences';
import generateStandardizedVariants from './specs/standardized-variants';
import generateEmojiZwjSequences from './specs/emoji-zwj-sequences';
import generateEmojiData from './specs/emoji-data';

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

co(function* main() {

	const unicodeData = yield generateUnicodeData({
		url: 'http://www.unicode.org/Public/9.0.0/ucd/UnicodeData.txt',
	});

	const emojiSources = yield generateEmojiSources({
		url: 'http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt',
	});

	const emojiSequences = yield generateEmojiSequences({
		url: 'http://www.unicode.org/Public/emoji/3.0/emoji-sequences.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
	});

	const standardizedVariants = yield generateStandardizedVariants({
		url: 'http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt',
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
		getShiftJisCodeByCarrierForCodepoint: emojiSources.getShiftJisCodeByCarrierForCodepoint,

	});

	const combined = [
		...emojiData.emoji,
		...emojiSequences.flagEmoji,
		...emojiZwjSequences.zwjEmoji,
	];

	fs.writeFileSync('lib/emoji.json', JSON.stringify(combined, null, 2));

	const minifyDatum = (parentNode, nodeKey) => {
		const node = nodeKey == null ? { ...parentNode } : parentNode[nodeKey];
		if (node === Object(node) && Object.prototype.toString.call(node) !== '[object Array]') {
			if (node.sequence && node.output) {
				parentNode[nodeKey] = node.sequence;
			} else {
				Object.keys(node).forEach(key => {
					minifyDatum(node, key);
				});
			}
		}
		return node;
	};

	const minified = combined.map(datum => minifyDatum(datum));

	fs.writeFileSync('lib/emoji.min.json', JSON.stringify(minified));
});
