import fetchMock from 'fetch-mock';
import buildUnicodeData, { internals } from '../unicode-data';

const {
	defaultUrl,
	buildNameForCodepoint,
} = internals;

describe('unicode-data', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://www.unicode.org/Public/10.0.0/ucd/UnicodeData-10.0.0d5.txt');
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
		const nameForCodepoint = buildNameForCodepoint(data);
		expect(nameForCodepoint).to.deep.equal(expected);
	});
	it('should generate an API', (done) => {
		fetchMock.get('*', '1F4A9;PILE OF POO;So;0;ON;;;;;N;;;;;');
		const step = buildUnicodeData({});
		step.next().value.then((content) => { // wait until first yield's promise (mocked fetch) resolves
			const api = step.next(content).value; // manually hand over mocked content to the left side of yield
			expect(api).to.have.all.keys('getNameForCodepoint');
			expect(api.getNameForCodepoint).to.be.a('function');
			expect(api.getNameForCodepoint('1F4A9')).to.equal('PILE OF POO');
			done();
		});
	});
});
