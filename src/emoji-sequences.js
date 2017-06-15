import 'isomorphic-fetch';
import parse from './parse';
import preset from './preset';

// emoji-sequences.txt provides combining, flag and modifier sequences.
// We use this only to get combining and flag sequences.
const defaultUrl = preset.emojiSequencesUrl;

// Combining marks can modify the appearance of a preceding
// emoji variation sequence when used in a combining sequence.
const combiningMarks = {
	'20E3': { // COMBINING ENCLOSING KEYCAP
		propKey: 'keycap',
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

// Builds a map of compatible code points for each combining mark
// while associating with them their transformed/combined name:
// {
// 	...
// 	"20E3": { // COMBINING ENCLOSING KEYCAP
// 		...
// 		"0030": "KEYCAP ZERO", // DIGIT ZERO
// 		...
// 	},
// 	...
// }
function buildCompatibleCodepointsForCombiningMark(emojiVersion, data, getNameForCodepoint) {
	const versionSpecificType = emojiVersion === 4 ? 'Emoji_Combining_Sequence' : 'Emoji_Keycap_Sequence';
	return data
	.filter(datum => datum.type === versionSpecificType)
	.reduce((cpsForMark, datum) => {
		const nextCpsForMark = cpsForMark;
		const codepoints = datum.sequence.split(' ');
		const compatibleCodepoint = codepoints[0]; // ignore the variation selector
		const combiningMark = codepoints[codepoints.length - 1];
		if (nextCpsForMark[combiningMark] == null) {
			nextCpsForMark[combiningMark] = {};
		}
		const compatibleCodepointName = getNameForCodepoint(compatibleCodepoint);
		const combinedName = combiningMarks[combiningMark].getCombinedName(compatibleCodepointName);
		nextCpsForMark[combiningMark][compatibleCodepoint] = combinedName;
		return nextCpsForMark;
	}, {});
}

// Assemble a data structure describing combinations for a given codepoint:
// {
// 	"keycap": {
// 		"name": "KEYCAP ZERO",
// 		"defaultPresentation": "emoji",
// 		"presentation": {
// 			"default": "0030 20E3",
// 			"variation": {
// 				"text": "0030 FE0E 20E3",
// 				"emoji": "0030 FE0F 20E3"
// 			}
// 		}
// 	}
// 	...
// }
function combinationsForCodepoint(codepoint, compatibleCodepointsForCombiningMark, getVariationSequencesForCodepoint) {
	return Object.keys(compatibleCodepointsForCombiningMark).reduce((combForMarkProp, mark) => {
		const nextCombForMarkProp = combForMarkProp;
		const markPropKey = combiningMarks[mark].propKey;
		const compatibleCodepoints = compatibleCodepointsForCombiningMark[mark];
		if (compatibleCodepoints[codepoint] == null) {
			return nextCombForMarkProp; // return early
		}
		const variationSequences = getVariationSequencesForCodepoint(codepoint);
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
		nextCombForMarkProp[markPropKey] = {
			name: compatibleCodepoints[codepoint],
			defaultPresentation: 'emoji', // combination should take on an emoji presentation per default
			presentation: {
				default: defaultPresentation,
				variation: !variationSequences ? undefined : {
					text: textPresentation,
					emoji: emojiPresentation,
				},
			},
		};
		return nextCombForMarkProp;
	}, {});
}

// Build collection of flag emoji data from flag sequences:
// [
// 	...
// 	{
// 		"name": "REGIONAL INDICATOR SYMBOL LETTER D, REGIONAL INDICATOR SYMBOL LETTER E",
// 		"defaultPresentation": "emoji",
// 		"presentation": {
// 			"default": "1F1E9 1F1EA"
// 		}
// 	}
// 	...
// ]
function buildFlagEmoji(
	data,
	getNameForCodepoint,
	getEmojiVersionForCodepoint,
	getUnicodeVersionForCodepoint,
) {
	return data.filter(datum =>
		datum.type === 'Emoji_Flag_Sequence',
	)
	.map(datum => ({
		// No codepoint prop here because it's technically not a codepoint
		// singleton but rather just a combination of other codepoints.
		name: datum.sequence.split(' ').map(cp => getNameForCodepoint(cp)).join(', '),
		defaultPresentation: 'emoji', // always for flags
		presentation: {
			default: datum.sequence,
		},
		version: getEmojiVersionForCodepoint(datum.sequence),
		unicodeVersion: getUnicodeVersionForCodepoint(datum.sequence),
	}));
}

export const internals = {
	defaultUrl,
	combiningMarks,
	buildCompatibleCodepointsForCombiningMark,
	combinationsForCodepoint,
	buildFlagEmoji,
};

export default function* EmojiSequences({
	url = defaultUrl,
	emojiVersion,
	getNameForCodepoint,
	getVariationSequencesForCodepoint,
	getEmojiVersionForCodepoint,
	getUnicodeVersionForCodepoint,
}) {
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['sequence', 'type', 'description']);
	const compatibleCodepointsForCombiningMark = buildCompatibleCodepointsForCombiningMark(emojiVersion, data, getNameForCodepoint);
	const getCombinationsForCodepoint = codepoint => combinationsForCodepoint(codepoint, compatibleCodepointsForCombiningMark, getVariationSequencesForCodepoint);
	const flagEmoji = buildFlagEmoji(data, getNameForCodepoint, getEmojiVersionForCodepoint, getUnicodeVersionForCodepoint);
	return { // API
		getCombinationsForCodepoint,
		flagEmoji,
	};
}
