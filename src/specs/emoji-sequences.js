import fetch from 'node-fetch';
import parse from '../utils/parse';
import { codepointSequenceToString } from '../utils/convert';

// emoji-sequences
// emoji-sequences.txt provides combining, flag and modifier sequences.
// We use this only to get combining and flag sequences.
const defaultUrl = 'http://www.unicode.org/Public/emoji/3.0/emoji-sequences.txt';

export default function* EmojiSequences({ url = defaultUrl, getNameForCodepoint }) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['sequence', 'type', 'description']);

	// Combining marks can modify the appearance of a preceding
	// emoji variation sequence when used in a combining sequence.
	const combiningMarks = {
		'20E3': { // COMBINING ENCLOSING KEYCAP
			propertyKey: 'keycap',
			// For digits, follow naming convention of pure emoji U+1F51F (KEYCAP TEN)
			getCombinedName: name => (
				name.startsWith('DIGIT')
					? name.replace('DIGIT', 'KEYCAP')
					: `KEYCAP ${name}`
			),
		},
		'20E0': { // COMBINING ENCLOSING CIRCLE BACKSLASH
			// Prohibition mark is generally recommended in tr51 but there are
			// no compatible code points mentioned in StandardizedVariants.txt
			// and implementations don't seem to support this yet
		},
	};

	// Build a map of compatible code points for each combining mark
	// while associating with them their transformed/combined name:
	// {
	// 	...
	// 	'20E3': { // COMBINING ENCLOSING KEYCAP
	// 		...
	// 		'002A': 'KEYCAP ASTERISK', // ASTERISK
	// 		'0030': 'KEYCAP ZERO', // DIGIT ZERO
	// 		...
	// 	},
	// 	...
	// }
	const compatibleCodepointsForCombiningMark = data
		.filter(datum => datum.type === 'Emoji_Combining_Sequence')
		.reduce((cpsForMark, datum) => {
			const codepoints = datum.sequence.split(' ');
			const compatibleCodepoint = codepoints[0]; // ignore the variation selector
			const combiningMark = codepoints[codepoints.length - 1];
			if (cpsForMark[combiningMark] == null) {
				cpsForMark[combiningMark] = {}; // eslint-disable-line no-param-reassign
			}
			const compatibleCodepointName = getNameForCodepoint(compatibleCodepoint);
			const combinedName = combiningMarks[combiningMark].getCombinedName(compatibleCodepointName);
			cpsForMark[combiningMark][compatibleCodepoint] = combinedName; // eslint-disable-line no-param-reassign
			return cpsForMark;
		}, {});

	// Assemble combination data for a codepoint:
	const getCombinationsForCodepoint = codepoint =>
		Object.keys(compatibleCodepointsForCombiningMark).reduce((combForMarkProp, mark) => {
			const markPropertyKey = combiningMarks[mark].propertyKey;
			const compatibleCodepoints = compatibleCodepointsForCombiningMark[mark];
			if (compatibleCodepoints[codepoint] == null) {
				return combForMarkProp; // return early
			}
			// tr51: Combining marks may be applied to emoji, just like they can
			// be applied to other characters. When a combining mark is applied
			// to a code point, the combination should take on an emoji presentation.
			// StandardizedVariants.txt defines both emoji and text variations to be
			// compatible with keycap marks and implementations also support both.
			// Furthermore, EmojiSources.txt indicates keycap mark be joined
			// without a variation sequence present.
			// -> So as a consequence we support all three presentations:
			const defaultPresentation = `${codepoint} ${mark}`;
			const textPresentation = `${codepoint} FE0E ${mark}`;
			const emojiPresentation = `${codepoint} FE0F ${mark}`;
			combForMarkProp[markPropertyKey] = compatibleCodepoints[codepoint] == null ? undefined : { // eslint-disable-line no-param-reassign
				name: compatibleCodepoints[codepoint],
				defaultPresentation: 'emoji', // combination should take on an emoji presentation
				presentation: {
					default: {
						sequence: defaultPresentation,
						output: codepointSequenceToString(defaultPresentation),
					},
					variation: {
						text: {
							sequence: textPresentation,
							output: codepointSequenceToString(textPresentation),
						},
						emoji: {
							sequence: emojiPresentation,
							output: codepointSequenceToString(emojiPresentation),
						},
					},
				},
			};
			return combForMarkProp;
		}, {});

	// Build additional flag emoji entries from flag sequences:
	const flagEmoji = data
		.filter(datum => datum.type === 'Emoji_Flag_Sequence')
		.map(datum => ({
			// No codepoint prop here because it's technically not a codepoint
			// singleton but rather just a combination of other codepoints.
			name: datum.sequence.split(' ').map(cp => getNameForCodepoint(cp)).join(', '),
			defaultPresentation: 'emoji', // always for flags
			presentation: {
				default: {
					sequence: datum.sequence,
					output: codepointSequenceToString(datum.sequence),
				},
			},
		}));

	return { // API
		getCombinationsForCodepoint,
		flagEmoji,
	};
}
