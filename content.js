///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
// This file has a series of connected functions that grab old-slide page text. It consists of several functions that call each other in this order:

// - mainDoc
// - bottomDoc
// - nButton
// - displayDoc
// - mainTextCont 
// - finish (if there is no html text on page, this function is skipped)
// - getNarration
// - getSlideId
// - sendSlideData

// Most of these functions are searching for an element on a page, and if they don't find it, they will recursively call themselves until they find the element.


// TODO/ISSUES:
// - There is not a good algorithm built out to seperate groups of words (search "\r\n" for more info)
// - Event listeners aren't consistently recognizing when a page is switched. 
// - No information is being stored to determine if a user has been to a page already
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

var stop_scrape = false;
var rerun = true;
var slideId;
var narrationTxt;
var pageText;
var displayBodyText;

changeHandler();
function changeHandler() {
  console.log('change handler');
  setTimeout(() => {
    evaluateSlide();
  }, 1000);
}

function evaluateSlide() {

  var mainDocument,
      bottomDocument,
      nextButton,
      displayDocument,
      mainTextContainer = [],
      displayBody;

  //call starting function that calls each function below successively
  mainDoc();

  // get main iframe
  function mainDoc(){
    console.log("mainDoc");
    if(document.getElementById('_RLOCD')){
      // the root iframe
      mainDocument = document.getElementById('_RLOCD');
      // move to next function
      bottomDoc();
    }
    else {
      //relook for element
      setTimeout(function(){
        mainDoc();
      }, 1000);
    }
  }
  
  // get navigation bar from bottom
  function bottomDoc(){
    console.log("bottomDoc");
    if(mainDocument.contentDocument.getElementById('FaceBottom')){
      // the bottom frame with nav elements
      bottomDocument = mainDocument.contentDocument.getElementById('FaceBottom');
      // move to next function
      nButton();
    }
    else {
      //relook for element
      setTimeout(function(){
        bottomDoc();
      }, 1000);
    }
  }

  // get next button on bottom bar
  function nButton(){
    console.log("nButton");
    // the next ow in the bottom frame
    nextButton = bottomDocument.contentDocument.getElementById('nextbutton');
    if(nextButton){
      //next function
      displayDoc();
    }
    else {
      //relook for element
      setTimeout(function(){
        nButton();
      }, 1000);
    }
  }

  // get main display <frame> within main <iframe>
  function displayDoc(){
    console.log("displayDoc");
    if(mainDocument.contentDocument.getElementById('display')){
      // the center frame with main course elements
      displayDocument = mainDocument.contentDocument.getElementById('display');
      //next function
      mainTextCont();
    }
    else {
      //relook for element
      setTimeout(function(){
        displayDoc();
      }, 1000);
    }
  }

  // get array of all text on the page
  function mainTextCont(){
    console.log("mainTextCont");
    //if xml text was found, stop scraping html page
    if(stop_scrape){
      nextButton.addEventListener('click', changeHandler);
      getNarration();
    }
    else {
      // the container that may or may not have text in it
      mainTextContainer = displayDocument.contentDocument.getElementsByClassName('regularcontenttext');
      if(mainTextContainer.length > 0){
        //next function
        finish();
      }
      else {
        //relook for elements
        setTimeout(function(){
          mainTextCont();
        }, 1000);
      }
    }
  }

  // set listener on page or just click button and do something with scraped data
  function finish(){
    setTimeout(function(){
      if(rerun){
        rerun = false;
        mainDoc();
      }
      else {
        console.log("finish");
        // the body of the center frame
        displayBody = displayDocument.contentDocument.body;
        displayBodyText = displayBody.innerText.trim();
        if (displayBodyText) {

          getNarration();

          mainTextContainer[0].addEventListener('click', changeHandler);
        }
        else {
          displayBodyText = null;
          console.log('No inner text found.');
          getNarration();
          nextButton.addEventListener('click', changeHandler);
        }
      }

    }, 500);
  }

  function getNarration(){
    setTimeout(function(){
      executeInPageContext(function() {
        var old_slide_narration_scraped = document.querySelector('#_RLOCD').contentDocument.querySelector('#display').contentWindow.GetNarrationText();
        var input = document.createElement('input');
        input.value = old_slide_narration_scraped;
        input.setAttribute('type', 'hidden');
        input.id = "old_slide_narration_text";
        document.body.appendChild(input);
      });
      narrationTxt = document.querySelector('#old_slide_narration_text').value;
      getSlideId();
    }, 1000);
  }

  function getSlideId(){
    slideId = displayDocument.contentDocument.getElementsByTagName('embed')[0].src;
    console.log("slideId", slideId);
    console.log("displayBodyText", displayBodyText);
    console.log("narrationTxt", narrationTxt);
    if(displayBodyText === undefined || !displayBodyText){
      displayBodyText = ["No text found in document"];
    }
    else {
      displayBodyText = displayBodyText.split(/\r\n|\n/g);
    }

    var request = {
      message : 'new-html-page',
      data : {
        slideId : slideId,
        pageText : displayBodyText,
        narrationTxt : narrationTxt
      }
    };
    sendSlideData(request);
  }

  function sendSlideData(request){
    chrome.runtime.sendMessage(request);
    request = {};
  }
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var msg = request.message;
    var data = request.data;

    if (msg == 'stop-scrape') {
      stop_scrape = true;
      displayBodyText = data;
    }
  });

//
// Executing a script in the context of the page
//
// NOTE: arguments should be passed as separate parameters from
// the function itself (e.g. executeInPageContext(function(param1){}, param1))
var executeInPageContext = function(fn) {
  var args = '';
  if (arguments.length > 1) {
    for (var i = 1, end = arguments.length - 2; i <= end; i++) {
      args += typeof arguments[i]=='function' ? arguments[i] : JSON.stringify(arguments[i]) + ', ';
    }
    args += typeof arguments[i]=='function' ? arguments[arguments.length - 1] : JSON.stringify(arguments[arguments.length - 1]);
  }

  var script = document.createElement('script');
  script.setAttribute("type", "application/javascript");
  script.textContent = '(' + fn + ')(' + args + ');';
  document.documentElement.appendChild(script); // run the script
  document.documentElement.removeChild(script); // clean up
};

