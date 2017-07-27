// Vue Application
var app = new Vue({
  el: '#container',
  data: {
    title: "XML Preview",
    slides: []
  }
});

// JavaScript running inside of the generated HTML page
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var msg  = request.message;
    var data = request.data;

    if (msg === 'display-xml') {
      var slides             = app._data.slides;
      var slideAlreadyExists = false;

      // change this however necessary
      var primaryKey = 'primaryKey';

      // check if the slide sent already exists
      for (var i = 0; i < slides.length; i++) {
	let curKey = slides[i][primaryKey];
	let newKey = data[primaryKey];

	if (curKey === newKey) {
	  slideAlreadyExists = true;
	}
      }

      // add slide if it doesn't already exist
      if (!slideAlreadyExists) {
	addSlide(data);
	console.log(app._data.slides);
      }
    }
});

function addSlide(slide) {
  app._data.slides.push(slide);
}

