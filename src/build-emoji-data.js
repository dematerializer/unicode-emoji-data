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
import { scrapeSequencesFromEmojiList } from './emoji-list';
import checkData from './check-data';

import mainPreset from './preset';

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

function* buildForPreset(preset) {
	logUpdate(`using unicode ${preset.unicodeVersion}, emoji ${preset.emojiVersion} (${preset.tag})`);
	logUpdate.done();

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
		emojiVersion: preset.emojiVersion,
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

	// Render emoji data file containing compact, nested emoji data:

	logUpdate('⇣ write data file');

	const combined = [
		...emojiData.emoji,
		...emojiSequences.flagEmoji,
		...emojiZwjSequences.zwjEmoji,
	];
	fs.writeFileSync('res/emoji-data.json', JSON.stringify(combined, null, 2));

	logUpdate('✓ write data file');
	logUpdate.done();

	// Create temporary expanded human readable emoji data containing flattened
	// emoji-presentation-only data and check against the locally cached unicode
	// emoji list for completeness:

	logUpdate('⇣ emoji-list');
	const emojiListContent = fs.readFileSync(preset.localEmojiListUrl);
	const emojiListSequences = scrapeSequencesFromEmojiList(emojiListContent);
	logUpdate('✓ emoji-list');
	logUpdate.done();

	logUpdate('⌛︎ check-data');
	const report = checkData({
		data: expandEmojiData(combined),
		reference: emojiListSequences,
	});
	if (report.unmatchedSequences.length > 0) {
		report.unmatchedSequences.forEach((unmatchedSequence) => {
			logUpdate(`⌛︎ check-data: did not expect sequence ${unmatchedSequence}`);
			logUpdate.done();
		});
		logUpdate(`x check-data: ${report.numDiff} sequences not expected (see above)`);
	} else if (report.numDiff > 0) {
		logUpdate(`x check-data: numbers of entries don't match (expected ${report.numExpected} but got ${report.numGot})`);
	} else {
		logUpdate(`✓ check-data: ${emojiListSequences.length} entries verified`);
	}
	logUpdate.done();
}

co(function* main() {
	yield buildForPreset(mainPreset);
});
