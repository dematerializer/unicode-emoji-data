import logUpdate from 'log-update';
import 'isomorphic-fetch';
import cheerio from 'cheerio';
import punycode from 'punycode';
import leftPad from 'left-pad';

// emoji-list.html provides a compiled list of emoji data directly from unicode;
// we use this list to check our generated data files against for completeness:
const defaultUrl = 'http://unicode.org/emoji/charts-beta/emoji-list.html';

// Build a list of sequences:
// [
// 	...
// 	"1F609",
// 	...
// ]
function scrapeSequencesFromEmojiList(html) {
	const $ = cheerio.load(html);
	return $('td.rchars').map(function mapRow() {
		const tr = $(this).parent();
		const chars = $('.chars', tr).text();
		const seq = punycode.ucs2.decode(chars);
		const seqHex = seq.map(cp => leftPad(cp.toString(16), 4, 0).toUpperCase()).join(' ');
		return seqHex;
	}).get();
}

export const internals = {
	defaultUrl,
	scrapeSequencesFromEmojiList,
};

export default function* EmojiList({ url = defaultUrl }) {
	logUpdate('⇣ emoji-list');
	const content = yield fetch(url).then(res => res.text());
	const sequences = scrapeSequencesFromEmojiList(content);
	logUpdate('✓ emoji-list');
	logUpdate.done();
	return { // API
		sequences,
	};
}
