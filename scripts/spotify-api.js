function getNewAccessToken() {
	// Query heroku proxy server to get spotify access token
	return new Promise((resolve, reject) => {
		url = "https://linkki-backend.herokuapp.com/get_token";
		fetch(url, {
			method: "GET"
		})
			.then(resp => resp.json())
			.then(jsonResp => {
				accessToken = jsonResp.access_token;
				resolve(accessToken);
			})
			.catch(error => {
				console.error(error);
				reject(error);
			});
	});
}

function getLocalAccessToken(cb) {
	// Retrieve access token from storage
	chrome.storage.sync.get(["linkki_access_token"], items => {
		cb(items.linkki_access_token);
	});
}

function makeNewAccessToken() {
	// Get a new access token and set it to storage
	return new Promise((resolve, reject) => {
		getNewAccessToken().then(token => {
			chrome.storage.sync.set(
				{
					linkki_access_token: token,
					linkki_token_last_set: Date.now()
				},
				resolve()
			);
		});
	});
}

function refreshTokenIfNeeded(cb) {
	// Check storage, get new access token if old one has expired
	chrome.storage.sync.get(["linkki_token_last_set"], items => {
		if (Date.now() - items.linkki_token_last_set > 3600000) {
			// Get new token
			makeNewAccessToken().then(cb);
		} else {
			cb();
		}
	});
}

function makeApiCall(searchTerm, tries) {
	// Make the search call to Spotify API

	// Base API URL
	let url = new URL("https://api.spotify.com/v1/search");
	// Define query params
	let searchQuery = searchTerm;
	let searchLimit = 1;
	// Create params json
	let params = { q: searchQuery, limit: searchLimit, type: "track" };
	// Add query params to url
	url.search = new URLSearchParams(params);
	// Get access token
	getLocalAccessToken(accessToken => {
		let headers = new Headers({ Authorization: `Bearer ${accessToken}` });
		// Perform request
		fetch(url, {
			method: "GET",
			headers: headers
		})
			.then(res => res.json())
			.then(response => {
				if (response.error) {
					if (response.error.status == 401) {
						makeNewAccessToken()
							.then(() => searchSpotify(searchTerm, tries + 1))
							.catch(error => {
								console.error(error);
							});
					}
				} else {
					if ("tracks" in response && response["tracks"]["items"].length != 0) {
						var trackUrl;
						getLinkType(linkType => {
							if (linkType == "web-player") {
								// Get external link to open in web player
								trackUrl =
									response["tracks"]["items"][0]["external_urls"]["spotify"];
							} else {
								// Get URI to open in app
								trackUrl = response["tracks"]["items"][0]["uri"];
							}
							changeButtonUrl(trackUrl);
						});
					}
				}
			})
			.catch(error => console.error(error));
	});
}

function searchSpotify(searchTerm, tries) {
	// Refresh token if needed, then make API call

	if (tries >= 2) {
		// Tried too many times, something is wrong, stop trying
		console.error(
			"[Linkki] Error accessing Spotify API. Please contact the extension administrator if this continues."
		);
		return;
	}

	refreshTokenIfNeeded(() => {
		makeApiCall(searchTerm, tries);
	});
}

function getLinkType(cb) {
	// Get option the user selected for link opening
	// (default to web player)
	chrome.storage.sync.get({ linkki_checked_link_type: "web-player" }, items => {
		return cb(items.linkki_checked_link_type);
	});
}
