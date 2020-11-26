const apiUrlHtml = 'https://www.spotlightstores.com/rest/v1/product/';
const apiUrlJson = 'https://www.spotlightstores.com/rest/v1/product/basic/';
const itemData = {};
const fetchBatchSize = 5;
let controller = null;
let delay = 5000;
let timeout = null;

function populateDropdown() {

  const items = [...document.getElementsByClassName('dropdown-item')];
  console.log('populating dropdown');
  
  let fetchQueue = [];
  
  items.forEach(i => {
    const id = i.dataset?.variantStyleCode;
    const variant = i.title;
    if (id) {
      if (itemData[id]) {
        Promise.resolve(itemData[id])
        .then(item => addItemDetailsToDropdown(item, i))
        .catch(error => console.log(error));
      } else {
        fetchQueue.push(i);
      }
    }
  });

  if (fetchQueue.length) {
    console.log('fetching queue');
    throttleFetch(fetchQueue);
  }
}

function throttleFetch(queue) {
  let batch = queue.splice(0,fetchBatchSize);

  controller = new AbortController();
  const { signal } = controller;

  const promises = batch.map(i => {
    const id = i.dataset?.variantStyleCode;
    const variant = i.title;
    return fetch(apiUrlJson + id, { signal })
      .then(response => {
        if (response.status === 200) {
          console.log(`fetched ${id}`);
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

  if (queue.length) {
    // wait a delay then fetch the next batch
    Promise.all(promises).then(() => {
      timeout = setTimeout(() => throttleFetch(queue), delay);
    });
  }
}

function parseItemHtml(htmlString, productCode) {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const detailsElement = doc.getElementById('productDetailWrapper');
  const stockElement = doc.querySelector('[itemprop=availability]');
  const availableForDeliveryElement = doc.getElementsByClassName('isHomeDelivery')[0];
  
  const item = {
    id: productCode,
    url: doc.querySelector('[itemprop=url]').content,
    details: detailsElement?.dataset,
    inStock: stockElement?.href === "http://schema.org/InStock" ? true : false,
    availableOnline: (availableForDeliveryElement.value === "true"),
    variant: detailsElement.dataset.productVariant,
    img: doc.getElementById('pdp-img-wrap').src,
    price: detailsElement.dataset.productPrice,
  };

  itemData[productCode] = item;

  return item;
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

  itemData[productCode] = item;

  return item;
}

function createItemTile(item) {
  const itemWrapper = document.createElement("a");
  itemWrapper.setAttribute('id', item.id);    
  itemWrapper.setAttribute('href', item.url);
  
  let stockMsg = null;
  if (!item.availableOnline && item.inStock) {
    stockMsg = 'Instore only';
  } else if (!item.inStock) {
    stockMsg = 'Out of stock';
  }

  itemWrapper.innerText = `${stockMsg || ('$' + item.price)}  ${item.variant}`;
  itemWrapper.style.cssText = `
    background-image: url('${item.img}');
    width: 200px;
    height: 200px;
    background-size: contain;
    color: white;
    font-weight: bold;
  `;

  return itemWrapper;
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



populateDropdown();

const observer = new MutationObserver(() => { 
  controller.abort();
  clearTimeout(timeout);
  populateDropdown();
});
observer.observe(document.getElementById('productContentWrapper'), {childList: true});
