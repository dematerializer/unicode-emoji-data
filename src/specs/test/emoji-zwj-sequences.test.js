/* eslint-disable no-unused-vars */

import { internals } from '../emoji-zwj-sequences';

const {
	defaultUrl,
	zeroWidthJoiner,
	buildZwjEmoji,
} = internals;

describe('emoji-zwj-sequences', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt');
	});
});
