import fetchMock from 'fetch-mock';
import buildEmojiData, { internals } from '../emoji-data';

const {
	defaultUrl,
	expandEmojiData,
	getEmojiCodepoints,
	getEmojiPresentationCodepoints,
	getEmojiModifierCodepoints,
	getEmojiModifierBaseCodepoints,
	getMetaForModifierName,
	buildModifierSequencesForModifiableCodepoint,
} = internals;

const expandedEmojiDataMock = [
	{ codepoint: '2139', property: 'Emoji' },
	{ codepoint: '231A', property: 'Emoji_Presentation' },
	{ codepoint: '231B', property: 'Emoji_Presentation' },
	{ codepoint: '1F3FB', property: 'Emoji_Modifier' },
	{ codepoint: '1F3FC', property: 'Emoji_Modifier' },
	{ codepoint: '261D', property: 'Emoji_Modifier_Base' },
];

const getNameForCodepointMock = (codepoint) => {
	const nameForCodepoint = {
		'0023': 'NUMBER SIGN',
		'2139': 'INFORMATION SOURCE', // eslint-disable-line quote-props
		'231A': 'WATCH',
		'231B': 'HOURGLASS',
		'1F3FB': 'EMOJI MODIFIER FITZPATRICK TYPE-1-2',
		'1F3FC': 'EMOJI MODIFIER FITZPATRICK TYPE-3',
		'261D': 'WHITE UP POINTING INDEX',
		'1F4A9': 'PILE OF POO', // one that has no variations
	};
	return nameForCodepoint[codepoint];
};

const getVariationSequencesForCodepointMock = (codepoint) => {
	const variationSequencesForCodepoint = {
		'0023': {
			text: '0023 FE0E',
			emoji: '0023 FE0F',
		},
		'2139': { // eslint-disable-line quote-props
			text: '2139 FE0E',
			emoji: '2139 FE0F',
		},
		'231A': {
			text: '231A FE0E',
			emoji: '231A FE0F',
		},
		'231B': {
			text: '231B FE0E',
			emoji: '231B FE0F',
		},
		'261D': {
			text: '261D FE0E',
			emoji: '261D FE0F',
		},
	};
	return variationSequencesForCodepoint[codepoint];
};

const getCombinationsForCodepointMock = (codepoint) => {
	const combinationsForCodepoint = {
		'0023': {
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
		},
		'2139': {}, // eslint-disable-line quote-props
		'231A': {},
		'231B': {},
		'261D': {},
		'1F4A9': {},
	};
	return combinationsForCodepoint[codepoint];
};

const getShiftJisCodesForCodepointMock = (codepoint) => {
	const shiftJisCodesForCodepoint = {
		'2139': { kddi: 'F74F' }, // eslint-disable-line quote-props
		'231A': { docomo: 'F9C4', kddi: 'F797' },
		'231B': { kddi: 'F798' },
		'261D': { kddi: 'F6CF', softbank: 'F94F' },
		'1F4A9': { kddi: 'F6CE', softbank: 'F99B' },
	};
	return shiftJisCodesForCodepoint[codepoint];
};

