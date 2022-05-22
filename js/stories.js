"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

//stores the Id of a story when a user clicks the edit story button (to be passed to the editStory method when the form is submitted)
let editStoryId;

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
  let removeClass = "story-remove hidden";
  let editClass = "story-edit hidden";

  if (currentUser) {
    if (isFavorite(story.storyId)) {
      favSymbol = "fa-solid";
    }

    if (story.username === currentUser.username) {
      removeClass = "story-remove";
      editClass = "story-edit";
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
        <a class="${editClass}" href="#">Edit Story</a>
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
// Checks if the user is editing an existing story and if true calls the editStory method instead

async function submitStory(evt) {
  evt.preventDefault();
  const author = $("#submit-author").val();
  const title = $("#submit-title").val();
  const url = $("#submit-url").val();

  //checks to see if the user is editing a story or submitting a new story
  if ($submitStoryHeading.is(":visible")) {
    //call add story method on storyList
    await storyList.addStory(currentUser.loginToken, {
      title,
      author,
      url,
    });
  } else if ($editStoryHeading.is(":visible")) {
    //call edit story method on storyList
    await storyList.editStory(currentUser.loginToken, {
      storyId: editStoryId,
      title,
      author,
      url,
    });
  }

  //update the currentUser and storyList objects
  currentUser = await User.updateUser();
  storyList = await StoryList.getStories();

  //clear the form
  $("#submit-author").val("");
  $("#submit-title").val("");
  $("#submit-url").val("");

  hidePageComponents();
  putStoriesOnPage();
}

$submitStoryForm.on("submit", submitStory);

// When the user clicks on the favorite icon next to a story on the story list:
// If the story is already a favorite, it is removed from the favorites list.
// If the story is not a favorite, it is added to the favorites list.
// toggles the star icon

async function toggleFavorite(evt) {
  console.debug("toggleFavorite", evt);

  //get the story ID from the parent LI
  const storyId = $(evt.target).parent().attr("id");
  const $favIcon = $(evt.target);

  console.log(currentUser.favorites);
  if (currentUser) {
    if (isFavorite(storyId)) {
      await currentUser.removeFavorite(storyId);
      $favIcon.removeClass("fa-solid");
      $favIcon.addClass("fa-regular");
    } else {
      await currentUser.addFavorite(storyId);
      $favIcon.removeClass("fa-regular");
      $favIcon.addClass("fa-solid");
    }
  }
  currentUser = await User.updateUser();
  console.log(currentUser.favorites);
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

  //update the user object
  currentUser = await User.updateUser();
}

$body.on("click", ".story-remove", deleteStoryClick);

//sets the editStoryId to the ID of the story that the user wants to edit, then sends the user to the form (with the inputs pre-filled with existing story info)
function editStoryClick(evt) {
  const storyId = $(evt.target).parent().attr("id");
  editStoryId = storyId;

  for (let story of storyList.stories) {
    if (editStoryId === story.storyId) {
      $("#submit-author").val(story.author);
      $("#submit-title").val(story.title);
      $("#submit-url").val(story.url);
    }
  }

  hidePageComponents();
  $editStoryHeading.show();
  $submitStoryForm.show();
}

$body.on("click", ".story-edit", editStoryClick);
