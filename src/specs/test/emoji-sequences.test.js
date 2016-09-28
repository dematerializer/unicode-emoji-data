/* eslint-disable no-unused-vars */

import { internals } from '../emoji-sequences';

const {
	defaultUrl,
	combiningMarks,
	buildCompatibleCodepointsForCombiningMark,
	combinationsForCodepoint,
	buildFlagEmoji,
} = internals;

describe('emoji-sequences', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/Public/emoji/3.0/emoji-sequences.txt');
	});
});
