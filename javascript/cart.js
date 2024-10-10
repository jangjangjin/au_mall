document.addEventListener("DOMContentLoaded", function () {
  const user = firebase.auth().currentUser;

  if (user) {
    const userId = user.uid;
    const cartRef = firebase.database().ref("carts/" + userId);

    // 장바구니 데이터 가져오기
    cartRef.on("value", (snapshot) => {
      const cartItems = snapshot.val();
      const cartContainer = document.getElementById("cart-items");
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
          cartItemDiv.innerHTML = `
                <input type="checkbox" class="item-checkbox" />
                <img src="${
                  item.productImage || "https://via.placeholder.com/100"
                }" alt="${item.productName}" />
                <div class="item-info">
                  <h3>${item.productName}</h3>
                  <p>₩${item.productPrice.toLocaleString()}</p>
                  <div class="item-quantity">
                    <button class="quantity-btn" data-action="decrease" data-key="${key}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-key="${key}">+</button>
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
        updateTotalPrice();
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
        cartRef
          .child(key)
          .remove()
          .then(() => console.log("장바구니 항목 제거 성공:", key))
          .catch((error) =>
            console.error("장바구니 항목 제거 중 오류 발생:", error)
          );
      }
    });

    // 개별 항목 체크박스 이벤트 처리
    cartContainer.addEventListener("change", function (e) {
      if (e.target.classList.contains("item-checkbox")) {
        updateTotalPrice();
      }
    });

    // 총 결제 금액 업데이트 함수
    function updateTotalPrice() {
      let totalPrice = 0;
      document.querySelectorAll(".cart-item").forEach((item) => {
        const checkbox = item.querySelector(".item-checkbox");
        if (checkbox.checked) {
          const price = parseInt(
            item
              .querySelector(".item-info p")
              .textContent.replace("₩", "")
              .replace(",", "")
          );
          const quantity = parseInt(
            item.querySelector(".quantity").textContent
          );
          totalPrice += price * quantity;
        }
      });
      document.getElementById(
        "total-price"
      ).textContent = `₩${totalPrice.toLocaleString()}`;
    }

    // 결제하기 버튼 클릭 이벤트 처리
    document.getElementById("checkout").addEventListener("click", function () {
      window.location.href = "payment.html";
    });
  } else {
    alert("로그인이 필요합니다.");
    window.location.href = "login.html";
  }
});
