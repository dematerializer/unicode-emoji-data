import fetchMock from 'fetch-mock';
import buildEmojiSources, { internals } from '../emoji-sources';

const {
	defaultUrl,
	buildShiftJisCodesForCodepoint,
} = internals;

describe('emoji-sources', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://www.unicode.org/Public/10.0.0/ucd/EmojiSources-10.0.0d1.txt');
	});

	it('should map each unicode code point or sequence to one or more Shift-JIS codes for cell phone carrier symbols', () => {
		const data = [
			{ unicode: '00AE', docomo: 'F9DB', kddi: 'F775', softbank: 'F7EF' },
			{ unicode: '2139', docomo: '', kddi: 'F74F', softbank: '' },
			{ unicode: '2754', docomo: '', kddi: '', softbank: 'F9D6' },
			{ unicode: 'bogus', docomo: '', kddi: '', softbank: '' },
		];
		const expected = {
			'00AE': {
				docomo: 'F9DB', kddi: 'F775', softbank: 'F7EF',
			},
			'2139': { // eslint-disable-line quote-props
				docomo: undefined, kddi: 'F74F', softbank: undefined,
			},
			'2754': { // eslint-disable-line quote-props
				docomo: undefined, kddi: undefined, softbank: 'F9D6',
			},
		};
		const shiftJisCodesForCodepoint = buildShiftJisCodesForCodepoint(data);
		expect(shiftJisCodesForCodepoint).to.deep.equal(expected);
	});

	it('should generate an API', (done) => {
		fetchMock.get('*', `
			00AE;F9DB;F775;F7EF
			2139;;F74F;
			2754;;;F9D6
		`);
		const step = buildEmojiSources({});
		step.next().value.then((content) => { // wait until first yield's promise (mocked fetch) resolves
			const api = step.next(content).value; // manually hand over mocked content to the left side of yield
			expect(api).to.have.all.keys('getShiftJisCodesForCodepoint');
			expect(api.getShiftJisCodesForCodepoint).to.be.a('function');
			expect(api.getShiftJisCodesForCodepoint('00AE')).to.deep.equal({
				docomo: 'F9DB', kddi: 'F775', softbank: 'F7EF',
			});
			done();
		});
	});
});
