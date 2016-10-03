import fetchMock from 'fetch-mock';
import buildEmojiSequences, { internals } from '../emoji-sequences';

const {
	defaultUrl,
	combiningMarks,
	buildCompatibleCodepointsForCombiningMark,
	combinationsForCodepoint,
	buildFlagEmoji,
} = internals;

const getNameForCodepointMock = (codepoint) => {
	const nameForCodepoint = {
		'0023': 'NUMBER SIGN',
		'002A': 'ASTERISK',
		'0030': 'DIGIT ZERO',
		'0031': 'DIGIT ONE',
		'0032': 'DIGIT TWO',
		'0033': 'DIGIT THREE',
		'0034': 'DIGIT FOUR',
		'0035': 'DIGIT FIVE',
		'0036': 'DIGIT SIX',
		'0037': 'DIGIT SEVEN',
		'0038': 'DIGIT EIGHT',
		'0039': 'DIGIT NINE',
		'compatible-but-variation-less-codepoint': 'COMPATIBLE-BUT-VARIATION-LESS',
		'1F1E6': 'REGIONAL INDICATOR SYMBOL LETTER A',
		'1F1E8': 'REGIONAL INDICATOR SYMBOL LETTER C',
		'1F1E9': 'REGIONAL INDICATOR SYMBOL LETTER D',
		'1F1EA': 'REGIONAL INDICATOR SYMBOL LETTER E',
	};
	return nameForCodepoint[codepoint];
};

const compatibleCodepointsForCombiningMarkMock = {
	'20E3': {
		'0023': 'KEYCAP NUMBER SIGN',
		'002A': 'KEYCAP ASTERISK',
		'0030': 'KEYCAP ZERO',
		'0031': 'KEYCAP ONE',
		'0032': 'KEYCAP TWO',
		'0033': 'KEYCAP THREE',
		'0034': 'KEYCAP FOUR',
		'0035': 'KEYCAP FIVE',
		'0036': 'KEYCAP SIX',
		'0037': 'KEYCAP SEVEN',
		'0038': 'KEYCAP EIGHT',
		'0039': 'KEYCAP NINE',
		'compatible-but-variation-less-codepoint': 'KEYCAP COMPATIBLE-BUT-VARIATION-LESS',
	},
};

const getVariationSequencesForCodepointMock = (codepoint) => {
	const variationSequencesForCodepoint = {
		'0023': {
			text: '0023 FE0E',
			emoji: '0023 FE0F',
		},
	};
	return variationSequencesForCodepoint[codepoint];
};

const expectedFlagEmoji = [
	{
		name: 'REGIONAL INDICATOR SYMBOL LETTER A, REGIONAL INDICATOR SYMBOL LETTER C',
		defaultPresentation: 'emoji',
		presentation: {
			default: '1F1E6 1F1E8',
		},
	},
	{
		name: 'REGIONAL INDICATOR SYMBOL LETTER A, REGIONAL INDICATOR SYMBOL LETTER D',
		defaultPresentation: 'emoji',
		presentation: {
			default: '1F1E6 1F1E9',
		},
	},
	{
		name: 'REGIONAL INDICATOR SYMBOL LETTER A, REGIONAL INDICATOR SYMBOL LETTER E',
		defaultPresentation: 'emoji',
		presentation: {
			default: '1F1E6 1F1EA',
		},
	},
];

