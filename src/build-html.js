import fs from 'fs';
import punycode from 'punycode';
import { expandEmojiData, emojiDataStable, emojiDataBeta } from '.';
import presetStable from './preset-stable';

process.on('uncaughtException', (err) => { throw err; });
process.on('unhandledRejection', (err) => { throw err; });

const buildForPreset = (preset) => {
	const expandedData = expandEmojiData(preset.tag === 'stable' ? emojiDataStable : emojiDataBeta);
	const tableRows = expandedData.map((datum, index) => {
		// Prefer explicit emoji presentation variation sequence:
		let exampleOutputSequence = datum.presentation.variation ? datum.presentation.variation.emoji : datum.presentation.default;
		// Make keycaps look nice in Google Chrome:
		if (datum.name.includes('KEYCAP')) {
			exampleOutputSequence = datum.presentation.default;
		}
		const exampleOutput = punycode.ucs2.encode(exampleOutputSequence.split(' ').map(cp => parseInt(cp, 16)));
		return `
			<tr>
				<td><pre>${index + 1}</pre></td>
				<td><pre>${datum.name}</pre></td>
				<td><pre>${exampleOutputSequence} => ${exampleOutput}</pre></td>
				<td><pre>${JSON.stringify(datum, null, 2)}</pre></td>
			</tr>`;
	}).join('');

	const html = `
		<!DOCTYPE html>
		<html>
			<head>
			<meta charset="utf-8">
			<title>emoji data for unicode ${preset.unicodeVersion}, emoji ${preset.emojiVersion} (${preset.tag})</title>
			<style>
				table {
					border-collapse: collapse;
				}
				th, td {
					vertical-align: top;
					text-align: left;
					white-space: nowrap;
					border: 1px solid black;
				}
				td:last-child {
					white-space: normal;
				}
			</style>
			<body>
				<table>
					<thead>
						<th>#</th>
						<th>Name</th>
						<th>Example Output</th>
						<th>Emoji Datum</th>
					</thead>
					<tbody>
						${tableRows}
					</tbody>
				</table>
			</body>
		</html>
	`;

	fs.writeFileSync(`docs/emoji-data.${preset.tag}.html`, html);
};

buildForPreset(presetStable); // for now we only care about the stable data
