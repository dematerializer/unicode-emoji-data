import {
	expandEmojiData,
	emojiDataStable,
	emojiDataBeta,
} from '../';

describe('unicode-emoji-data', () => {
	it('should offer a conservative node API', () => {
		const unicodeEmojiData = require('../'); // eslint-disable-line global-require
		expect(unicodeEmojiData).to.have.all.keys(
			'expandEmojiData',
			'emojiDataStable',
			'emojiDataBeta',
		);
	});

	it('should export a function for expanding emoji data', () => {
		expect(expandEmojiData).to.be.a('function');
	});

	it('should export stable emoji data', () => {
		expect(emojiDataStable).to.be.instanceof(Array);
	});

	it('should export beta emoji data', () => {
		expect(emojiDataBeta).to.be.instanceof(Array);
	});
});