describe('emoji-data', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://www.unicode.org/Public/emoji/5.0/emoji-data.txt');
	});

	it('should expand emoji data', () => {
		const data = [
			{ codepoints: '2139', property: 'Emoji' },
			{ codepoints: '231A..231B', property: 'Emoji_Presentation' },
			{ codepoints: '1F3FB..1F3FC', property: 'Emoji_Modifier' },
			{ codepoints: '261D', property: 'Emoji_Modifier_Base' },
		];
		const expandedEmojiData = expandEmojiData(data);
		expect(expandedEmojiData).to.deep.equal(expandedEmojiDataMock);
	});

	it('should extract code points recommended for use as emoji', () => {
		const expected = [expandedEmojiDataMock[0].codepoint];
		const emojiCodepoints = getEmojiCodepoints(expandedEmojiDataMock);
		expect(emojiCodepoints).to.deep.equal(expected);
	});

	it('should extract code points that should appear with an emoji presentation style by default', () => {
		const expected = [expandedEmojiDataMock[1].codepoint, expandedEmojiDataMock[2].codepoint];
		const emojiPresentationCodepoints = getEmojiPresentationCodepoints(expandedEmojiDataMock);
		expect(emojiPresentationCodepoints).to.deep.equal(expected);
	});

	it('should extract code points that can be used to modify the appearance of a preceding emoji', () => {
		const expected = [expandedEmojiDataMock[3].codepoint, expandedEmojiDataMock[4].codepoint];
		const emojiModifierCodepoints = getEmojiModifierCodepoints(expandedEmojiDataMock);
		expect(emojiModifierCodepoints).to.deep.equal(expected);
	});

	it('should extract code points whose appearance can be modified by a subsequent emoji modifier', () => {
		const expected = [expandedEmojiDataMock[5].codepoint];
		const emojiModifierBaseCodepoints = getEmojiModifierBaseCodepoints(expandedEmojiDataMock);
		expect(emojiModifierBaseCodepoints).to.deep.equal(expected);
	});

	it('should derive a short name from a given modifier name', () => {
		expect(getMetaForModifierName('NOT A MODIFIER')).to.equal(null);
		expect(getMetaForModifierName('EMOJI MODIFIER FITZPATRICK TYPE-1-2')).to.deep.equal({
			propKey: 'type-1-2',
			nameExt: 'EMOJI MODIFIER FITZPATRICK TYPE-1-2',
		});
		expect(getMetaForModifierName('EMOJI MODIFIER FITZPATRICK TYPE-3')).to.deep.equal({
			propKey: 'type-3',
			nameExt: 'EMOJI MODIFIER FITZPATRICK TYPE-3',
		});
	});

	it('should map each modifiable (base) code point to a precompiled modifier sequence', () => {
		const emojiModifierBaseCodepointsMock = ['261D'];
		const emojiModifierCodepointsMock = ['1F3FB', '1F3FC'];
		const expected = {
			'261D': {
				'type-1-2': {
					name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-1-2',
					defaultPresentation: 'emoji',
					presentation: {
						default: '261D 1F3FB',
					},
				},
				'type-3': {
					name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-3',
					defaultPresentation: 'emoji',
					presentation: {
						default: '261D 1F3FC',
					},
				},
			},
		};
		const modifierSequencesForModifiableCodepoint = buildModifierSequencesForModifiableCodepoint(
			emojiModifierBaseCodepointsMock,
			emojiModifierCodepointsMock,
			getNameForCodepointMock,
		);
		expect(modifierSequencesForModifiableCodepoint).to.deep.equal(expected);
	});

	it('should generate an API', (done) => {
		fetchMock.get('*', `
			0023          ; Emoji                # 1.1  [1] (#)       NUMBER SIGN
			2139          ; Emoji                # 3.0  [1] (ℹ)       INFORMATION SOURCE
			231A..231B    ; Emoji                # 1.1  [2] (⌚..⌛)    WATCH..HOURGLASS
			231A..231B    ; Emoji_Presentation   # 1.1  [2] (⌚..⌛)    WATCH..HOURGLASS
			1F3FB..1F3FC  ; Emoji_Modifier       # 8.0  [2] (🏻...🏿)    EMOJI MODIFIER FITZPATRICK TYPE-1-2..EMOJI MODIFIER FITZPATRICK TYPE-3
			261D          ; Emoji                # 1.1  [1] (☝)       WHITE UP POINTING INDEX
			261D          ; Emoji_Modifier_Base  # 1.1  [1] (☝)       WHITE UP POINTING INDEX
			1F4A9         ; Emoji                # whatever
			1F4A9         ; Emoji_Presentation   # whatever
		`);
		const step = buildEmojiData({
			getNameForCodepoint: getNameForCodepointMock,
			getVariationSequencesForCodepoint: getVariationSequencesForCodepointMock,
			getCombinationsForCodepoint: getCombinationsForCodepointMock,
			getShiftJisCodesForCodepoint: getShiftJisCodesForCodepointMock,
		});
		step.next().value.then((content) => { // wait until first yield's promise (mocked fetch) resolves
			const api = step.next(content).value; // manually hand over mocked content to the left side of yield
			expect(api).to.have.all.keys('getMetaForModifierName', 'emoji');
			expect(api.getMetaForModifierName).to.be.a('function');
			expect(api.getMetaForModifierName('EMOJI MODIFIER FITZPATRICK TYPE-3')).to.deep.equal({
				propKey: 'type-3',
				nameExt: 'EMOJI MODIFIER FITZPATRICK TYPE-3',
			});
			expect(api.emoji).to.deep.equal([
				{
					name: 'NUMBER SIGN',
					codepoint: '0023',
					shiftJis: undefined,
					defaultPresentation: 'text',
					presentation: {
						default: '0023',
						variation: {
							text: '0023 FE0E',
							emoji: '0023 FE0F',
						},
					},
					combination: {
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
					},
					modification: undefined,
				},
				{
					name: 'INFORMATION SOURCE',
					codepoint: '2139',
					shiftJis: {
						kddi: 'F74F',
					},
					defaultPresentation: 'text',
					presentation: {
						default: '2139',
						variation: {
							text: '2139 FE0E',
							emoji: '2139 FE0F',
						},
					},
					combination: undefined,
					modification: undefined,
				},
				{
					name: 'WATCH',
					codepoint: '231A',
					shiftJis: {
						docomo: 'F9C4',
						kddi: 'F797',
					},
					defaultPresentation: 'emoji',
					presentation: {
						default: '231A',
						variation: {
							text: '231A FE0E',
							emoji: '231A FE0F',
						},
					},
					combination: undefined,
					modification: undefined,
				},
				{
					name: 'HOURGLASS',
					codepoint: '231B',
					shiftJis: {
						kddi: 'F798',
					},
					defaultPresentation: 'emoji',
					presentation: {
						default: '231B',
						variation: {
							text: '231B FE0E',
							emoji: '231B FE0F',
						},
					},
					combination: undefined,
					modification: undefined,
				},
				{
					name: 'WHITE UP POINTING INDEX',
					codepoint: '261D',
					shiftJis: {
						kddi: 'F6CF',
						softbank: 'F94F',
					},
					defaultPresentation: 'text',
					presentation: {
						default: '261D',
						variation: {
							text: '261D FE0E',
							emoji: '261D FE0F',
						},
					},
					combination: undefined,
					modification: {
						skin: {
							'type-1-2': {
								name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-1-2',
								defaultPresentation: 'emoji',
								presentation: {
									default: '261D 1F3FB',
								},
							},
							'type-3': {
								name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-3',
								defaultPresentation: 'emoji',
								presentation: {
									default: '261D 1F3FC',
								},
							},
						},
					},
				},
				{
					name: 'PILE OF POO',
					codepoint: '1F4A9',
					shiftJis: {
						kddi: 'F6CE',
						softbank: 'F99B',
					},
					defaultPresentation: 'emoji',
					presentation: {
						default: '1F4A9',
						variation: undefined,
					},
					combination: undefined,
					modification: undefined,
				},
			]);
			done();
		});
	});
});
