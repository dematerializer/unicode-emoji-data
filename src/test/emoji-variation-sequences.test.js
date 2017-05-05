import fetchMock from 'fetch-mock';
import buildVariationSequences, { internals } from '../emoji-variation-sequences';

const {
	defaultUrl,
	variationSelectors,
	buildVariationSequencesForCodepoint,
} = internals;

describe('variation-sequences', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://www.unicode.org/Public/emoji/5.0/emoji-variation-sequences.txt');
	});

	it('should use correct variation selectors', () => {
		expect(variationSelectors.text).to.equal('FE0E');
		expect(variationSelectors.emoji).to.equal('FE0F');
	});

	it('should map variation sequences grouped by style to each code point that supports both text and emoji styles', () => {
		const data = [
			{ sequence: '0023 FE0E', description: 'text style', comment: 'NUMBER SIGN' },
			{ sequence: '0023 FE0F', description: 'emoji style', comment: 'NUMBER SIGN' },
			{ sequence: '002A FE0E', description: 'text style', comment: 'ASTERISK' },
			{ sequence: '002A FE0F', description: 'emoji style', comment: 'ASTERISK' },
		];
		const expected = {
			'0023': {
				text: '0023 FE0E',
				emoji: '0023 FE0F',
			},
			'002A': {
				text: '002A FE0E',
				emoji: '002A FE0F',
			},
		};
		const variationSequencesForCodepoint = buildVariationSequencesForCodepoint(data);
		expect(variationSequencesForCodepoint).to.have.property('0023');
		expect(variationSequencesForCodepoint).to.have.property('002A');
		expect(variationSequencesForCodepoint['0023']).to.deep.equal(expected['0023']);
		expect(variationSequencesForCodepoint['002A']).to.deep.equal(expected['002A']);
	});

	it('should generate an API', (done) => {
		const mockedContent = `
			0023 FE0E; text style;  # NUMBER SIGN
			0023 FE0F; emoji style; # NUMBER SIGN
			002A FE0E; text style;  # ASTERISK
			002A FE0F; emoji style; # ASTERISK
		`;
		fetchMock.get('*', mockedContent);
		const step = buildVariationSequences({});
		step.next().value.then((content) => { // wait until first yield's promise (mocked fetch) resolves
			const api = step.next(content).value; // manually hand over mocked content to the left side of yield
			expect(api).to.have.all.keys('getVariationSequencesForCodepoint');
			expect(api.getVariationSequencesForCodepoint).to.be.a('function');
			expect(api.getVariationSequencesForCodepoint('0023')).to.deep.equal({
				text: '0023 FE0E',
				emoji: '0023 FE0F',
			});
			done();
		});
	});
});
