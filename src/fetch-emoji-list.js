import co from 'co';
import fs from 'fs';
import logUpdate from 'log-update';

import mainPreset from './preset';
import { fetchEmojiList } from './emoji-list';

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

// Fetch the unicode emoji list and save it minified locally because
// a) the web page is not versioned and b) for performance
// reasons (html contains huge amount of base64 encoded images):
function* fetchEmojiListForPreset(preset) {
	logUpdate('⇣ emoji-list');
	const content = yield fetchEmojiList({
		url: preset.emojiListUrl,
	});
	fs.writeFileSync(preset.localEmojiListUrl, content);
	logUpdate('✓ emoji-list');
	logUpdate.done();
}

co(function* main() {
	yield fetchEmojiListForPreset(mainPreset);
});
