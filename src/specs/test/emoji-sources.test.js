/* eslint-disable no-unused-vars */

import { internals } from '../emoji-sources';

const {
	defaultUrl,
	buildShiftJisCodesForCodepoint,
} = internals;

describe('emoji-sources', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/Public/9.0.0/ucd/EmojiSources.txt');
	});
});
