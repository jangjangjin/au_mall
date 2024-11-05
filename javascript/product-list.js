function displayProducts() {
  const productList = document.querySelector(".product-list");
  const dbRef = firebase.database().ref("products");
  dbRef
    .once("value")
    .then((snapshot) => {
      productList.innerHTML = "";
      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        const productId = childSnapshot.key;
        const productItem = document.createElement("div");
        productItem.className = "product-item";
        productItem.innerHTML = `
              <a href="./product-detail.html?id=${productId}">
                <img src="${
                  product.imageUrl || "https://via.placeholder.com/200"
                }" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>₩${Number(product.price).toLocaleString()}</p>
              </a>
            `;
        productList.appendChild(productItem);
      });
    })
    .catch((error) => {
      console.error("Error fetching products: ", error);
    });
}
function onDOMLoaded() {
  displayProducts();
}
fetch("footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-container").innerHTML = data;
  })
  .catch((error) =>
    console.error("Footer를 로드하는 중 오류가 발생했습니다:", error)
  );
document.addEventListener("DOMContentLoaded", onDOMLoaded);
document.addEventListener("DOMContentLoaded", onDOMLoaded);
