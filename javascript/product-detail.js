document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  console.log("상품 ID:", productId);

  const loadingSpinner = document.getElementById("loading-spinner");
  const modal = document.getElementById("modal");
  const modalClose = document.getElementById("modal-close");
  const modalYes = document.getElementById("modal-yes");
  const modalNo = document.getElementById("modal-no");

  if (productId) {
    loadingSpinner.style.display = "block";

    const dbRef = firebase.database().ref("products/" + productId);
    dbRef
      .once("value")
      .then((snapshot) => {
        const product = snapshot.val();
        console.log("상품 정보:", product);

        if (product) {
          setProductDetails(product);

          let quantity = 1;
          const quantityInput = document.getElementById("quantity");

          document
            .getElementById("increase-quantity")
            .addEventListener("click", function () {
              if (quantity < product.quantity) {
                quantity++;
                quantityInput.value = quantity;
                console.log("수량 증가:", quantity);
              } else {
                console.log("더 이상 증가할 수 없습니다.");
              }
            });

          document
            .getElementById("decrease-quantity")
            .addEventListener("click", function () {
              if (quantity > 1) {
                quantity--;
                quantityInput.value = quantity;
                console.log("수량 감소:", quantity);
              } else {
                console.log("최소 수량은 1입니다.");
              }
            });

          document
            .getElementById("add-to-cart")
            .addEventListener("click", function () {
              const user = firebase.auth().currentUser;
              if (user) {
                const userId = user.uid;
                const cartRef = firebase.database().ref("carts/" + userId);
                console.log("현재 사용자 ID:", userId);

                cartRef
                  .child(productId)
                  .once("value")
                  .then((snapshot) => {
                    const addQuantity = quantity;
                    console.log("추가할 수량:", addQuantity);

                    const totalPrice = product.price * addQuantity;
                    const productImage =
                      product.imageUrl || "https://via.placeholder.com/100";

                    // 태그 정보 가져오기
                    const tags = product.tags || {};
                    const tagArray = Object.values(tags);
                    console.log("상품 태그:", tagArray);

                    if (snapshot.exists()) {
                      // 이미 장바구니에 있는 경우 수량과 총 가격만 업데이트
                      const cartItem = snapshot.val();
                      const newQuantity = cartItem.quantity + addQuantity;
                      const newTotalPrice = product.price * newQuantity;

                      console.log(
                        "장바구니에 있는 상품 수량 및 가격 업데이트:",
                        newQuantity,
                        newTotalPrice
                      );

                      cartRef
                        .child(productId)
                        .update({
                          quantity: newQuantity,
                          totalPrice: newTotalPrice,
                          tags: tagArray, // 태그 정보 업데이트
                        })
                        .then(() => {
                          showModal();
                          updateStock(dbRef, product, addQuantity);
                        })
                        .catch((error) => {
                          console.error(
                            "장바구니 수량 업데이트 중 오류 발생: ",
                            error
                          );
                        });
                    } else {
                      // 새로운 상품을 장바구니에 추가
                      cartRef
                        .child(productId)
                        .set({
                          productId: productId,
                          productName: product.name,
                          productPrice: product.price,
                          productDescription: product.description,
                          productImage: productImage,
                          quantity: addQuantity,
                          totalPrice: totalPrice,
                          tags: tagArray, // 태그 정보 추가
                          addedAt: new Date().toISOString(),
                        })
                        .then(() => {
                          showModal();
                          updateStock(dbRef, product, addQuantity);
                        })
                        .catch((error) => {
                          console.error(
                            "장바구니에 추가 중 오류 발생: ",
                            error
                          );
                        });
                    }
                  });
              } else {
                alert("로그인이 필요합니다.");
                window.location.href = "login.html";
              }
            });
        } else {
          console.error("상품 정보를 찾을 수 없습니다.");
        }
      })
      .catch((error) => {
        console.error("상품 정보 로드 중 오류 발생: ", error);
      })
      .finally(() => {
        loadingSpinner.style.display = "none";
      });
  }

  function showModal() {
    modal.style.display = "flex";
  }

  modalClose.onclick = function () {
    modal.style.display = "none";
  };

  modalYes.onclick = function () {
    window.location.href = "./cart.html";
  };

  modalNo.onclick = function () {
    modal.style.display = "none";
  };

  document
    .getElementById("view-reviews")
    .addEventListener("click", function () {
      console.log("리뷰 보기 클릭");
      window.location.href = `reviews.html?productId=${productId}`;
    });
});

function setProductDetails(product) {
  document.querySelector(".product-detail img").src =
    product.imageUrl || "https://via.placeholder.com/400";
  document.querySelector(".product-detail img").alt = product.name;
  document.querySelector(".product-info h2").textContent = product.name;
  document.querySelector(".product-info .price").textContent = `₩${Number(
    product.price
  ).toLocaleString()}`;
  document.querySelector(".product-info .description").textContent =
    product.description;
  document.getElementById("stock").textContent =
    "재고: " + product.quantity + "개";

  // 태그 정보 표시
  const tagsContainer = document.querySelector(".product-tags");
  if (tagsContainer && product.tags) {
    tagsContainer.innerHTML = "";
    Object.values(product.tags).forEach(tag => {
      const tagElement = document.createElement("span");
      tagElement.className = "tag";
      tagElement.textContent = tag;
      tagsContainer.appendChild(tagElement);
    });
  }
}

function updateStock(dbRef, product, addQuantity) {
  const updatedStock = product.quantity - addQuantity;
  if (updatedStock >= 0) {
    dbRef
      .update({ quantity: updatedStock })
      .then(() => {
        document.getElementById("stock").textContent =
          "재고: " + updatedStock + "개";
        console.log("상품 재고가 업데이트되었습니다:", updatedStock);
      })
      .catch((error) => {
        console.error("재고 업데이트 중 오류 발생: ", error);
      });
  } else {
    alert("재고가 부족합니다.");
  }
}

function onDOMLoaded() {}
fetch("footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-container").innerHTML = data;
  })
  .catch((error) =>
    console.error("Footer를 로드하는 중 오류가 발생했습니다:", error)
  );
document.addEventListener("DOMContentLoaded", onDOMLoaded);