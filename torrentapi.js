const request = require('request');
const { config, persist } = require('internal');
const randomWords = require('./randomWords');
const mins15 = 15 * 60 * 1000;

let app_id = config.appId || persist.getItem('appId') || randomWords(2).join('_');

if (!config.appId && !persist.getItem('appId'))
    persist.setItem('appId', app_id);

class TorrentApi {
    async queryAPI(mode, params = {}, format = 'json_extended') {
        params.app_id = app_id;
        params.token = await this.getToken();
        params.sort = config.sortingMethod;
        params.min_seeders = config.minSeeders;
        params.mode = mode;
        params.format = format;

        if (params.token == null)
            throw new Error('Token not found!');

        return new Promise((resolve, reject) => {
            request({
                uri: 'https://torrentapi.org/pubapi_v2.php',
                qs: params,
                json: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0'
                }
            }, (error, response, body) => {
                if ((response || {}).statusCode != 200 && !retrying && !config.appId) {

                    // try 1 more time, only if no user defined app id

                    app_id = randomWords(2).join('_')
                    persist.setItem('appId', app_id)
                    persist.removeItem('token')

                    this.queryAPI(mode, params, format, true)
                    .then(resolve)
                    .catch(reject)

                } else {

                    if (error) reject(error);
                    resolve(body);

                }
            });
        });
    }

    getToken() {

        const oldToken = persist.getItem('token');

        if (oldToken && Date.now() - persist.getItem('tokenTime') < mins15)
            return Promise.resolve(oldToken);

        return new Promise((resolve, reject) => {
            request({
                uri: 'https://torrentapi.org/pubapi_v2.php',
                qs: { get_token: 'get_token', app_id },
                json: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0'
                }
            }, (error, response, body) => {
                if (error) reject(error);
                if (!body.token) reject('rarbg-4k: token not found in response');
                persist.setItem('token', body.token);
                persist.setItem('tokenTime', Date.now());

                // 2 second timeout between requests
                // as per api specification
                setTimeout(() => {
                    resolve(body.token);
                }, 2000);
            });
        });
    }

    searchImdb(tt, uhd = false) {
        const params = {search_imdb: tt};
        if (uhd) params.category = '51;52;50';
        return this.queryAPI('search', params);
    }
}

module.exports = TorrentApi;
