document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  console.log("상품 ID:", productId); // 상품 ID 확인

  const loadingSpinner = document.getElementById("loading-spinner");
  const modal = document.getElementById("modal");
  const modalClose = document.getElementById("modal-close");
  const modalYes = document.getElementById("modal-yes");
  const modalNo = document.getElementById("modal-no");

  if (productId) {
    // 로딩 스피너 표시
    loadingSpinner.style.display = "block";

    const dbRef = firebase.database().ref("products/" + productId);
    dbRef
      .once("value")
      .then((snapshot) => {
        const product = snapshot.val();
        console.log("상품 정보:", product); // 상품 정보 확인

        if (product) {
          // 상품 정보 설정
          setProductDetails(product);

          // 수량 선택 기능
          let quantity = 1;
          const quantityInput = document.getElementById("quantity");

          document
            .getElementById("increase-quantity")
            .addEventListener("click", function () {
              if (quantity < product.quantity) {
                quantity++;
                quantityInput.value = quantity;
                console.log("수량 증가:", quantity); // 수량 증가 확인
              } else {
                console.log("더 이상 증가할 수 없습니다."); // 최대 수량 도달
              }
            });

          document
            .getElementById("decrease-quantity")
            .addEventListener("click", function () {
              if (quantity > 1) {
                quantity--;
                quantityInput.value = quantity;
                console.log("수량 감소:", quantity); // 수량 감소 확인
              } else {
                console.log("최소 수량은 1입니다."); // 최소 수량 도달
              }
            });

          // 장바구니에 상품 추가
          document
            .getElementById("add-to-cart")
            .addEventListener("click", function () {
              const user = firebase.auth().currentUser;
              if (user) {
                const userId = user.uid;
                const cartRef = firebase.database().ref("carts/" + userId);
                console.log("현재 사용자 ID:", userId); // 현재 사용자 ID 확인

                // 장바구니에서 같은 상품이 있는지 확인
                cartRef
                  .orderByChild("productId")
                  .equalTo(productId)
                  .once("value")
                  .then((snapshot) => {
                    const addQuantity = quantity; // 선택한 수량을 저장
                    console.log("추가할 수량:", addQuantity); // 추가할 수량 확인

                    const totalPrice = product.price * addQuantity; // 총 가격 계산
                    const productImage =
                      product.imageUrl || "https://via.placeholder.com/100"; // 이미지 URL

                    if (snapshot.exists()) {
                      // 같은 상품이 이미 있을 경우 수량 및 가격 업데이트
                      const cartItemKey = Object.keys(snapshot.val())[0];
                      const cartItem = snapshot.val()[cartItemKey];
                      const newQuantity = cartItem.quantity + addQuantity;
                      const newTotalPrice = cartItem.totalPrice + totalPrice; // 총 가격 업데이트

                      console.log(
                        "장바구니에 있는 상품 수량 및 가격 업데이트:",
                        newQuantity,
                        newTotalPrice
                      ); // 수량 및 가격 업데이트 확인

                      // 장바구니 수량 및 가격 업데이트
                      cartRef
                        .child(cartItemKey)
                        .update({
                          quantity: newQuantity,
                          totalPrice: newTotalPrice,
                        })
                        .then(() => {
                          showModal();
                          // 상품의 수량 업데이트
                          updateStock(dbRef, product, addQuantity);
                        })
                        .catch((error) => {
                          console.error(
                            "장바구니 수량 업데이트 중 오류 발생: ",
                            error
                          );
                        });
                    } else {
                      // 장바구니에 같은 상품이 없을 경우 새로 추가
                      cartRef
                        .push({
                          productId: productId,
                          productName: product.name,
                          productPrice: product.price,
                          productDescription: product.description,
                          productImage: productImage, // 상품 이미지 URL 저장
                          quantity: addQuantity,
                          totalPrice: totalPrice, // 총 가격 저장
                          addedAt: new Date().toISOString(),
                        })
                        .then(() => {
                          showModal();
                          // 상품의 수량 업데이트
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
        // 로딩 스피너 숨김
        loadingSpinner.style.display = "none";
      });
  }

  // 모달 보여주기
  function showModal() {
    modal.style.display = "flex";
  }

  // 모달 닫기
  modalClose.onclick = function () {
    modal.style.display = "none";
  };

  // 예 버튼 클릭 시 장바구니 페이지로 이동
  modalYes.onclick = function () {
    window.location.href = "./cart.html";
  };

  // 아니요 버튼 클릭 시 모달 닫기
  modalNo.onclick = function () {
    modal.style.display = "none";
  };

  // 리뷰 보기 버튼 클릭 이벤트
  document
    .getElementById("view-reviews")
    .addEventListener("click", function () {
      console.log("리뷰 보기 클릭"); // 리뷰 보기 버튼 클릭 확인
      window.location.href = "reviews.html";
    });
});

// 상품 상세 정보 설정 및 이미지 url 추가
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
}

// 재고 업데이트 함수
function updateStock(dbRef, product, addQuantity) {
  const updatedStock = product.quantity - addQuantity;
  if (updatedStock >= 0) {
    dbRef
      .update({ quantity: updatedStock })
      .then(() => {
        document.getElementById("stock").textContent =
          "재고:" + updatedStock + "개"; // UI 업데이트
        console.log("상품 재고가 업데이트되었습니다:", updatedStock); // 재고 업데이트 확인
      })
      .catch((error) => {
        console.error("재고 업데이트 중 오류 발생: ", error);
      });
  } else {
    alert("재고가 부족합니다.");
  }
}
