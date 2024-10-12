document.addEventListener("DOMContentLoaded", function () {
  // 총 결제 금액 초기화
  document.getElementById("total-price").textContent = "₩0";

  // 전체 선택 체크박스 체크
  document.getElementById("select-all").checked = true;

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      const userId = user.uid;
      const cartRef = firebase.database().ref("carts/" + userId);
      const cartContainer = document.getElementById("cart-items");

      // 장바구니 데이터 가져오기
      cartRef.on("value", (snapshot) => {
        const cartItems = snapshot.val();
        cartContainer.innerHTML = ""; // 초기화

        let totalPrice = 0; // 총 결제 금액 초기화

        if (cartItems) {
          Object.keys(cartItems).forEach((key) => {
            const item = cartItems[key];
            const itemTotalPrice = item.productPrice * item.quantity; // 상품 총 가격 계산
            totalPrice += itemTotalPrice; // 총 결제 금액 업데이트

            // 장바구니 항목 생성
            const cartItemDiv = document.createElement("div");
            cartItemDiv.classList.add("cart-item");
            cartItemDiv.dataset.key = item.productId; // 상품 키 추가
            cartItemDiv.innerHTML = `
                          <input type="checkbox" class="item-checkbox" checked />
                          <img src="${
                            item.productImage ||
                            "https://via.placeholder.com/100"
                          }" alt="${item.productName}" />
                          <div class="item-info">
                            <h3>${item.productName}</h3>
                            <p>₩${item.productPrice.toLocaleString()}</p>
                            <div class="item-quantity">                              
                              <span class="quantity">${item.quantity}</span>
                            </div>
                          </div>
                          <button class="remove-item" data-key="${key}">제거</button>
                      `;
            cartContainer.appendChild(cartItemDiv);
          });

          // 총 결제 금액 업데이트
          document.getElementById(
            "total-price"
          ).textContent = `₩${totalPrice.toLocaleString()}`;
        } else {
          cartContainer.innerHTML = "<p>장바구니가 비어 있습니다.</p>"; // 장바구니가 비어 있을 경우 메시지
        }
      });

      // 전체 선택 체크박스 이벤트 처리
      document
        .getElementById("select-all")
        .addEventListener("change", function () {
          const checkboxes = document.querySelectorAll(".item-checkbox");
          checkboxes.forEach((checkbox) => (checkbox.checked = this.checked));
          updateTotalPrice(); // 총 결제 금액 업데이트
        });

      // 수량 변경 버튼 이벤트 리스너 추가
      cartContainer.addEventListener("click", function (e) {
        const target = e.target;
        const action = target.dataset.action;
        const key = target.dataset.key;

        // 수량 조정
        if (action === "increase" || action === "decrease") {
          const quantitySpan = target.parentElement.querySelector(".quantity");
          let quantity = parseInt(quantitySpan.textContent, 10);

          if (action === "increase") {
            quantity++;
          } else if (action === "decrease" && quantity > 1) {
            quantity--;
          }

          // 수량 업데이트
          cartRef
            .child(key)
            .update({ quantity: quantity })
            .then(() => console.log("수량 업데이트 성공:", quantity))
            .catch((error) =>
              console.error("수량 업데이트 중 오류 발생:", error)
            );
        }

        // 항목 제거 버튼 클릭 시
        if (target.classList.contains("remove-item")) {
          const cartItemDiv = target.parentElement; // 해당 항목의 부모 요소(div)
          const itemQuantity = parseInt(cartItemDiv.querySelector(".quantity").textContent, 10); // 장바구니에서의 수량
          const productKey = cartItemDiv.dataset.key; // 제품의 키

          console.log("제거하려는 상품 키:", productKey); // 추가된 로그
          console.log("제거할 수량:", itemQuantity); // 추가된 로그

          // 장바구니에서 항목 제거
          cartRef.child(key).remove().then(() => {
              console.log("장바구니 항목 제거 성공:", key);
              cartItemDiv.remove(); // 화면에서 항목 제거

              // 재고 복구
              const productRef = firebase.database().ref("products/" + productKey); // 상품 레퍼런스
              productRef.once("value").then(snapshot => {
                  const product = snapshot.val();
                  console.log("현재 재고 수량:", product.quantity); // 추가된 로그
                  const currentQuantity = product.quantity || 0; // 현재 재고 수량 가져오기
                  const newQuantity = currentQuantity + itemQuantity; // 기존 재고에 장바구니에서 제거된 수량 더하기
                  productRef.update({ quantity: newQuantity }) // 재고 업데이트
                      .then(() => console.log("재고 업데이트 성공:", newQuantity))
                      .catch(error => console.error("재고 업데이트 중 오류 발생:", error));
              });
              updateTotalPrice(); // 총 결제 금액 업데이트
          }).catch(error =>
              console.error("장바구니 항목 제거 중 오류 발생:", error)
          );
        }

        // 체크박스 클릭 시 총 결제 금액 업데이트
        if (target.classList.contains("item-checkbox")) {
          updateTotalPrice(); // 총 결제 금액 업데이트
        }
      });

      // 결제 버튼 클릭 이벤트 처리
      document.getElementById("checkout").addEventListener("click", function () {
        // 결제 로직 구현
        alert("결제하기 버튼 클릭!");
      });
    } else {
      alert("로그인 해주세요.");
      window.location.href = "./login.html"; // 로그인 페이지로 리다이렉트
    }
  });
});

// 총 결제 금액 업데이트 함수
function updateTotalPrice() {
  const checkboxes = document.querySelectorAll(".item-checkbox");
  let totalPrice = 0;

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const cartItemDiv = checkbox.parentElement;
      const price = parseInt(cartItemDiv.querySelector("p").textContent.replace(/[^0-9]/g, ""), 10);
      const quantity = parseInt(cartItemDiv.querySelector(".quantity").textContent, 10);
      totalPrice += price * quantity;
    }
  });

  document.getElementById("total-price").textContent = `₩${totalPrice.toLocaleString()}`;
}
