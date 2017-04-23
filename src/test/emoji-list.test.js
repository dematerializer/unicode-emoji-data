import fetchMock from 'fetch-mock';
import { scrapeSequencesFromEmojiList, fetchEmojiList, internals } from '../emoji-list';

const {
	defaultUrl,
} = internals;

const html = `
	<table>
		<tr>
			<td class="rchars">1</td>
			<td class="code">
				<a name="1f600">U+1F600</a>
			</td>
			<td class="andr">
				<a href="full-emoji-list.html#1f600" target="full">
					<img alt="😀" class="imga" src="data:imageblablablabla" title="U+1F600 😀 grinning face">
				</a>
			</td>
		</tr>
		<tr>
			<td class="rchars">157</td>
			<td class="code">
				<a name="1f469_1f3fe_200d_2695_fe0f">U+1F469 U+1F3FE U+200D U+2695 U+FE0F</a>
			</td>
			<td class="andr">
				<a href="full-emoji-list.html#1f469_1f3fe_200d_2695" target="full">
					<img alt="👩🏾‍⚕️" class="imga" src="data:imageblablablabla" title="U+1F469 U+1F3FE U+200D U+2695 U+FE0F 👩🏾‍⚕️ woman health worker: medium-dark skin tone">
				</a>
			</td>
		</tr>
	</table>
`;

const expectedMinifiedHtml = `
	<table>
		<tr>
			<td class="rchars">1</td>
			<td class="code">
				<a name="1f600">U+1F600</a>
			</td>
			<td class="andr">
				<a href="full-emoji-list.html#1f600" target="full">
					<img alt="😀" class="imga" title="U+1F600 😀 grinning face">
				</a>
			</td>
		</tr>
		<tr>
			<td class="rchars">157</td>
			<td class="code">
				<a name="1f469_1f3fe_200d_2695_fe0f">U+1F469 U+1F3FE U+200D U+2695 U+FE0F</a>
			</td>
			<td class="andr">
				<a href="full-emoji-list.html#1f469_1f3fe_200d_2695" target="full">
					<img alt="👩🏾‍⚕️" class="imga" title="U+1F469 U+1F3FE U+200D U+2695 U+FE0F 👩🏾‍⚕️ woman health worker: medium-dark skin tone">
				</a>
			</td>
		</tr>
	</table>
`;

const expectedSequences = ['1F600', '1F469 1F3FE 200D 2695 FE0F'];

describe('emoji-list', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/emoji/charts/emoji-list.html');
	});

	it('should scrape sequences from the unicode emoji list HTML table', () => {
		expect(scrapeSequencesFromEmojiList(html)).to.deep.equal(expectedSequences);
	});

	it('should fetch and minify the unicode emoji list HTML table', (done) => {
		fetchMock.get('*', html);
		const step = fetchEmojiList({});
		step.next().value.then((content) => { // wait until first yield's promise (mocked fetch) resolves
			const minifiedContent = step.next(content).value; // manually hand over mocked content to the left side of yield
			expect(minifiedContent).to.equal(expectedMinifiedHtml);
			done();
		});
	});
});
