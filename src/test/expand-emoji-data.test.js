import expandEmojiData, { internals } from '../expand-emoji-data';

const {
	transformEmojiDatum,
} = internals;

const datumWithVariation = {
	name: 'UMBRELLA WITH RAIN DROPS',
	codepoint: '2614',
	shiftJis: {
		docomo: 'F8A1',
		kddi: 'F664',
		softbank: 'F98C',
	},
	defaultPresentation: 'emoji',
	presentation: {
		default: '2614',
		variation: {
			text: '2614 FE0E',
			emoji: '2614 FE0F',
		},
	},
};

const datumWithCombinationAndVariation = {
	name: 'NUMBER SIGN',
	codepoint: '0023',
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
};

const datumWithSkinModification = {
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
			'type-4': {
				name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4',
				defaultPresentation: 'emoji',
				presentation: {
					default: '261D 1F3FD',
				},
			},
			'type-5': {
				name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-5',
				defaultPresentation: 'emoji',
				presentation: {
					default: '261D 1F3FE',
				},
			},
			'type-6': {
				name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-6',
				defaultPresentation: 'emoji',
				presentation: {
					default: '261D 1F3FF',
				},
			},
		},
	},
};

describe('expand-emoji-data', () => {
	it('should transform a given base datum', () => {
		expect(transformEmojiDatum(
			datumWithVariation,
		)).to.equal(datumWithVariation);
		expect(transformEmojiDatum(
			datumWithCombinationAndVariation,
			datumWithCombinationAndVariation.combination.keycap,
		)).to.deep.equal({
			...datumWithCombinationAndVariation,
			...datumWithCombinationAndVariation.combination.keycap,
			modification: undefined,
			combination: undefined,
		});
		expect(transformEmojiDatum(
			datumWithSkinModification,
			datumWithSkinModification.modification.skin['type-4'],
		)).to.deep.equal({
			...datumWithSkinModification,
			...datumWithSkinModification.modification.skin['type-4'],
			modification: undefined,
			combination: undefined,
		});
	});

	it('should expand all given emoji data entries such that each combination and each modification of one entry results in a separate entry', () => {
		const data = [
			datumWithVariation,
			datumWithCombinationAndVariation,
			datumWithSkinModification,
		];
		expect(expandEmojiData(data)).to.deep.equal([
			datumWithVariation,
			{
				...datumWithCombinationAndVariation,
				...datumWithCombinationAndVariation.combination.keycap,
				modification: undefined,
				combination: undefined,
			},
			datumWithSkinModification,
			{
				...datumWithSkinModification,
				...datumWithSkinModification.modification.skin['type-1-2'],
				modification: undefined,
				combination: undefined,
			},
			{
				...datumWithSkinModification,
				...datumWithSkinModification.modification.skin['type-3'],
				modification: undefined,
				combination: undefined,
			},
			{
				...datumWithSkinModification,
				...datumWithSkinModification.modification.skin['type-4'],
				modification: undefined,
				combination: undefined,
			},
			{
				...datumWithSkinModification,
				...datumWithSkinModification.modification.skin['type-5'],
				modification: undefined,
				combination: undefined,
			},
			{
				...datumWithSkinModification,
				...datumWithSkinModification.modification.skin['type-6'],
				modification: undefined,
				combination: undefined,
			},
		]);
	});
});
