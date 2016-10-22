import co from 'co';
import fs from 'fs';
import logUpdate from 'log-update';

import buildUnicodeData from './unicode-data';
import buildEmojiSources from './emoji-sources';
import buildStandardizedVariants from './standardized-variants';
import buildEmojiSequences from './emoji-sequences';
import buildEmojiData from './emoji-data';
import buildEmojiZwjSequences from './emoji-zwj-sequences';
import expandEmojiData from './expand-emoji-data';
import scrapeEmojiList from './emoji-list';
import checkData from './check-data';

import preset from './presets/unicode-9-emoji-4';

logUpdate(`using unicode v${preset.unicodeVersion}, emoji v${preset.emojiVersion}`);
logUpdate.done();

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

co(function* main() {
	logUpdate('⇣ unicode-data');
	const unicodeData = yield buildUnicodeData({
		url: preset.unicodeDataUrl,
	});
	logUpdate('✓ unicode-data');
	logUpdate.done();

	logUpdate('⇣ emoji-sources');
	const emojiSources = yield buildEmojiSources({
		url: preset.emojiSourcesUrl,
	});
	logUpdate('✓ emoji-sources');
	logUpdate.done();

	logUpdate('⇣ standardized-variants');
	const standardizedVariants = yield buildStandardizedVariants({
		url: preset.standardizedVariantsUrl,
	});
	logUpdate('✓ standardized-variants');
	logUpdate.done();

	logUpdate('⇣ emoji-sequences');
	const emojiSequences = yield buildEmojiSequences({
		url: preset.emojiSequencesUrl,
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
	});
	logUpdate('✓ emoji-sequences');
	logUpdate.done();

	logUpdate('⇣ emoji-data');
	const emojiData = yield buildEmojiData({
		url: preset.emojiDataUrl,
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: standardizedVariants.getVariationSequencesForCodepoint,
		getCombinationsForCodepoint: emojiSequences.getCombinationsForCodepoint,
		getShiftJisCodesForCodepoint: emojiSources.getShiftJisCodesForCodepoint,
	});
	logUpdate('✓ emoji-data');
	logUpdate.done();

	logUpdate('⇣ emoji-zwj-sequences');
	const emojiZwjSequences = yield buildEmojiZwjSequences({
		url: preset.emojiZwjSequencesUrl,
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getMetaForModifierName: emojiData.getMetaForModifierName,
	});
	logUpdate('✓ emoji-zwj-sequences');
	logUpdate.done();

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

	const expandedEmojiOnly = expandEmojiData(combined);
	fs.writeFileSync('lib/emoji.expanded.json', JSON.stringify(expandedEmojiOnly, null, 2));

	logUpdate('✓ write data files');
	logUpdate.done();

	// Verify: check expanded data against unicode emoji list for completeness:

	logUpdate('⇣ emoji-list');
	const emojiList = yield scrapeEmojiList({
		url: preset.emojiListUrl,
	});
	logUpdate('✓ emoji-list');
	logUpdate.done();

	checkData({
		data: expandedEmojiOnly,
		emojiList,
	});
});