describe('emoji-sequences', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/Public/emoji/3.0/emoji-sequences.txt');
	});
	it('should provide proper meta data for combining marks', () => {
		expect(combiningMarks).to.have.all.keys('20E3', '20E0');
		expect(combiningMarks['20E3']).to.have.all.keys('propKey', 'getCombinedName');
		expect(combiningMarks['20E3'].propKey).to.equal('keycap');
		expect(combiningMarks['20E3'].getCombinedName).to.be.a('function');
		expect(combiningMarks['20E3'].getCombinedName('DIGIT ONE')).to.equal('KEYCAP ONE');
		expect(combiningMarks['20E3'].getCombinedName('NUMBER SIGN')).to.equal('KEYCAP NUMBER SIGN');
		expect(combiningMarks['20E0']).to.deep.equal({});
	});
	it('should build a map of compatible code points for each combining mark while associating with them their transformed/combined name', () => {
		const data = [
			{ sequence: '0023 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '002A FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0030 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0031 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0032 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0033 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0034 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0035 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0036 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0037 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0038 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: '0039 FE0F 20E3', type: 'Emoji_Combining_Sequence' },
			{ sequence: 'compatible-but-variation-less-codepoint FE0F 20E3', type: 'Emoji_Combining_Sequence' },
		];
		const compatibleCodepointsForCombiningMark = buildCompatibleCodepointsForCombiningMark(data, getNameForCodepointMock);
		expect(compatibleCodepointsForCombiningMark).to.deep.equal(compatibleCodepointsForCombiningMarkMock);
	});
	it('should generate a data structure describing combinations for a given code point', () => {
		expect(combinationsForCodepoint('0023', compatibleCodepointsForCombiningMarkMock, getVariationSequencesForCodepointMock))
		.to.deep.equal({
			keycap: {
				name: 'KEYCAP NUMBER SIGN',
				defaultPresentation: 'emoji',
				presentation: {
					default: '0023 20E3',
					variation: {
						text: '0023 FE0E 20E3',
						emoji: '0023 FE0F 20E3',
					},
				},
			},
		});
		expect(combinationsForCodepoint('non-compatible-codepoint', compatibleCodepointsForCombiningMarkMock, getVariationSequencesForCodepointMock))
		.to.deep.equal({});
		expect(combinationsForCodepoint('compatible-but-variation-less-codepoint', compatibleCodepointsForCombiningMarkMock, getVariationSequencesForCodepointMock))
		.to.deep.equal({
			keycap: {
				name: 'KEYCAP COMPATIBLE-BUT-VARIATION-LESS',
				defaultPresentation: 'emoji',
				presentation: {
					default: 'compatible-but-variation-less-codepoint 20E3',
					variation: undefined,
				},
			},
		});
	});
	it('should build additional flag emoji', () => {
		const data = [
			{ sequence: '1F1E6 1F1E8', type: 'Emoji_Flag_Sequence' },
			{ sequence: '1F1E6 1F1E9', type: 'Emoji_Flag_Sequence' },
			{ sequence: '1F1E6 1F1EA', type: 'Emoji_Flag_Sequence' },
		];
		const flagEmoji = buildFlagEmoji(data, getNameForCodepointMock);
		expect(flagEmoji).to.deep.equal(expectedFlagEmoji);
	});
	it('should generate an API', (done) => {
		fetchMock.get('*', `
			1F1E6 1F1E8   ; Emoji_Flag_Sequence       # 6.0  [1] (🇦🇨)      Flag for Ascension Island
			1F1E6 1F1E9   ; Emoji_Flag_Sequence       # 6.0  [1] (🇦🇩)      Flag for Andorra
			1F1E6 1F1EA   ; Emoji_Flag_Sequence       # 6.0  [1] (🇦🇪)      Flag for United Arab Emirates
		`);
		const step = buildEmojiSequences({
			getNameForCodepoint: getNameForCodepointMock,
			getVariationSequencesForCodepoint: getVariationSequencesForCodepointMock,
		});
		step.next().value.then((content) => { // wait until first yield's promise (mocked fetch) resolves
			const api = step.next(content).value; // manually hand over mocked content to the left side of yield
			expect(api).to.have.all.keys('getCombinationsForCodepoint', 'flagEmoji');
			expect(api.getCombinationsForCodepoint).to.be.a('function');
			expect(api.getCombinationsForCodepoint('non-compatible-codepoint', compatibleCodepointsForCombiningMarkMock, getVariationSequencesForCodepointMock))
			.to.deep.equal({});
			expect(api.flagEmoji).to.deep.equal(expectedFlagEmoji);
			done();
		});
	});
});
