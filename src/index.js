import co from 'co';
import fs from 'fs';
import punycode from 'punycode';
import logUpdate from 'log-update';

import buildUnicodeData from './specs/unicode-data';
import buildEmojiSources from './specs/emoji-sources';
import buildStandardizedVariants from './specs/standardized-variants';
import buildEmojiSequences from './specs/emoji-sequences';
import buildEmojiData from './specs/emoji-data';
import buildEmojiZwjSequences from './specs/emoji-zwj-sequences';
import buildCldrAnnotations from './specs/cldr-annotations';

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
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-sequences.txt',
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
	});

	const emojiData = yield buildEmojiData({
		url: 'http://www.unicode.org/Public/emoji/4.0/emoji-data.txt',
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

	const annotations = yield buildCldrAnnotations({
		baseUrl: 'http://unicode.org/repos/cldr/tags/latest/common/annotations',
		languages: ['en', 'de'],
	});

	Object.keys(annotations.annotationForSequenceForLanguage).forEach((language) => {
		const data = annotations.annotationForSequenceForLanguage[language];
		fs.writeFileSync(`lib/annotations/cldr/${language}.json`, JSON.stringify(data, null, 2));
	});

	logUpdate('⇣ writing files');

	// Render main emoji data file (emoji.json) containing compact, nested emoji data:

	const combined = [
		...emojiData.emoji,
		...emojiSequences.flagEmoji,
		...emojiZwjSequences.zwjEmoji,
	];
	fs.writeFileSync('lib/emoji.json', JSON.stringify(combined, null, 2));

	// Render human-readable variant of main emoji data file (emoji.readable.json):

	const makeDatumReadable = (node) => {
		const readableNode = { ...node };
		Object.keys(readableNode).forEach((key) => {
			const propValue = readableNode[key];
			if (['default', 'text', 'emoji'].includes(key)) {
				readableNode[key] = { // eslint-disable-line no-param-reassign
					sequence: propValue,
					output: punycode.ucs2.encode(propValue.split(' ').map(cp => parseInt(cp, 16))),
				};
			} else if (propValue === Object(propValue) && Object.prototype.toString.call(propValue) !== '[object Array]' && typeof propValue !== 'string') {
				readableNode[key] = makeDatumReadable(propValue);
			}
		});
		return readableNode;
	};

	const readable = combined.map(datum => makeDatumReadable(datum));
	fs.writeFileSync('lib/emoji.readable.json', JSON.stringify(readable, null, 2));

	// Render expanded, human readable emoji data file (emoji.expanded.json)
	// containing flattened emoji-presentation-only data:

	const expandedEmojiOnly = [];
	const extractEmojiInfoFromDatum = (datum) => {
		const sequence = datum.defaultPresentation === 'text' ? datum.presentation.variation.emoji : datum.presentation.default;
		return {
			name: datum.name,
			sequence,
			output: punycode.ucs2.encode(sequence.split(' ').map(cp => parseInt(cp, 16))),
		};
	};
	combined.forEach((datum) => {
		expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum));
		if (datum.combination && datum.combination.keycap) {
			expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.combination.keycap));
		}
		if (datum.modification && datum.modification.skin) {
			Object.keys(datum.modification.skin).forEach(type =>
				expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.modification.skin[type]))
			);
		}
	});
	fs.writeFileSync('lib/emoji.expanded.json', JSON.stringify(expandedEmojiOnly, null, 2));

	logUpdate('✓ writing files');
	logUpdate(expandedEmojiOnly.length);
	logUpdate.done();
});
