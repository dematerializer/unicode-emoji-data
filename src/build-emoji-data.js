import co from 'co';
import fs from 'fs';
import logUpdate from 'log-update';

import buildUnicodeData from './unicode-data';
import buildEmojiSources from './emoji-sources';
import buildEmojiVariationSequences from './emoji-variation-sequences';
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

	logUpdate('⇣ variation-sequences');
	const variationSequences = yield buildEmojiVariationSequences({
		url: preset.emojiVariationSequencesUrl,
	});
	logUpdate('✓ variation-sequences');
	logUpdate.done();

	logUpdate('⇣ emoji-sequences');
	const emojiSequences = yield buildEmojiSequences({
		emojiVersion: preset.emojiVersion,
		url: preset.emojiSequencesUrl,
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: variationSequences.getVariationSequencesForCodepoint,
	});
	logUpdate('✓ emoji-sequences');
	logUpdate.done();

	logUpdate('⇣ emoji-data');
	const emojiData = yield buildEmojiData({
		url: preset.emojiDataUrl,
		getNameForCodepoint: unicodeData.getNameForCodepoint,
		getVariationSequencesForCodepoint: variationSequences.getVariationSequencesForCodepoint,
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
	if (report.sequencesInDataButNotInReference.length > 0) {
		report.sequencesInDataButNotInReference.forEach((unmatchedSequence) => {
			logUpdate(`⌛︎ check-data: data sequence ${unmatchedSequence} not found in reference`);
			logUpdate.done();
		});
		logUpdate(`x check-data: ${report.sequencesInDataButNotInReference.length} data sequences not existing in reference (see above)`);
	}
	if (report.sequencesInReferenceButNotInData.length > 0) {
		report.sequencesInReferenceButNotInData.forEach((unmatchedSequence) => {
			logUpdate(`⌛︎ check-data: reference sequence ${unmatchedSequence} not found in data`);
			logUpdate.done();
		});
		logUpdate(`x check-data: ${report.sequencesInReferenceButNotInData.length} reference sequences not existing in data (see above)`);
	}
	if (report.sequencesInDataButNotInReference.length === 0 && report.sequencesInReferenceButNotInData.length === 0) {
		logUpdate(`✓ check-data: ${emojiListSequences.length} entries verified`);
	}
	logUpdate.done();
}

co(function* main() {
	yield buildForPreset(mainPreset);
});
