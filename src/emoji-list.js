import 'isomorphic-fetch';
import cheerio from 'cheerio';

// emoji-list.html provides a compiled list of emoji data directly from unicode;
// we use this list to check our generated data files against for completeness:
const defaultUrl = 'http://unicode.org/emoji/charts/emoji-list.html';

export const internals = {
	defaultUrl,
};

const matchBase64Image = new RegExp(' src=["|\']data:image.*["|\'] ', 'g');

// Fetch the list and return minified content:
export function* fetchEmojiList({ url = defaultUrl }) {
	const content = yield fetch(url).then(res => res.text());
	return content.replace(matchBase64Image, ' ');
}

// Build a list of sequences from the unicode emoji list HTML table:
// [
// 	...
// 	"1F609",
// 	...
// ]
export const scrapeSequencesFromEmojiList = (html) => {
	const $ = cheerio.load(html);
	return $('td.rchars').map(function mapRow() {
		const tr = $(this).parent();
		const code = $('.code', tr);
		const aName = $('a[name]', code).attr('name');
		const sequence = aName.split('_').join(' ').toUpperCase();
		return sequence;
	}).get();
};
