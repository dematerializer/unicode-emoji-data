import { internals } from '../unicode-data';

describe('unicode-data', () => {
	it('should use a reasonable default url', () => {
		expect(internals.defaultUrl).to.equal('http://unicode.org/Public/9.0.0/ucd/UnicodeData.txt');
	});
	it('should transform data to map each code point to a name', () => {
		const data = [
			{ codepoint: '1F600', name: 'GRINNING FACE', comment: 'foo' },
			{ codepoint: '1F601', name: 'GRINNING FACE WITH SMILING EYES', comment: 'bar' },
		];
		const expected = {
			'1F600': 'GRINNING FACE',
			'1F601': 'GRINNING FACE WITH SMILING EYES',
		};
		const nameForCodepoint = internals.buildNameForCodepoint(data);
		expect(nameForCodepoint).to.deep.equal(expected);
	});
});
