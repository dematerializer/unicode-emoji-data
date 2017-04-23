import checkData from '../check-data';

const reference = ['1F600', '1F469 1F3FE 200D 2695 FE0F'];

describe('check-data', () => {
	it('should report success if data matches reference, even if data contains variations', () => {
		const data = [
			{ presentation: { default: '1F600' } },
			{ presentation: { variation: { emoji: '1F469 1F3FE 200D 2695 FE0F' } } },
		];
		const result = checkData({ data, reference });
		expect(result).to.deep.equal({
			sequencesInDataButNotInReference: [],
			sequencesInReferenceButNotInData: [],
		});
	});

	it('should report failure if reference list contains at least one sequence not contained in data', () => {
		const data = [{ presentation: { default: '1F600' } }];
		const result = checkData({ data, reference });
		expect(result).to.deep.equal({
			sequencesInDataButNotInReference: [],
			sequencesInReferenceButNotInData: ['1F469 1F3FE 200D 2695 FE0F'],
		});
	});

	it('should report failure if data contains a sequence not contained in the reference list', () => {
		const data = [
			{ presentation: { default: '1F600' } },
			{ presentation: { default: 'WTF' } },
			{ presentation: { variation: { emoji: '1F469 1F3FE 200D 2695 FE0F' } } },
		];
		const result = checkData({ data, reference });
		expect(result).to.deep.equal({
			sequencesInDataButNotInReference: ['WTF'],
			sequencesInReferenceButNotInData: [],
		});
	});
});
