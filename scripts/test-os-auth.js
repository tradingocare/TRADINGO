const path = require('path');
const opensearchPath = require.resolve('@opensearch-project/opensearch', { paths: [path.resolve(__dirname, '..', 'apps', 'api')] });
const { Client } = require(opensearchPath);

const client = new Client({
  node: 'http://localhost:9200',
  auth: { username: 'admin', password: 'admin' },
  maxRetries: 1,
  requestTimeout: 5000,
});

(async () => {
  try {
    const info = await client.info();
    console.log('OpenSearch connected with auth:', info.body.tagline);
    
    const search = await client.search({
      index: 'products',
      body: { query: { match: { name: 'PCB' } } },
    });
    console.log('Search hits:', search.body.hits.hits.length);
    console.log('First hit:', search.body.hits.hits[0]._source.name);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.meta) console.error('Meta:', err.meta.body);
  }
})();
