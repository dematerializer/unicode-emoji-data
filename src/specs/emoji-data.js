import logUpdate from 'log-update';
import fetch from 'node-fetch';
import leftPad from 'left-pad'; // FTW!
import parse from '../utils/parse';

// emoji-data.txt provides emoji code points.
// Property "Emoji=Yes" means "emoji character", a character that is recommended for use as emoji
// If property "Emoji=No", then "Emoji_Presentation=No", "Emoji_Modifier=No" and "Emoji_Modifier_Base=No"
// Property "Emoji_Presentation=Yes" means "default emoji presentation character",
//   a character that, by default, should appear with an emoji presentation style
// Property "Emoji_Presentation=No" means "default text presentation character",
//   a character that, by default, should appear with a text presentation style
// Property "Emoji_Modifier=Yes" — A character that can be used to modify the appearance of a preceding emoji in an emoji modifier sequence
// property="Emoji_Modifier_Base" means A character whose appearance can be modified by a subsequent emoji modifier in an emoji modifier sequence
const defaultUrl = 'http://www.unicode.org/Public/emoji/3.0/emoji-data.txt';

// Expand code point ranges (e.g. '1F601..1F610') into separate objects
// [
// 	...
// 	{
// 		"codepoint": "1F3C6",
// 		"property": "Emoji",
// 	}
// 	...
// 	{
// 		"codepoint": "2705",
// 		"property": "Emoji_Presentation",
// 	}
// 	...
// 	{
// 		"codepoint": "1F3FB",
// 		"property": "Emoji_Modifier",
// 	}
// 	...
// 	{
// 		"codepoint": "1F466",
// 		"property": "Emoji_Modifier_Base",
// 	}
// 	...
// ]
function expandEmojiData(data, getNameForCodepoint) {
	return data.reduce((expanded, datum) => {
		if (datum.codepoints.indexOf('..') > -1) {
			const codepointRange = datum.codepoints.split('..').map(cp => parseInt(cp, 16));
			const [lowCodepoint, highCodepoint] = codepointRange;
			for (let cp = lowCodepoint; cp <= highCodepoint; cp += 1) {
				const cpHex = leftPad(cp.toString(16), 4, 0).toUpperCase();
				expanded.push({
					codepoint: cpHex,
					property: datum.property,
				});
			}
		} else {
			expanded.push({
				codepoint: datum.codepoints,
				property: datum.property,
			});
		}
		return expanded;
	}, []);
}

// Extracts code points recommended for use as emoji:
// [
// 	...
// 	"1F3C6",
// 	...
// ]
function getEmojiCodepoints(data) {
	return data.filter(d => d.property === 'Emoji').map(d => d.codepoint);
}

// Extracts code points that should appear with an emoji presentation style by default:
// [
// 	...
// 	"2705",
// 	...
// ]
function getEmojiPresentationCodepoints(data) {
	return data.filter(d => d.property === 'Emoji_Presentation').map(d => d.codepoint);
}

// Extracts code points that can be used to modify the appearance of a preceding emoji:
// [
// 	...
// 	"1F3FB",
// 	...
// ]
function getEmojiModifierCodepoints(data) {
	return data.filter(d => d.property === 'Emoji_Modifier').map(d => d.codepoint);
}

// Extracts code points whose appearance can be modified by a subsequent emoji modifier:
// [
// 	...
// 	"1F466",
// 	...
// ]
function getEmojiModifierBaseCodepoints(data) {
	return data.filter(d => d.property === 'Emoji_Modifier_Base').map(d => d.codepoint);
}

// Derives a short name from a given modifier name:
function getMetaForModifierName(modName) {
	if (modName.includes('EMOJI MODIFIER FITZPATRICK')) {
		const parts = modName.split(' '); // ['EMOJI', 'MODIFIER', 'FITZPATRICK', 'TYPE-1-2']
		const type = parts[parts.length - 1]; // 'TYPE-1-2'
		return {
			propKey: type.toLowerCase(), // 'type-1-2'
			nameExt: type, // 'TYPE-1-2'
		};
	}
	return null;
}

