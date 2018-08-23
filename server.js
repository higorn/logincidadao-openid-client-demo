'use strict';

var
    openid = require('openid-client'),
    express = require('express');

const PORT = 8080;
const app = express();
app.set('view options', { pretty: true });
app.set('json spaces', 2);


class DataportenClient {
	constructor(config) {
	    this.config = config || {}
	    this.issuerHost = 'https://logincidadao.rs.gov.br/'
	    this.client = null
		this.tokenSet = null
	}
	init() {
	    return Promise.resolve().then(() => {
	        return openid.Issuer.discover(this.issuerHost)
	    })
	        .then((issuer) => {
	            this.client = new issuer.Client(this.config)
	        })
	        .catch((err) => {
	            console.error("ERROR", err);
	        })
	}
	getAuthURL() {
	    return this.client.authorizationUrl(this.config)
	}

	callback(req) {
	    return this.client.authorizationCallback(this.config.redirect_uri, req.query)
	        .then((tokenSet) => {
				this.tokenSet = tokenSet
	            return this.getUserInfo()
	        })
			.then((userinfo) => {
	            return this.getDebugInfo()
	        })
	        .catch((err) => {
	            console.error("Error processing callback", err);
	            res.status(500).send("Error: " + err.message)
	        })
	}

	getUserInfo() {
	    return this.client.userinfo(this.tokenSet.access_token)
			.then((userinfo) => {
				this.userinfo = userinfo
			})
	}

	getDebugInfo() {
		var obj = {
			"tokenSet": this.tokenSet,
			"idtokenClaims": this.tokenSet.claims,
			"userinfo": this.userinfo
		}
		return obj
	}


}


var dp = new DataportenClient({
    "client_id": "149_va68p4x05e8csc4s04wgccsgooocws0844gwkk0cwg48sok4w",
    "client_secret": "5m7yc4sozxookwk488kwgos8oc88w8oc0sk808gok8sg4ccsgs",
    "redirect_uri": "http://127.0.0.1:8080/callback",
    "scope": "openid",
})

dp.init()
    .then(() => {
        console.log("ready.")
    })


app.get('/', function (req, res) {
    if (dp.client === null) {
        return res.send("Waiting to initialize federated authentication with Dataporten.")
    }
    res.redirect(dp.getAuthURL())
})

app.get('/callback', function (req, res) {

    dp.callback(req)
        .then((tokenset) => {
            res.json(tokenset)
        })
})
app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
