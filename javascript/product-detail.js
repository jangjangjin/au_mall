document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  console.log(urlParams);
  if (productId) {
    const dbRef = firebase.database().ref("products/" + productId);
    dbRef
      .once("value")
      .then((snapshot) => {
        const product = snapshot.val();
        if (product) {
          document.querySelector(".product-detail img").src =
            product.imageUrl || "https://via.placeholder.com/400";
          document.querySelector(".product-detail img").alt = product.name;
          document.querySelector(".product-info h2").textContent = product.name;
          document.querySelector(
            ".product-info .price"
          ).textContent = `₩${Number(product.price).toLocaleString()}`;
          document.querySelector(".product-info .description").textContent =
            product.description;

          const quantityInfo = document.createElement("p");
          quantityInfo.textContent = `재고: ${product.quantity}개`;
          document
            .querySelector(".product-info")
            .insertBefore(quantityInfo, document.getElementById("add-to-cart"));
        } else {
          console.error("Product not found");
        }
      })
      .catch((error) => {
        console.error("Error fetching product details: ", error);
      });
  }

  document.getElementById("add-to-cart").addEventListener("click", function () {
    alert("장바구니에 추가되었습니다.");
  });

  document.getElementById("buy-now").addEventListener("click", function () {
    window.location.href = "payment.html";
  });

  document
    .getElementById("view-reviews")
    .addEventListener("click", function () {
      window.location.href = "reviews.html";
    });
});
