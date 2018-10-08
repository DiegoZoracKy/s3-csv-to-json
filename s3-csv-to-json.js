'use strict';

const AWS = require('aws-sdk');
const stream = require('stream');
const path = require('path');
const csv = require('csv-parser');
const zlib = require('zlib');
const getBucketAndKeyFromS3Url = require('./modules/bucket-key-from-s3-url');

function createObjectToJsonLineStream() {
    return new stream.Transform({
        writableObjectMode: true,

        transform(chunk, encoding, callback) {
            const line = JSON.stringify(chunk) + '\n';
            callback(null, line);
        }
    });
}

function s3CsvToJson({ input, output }) {
    return new Promise((resolve, reject) => {
        const s3 = new AWS.S3();
        const inputParams = getBucketAndKeyFromS3Url(input);
        const outputParams = getBucketAndKeyFromS3Url(output);

        let pipeline = s3.getObject(inputParams)
            .createReadStream()
            .on('error', err => reject(err));

        if ('.gz' === path.extname(input).toLocaleLowerCase()) {
            pipeline = pipeline.pipe(zlib.createGunzip());
        }

        pipeline = pipeline.pipe(csv());
        pipeline = pipeline.pipe(createObjectToJsonLineStream());

        if ('.gz' === path.extname(output).toLocaleLowerCase()) {
            pipeline = pipeline.pipe(zlib.createGzip());
        }

        outputParams.Body = pipeline;
        s3.upload(outputParams)
            .send((err, data) => {
                if (err) {
                    reject(err);
                }

                resolve(data);
            });
    });
}

module.exports = s3CsvToJson;