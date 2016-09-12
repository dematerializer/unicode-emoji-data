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
	const minified = combined.map((datum) => {
		const newDatum = { ...datum };
		if (datum.presentation) {
			if (datum.presentation.default) {
				newDatum.presentation.default = datum.presentation.default.sequence;
			}
			if (datum.presentation.variation) {
				if (datum.presentation.variation.text) {
					newDatum.presentation.variation.text = datum.presentation.variation.text.sequence;
				}
				if (datum.presentation.variation.emoji) {
					newDatum.presentation.variation.emoji = datum.presentation.variation.emoji.sequence;
				}
			}
			if (datum.combination && datum.combination.keycap && datum.combination.keycap.presentation) {
				if (datum.combination.keycap.presentation.default) {
					newDatum.combination.keycap.presentation.default = datum.combination.keycap.presentation.default.sequence;
				}
				if (datum.combination.keycap.presentation.variation) {
					if (datum.combination.keycap.presentation.variation.text) {
						newDatum.combination.keycap.presentation.variation.text = datum.combination.keycap.presentation.variation.text.sequence;
					}
					if (datum.combination.keycap.presentation.variation.emoji) {
						newDatum.combination.keycap.presentation.variation.emoji = datum.combination.keycap.presentation.variation.emoji.sequence;
					}
				}
			}
			if (datum.modification && datum.modification.skin) {
				newDatum.modification.skin = Object.keys(datum.modification.skin).map(skinType =>
					newDatum.modification.skin[skinType].sequence
				);
			}
		}
		return newDatum;
	});
	fs.writeFileSync('lib/emoji.min.json', JSON.stringify(minified));
});
