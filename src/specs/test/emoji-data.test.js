/* eslint-disable no-unused-vars */

import { internals } from '../emoji-data';

const {
	defaultUrl,
	expandEmojiData,
	getEmojiCodepoints,
	getEmojiPresentationCodepoints,
	getEmojiModifierCodepoints,
	getEmojiModifierBaseCodepoints,
	getMetaForModifierName,
	buildModifierSequencesForModifiableCodepoint,
} = internals;

describe('emoji-data', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/Public/emoji/3.0/emoji-data.txt');
	});
});
