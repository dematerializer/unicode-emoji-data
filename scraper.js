const co = require('co');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

// fetch('http://unicode.org/emoji/charts/full-emoji-list.html')
// .then((res) => res.text())
// .then((html) => cheerio.load(html))
// .then(($) => {
// 	return $('td.rchars').map(function () {
// 		const tr = $(this).parent();
// 		return {
// 			chars: $('.chars', tr).text(),
// 			name: $('.name', tr).eq(0).text(),
// 			keywords: $('.name', tr).eq(1).text()
// 		}
// 	}).get();
// })
// .then((emojis) => JSON.stringify(emojis, null, 2))
// .then((text) => fs.writeFileSync('emojis.json', text));

co(function *() {
	const res = yield fetch('http://unicode.org/emoji/charts/full-emoji-list.html');
	const html = yield res.text();
	const $ = cheerio.load(html);
	const json = $('td.rchars').map(function () {
		const tr = $(this).parent();
		return {
			chars: $('.chars', tr).text(),
			name: $('.name', tr).eq(0).text(),
			keywords: $('.name', tr).eq(1).text()
		};
	}).get();
	const text = JSON.stringify(json, null, 2);
	fs.writeFileSync('emojis.json', text);
});
