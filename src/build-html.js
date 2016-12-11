import fs from 'fs';
import { expandEmojiData, emojiDataStable, emojiDataBeta } from '.';
import presetStable from './preset-stable';
import presetBeta from './preset-beta';

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

const buildForPreset = (preset) => {
	const expandedData = expandEmojiData(preset.tag === 'stable' ? emojiDataStable : emojiDataBeta);
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
			<title>emoji data for unicode v${preset.unicodeVersion}, emoji v${preset.emojiVersion} (${preset.tag})</title>
			<body>
				<table>
					<tbody>
						${tableRows}
					</tbody>
				</table>
			</body>
		</html>
	`;

	fs.writeFileSync(`docs/emoji-data-v${preset.emojiVersion}.${preset.tag}.html`, html);
};

buildForPreset(presetStable);
buildForPreset(presetBeta);
