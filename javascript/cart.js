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
                  item.productImage || "https://via.placeholder.com/100"
                }" alt="${item.productName}" />
                <div class="item-info">
                    <h3>${item.productName}</h3>
                    <p>${item.productDescription}</p>
                    <p>₩${item.productPrice.toLocaleString()}</p>
                    <div class="item-quantity">
                      
                        <span class="quantity">${item.quantity}개</span>
                        
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
          cartContainer.innerHTML = "<p>장바구니가 비어 있습니다.</p>";
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

      // 장바구니 컨테이너 이벤트 위임
      cartContainer.addEventListener("click", async function (e) {
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
          try {
            await cartRef.child(key).update({ quantity: quantity });
            console.log("수량 업데이트 성공:", quantity);
            updateTotalPrice();
          } catch (error) {
            console.error("수량 업데이트 중 오류 발생:", error);
          }
        }

        // 항목 제거
        if (target.classList.contains("remove-item")) {
          const cartItemDiv = target.parentElement;
          const itemQuantity = parseInt(
            cartItemDiv.querySelector(".quantity").textContent,
            10
          );
          const productKey = cartItemDiv.dataset.key;

          try {
            // 장바구니에서 제거
            await cartRef.child(key).remove();
            console.log("장바구니 항목 제거 성공:", key);

            // 재고 복구
            const productRef = firebase
              .database()
              .ref("products/" + productKey);
            const snapshot = await productRef.once("value");
            const product = snapshot.val();

            if (product) {
              const newQuantity = (product.quantity || 0) + itemQuantity;
              await productRef.update({ quantity: newQuantity });
              console.log("재고 업데이트 성공:", newQuantity);
            }

            cartItemDiv.remove();
            updateTotalPrice();
          } catch (error) {
            console.error("항목 제거 중 오류 발생:", error);
          }
        }

        // 체크박스 변경
        if (target.classList.contains("item-checkbox")) {
          updateTotalPrice();
        }
      });

      // 결제 버튼 이벤트 처리
      // document
      //   .getElementById("checkout")
      //   .addEventListener("click", processPayment);
      document
        .getElementById("checkout")
        .addEventListener("click", function () {
          window.location.href = "./payment.html";
        });
    } else {
      alert("로그인 해주세요.");
      window.location.href = "./login.html";
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
      const price = parseInt(
        cartItemDiv.querySelector("p").textContent.replace(/[^0-9]/g, ""),
        10
      );
      const quantity = parseInt(
        cartItemDiv.querySelector(".quantity").textContent,
        10
      );
      totalPrice += price * quantity;
    }
  });

  document.getElementById(
    "total-price"
  ).textContent = `₩${totalPrice.toLocaleString()}`;
}

// 선택된 상품 정보 가져오기
function getSelectedItems() {
  const selectedItems = [];
  const checkboxes = document.querySelectorAll(".item-checkbox:checked");

  checkboxes.forEach((checkbox) => {
    const itemDiv = checkbox.closest(".cart-item");
    const itemInfo = {
      productId: itemDiv.dataset.key,
      productName: itemDiv.querySelector("h3").textContent,
      productPrice: parseInt(
        itemDiv.querySelector("p").textContent.replace(/[^0-9]/g, ""),
        10
      ),
      quantity: parseInt(itemDiv.querySelector(".quantity").textContent, 10),
    };
    selectedItems.push(itemInfo);
  });

  return selectedItems;
}
