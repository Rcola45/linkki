// Steps:
// 	1) On youtube video page load, inject button into page
// 	2) On button click, get video title and do spotify search
// 	3) Open Spotify link with the first url returned from search

var loadedTimer;
function startSearchTimer() {
	// Check if we are watching a youtube video
	var watchRegex = /^.+:\/\/.*youtube.com\/watch\?.+$/g;
	if (window.location.toString().match(watchRegex)) {
		// Start search for place to put the button
		// (This is due to youtube's JS loading)
		loadedTimer = setInterval(addSpotifyButton, 500);
	}
}

// Runs when a youtube page is loaded or changes
window.addEventListener("yt-navigate-finish", startSearchTimer);

function addSpotifyButton() {
	// Adds button to Youtube page
	topLevelButtons = document.querySelector(
		"#menu.ytd-video-primary-info-renderer #top-level-buttons.ytd-menu-renderer"
	);
	if (topLevelButtons != null) {
		// Remove button if already on page
		button = document.getElementById("spotlink-spotify-link");
		if (button) button.parentNode.removeChild(button);
		clearInterval(loadedTimer);
		button = getButtonNode();
		topLevelButtons.insertBefore(button, null);
		searchTerms = getSearchTerms();
		if (searchTerms) {
			searchSpotify(searchTerms, 0);
		} else {
			console.error("Could not find current video title");
		}
	}
}

function changeButtonUrl(newUrl) {
	// Change button url to song link
	// Change button logo to green
	button = document.getElementById("spotlink-spotify-link");
	button.setAttribute("href", newUrl);
	logo = document.getElementById("spotlink-spotify-logo");
	spotifyGreenIconPath = chrome.runtime.getURL(
		"images/spotify/Spotify_Icon_Green.png"
	);
	logo.setAttribute("src", spotifyGreenIconPath);
}

function getButtonNode() {
	// Returns the button html to insert on page
	var template = document.createElement("template");
	var spotifyBlackIconPath = chrome.runtime.getURL(
		"images/spotify/Spotify_Icon_Black.png"
	);
	var buttonHtml =
		'<a id="spotlink-spotify-link" class="yt-simple-endpoint style-scope ytd-button-renderer" target="_blank" tabindex="-1"><yt-icon-button id="button" class="style-scope ytd-button-renderer style-default size-default"><button id="button" class="style-scope yt-icon-button" aria-label="Spotify"><img id="spotlink-spotify-logo" src=' +
		spotifyBlackIconPath +
		' focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"></button></yt-icon-button></a>';
	buttonHtml = buttonHtml.trim();
	template.innerHTML = buttonHtml;
	return template.content.firstChild;
}

function getSearchTerms() {
	// Clean video title and return it
	videoTitle = document.querySelector(
		"#info-contents .title yt-formatted-string"
	).innerText;
	// Remove parentheses, square brackets or ft.|feat.
	videoTitle = videoTitle.replace(/\([^)]*\)|\[[^\]]*\]/g, "");
	videoTitle = videoTitle.replace(/(ft|feat)\./gi, "");

	return videoTitle;
}
