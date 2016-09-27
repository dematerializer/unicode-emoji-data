import parse from '../parse';

const text = `
# this is a comment

# real world:

## UnicodeData.txt
1F4A9;PILE OF POO;So;0;ON;;;;;N;;;;;

## EmojiSources.txt
0023 20E3;F985;F489;F7B0

## StandardizedVariants.txt
0023 FE0E; text style;  # NUMBER SIGN

## emoji-sequences.txt
1F918 1F3FC   ; Emoji_Modifier_Sequence   # 8.0  [1] (🤘🏼)      SIGN OF THE HORNS, TYPE-3

## emoji-data.txt
1F600         ; Emoji                # 6.1  [1] (😀)       GRINNING FACE
1F601..1F610  ; Emoji                # 6.0 [16] (😁..😐)    GRINNING FACE WITH SMILING EYES..NEUTRAL FACE

## emoji-zwj-sequences.txt
1F926 1F3FD 200D 2640 FE0F                  ; Emoji_ZWJ_Sequence  ; woman facepalming: medium skin tone                            # 9.0  [1] (🤦🏽‍♀️)

# imaginary:

FFFFE         ; no comment
; empty first field and no comment
;;
;;additional field 1;additional field 2
just one field

`;

describe('parse', () => {
	it('should parse correctly', () => {
		const fieldNames = ['field1', 'field2'];
		const expected = [
			{
				field1: '1F4A9',
				field2: 'PILE OF POO',
				comment: undefined,
			},
			{
				field1: '0023 20E3',
				field2: 'F985',
				comment: undefined,
			},
			{
				field1: '0023 FE0E',
				field2: 'text style',
				comment: 'NUMBER SIGN',
			},
			{
				field1: '1F918 1F3FC',
				field2: 'Emoji_Modifier_Sequence',
				comment: '8.0 [1] (🤘🏼) SIGN OF THE HORNS, TYPE-3',
			},
			{
				field1: '1F600',
				field2: 'Emoji',
				comment: '6.1 [1] (😀) GRINNING FACE',
			},
			{
				field1: '1F601..1F610',
				field2: 'Emoji',
				comment: '6.0 [16] (😁..😐) GRINNING FACE WITH SMILING EYES..NEUTRAL FACE',
			},
			{
				field1: '1F926 1F3FD 200D 2640 FE0F',
				field2: 'Emoji_ZWJ_Sequence',
				comment: '9.0 [1] (🤦🏽‍♀️)',
			},
			{
				field1: 'FFFFE',
				field2: 'no comment',
				comment: undefined,
			},
			{
				field1: '',
				field2: 'empty first field and no comment',
				comment: undefined,
			},
			{
				field1: '',
				field2: '',
				comment: undefined,
			},
			{
				field1: '',
				field2: '',
				comment: undefined,
			},
			{
				field1: 'just one field',
				field2: undefined,
				comment: undefined,
			},
		];
		const data = parse(text, fieldNames);
		expect(data).to.deep.equal(expected);
	});
});
