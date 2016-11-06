// Parses a CSV formatted <text> that may contain comments,
// extracting only relevant fields given by <fieldNames> + comment:
//
// e.g. let <fieldNames> be ['codepoints', 'property']; <text> = '
// 	# this is a comment
// 	1F600         ; Emoji                # 6.1  [1] (😀)       GRINNING FACE
// 	1F601..1F610  ; Emoji                # 6.0 [16] (😁..😐)    GRINNING FACE WITH SMILING EYES..NEUTRAL FACE
// '
//
// Returns a data structure like this:
// [
// 	{
// 		codepoints: '1F600',
// 		property: 'Emoji',
// 		comment: '6.1 [1] (😀) GRINNING FACE'
// 	},
// 	{
// 		codepoints: '1F601..1F610',
// 		property: 'Emoji',
// 		comment: '6.0 [16] (😁..😐) GRINNING FACE WITH SMILING EYES..NEUTRAL FACE'
// 	},
// ]
const anyWhitespace = /([\s])+/g;
export default function parse(text, fieldNames) {
	if (fieldNames == null) {
		return null;
	}
	return text.split('\n')
		// Collapse any amount of whitespace to a single space:
		.map(line => line.replace(anyWhitespace, ' '))
		// Separate fields and comment:
		.map((line) => {
			const indexOfComment = line.indexOf('#');
			return {
				fields: line.slice(0, indexOfComment > -1 ? indexOfComment : line.length).trim(),
				comment: indexOfComment > -1
					? line.slice(indexOfComment + 1, line.length).trim()
					: undefined,
			};
		})
		// Kick out empty lines:
		.filter(line => line.fields.length > 0)
		// Split fields into array while retaining comment:
		.map(line => ({
			fields: line.fields.split(';').map(field => field.trim()),
			comment: line.comment,
		}))
		// Map fields to props while only keeping fields that we're interested in via fieldNames:
		.map(line => fieldNames.reduce(((datum, field, i) => {
			const extDatum = datum;
			extDatum[field] = line.fields[i];
			return extDatum;
		}), { comment: line.comment }));
}
