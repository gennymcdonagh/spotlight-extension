const apiUrlHtml = 'https://www.spotlightstores.com/rest/v1/product/';
const apiUrlJson = 'https://www.spotlightstores.com/rest/v1/product/basic/';
const itemData = {};

function populateDropdown() {

  const items = [...document.getElementsByClassName('dropdown-item')];
  console.log('populating dropdown');
  
  
  const promises = items.map(i => {
    const id = i.dataset?.variantStyleCode;
    const variant = i.title;
    if (id) {
      if (itemData[id]) {
        return Promise.resolve(itemData[id])
        .then(item => addItemDetailsToDropdown(item, i))
        .catch(error => console.log(error));
      } else {
        return fetch(apiUrlJson + id)
        .then(response => {
          if (response.status === 200) {
            console.log(`fetched ${id}`);
            return response.json()
          }
          else {
            // todo show error, hide loading spinner
            throw new Error(`couldn't load product ${id}`);
          };
        })
        .then(html => parseItemJson(html, id, variant))
        .then(item => addItemDetailsToDropdown(item, i))
        .catch(error => console.log(error));
      }
    }
  });
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

const observer = new MutationObserver(populateDropdown);
observer.observe(document.getElementById('productContentWrapper'), {childList: true});
