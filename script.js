const apiUrl = 'https://www.spotlightstores.com/rest/v1/product/';

function fetchItems() {
  const imageWrapperElement = document.getElementsByClassName('product-hero-image')[0];
  const extraImagesContainer = document.createElement("div");
  extraImagesContainer.setAttribute('id', 'extra-images-container');     
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
        .then(createItemElement)
        .then(item => {
          extraImagesContainer.appendChild(item);
        })
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
    url: apiUrl + productCode,
    details: detailsElement?.dataset,
    inStock: stockElement?.href === "http://schema.org/InStock" ? true : false,
    availableOnline: (availableForDeliveryElement.value === "true"),
    variant: detailsElement.dataset.productVariant,
    img: doc.getElementById('pdp-img-wrap').src,
    price: detailsElement.dataset.productPrice,
  };

  return item;
}

function createItemElement(item) {
  const itemWrapper = document.createElement("div");
  itemWrapper.setAttribute('id', 'item.id');    
  
  let stockMsg = null;
  if (!item.availableOnline && item.inStock) {
    stockMsg = 'Instore only';
  } else if (!item.inStock) {
    stockMsg = 'Out of stock';
  }
  itemWrapper.innerText = `${stockMsg || ('$' + item.price)}  ${item.variant}`;
  itemWrapper.style.backgroundImage = `url('${item.img}')`;

  return itemWrapper;
}

fetchItems();