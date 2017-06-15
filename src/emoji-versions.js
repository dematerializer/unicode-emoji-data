import { expandEmojiData } from './emoji-data';
import preset from './preset';
import parse from './parse';

const latestVersion = preset.emojiVersion;
const emojiVersions = {};
const unicodeVersions = {};

function fetchVersions(url) {
	return Promise.all(
		Array.from({ length: latestVersion }, (v, i) => i + 1).map(version => (
			fetch(url.replace('{version}', `${version}.0`))
				.then(res => (res.ok ? res.text() : ''))
				.then(content => ({
					content,
					version,
				}))
		)),
	);
}

export default function* EmojiDataVersions() {
	const versionToken = `${latestVersion}.0`;
	const primaryContents = [
		yield fetchVersions(preset.emojiDataUrl.replace(versionToken, '{version}')),
		yield fetchVersions(preset.emojiSequencesUrl.replace(versionToken, '{version}')),
		yield fetchVersions(preset.emojiZwjSequencesUrl.replace(versionToken, '{version}')),
	];

	primaryContents.forEach((contentList) => {
		contentList.forEach(({ content, version }) => {
			// Source file does not exist
			if (!content) return;

			expandEmojiData(parse(content, ['codepoints'])).forEach((datum) => {
				// Do not overwrite previous versions
				if (!emojiVersions[datum.codepoint]) {
					emojiVersions[datum.codepoint] = version;
				}

				const unicodeVersion = datum.comment.match(/^V?([0-9.]+)/);

				// Same goes for unicode version
				if (unicodeVersion && !unicodeVersions[datum.codepoint]) {
					unicodeVersions[datum.codepoint] = parseFloat(unicodeVersion[1]);
				}
			});
		});
	});

	return { // API
		getEmojiVersionForCodepoint: codepoint => emojiVersions[codepoint] || null,
		getUnicodeVersionForCodepoint: codepoint => unicodeVersions[codepoint] || null,
	};
}
