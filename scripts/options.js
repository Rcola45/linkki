function saveOptions() {
	// Save the users choice
	var checkedItemName = document.querySelector(
		'input[name="link_type"]:checked'
	).value;

	chrome.storage.sync.set(
		{
			spotlink_checked_link_type: checkedItemName
		},
		function() {
			document.getElementById("spotlink-options-status").innerHTML =
				"Options saved succesfully!";
		}
	);
}

function restoreOptions() {
	// Set initial values from storage
	// (Or web-player by default)
	chrome.storage.sync.get(
		{
			spotlink_checked_link_type: "web-player"
		},
		function(items) {
			document.getElementById(
				"spotlink-" + items.spotlink_checked_link_type + "-option"
			).checked = true;
		}
	);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document
	.getElementById("spotlink-link-type-save")
	.addEventListener("click", saveOptions);
