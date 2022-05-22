"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  //console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  let favSymbol = "fa-regular";
  let removeClass = "story-link story-remove hidden";

  if (currentUser) {
    if (isFavorite(story.storyId)) {
      favSymbol = "fa-solid";
    }

    if (story.username === currentUser.username) {
      removeClass = "story-link story-remove";
    }
  }

  return $(`
      <li id="${story.storyId}">
        <i class="${favSymbol} fa-star"></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <a class="${removeClass}" href="#">Delete Story</a>
        <small class="story-user">posted by ${story.username}</small>
        
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStories.show();
}

//Gets list of current user's favorite stories from the currentUser instance and puts them on the page
function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");

  $favStoriesList.empty();

  //loop through user's favorite stories and generate HTML for them
  for (let story of currentUser.favorites) {
    const $favorite = generateStoryMarkup(story);
    $favStoriesList.append($favorite);
  }

  //display a message if the user does not have any favorite stories
  if (currentUser.favorites.length === 0) {
    $favStoriesList.append($("<h2>You do not have any favorite stories!</h2>"));
  }

  $favStories.show();
}

// Gets list of current user's own stories from the currentUser instance and puts them on the page
function putOwnStoriesOnPage() {
  console.debug("putOwnStoriesOnPage");

  $ownStoriesList.empty();

  //loop through user's own stories and generate HTML list
  for (let story of currentUser.ownStories) {
    const $ownStory = generateStoryMarkup(story);
    $ownStoriesList.append($ownStory);
  }

  //display a message if the user has not created any stories
  if (currentUser.ownStories.length === 0) {
    $ownStoriesList.append($("<h2>You have not created any stories!</h2>"));
  }

  $ownStories.show();
}

// Adds a new story to the stories list and puts it on the page when the user submits a new story

async function submitNewStory(evt) {
  evt.preventDefault();
  const author = $("#submit-author").val();
  const title = $("#submit-title").val();
  const url = $("#submit-url").val();

  //call add story method on storyList class
  const newStory = await storyList.addStory(currentUser.loginToken, {
    title,
    author,
    url,
  });

  //add story to current user's ownStory array property and update the storyList
  currentUser.ownStories.unshift(newStory);
  storyList = await StoryList.getStories();

  //clear the form
  $("#submit-author").val("");
  $("#submit-title").val("");
  $("#submit-url").val("");

  hidePageComponents();
  putStoriesOnPage();
}

$submitStoryForm.on("submit", submitNewStory);

// When the user clicks on the favorite icon next to a story on the story list:
// If the story is already a favorite, it is removed from the favorites list.
// If the story is not a favorite, it is added to the favorites list.
// toggles the star icon

function toggleFavorite(evt) {
  console.debug("toggleFavorite", evt);

  //get the story ID from the parent LI
  const storyId = $(evt.target).parent().attr("id");
  const $favIcon = $(evt.target);
  let currStory;

  console.log(storyId);
  console.log(currentUser.favorites);

  //get the story from the story list using the story ID
  for (let story of storyList.stories) {
    if (story.storyId === storyId) {
      currStory = story;
    }
  }

  //call the correct method from the User class
  if (isFavorite(storyId)) {
    currentUser.removeFavorite(storyId);
    $favIcon.removeClass("fa-solid");
    $favIcon.addClass("fa-regular");
  } else {
    currentUser.addFavorite(currStory);
    $favIcon.removeClass("fa-regular");
    $favIcon.addClass("fa-solid");
  }
}

$body.on("click", "li i.fa-star", toggleFavorite);

// Check if a story is present in the favorites list for the current user

function isFavorite(storyId) {
  for (let story of currentUser.favorites) {
    if (story.storyId === storyId) {
      return true;
    }
  }
  return false;
}

//Call the removeStory method on the storyList object to delete a story
async function deleteStoryClick(evt) {
  const storyId = $(evt.target).parent().attr("id");
  await storyList.removeStory(currentUser.loginToken, storyId);
  $(evt.target).parent().remove();

  //update the storyList
  storyList = await StoryList.getStories();

  //remove the story from the current user's array of stories
  currentUser.ownStories.forEach((story, idx) => {
    if (story.storyId === storyId) {
      currentUser.ownStories.splice(idx);
    }
  });
}

$body.on("click", ".story-remove", deleteStoryClick);
