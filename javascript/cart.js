// IMP 초기화
var IMP = window.IMP;
IMP.init("imp67622846"); // 실제 가맹점 식별코드로 변경 필요

document.addEventListener("DOMContentLoaded", function () {
  // 총 결제 금액 초기화
  document.getElementById("total-price").textContent = "₩0";

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

      // 장바구니 컨테이너 이벤트 위임
      cartContainer.addEventListener("click", async function (e) {
        const target = e.target;
        const key = target.dataset.key;

        // 항목 제거
        if (target.classList.contains("remove-item")) {
          const cartItemDiv = target.parentElement;
          const itemQuantity = parseInt(
            cartItemDiv.querySelector(".quantity").textContent,
            10
          );

          try {
            // 장바구니에서 제거
            await cartRef.child(key).remove();
            console.log("장바구니 항목 제거 성공:", key);

            // 재고 복구
            const productRef = firebase.database().ref("products/" + key); // key로 수정
            const snapshot = await productRef.once("value");
            const product = snapshot.val();

            if (product) {
              const newQuantity = (product.quantity || 0) + itemQuantity;
              await productRef.update({ quantity: newQuantity });
              console.log("재고 업데이트 성공:", newQuantity);
            }

            cartItemDiv.remove();
            updateTotalPrice(); // 총 결제 금액 업데이트 함수 호출
          } catch (error) {
            console.error("항목 제거 중 오류 발생:", error);
          }
        }
      });

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
  let totalPrice = 0;
  const cartItems = document.querySelectorAll(".cart-item");

  cartItems.forEach((cartItemDiv) => {
    const price = parseInt(
      cartItemDiv.querySelector("p").textContent.replace(/[^0-9]/g, ""),
      10
    );
    const quantity = parseInt(
      cartItemDiv.querySelector(".quantity").textContent,
      10
    );
    totalPrice += price * quantity;
  });

  document.getElementById(
    "total-price"
  ).textContent = `₩${totalPrice.toLocaleString()}`;
}
