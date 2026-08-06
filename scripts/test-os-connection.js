const path = require('path');
const opensearchPath = require.resolve('@opensearch-project/opensearch', { paths: [path.resolve(__dirname, '..', 'apps', 'api')] });
const { Client } = require(opensearchPath);

const client = new Client({
  node: 'http://localhost:9200',
  maxRetries: 1,
  requestTimeout: 5000,
});

(async () => {
  try {
    const info = await client.info();
    console.log('OpenSearch connected:', info.body.tagline);
    
    const count = await client.count({ index: 'products' });
    console.log('Products index count:', count.body.count);
    
    const search = await client.search({
      index: 'products',
      body: { query: { match_all: {} } },
    });
    console.log('Got hits:', search.body.hits.hits.length);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Full err:', err);
  }
})();
