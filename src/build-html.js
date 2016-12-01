import fs from 'fs';
import unicodeEmojiData from '.';
import presetUnicode9Emoji3 from './preset-unicode-9-emoji-3';
import presetUnicode9Emoji4 from './preset-unicode-9-emoji-4';

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

const buildForPreset = (preset) => {
	const expandedData = unicodeEmojiData.expand(unicodeEmojiData[`v${preset.emojiVersion}`]);
	const tableRows = expandedData.map(datum => `
		<tr>
			<td>${datum.name}</td>
			<td>${datum.sequence}</td>
			<td>${datum.output}</td>
		</tr>
	`).join('');

	const html = `
		<!DOCTYPE html>
		<html>
			<head>
			<meta charset="utf-8">
			<title>emoji data v${preset.emojiVersion}</title>
			<body>
				<table>
					<tbody>
						${tableRows}
					</tbody>
				</table>
			</body>
		</html>
	`;

	fs.writeFileSync(`docs/emoji-data-v${preset.emojiVersion}.html`, html);
};

buildForPreset(presetUnicode9Emoji3);
buildForPreset(presetUnicode9Emoji4);
