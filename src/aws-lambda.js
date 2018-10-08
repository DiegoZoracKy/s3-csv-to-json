const s3CsvToJson = require('./s3-csv-to-json.js');

async function handler({ input, output }) {
    try {
        const body = await s3CsvToJson({ input, output });
        return { statusCode: 200, body };
    } catch (err) {
        return { statusCode: err.statusCode || 400, body: err };
    }
};

exports.handler = handler;