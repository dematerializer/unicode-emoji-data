import checkData from '../check-data';

const reference = ['1F600', '1F914'];

describe('check-data', () => {
	it('should report success if data matches reference', () => {
		const data = [{ sequence: '1F600' }, { sequence: '1F914' }];
		const result = checkData({ data, reference });
		expect(result).to.deep.equal({
			unmatchedSequences: [],
			numDiff: 0,
			numExpected: reference.length,
			numGot: data.length,
		});
	});

	it('should still report success if data containing variation selectors match reference', () => {
		const data = [{ sequence: '1F600 FE0E' }, { sequence: '1F914 FE0F' }];
		const result = checkData({ data, reference });
		expect(result).to.deep.equal({
			unmatchedSequences: [],
			numDiff: 0,
			numExpected: reference.length,
			numGot: data.length,
		});
	});

	it('should report failure if data and reference length differ', () => {
		const data = [{ sequence: '1F600' }];
		const result = checkData({ data, reference });
		expect(result).to.deep.equal({
			unmatchedSequences: [],
			numDiff: -1,
			numExpected: reference.length,
			numGot: data.length,
		});
	});

	it('should report failure if data contains a sequence not contained in the reference list', () => {
		const data = [{ sequence: '1F600' }, { sequence: 'WTF' }];
		const result = checkData({ data, reference });
		expect(result).to.deep.equal({
			unmatchedSequences: ['WTF'],
			numDiff: 1,
			numExpected: reference.length,
			numGot: data.length,
		});
	});
});
