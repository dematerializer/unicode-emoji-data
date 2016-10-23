import fetchMock from 'fetch-mock';
import emojiList, { internals } from '../emoji-list';

const {
	defaultUrl,
	scrapeSequencesFromEmojiList,
} = internals;

const html = `
	<table>
		<tr>
			<td class="rchars">1</td>
			<td class="chars">😀</td>
		</tr>
		<tr>
			<td class="rchars">21</td>
			<td class="chars">🤔</td>
		</tr>
	</table>
`;

const expected = ['1F600', '1F914'];

describe('emoji-list', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/emoji/charts-beta/emoji-list.html');
	});

	it('should scrape sequences from the unicode emoji list HTML table', () => {
		expect(scrapeSequencesFromEmojiList(html)).to.deep.equal(expected);
	});

	it('should generate an API', (done) => {
		fetchMock.get('*', html);
		const step = emojiList({});
		step.next().value.then((content) => { // wait until first yield's promise (mocked fetch) resolves
			const api = step.next(content).value; // manually hand over mocked content to the left side of yield
			expect(api).to.have.all.keys('sequences');
			expect(api.sequences).to.deep.equal(expected);
			done();
		});
	});
});
