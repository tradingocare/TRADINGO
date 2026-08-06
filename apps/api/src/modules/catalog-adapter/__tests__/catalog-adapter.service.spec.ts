import { CatalogAdapterService } from '../catalog-adapter.service';

describe('CatalogAdapterService', () => {
    test('unifiedSearchBulk calls unifiedSearch for each query and returns map', async () => {
        const fakePrisma: any = {}; // not used because we mock unifiedSearch
        // @ts-ignore - override instance method for test
        const svc: any = new CatalogAdapterService(fakePrisma);

        svc.unifiedSearch = jest.fn().mockImplementation(async (q: string) => {
            return [{ id: `id-${q}`, name: `name-${q}`, type: 'catalogCategory' }];
        });

        const queries = ['foo', 'bar', 'foo'];
        const res = await svc.unifiedSearchBulk(queries, { includeCatalog: true, includeOld: false, limit: 1 });

        expect(svc.unifiedSearch).toHaveBeenCalledTimes(3);
        expect(res['foo']).toBeDefined();
        expect(res['bar']).toBeDefined();
        expect(res['foo'][0].id).toBe('id-foo');
    });
});
