// Replace <your unsplash access key> with the Access Key retrieved
// in the previous step.
const UNSPLASH_ACCESS_KEY = 'qQqPFX9svLpCjIMhLKCk2Q69fcIYRs213HtbwKyP45M';

function validateResponse(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }

  return response;
}
function getCollections() {
    return new Promise((resolve) => {
      chrome.storage.local.get('collections', (result) => {
        const collections = result.collections || '';
        resolve(collections);
      });
    });
  }

async function getRandomPhoto() {
  const collections = await getCollections();
  const endpoint = 'https://api.unsplash.com/photos/random?orientation=landscape';
  if (collections) {
    endpoint += `&collections=${collections}`;
  }
  // Creates a new Headers object.
  const headers = new Headers();
  // Set the HTTP Authorization header
  headers.append('Authorization', `Client-ID ${UNSPLASH_ACCESS_KEY}`);

  let response = await fetch(endpoint, { headers });
  const json = await validateResponse(response).json();
  // Fetch the raw image data. The query parameters are used to control the size
  // and quality of the image:
  // q - compression quality
  // w - image width
  // See all the suported parameters: https://unsplash.com/documentation#supported-parameters
  response = await fetch(json.urls.raw + '&q=85&w=2000');
  // Verify the status of the response (must be 200 OK)
  // and read a Blob object out of the response.
  // This object is used to represent binary data and
  // is stored in a new `blob` property on the `json` object.
  json.blob = await validateResponse(response).blob();
  return json;
}

async function nextImage() {
  try {
    const image = await getRandomPhoto();
    // the FileReader object lets you read the contents of
    // files or raw data buffers. A blob object is a data buffer
    const fileReader = new FileReader();
    // The readAsDataURL method is used to read
    // the contents of the specified blob object
    // Once finished, the binary data is converted to
    // a Base64 string
    fileReader.readAsDataURL(image.blob);
    // The `load` event is fired when a read
    // has completed successfully. The result
    // can be found in `event.target.result`
    fileReader.addEventListener('load', event => {
      // The `result` property is the Base64 string
      const { result } = event.target;
      // This string is stored on a `base64` property
      // in the image object
      image.base64 = result;
      // The image object is subsequently stored in
      // the browser's local storage as before
      chrome.storage.local.set({ nextImage: image });
    });
  } catch (err) {
    console.log(err);
  }
}

// Execute the `nextImage` function when the extension is installed
chrome.runtime.onInstalled.addListener(nextImage);

chrome.runtime.onMessage.addListener((request) => {
    if (request.command === 'next-image') {
      nextImage();
    }
  });