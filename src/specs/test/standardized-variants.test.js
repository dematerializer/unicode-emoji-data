/* eslint-disable no-unused-vars */

import { internals } from '../standardized-variants';

const {
	defaultUrl,
	buildVariationSequencesForCodepoint,
} = internals;

describe('standardized-variants', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/Public/9.0.0/ucd/StandardizedVariants.txt');
	});
});
