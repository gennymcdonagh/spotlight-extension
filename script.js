const apiUrl = 'https://www.spotlightstores.com/rest/v1/product/basic/';
const itemData = {};
const batchSize = 5;
let fetchAbortController = null;
const delay = 5000;
let timeout = null;

function populateDropdown() {
  const items = [...document.getElementsByClassName('dropdown-item')];
  //console.log(items);
  //console.log('populating dropdown');
  let fetchQueue = [];
  
  // iterate over the contents of the dropdown
  items.forEach(i => {
    const id = i.dataset?.variantStyleCode;
    if (id) {
      if (itemData[id]) { // if there's already cached data for this id
        Promise.resolve(itemData[id])
        .then(item => addItemDetailsToDropdown(item, i))
        .catch(error => console.log(error));
      } else { // need to fetch this id's data
        fetchQueue.push(i);
      }
    }
  });

  // fetch any items that were not already available in itemData
  if (fetchQueue.length) {
    console.log('fetching data...');
    throttleFetch(fetchQueue);
  }
}

function throttleFetch(queue) {
  // do the fetches one batch at a time
  const batch = queue.splice(0,batchSize);

  fetchAbortController = new AbortController();
  const { signal } = fetchAbortController;

  const promises = batch.map(i => {
    const id = i.dataset?.variantStyleCode;
    const variant = i.title;
    return fetch(apiUrl + id, { signal })
      .then(response => {
        if (response.status === 200) {
          return response.json()
        }
        else {
          throw new Error(`couldn't load product ${id}`);
        };
      })
      .then(html => parseItemJson(html, id, variant))
      .then(item => addItemDetailsToDropdown(item, i))
      .catch(error => console.log(error));
  })

  Promise.all(promises).then(() => {
    //console.log('fetched batch');
    if (queue.length) {
      // wait a delay then fetch the next batch
      timeout = setTimeout(() => throttleFetch(queue), delay);
    } else {
      console.log('finished fetching');
    }
  });
}

function parseItemJson(json, productCode, variant) {
  const item = {
    id: productCode,
    url: json.url,
    inStock: json.stockStatus !=='OUTOFSTOCK' ? true : false,
    availableOnline: json.purchasable,
    variant: variant || json.name,
    img: json.primaryImage.thumbnail,
    price: json.salePrice || json.regPrice,
  };

  // save this data to itemData so we don't need to refetch it if the page content changes
  itemData[productCode] = item;

  return item;
}

function addItemDetailsToDropdown(item, i) {
  let stockMsg = null;
  if (!item.availableOnline && item.inStock) {
    stockMsg = 'Instore only';
  } else if (!item.inStock) {
    stockMsg = 'Out of stock';
  }

  i.innerText = `${stockMsg || item.price} - ${item.variant}`;
  i.style.cssText = `
    background-image: url('${item.img}');
    height: 75px;
    background-size: cover;
    color: white;
    text-shadow: 1px 1px 7px #000;
    font-weight: bold;
  `;
}

const productContentObserver = new MutationObserver(() => { 
  // cancel any pending fetches
  if (fetchAbortController) {
    fetchAbortController.abort();
    clearTimeout(timeout);
  }
  // dropdown element has been replaced, so need to repopulate it
  populateDropdown();
});


function init() {
  const contentWrapperElement = document.getElementById('productContentWrapper');
  const styleDropdownElement = document.getElementsByClassName('style-variant')[0];

  if (contentWrapperElement && styleDropdownElement) {
    // when the productContentWrapper element is replaced (eg after selecting a variant from the dropdown), repopulate the dropdown
    productContentObserver.observe(contentWrapperElement, {childList: true});
    populateDropdown();
  }
}

//console.log('spotlight script loaded');
init();
