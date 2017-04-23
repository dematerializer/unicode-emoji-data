import {
	expandEmojiData,
	emojiData,
} from '../';

describe('unicode-emoji-data', () => {
	it('should offer a conservative node API', () => {
		const unicodeEmojiData = require('../'); // eslint-disable-line global-require
		expect(unicodeEmojiData).to.have.all.keys(
			'expandEmojiData',
			'emojiData',
		);
	});

	it('should export a function for expanding emoji data', () => {
		expect(expandEmojiData).to.be.a('function');
	});

	it('should export emoji data', () => {
		expect(emojiData).to.be.instanceof(Array);
	});
});
