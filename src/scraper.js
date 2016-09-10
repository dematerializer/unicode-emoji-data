const co = require('co');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

co(function *() {
	const res = yield fetch('http://unicode.org/emoji/charts/emoji-list.html');
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
	// fs.writeFileSync('../lib/emoji-scraped.json', text);
});
