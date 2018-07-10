import StorageAdapter from '../../Sdk/Lib/KeyStorage/adapters/FileSystemStorageAdapter';

describe ('StorageAdapter', () => {
	let storage: StorageAdapter;

	beforeEach(() => {
		storage = new StorageAdapter({
			dir: '.virgil_keys_test',
			name: 'VirgilKeysTest'
		});
	});

	afterEach(() => {
		return storage.clear();
	});

	it('set and get the key', () => {
		const expected = Buffer.from('one');
		return assert.eventually.equal(
			storage.store('first', expected)
				.then(() => storage.load('first'))
				.then(value => {
					return value != null && value.equals(expected)
				}),
			true,
			'loaded key is identical to the saved one'
		);
	});

	it('throws when saving key with existing name', () => {
		return assert.isRejected(
			storage.store('first', Buffer.from('one'))
				.then(() => storage.store('first', Buffer.from('two'))),
			Error,
			'already exists'
		);
	});

	it('returns false when removing non-existent key', () => {
		return assert.eventually.isFalse(
			storage.remove('first')
		);
	});

	it('returns true when removing existent key', () => {
		return assert.eventually.isTrue(
			storage.store('first', Buffer.from('one'))
				.then(() => storage.remove('first'))
		);
	});

	it('set remove set', () => {
		return assert.eventually.isTrue(
			storage.store('first', Buffer.from('one'))
				.then(() => storage.remove('first'))
				.then(() => storage.store('first', Buffer.from('two')))
				.then(() => storage.load('first'))
				.then(value => value != null && value!.equals(Buffer.from('two')))
		);
	});

	it ('remove item twice', () => {
		return assert.eventually.isNull(
			storage.remove('first')
				.then(() => storage.remove('first'))
				.then(() => storage.load('first'))
		);
	});

	it('set two items', () => {
		const oneExpected = Buffer.from('one');
		const twoExpected = Buffer.from('two');
		return assert.becomes(
			Promise.all([
				storage.store('first', oneExpected),
				storage.store('second', twoExpected)
			]).then(() => Promise.all([
					storage.load('first'),
					storage.load('second')
				])
			).then(([ one, two ]) => {
				return [
					one != null && one.equals(oneExpected),
					two != null && two.equals(twoExpected)
				]
			}),
			[ true, true ]
		);
	});

	it('set remove three items', () => {
		return assert.eventually.isNull(
			Promise.all([
				storage.store('first', Buffer.from('one')),
				storage.store('second', Buffer.from('two')),
				storage.store('third', Buffer.from('three'))
			]).then(() => storage.remove('second'))
				.then(() => Promise.all([
						assert.eventually.isTrue(
							storage.load('first')
								.then(first => first != null && first.toString() === 'one')
						),
						assert.eventually.isNull(storage.load('second')),
						assert.eventually.isTrue(
							storage.load('third')
								.then(third => third != null && third.toString() === 'three')
						)
					])
				)
				.then(() => storage.remove('first'))
				.then(() => Promise.all([
						assert.eventually.isNull(storage.load('first')),
						assert.eventually.isTrue(
							storage.load('third')
								.then(third => third != null && third.toString() === 'three')
						)
					])
				)
				.then(() => storage.remove('third'))
				.then(() => storage.load('third'))
		);
	});

	it('set empty value', () => {
		return assert.eventually.isTrue(
			storage.store('first', new Buffer(0))
				.then(() => storage.load('first'))
				.then(value => value != null && value.equals(new Buffer(0)))
		);
	});

	it('set with weird keys', () => {
		return assert.becomes(
			Promise.all([
				storage.store(' ', Buffer.from('space')),
				storage.store('=+!@#$%^&*()-_\\|;:\'",./<>?[]{}~`', Buffer.from('control')),
				storage.store(
					'\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341',
					Buffer.from('ten')
				),
				storage.store('\0', Buffer.from('null')),
				storage.store('\0\0', Buffer.from('double null')),
				storage.store('\0A', Buffer.from('null A')),
				storage.store('', Buffer.from('zero'))
			]).then(() => {
					return Promise.all([
						storage.load(' '),
						storage.load('=+!@#$%^&*()-_\\|;:\'",./<>?[]{}~`'),
						storage.load(
							'\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341'),
						storage.load('\0'),
						storage.load('\0\0'),
						storage.load('\0A'),
						storage.load('')
					]);
				})
				.then(values => values.map(value => value && value.toString())),
			[ 'space', 'control', 'ten', 'null', 'double null', 'null A', 'zero' ]
		);
	});

	it('exists with non-existent key', () => {
		return assert.eventually.isFalse(
			storage.exists('non-existent')
		);
	});

	it('exists with existent key', () => {
		return assert.eventually.isTrue(
			storage.store('existent', Buffer.from('my value'))
				.then(() => storage.exists('existent'))
		);
	});

	it('list returns empty array if storage is empty', () => {
		return assert.becomes(
			storage.list().then(entries => entries.length),
			0
		);
	});

	it('list returns array of all entries', () => {
		let expectedEntries: { key: string, value: Buffer }[];
		if (process.browser) {
			expectedEntries = [
				{ key: 'one', value: Buffer.from('one') },
				{ key: 'two', value: Buffer.from('two') },
				{ key: 'three', value: Buffer.from('three') }
			];
		} else {
			expectedEntries = [
				{ key: '', value: Buffer.from('one') },
				{ key: '', value: Buffer.from('two') },
				{ key: '', value: Buffer.from('three') }
			];
		}

		return Promise.all([
			storage.store('one', Buffer.from('one')),
			storage.store('two', Buffer.from('two')),
			storage.store('three', Buffer.from('three'))
		]).then(() =>
			storage.list()
		).then(entries => {
			assert.sameDeepMembers(entries, expectedEntries);
		})
	});
});
