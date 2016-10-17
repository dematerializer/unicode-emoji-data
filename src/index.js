import co from 'co';
import fs from 'fs';
import punycode from 'punycode';
import logUpdate from 'log-update';

import buildUnicodeData from './unicode-data';
import buildEmojiSources from './emoji-sources';
import buildStandardizedVariants from './standardized-variants';
import buildEmojiSequences from './emoji-sequences';
import buildEmojiData from './emoji-data';
import buildEmojiZwjSequences from './emoji-zwj-sequences';
import scrapeEmojiList from './emoji-list';
import checkData from './check-data';
import buildCldrAnnotations from './cldr-annotations';
import checkAnnotations from './check-annotations';

import preset from './presets/unicode-9-emoji-4-cldr-30';

const languages = ['en', 'de'];
// const languages = ['af', 'am', 'ar', 'as', 'az', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fa', 'fi', 'fil', 'fr', 'ga', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'is', 'it', 'ja', 'ka', 'kk', 'km', 'kn', 'ko', 'ky', 'lo', 'lt', 'lv', 'mk', 'ml', 'mn', 'mr', 'ms', 'my', 'nb', 'ne', 'nl', 'or', 'pa', 'pl', 'pt', 'ro', 'ru', 'si', 'sk', 'sl', 'sq', 'sr', 'sv', 'sw', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'uz', 'vi', 'zh'];

logUpdate(`using unicode v${preset.unicodeVersion}, emoji v${preset.emojiVersion}, CLDR v${preset.cldrVersion}`);
logUpdate.done();

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

co(function* main() {
	const unicodeData = yield buildUnicodeData({
		url: preset.unicodeDataUrl,
	});

	const emojiSources = yield buildEmojiSources({
		url: preset.emojiSourcesUrl,
	});

	const standardizedVariants = yield buildStandardizedVariants({
		url: preset.standardizedVariantsUrl,
	});

	const emojiSequences = yield buildEmojiSequences({
		url: preset.emojiSequencesUrl,
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
	});
	const emojiData = yield buildEmojiData({
		url: preset.emojiDataUrl,
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
		getCombinationsForCodepoint: emojiSequences.getCombinationsForCodepoint,
		getShiftJisCodesForCodepoint: emojiSources.getShiftJisCodesForCodepoint,
	});

	const emojiZwjSequences = yield buildEmojiZwjSequences({
		url: preset.emojiZwjSequencesUrl,
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getMetaForModifierName: emojiData.getMetaForModifierName,
	});

	logUpdate('⇣ write data files');

	// Render base emoji data file (emoji.json) containing compact, nested emoji data:

	const combined = [
		...emojiData.emoji,
		...emojiSequences.flagEmoji,
		...emojiZwjSequences.zwjEmoji,
	];
	fs.writeFileSync('lib/emoji.json', JSON.stringify(combined, null, 2));

	// Render expanded, human readable emoji data file (emoji.expanded.json)
	// containing flattened emoji-presentation-only data:

	const expandedEmojiOnly = [];
	const extractEmojiInfoFromDatum = (datum) => {
		const sequence = datum.presentation.variation ? datum.presentation.variation.emoji : datum.presentation.default;
		return {
			name: datum.name,
			sequence,
			output: punycode.ucs2.encode(sequence.split(' ').map(cp => parseInt(cp, 16))),
		};
	};
	combined.forEach((datum) => {
		if (datum.combination) {
			Object.keys(datum.combination).forEach(combiningMark =>
				expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.combination[combiningMark]))
			);
		} else {
			expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum));
		}
		if (datum.modification && datum.modification.skin) {
			Object.keys(datum.modification.skin).forEach(type =>
				expandedEmojiOnly.push(extractEmojiInfoFromDatum(datum.modification.skin[type]))
			);
		}
	});
	fs.writeFileSync('lib/emoji.expanded.json', JSON.stringify(expandedEmojiOnly, null, 2));

	logUpdate('✓ write data files');
	logUpdate.done();

	// Verify: check generated data files against unicode emoji list for completeness:

	const emojiList = yield scrapeEmojiList({
		url: preset.emojiListUrl,
	});

	checkData({
		data: expandedEmojiOnly,
		emojiList,
	});

	// Render CLDR annotation files:

	const annotations = yield buildCldrAnnotations({
		baseUrl: preset.cldrAnnotationsUrl,
		version: preset.cldrVersion,
		languages,
	});

	logUpdate('⇣ write annotation files');

	Object.keys(annotations.annotationForSequenceForLanguage).forEach((language) => {
		const data = annotations.annotationForSequenceForLanguage[language];
		fs.writeFileSync(`lib/annotations/cldr/${language}.json`, JSON.stringify(data, null, 2));
	});

	logUpdate('✓ write annotation files');

	// Check annotation coverage:

	checkAnnotations({
		languages,
		data: expandedEmojiOnly,
	});
});
