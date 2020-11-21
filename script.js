const apiUrl = 'https://www.spotlightstores.com/rest/v1/product/';

function fetchItems() {
  const imageWrapperElement = document.getElementsByClassName('product-hero-image')[0];
  const extraImagesContainer = document.createElement("div");
  extraImagesContainer.setAttribute('id', 'extra-images-container');     
  extraImagesContainer.style.display = 'flex';
  extraImagesContainer.style.flexWrap = 'wrap';
  imageWrapperElement.appendChild(extraImagesContainer);

  const items = [...document.getElementsByClassName('dropdown-item')];
  console.log('starting fetch');
  const promises = items.map(i => {
    const id = i?.dataset?.variantStyleCode;
    if (id) {
      return fetch(apiUrl + id)
        .then(response => {
          if (response.status === 200) {
            return response.text()
          }
          else {
            // todo show error, hide loading spinner
            throw new Error(`couldn't load product ${id}`);
          };
        })
        .then(html => parseItemData(html,id))
        .then(item => addItemDetailsToDropdown(item, i))
        .catch(error => console.log(error));
    }
  });
}

function parseItemData(htmlString, productCode) {
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
  i.style.color = 'green';

  let stockMsg = null;
  if (!item.availableOnline && item.inStock) {
    stockMsg = 'Instore only';
  } else if (!item.inStock) {
    stockMsg = 'Out of stock';
  }

  i.innerText = `${stockMsg || ('$' + item.price)}  ${item.variant}`;
  i.style.cssText = `
    background-image: url('${item.img}');
    height: 75px;
    background-size: cover;
    color: white;
    text-shadow: 1px 1px 7px #000;
    font-weight: bold;
  `;

}

fetchItems();