// Build map of emoji that can be modified, excluding zwj emoji (maps
// each modifiable code point to a precompiled modifier sequence).
// Those are basically (almost) all emoji that have skin variations:
// {
// 	...
// 	"261D": {
// 		"type-1-2": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-1-2
// 			"name": "RAISED HAND; TYPE-1-2",
// 			"defaultPresentation": "emoji",
// 			"presentation": {
// 				"default": "270B 1F3FB",
// 			}
// 		},
// 		"type-3": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-3
// 			"name": "RAISED HAND; TYPE-3",
// 			"defaultPresentation": "emoji",
// 			"presentation": {
// 				"default": "270B 1F3FC",
// 			}
// 		},
// 		"type-4": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-4
// 			"name": "RAISED HAND; TYPE-4",
// 			"defaultPresentation": "emoji",
// 			"presentation": {
// 				"default": "270B 1F3FD",
// 			}
// 		},
// 		"type-5": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-5
// 			"name": "RAISED HAND; TYPE-5",
// 			"defaultPresentation": "emoji",
// 			"presentation": {
// 				"default": "270B 1F3FE",
// 			}
// 		},
// 		"type-6": { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-6
// 			"name": "RAISED HAND; TYPE-6",
// 			"defaultPresentation": "emoji",
// 			"presentation": {
// 				"default": "270B 1F3FF",
// 			}
// 		}
// 	},
// 	...
// }

function buildModifierSequencesForModifiableCodepoint(emojiModifierBase, emojiModifier, getNameForCodepoint) {
	return emojiModifierBase.reduce((seqForModBaseCp, modBaseCodepoint) => {
		const extSeqForModBaseCp = seqForModBaseCp;
		const modBaseCpName = getNameForCodepoint(modBaseCodepoint);
		extSeqForModBaseCp[modBaseCodepoint] = emojiModifier
			.reduce((seqForModName, modifierCodepoint) => {
				const extSeqForModName = seqForModName;
				const modName = getNameForCodepoint(modifierCodepoint);
				const nameMeta = getMetaForModifierName(modName);
				extSeqForModName[nameMeta.propKey] = {
					name: `${modBaseCpName}; ${nameMeta.nameExt}`,
					defaultPresentation: 'emoji',
					presentation: {
						default: `${modBaseCodepoint} ${modifierCodepoint}`,
					},
				};
				return extSeqForModName;
			}, {});
		return extSeqForModBaseCp;
	}, {});
}

export const internals = {
	defaultUrl,
	expandEmojiData,
	getEmojiCodepoints,
	getEmojiPresentationCodepoints,
	getEmojiModifierCodepoints,
	getEmojiModifierBaseCodepoints,
	getMetaForModifierName,
	buildModifierSequencesForModifiableCodepoint,
};

export default function* EmojiData({ url = defaultUrl, getNameForCodepoint, getVariationSequencesForCodepoint, getCombinationsForCodepoint, getShiftJisCodesForCodepoint }) {
	logUpdate('⇣ emoji-data');
	const content = yield fetch(url).then(res => res.text());
	const data = parse(content, ['codepoints', 'property']);
	const expandedEmojiData = expandEmojiData(data, getNameForCodepoint);
	const emojiCodepoints = getEmojiCodepoints(expandedEmojiData);
	const emojiPresentationCodepoints = getEmojiPresentationCodepoints(expandedEmojiData);
	const emojiModifierCodepoints = getEmojiModifierCodepoints(expandedEmojiData);
	const emojiModifierBaseCodepoints = getEmojiModifierBaseCodepoints(expandedEmojiData);
	const modifierSequencesForModifiableCodepoint = buildModifierSequencesForModifiableCodepoint(emojiModifierBaseCodepoints, emojiModifierCodepoints, getNameForCodepoint);
	logUpdate('✓ emoji-data');
	logUpdate.done();
	return { // API
		getMetaForModifierName,
		// Assemble enhanced emoji data:
		emoji: emojiCodepoints.map((cp) => {
			const isDefaultEmojiPresentation = emojiPresentationCodepoints.some(pCp => pCp === cp);
			const variationSequences = getVariationSequencesForCodepoint(cp);
			const combinations = getCombinationsForCodepoint(cp);
			const modifications = modifierSequencesForModifiableCodepoint[cp] == null ? undefined : {
				skin: modifierSequencesForModifiableCodepoint[cp],
			};
			return {
				name: getNameForCodepoint(cp),
				codepoint: cp,
				shiftJis: getShiftJisCodesForCodepoint(cp),
				defaultPresentation: isDefaultEmojiPresentation ? 'emoji' : 'text',
				presentation: {
					default: cp, // only the base without explicit variation
					variation: !variationSequences ? undefined : {
						text: variationSequences.text,
						emoji: variationSequences.emoji,
					},
				},
				combination: Object.keys(combinations).length > 0 ? combinations : undefined,
				modification: modifications,
			};
		// tr51: "incomplete singletons" like single regional indicators
		// and fitzpatrick modifiers are not used as emoji by themselves:
		}).filter(datum => !datum.name.includes('REGIONAL INDICATOR SYMBOL LETTER')),
	};
}
