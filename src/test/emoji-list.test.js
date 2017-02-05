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
			<td class="code">
				<a name="1f600">U+1F600</a>
			</td>
		</tr>
		<tr>
			<td class="rchars">157</td>
			<td class="code">
				<a name="1f469_1f3fe_200d_2695_fe0f">U+1F469 U+1F3FE U+200D U+2695 U+FE0F</a>
			</td>
		</tr>
	</table>
`;

const expected = ['1F600', '1F469 1F3FE 200D 2695 FE0F'];

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
