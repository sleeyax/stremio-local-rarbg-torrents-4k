const request = require('request');
const { config, persist } = require('internal');

class TorrentApi {
    async queryAPI(mode, params = {}, format = 'json_extended') {
        params.app_id = config.appId;
        params.token = persist.getItem('token') || await this.getToken(config.appId);
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
                if (error) reject(error);
                resolve(body);
            });
        });
    }

    getToken(appId) {
        return new Promise((resolve, reject) => {
            request({
                uri: 'https://torrentapi.org/pubapi_v2.php',
                qs: { get_token: 'get_token', app_id: appId },
                json: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0'
                }
            }, (error, response, body) => {
                if (error) reject(error);
                if (!body.token) reject('rarbg-4k: token not found in response');
                persist.setItem('token', body.token);
                resolve(body.token);
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
