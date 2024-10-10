document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (productId) {
    const dbRef = firebase.database().ref("products/" + productId);
    dbRef.once("value").then((snapshot) => {
      const product = snapshot.val();
      if (product) {
        document.querySelector(".product-detail img").src =
          product.imageUrl || "https://via.placeholder.com/400";
        document.querySelector(".product-detail img").alt = product.name;
        document.querySelector(".product-info h2").textContent = product.name;
        document.querySelector(".product-info .price").textContent = `₩${Number(product.price).toLocaleString()}`;
        document.querySelector(".product-info .description").textContent = product.description;
        document.getElementById("stock").textContent = product.quantity;

        // 수량 선택 기능
        let quantity = 1;
        const quantityInput = document.getElementById("quantity");

        document.getElementById("increase-quantity").addEventListener("click", function () {
          if (quantity < product.quantity) {
            quantity++;
            quantityInput.value = quantity;
          }
        });

        document.getElementById("decrease-quantity").addEventListener("click", function () {
          if (quantity > 1) {
            quantity--;
            quantityInput.value = quantity;
          }
        });

        // 장바구니에 상품 추가
        document.getElementById("add-to-cart").addEventListener("click", function () {
          const user = firebase.auth().currentUser;
          if (user) {
            const userId = user.uid;
            const cartRef = firebase.database().ref("carts/" + userId);

            // 장바구니에서 같은 상품이 있는지 확인
            cartRef
              .orderByChild("productId")
              .equalTo(productId)
              .once("value")
              .then((snapshot) => {
                const addQuantity = quantity;  // 선택한 수량을 저장 (재고 업데이트에 사용)
                
                if (snapshot.exists()) {
                  // 같은 상품이 이미 있을 경우 수량만 업데이트
                  const cartItemKey = Object.keys(snapshot.val())[0];
                  const cartItem = snapshot.val()[cartItemKey];
                  const newQuantity = cartItem.quantity + addQuantity;

                  // 장바구니 수량 업데이트
                  cartRef
                    .child(cartItemKey)
                    .update({ quantity: newQuantity })
                    .then(() => {
                      alert("장바구니에 상품 수량이 업데이트되었습니다.");

                      // 상품의 수량 업데이트 (여기서 선택한 수량만큼 재고에서 차감)
                      const updatedStock = product.quantity - addQuantity;
                      if (updatedStock >= 0) {
                        dbRef.update({ quantity: updatedStock }).then(() => {
                          document.getElementById("stock").textContent = updatedStock;
                          console.log("상품 재고가 업데이트되었습니다.");
                        }).catch((error) => {
                          console.error("재고 업데이트 중 오류 발생: ", error);
                        });
                      } else {
                        alert("재고가 부족합니다.");
                      }

                      // 수량을 1로 초기화
                      quantity = 1;
                      quantityInput.value = quantity;
                    })
                    .catch((error) => {
                      console.error("장바구니 수량 업데이트 중 오류 발생: ", error);
                    });
                } else {
                  // 장바구니에 같은 상품이 없을 경우 새로 추가
                  cartRef
                    .push({
                      productId: productId,
                      productName: product.name,
                      productPrice: product.price,
                      productDescription: product.description,
                      quantity: addQuantity, // 선택한 수량 반영
                      addedAt: new Date().toISOString(),
                    })
                    .then(() => {
                      alert("장바구니에 상품이 추가되었습니다.");

                      // 상품의 수량 업데이트 (여기서 선택한 수량만큼 재고에서 차감)
                      const updatedStock = product.quantity - addQuantity;
                      if (updatedStock >= 0) {
                        dbRef.update({ quantity: updatedStock }).then(() => {
                          document.getElementById("stock").textContent = updatedStock;
                          console.log("상품 재고가 업데이트되었습니다.");
                        }).catch((error) => {
                          console.error("재고 업데이트 중 오류 발생: ", error);
                        });
                      } else {
                        alert("재고가 부족합니다.");
                      }

                      // 수량을 1로 초기화
                      quantity = 1;
                      quantityInput.value = quantity;
                    })
                    .catch((error) => {
                      console.error("장바구니에 추가 중 오류 발생: ", error);
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
    }).catch((error) => {
      console.error("상품 정보 로드 중 오류 발생: ", error);
    });
  }

  document.getElementById("buy-now").addEventListener("click", function () {
    window.location.href = "payment.html";
  });

  document.getElementById("view-reviews").addEventListener("click", function () {
    window.location.href = "reviews.html";
  });
});
