import expandEmojiData, { internals } from '../expand-emoji-data';

const {
	extractEmojiInfoFromDatum,
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

const datumWithSkinModificationAndWithoutVariation = {
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
	it('should extract a simplified, human readable representation from an emoji datum', () => {
		expect(extractEmojiInfoFromDatum(
			datumWithVariation,
		)).to.deep.equal({
			name: 'UMBRELLA WITH RAIN DROPS',
			sequence: '2614 FE0F',
			output: '☔️',
		});
		expect(extractEmojiInfoFromDatum(
			datumWithCombinationAndVariation.combination.keycap,
		)).to.deep.equal({
			name: 'KEYCAP NUMBER SIGN',
			sequence: '0023 FE0F 20E3',
			output: '#️⃣',
		});
		expect(extractEmojiInfoFromDatum(
			datumWithSkinModificationAndWithoutVariation.modification.skin['type-4'],
		)).to.deep.equal({
			name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4',
			sequence: '261D 1F3FD',
			output: '☝🏽',
		});
	});

	it('should expand all emoji data entries such that each combination and each modification of one entry results in a separate, simplified entry', () => {
		const data = [
			datumWithVariation,
			datumWithCombinationAndVariation,
			datumWithSkinModificationAndWithoutVariation,
		];
		expect(expandEmojiData(data)).to.deep.equal([
			{
				name: 'UMBRELLA WITH RAIN DROPS',
				sequence: '2614 FE0F',
				output: '☔️',
			},
			{
				name: 'KEYCAP NUMBER SIGN',
				sequence: '0023 FE0F 20E3',
				output: '#️⃣',
			},
			{
				name: 'WHITE UP POINTING INDEX',
				sequence: '261D FE0F',
				output: '☝️',
			},
			{
				name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-1-2',
				sequence: '261D 1F3FB',
				output: '☝🏻',
			},
			{
				name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-3',
				sequence: '261D 1F3FC',
				output: '☝🏼',
			},
			{
				name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4',
				sequence: '261D 1F3FD',
				output: '☝🏽',
			},
			{
				name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-5',
				sequence: '261D 1F3FE',
				output: '☝🏾',
			},
			{
				name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-6',
				sequence: '261D 1F3FF',
				output: '☝🏿',
			},
		]);
	});
});
